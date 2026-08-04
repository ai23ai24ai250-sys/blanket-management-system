/**
 * Supplier Returns (مرتجع المشتريات) Service Module - Cloud Firestore Connected
 * Records goods returned to a supplier, deducts the returned quantities from inventory,
 * settles the supplier debt (or records a cash refund), and maintains a unified
 * supplier transaction ledger used by the banking-style statements of account.
 */

window.getSupplierReturns = function() {
  return window.getCollection(window.STORAGE_KEYS.SUPPLIER_RETURNS);
};

window.getSupplierReturnsBySupplier = function(supplierId) {
  return window.getSupplierReturns().filter(r => r.supplierId === supplierId);
};

window.getSupplierTransactions = function() {
  return window.getCollection(window.STORAGE_KEYS.SUPPLIER_TRANSACTIONS);
};

window.getSupplierTransactionsBySupplier = function(supplierId) {
  return window.getSupplierTransactions().filter(t => t.supplierId === supplierId);
};

/**
 * Unified Supplier Ledger Log
 * debit  = amount that increases our debt to the supplier
 * credit = amount that decreases our debt to the supplier
 */
window.logSupplierTransaction = function({ supplierId, supplierName, type, refId = '', debit = 0, credit = 0, note = '', date = null }) {
  const txn = {
    id: window.generateAutoId('SUPLOG'),
    supplierId,
    supplierName: supplierName || '',
    type,
    refId,
    debit: Number(debit) || 0,
    credit: Number(credit) || 0,
    note: (note || '').trim(),
    createdAt: date || getCairoFormattedDate()
  };
  return window.addFirestoreDoc(window.STORAGE_KEYS.SUPPLIER_TRANSACTIONS, txn);
};

/**
 * Register a Purchase Return (مرتجع مشتريات) for a supplier.
 * refundType:
 *   - 'debt' => the return value is deducted from the supplier's remaining balance (debt settlement)
 *   - 'cash' => in addition to debt settlement, a cash treasury receipt is recorded for the
 *               cash received back from the supplier (استرداد نقدي)
 */
window.createSupplierReturn = function({ supplierId, supplierName, items, refundType = 'debt', notes = '', createdBy = 'المدير العام' }) {
  if (!supplierId) throw new Error('يرجى اختيار المورد / المصنع أولاً');
  const supplier = window.getSupplierById(supplierId);
  if (!supplier) throw new Error('المورد المحدد غير موجود في النظام');

  const selectedRefundType = refundType === 'cash' ? 'cash' : 'debt';

  const validItems = (items || []).filter(i => i && i.productId && Number(i.quantity) > 0);
  if (validItems.length === 0) throw new Error('يرجى إدخال منتج واحد على الأقل بكمية صحيحة أكبر من الصفر');

  // 1. Validate stock availability & prices (never allow returning more than current stock)
  validItems.forEach(i => {
    const product = window.getProductById(i.productId);
    if (!product) throw new Error('أحد المنتجات المحددة غير موجود في المخزن');
    const qty = Number(i.quantity);
    const unitCost = Number(i.unitCost);
    if (isNaN(unitCost) || unitCost < 0) throw new Error(`يرجى إدخال سعر وحدة صحيح للمنتج ${product.name}`);
    if (qty > Number(product.stock)) {
      throw new Error(`لا يمكن إرجاع ${qty} قطعة من "${product.name}" لأن المخزون الحالي ${product.stock} قطعة فقط`);
    }
  });

  const processedItems = validItems.map(i => {
    const product = window.getProductById(i.productId);
    const qty = Number(i.quantity);
    const unitCost = Number(i.unitCost);
    return {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitCost,
      subtotal: window.round2(qty * unitCost)
    };
  });

  const totalValue = window.round2(processedItems.reduce((s, i) => s + i.subtotal, 0));
  if (totalValue <= 0) throw new Error('قيمة المرتجع يجب أن تكون أكبر من الصفر');

  const now = getCairoFormattedDate();
  const returnId = window.generateAutoId('SRET');

  // 2. Deduct returned quantities from inventory (validated above, clamps at zero)
  processedItems.forEach(i => {
    window.decrementProductStock(i.productId, i.quantity);
  });

  // 3. Settle supplier debt: returning goods reduces purchases AND remaining balance.
  //    paid is recomputed to keep the identity (remaining = purchases - paid) consistent.
  const oldPurchases = Number(supplier.totalPurchases) || 0;
  const oldBalance = Number(supplier.remainingBalance) || 0;
  const newPurchases = window.round2(Math.max(0, oldPurchases - totalValue));
  const newBalance = window.round2(Math.max(0, oldBalance - totalValue));
  const newPaid = window.round2(Math.max(0, newPurchases - newBalance));

  window.updateSupplier(supplierId, {
    totalPurchases: newPurchases,
    remainingBalance: newBalance,
    paid: newPaid
  });

  // 4. Persist the return record
  const returnRecord = {
    id: returnId,
    supplierId,
    supplierName: supplier.name,
    items: processedItems,
    totalValue,
    refundType: selectedRefundType,
    notes: (notes || '').trim(),
    createdBy,
    createdAt: now
  };
  window.addFirestoreDoc(window.STORAGE_KEYS.SUPPLIER_RETURNS, returnRecord);

  // 5. Cash refund => record a treasury cash receipt (negative payment) for the supplier.
  //    Balance updates for negative supplier amounts are skipped inside createPaymentRecord
  //    (pure cash log) — the debt settlement is already handled above by this service.
  if (selectedRefundType === 'cash') {
    window.createPaymentRecord({
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.name,
      amount: -totalValue,
      date: now.slice(0, 10),
      paymentMethod: 'cash',
      notes: `استرداد نقدي - مرتجع مشتريات للمورد (${returnId}): ${processedItems.map(i => `${i.productName} x${i.quantity}`).join('، ')}`,
      createdBy
    });
  }

  // 6. Log the supplier ledger transaction (credit = our debt to the supplier decreased)
  window.logSupplierTransaction({
    supplierId,
    supplierName: supplier.name,
    type: selectedRefundType === 'cash' ? 'مرتجع نقدي' : 'مرتجع مشتريات',
    refId: returnId,
    credit: totalValue,
    note: (notes || '').trim() || (selectedRefundType === 'cash' ? 'استرداد نقدي من المورد عن بضاعة مرتجعة' : 'إرجاع بضاعة للمورد وخصمها من المديونية'),
    date: now
  });

  return returnRecord;
};

window.getTotalSupplierReturnsValue = function() {
  return window.round2(window.getSupplierReturns().reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0));
};

/**
 * V3.19 — إعادة احتساب الأرباح والتقارير (Recalculate Totals)
 * Non-destructive reconciliation of the supplier-returns ledger:
 *   1. Restates the treasury: every 'cash' return must have its matching negative
 *      supplier payment; any missing record is re-created (idempotent).
 *   2. Restates the unified supplier ledger: every return must have its credit
 *      transaction; any missing txn is re-logged.
 *   3. Recomputes each supplier's paid/remainingBalance from the transaction
 *      ledger (the bank-statement identity: balance = Σ debit − Σ credit) so any
 *      drift caused by the legacy double-counting is repaired.
 * Returns the number of restated entries (0 means everything already consistent).
 */
window.recalculateTotals = function() {
  const returns = window.getSupplierReturns();
  const payments = window.getPayments();
  let restated = 0;

  returns.forEach(r => {
    if (!r || !r.supplierId) return;
    const supplier = window.getSupplierById(r.supplierId);
    const name = (supplier && supplier.name) || r.supplierName || '';
    const totalValue = window.round2(Number(r.totalValue) || 0);
    if (totalValue <= 0) return;

    if (r.refundType === 'cash') {
      const exists = payments.some(p =>
        p.entityType === 'supplier' && p.entityId === r.supplierId &&
        (Number(p.amount) || 0) < 0 && (p.notes || '').indexOf('(' + r.id + ')') !== -1
      );
      if (!exists && window.createPaymentRecord) {
        window.createPaymentRecord({
          entityType: 'supplier',
          entityId: r.supplierId,
          entityName: name,
          amount: -totalValue,
          date: (r.createdAt || '').slice(0, 10),
          paymentMethod: 'cash',
          notes: `استرداد نقدي - مرتجع مشتريات للمورد (${r.id}): إعادة احتساب`,
          createdBy: 'المدير العام'
        });
        restated++;
      }
    }

    const expectedType = r.refundType === 'cash' ? 'مرتجع نقدي' : 'مرتجع مشتريات';
    const txnExists = window.getSupplierTransactions().some(t =>
      t.refId === r.id && (t.type === 'مرتجع نقدي' || t.type === 'مرتجع مشتريات')
    );
    if (!txnExists && window.logSupplierTransaction) {
      window.logSupplierTransaction({
        supplierId: r.supplierId,
        supplierName: name,
        type: expectedType,
        refId: r.id,
        credit: totalValue,
        note: (r.notes || '').trim() || (r.refundType === 'cash' ? 'استرداد نقدي من المورد عن بضاعة مرتجعة' : 'إرجاع بضاعة للمورد وخصمها من المديونية'),
        date: r.createdAt || null
      });
      restated++;
    }
  });

  // 3. Recompute derived supplier balances from the ledger (only suppliers with
  // a real transaction history — untouched legacy rows stay as-is).
  window.getSuppliers().forEach(sup => {
    const txns = window.getSupplierTransactionsBySupplier(sup.id);
    if (!txns || txns.length === 0) return;
    const totalDebit = txns.reduce((s, t) => s + (Number(t.debit) || 0), 0);
    const totalCredit = txns.reduce((s, t) => s + (Number(t.credit) || 0), 0);
    const purchases = window.round2(Number(sup.totalPurchases) || 0);
    const newBalance = window.round2(Math.max(0, totalDebit - totalCredit));
    const newPaid = window.round2(Math.max(0, purchases - newBalance));
    window.updateSupplier(sup.id, { remainingBalance: newBalance, paid: newPaid });
  });

  return restated;
};

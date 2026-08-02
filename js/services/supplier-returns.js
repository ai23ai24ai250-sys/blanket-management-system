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

/**
 * Payment Service Module - Cloud Firestore Connected
 * Supports Down Payment Creation & Standalone Payment Validation
 * Fixed Double Deduction Bug: Down payments recorded on order creation do NOT deduct customer remaining balance twice.
 */

window.getPayments = function() {
  return window.getCollection(window.STORAGE_KEYS.PAYMENTS);
};

window.searchPayments = function(query) {
  const payments = window.getPayments();
  if (!query) return payments;
  const q = query.trim().toLowerCase();
  return payments.filter(p => 
    (p.entityName && p.entityName.toLowerCase().includes(q)) ||
    (p.id && p.id.toLowerCase().includes(q)) ||
    (p.notes && p.notes.toLowerCase().includes(q))
  );
};

window.getPaymentsByEntity = function(entityType, entityId) {
  const payments = window.getPayments();
  return payments.filter(p => p.entityType === entityType && p.entityId === entityId);
};

window.createPaymentRecord = function({ entityType, entityId, entityName, amount, date, paymentMethod = 'cash', notes = '', isDownPayment = false, createdBy = 'المدير العام' }) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount === 0) {
    throw new Error('يرجى إدخال مبلغ صحيح');
  }

  // 🔒 1. Validation: Prevent standalone payments exceeding remaining balance
  if (!isDownPayment && numericAmount > 0) {
    if (entityType === 'customer') {
      const customer = window.getCustomerById(entityId);
      if (customer) {
        const maxRemaining = Number(customer.remainingBalance) || 0;
        if (numericAmount > maxRemaining) {
          throw new Error(`تنبيه: المبلغ المكتوب (${window.formatCurrency(numericAmount)}) يتجاوز إجمالي الرصيد المتبقي على العميل (${window.formatCurrency(maxRemaining)})`);
        }
      }
    } else if (entityType === 'supplier') {
      const supplier = window.getSupplierById(entityId);
      if (supplier) {
        const maxRemaining = Number(supplier.remainingBalance) || 0;
        if (numericAmount > maxRemaining) {
          throw new Error(`تنبيه: المبلغ المكتوب (${window.formatCurrency(numericAmount)}) يتجاوز إجمالي الرصيد المستحق للمورد (${window.formatCurrency(maxRemaining)})`);
        }
      }
    }
  }

  const paymentId = window.generateAutoId('PAY');
  const now = new Date().toISOString();

  const newPayment = {
    id: paymentId,
    entityType,
    entityId,
    entityName: entityName.trim(),
    amount: numericAmount,
    date: date || now.split('T')[0],
    paymentMethod,
    notes: notes.trim(),
    isDownPayment: !!isDownPayment,
    createdBy,
    createdAt: now
  };

  // Save Payment doc to Cloud Firestore
  window.addFirestoreDoc(window.STORAGE_KEYS.PAYMENTS, newPayment);

  // Update Customer or Supplier Balance in Cloud Firestore
  if (entityType === 'customer') {
    const customer = window.getCustomerById(entityId);
    if (customer) {
      const updatedPaid = (Number(customer.paid) || 0) + numericAmount;
      // 🔒 FIX DOUBLE DEDUCTION BUG: If isDownPayment is true, order.remainingBalance ALREADY subtracted the down payment!
      // Therefore, down payment receipts MUST NOT subtract numericAmount from customer.remainingBalance a second time!
      // 🔒 FIX REFUND BUG: If numericAmount < 0 (refund from order return), do NOT touch remainingBalance —
      //   the order return in updateOrderStatus already resets remainingBalance correctly.
      //   Applying Math.max(0, remainingBalance - negativeAmount) would incorrectly *increase* the balance.
      const updatedBalance = numericAmount < 0
        ? (Number(customer.remainingBalance) || 0)
        : (isDownPayment
            ? (Number(customer.remainingBalance) || 0)
            : Math.max(0, (Number(customer.remainingBalance) || 0) - numericAmount));

      window.updateCustomer(entityId, {
        paid: updatedPaid,
        remainingBalance: updatedBalance
      });

      // 🔒 SYNC STANDALONE PAYMENTS TO ORDER: When a non-down-payment is collected from a customer,
      //   distribute the amount across their unpaid orders (oldest first) so that order.remainingBalance
      //   and order.downPayment reflect actual payments.
      //   The payment record is also marked allocatedToOrders so recalculateCustomerBalance
      //   does not double-count the amount via both order.downPayment AND the payments table.
      if (!isDownPayment && numericAmount > 0) {
        const orders = window.getOrders();
        const unpaidOrders = orders
          .filter(o => o.customerId === entityId && o.status !== 'returned' && o.status !== 'cancelled' && (Number(o.remainingBalance) || 0) > 0)
          .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        let remainingToAllocate = numericAmount;
        for (const order of unpaidOrders) {
          if (remainingToAllocate <= 0) break;
          const orderRemaining = Number(order.remainingBalance) || 0;
          const allocated = Math.min(remainingToAllocate, orderRemaining);
          const newRemaining = orderRemaining - allocated;
          const newDownPayment = (Number(order.downPayment) || 0) + allocated;
          window.updateFirestoreDoc(window.STORAGE_KEYS.ORDERS, order.id, {
            downPayment: newDownPayment,
            remainingBalance: newRemaining,
            paidInFull: newRemaining <= 0
          });
          remainingToAllocate -= allocated;
        }
        // Mark this payment record as allocated so recalculateCustomerBalance skips it
        window.updateFirestoreDoc(window.STORAGE_KEYS.PAYMENTS, paymentId, {
          allocatedToOrders: true
        });
      }
    }
  } else if (entityType === 'supplier') {
    const supplier = window.getSupplierById(entityId);
    if (supplier) {
      // 🔒 FIX SUPPLIER REFUND BUG: For negative amounts (cash received back from a
      // supplier return), do NOT touch remainingBalance or paid — the supplier return
      // service already settled the debt. This record is a pure cash treasury log.
      const updatedPaid = numericAmount < 0
        ? (Number(supplier.paid) || 0)
        : (Number(supplier.paid) || 0) + numericAmount;
      const updatedBalance = numericAmount < 0
        ? (Number(supplier.remainingBalance) || 0)
        : Math.max(0, (Number(supplier.remainingBalance) || 0) - numericAmount);

      window.updateSupplier(entityId, {
        paid: updatedPaid,
        remainingBalance: updatedBalance
      });

      // 📒 Log the supplier ledger credit for positive payments (debt settlement)
      if (numericAmount > 0 && window.logSupplierTransaction) {
        window.logSupplierTransaction({
          supplierId: entityId,
          supplierName: supplier.name,
          type: 'تسديد دفعة',
          refId: paymentId,
          credit: numericAmount,
          note: (notes || '').trim() || 'تسديد دفعة / تحويل للمورد',
          date: now
        });
      }
    }
  }

  return newPayment;
};

window.getTotalCustomerReceivables = function() {
  const customers = window.getCollection(window.STORAGE_KEYS.CUSTOMERS);
  return customers.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);
};

window.getTotalSupplierPayables = function() {
  const suppliers = window.getCollection(window.STORAGE_KEYS.SUPPLIERS);
  return suppliers.reduce((sum, s) => sum + (Number(s.remainingBalance) || 0), 0);
};

window.getTotalPaymentsCollected = function() {
  const payments = window.getPayments();
  return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
};

/**
 * Payment Service Module - Cloud Firestore Connected
 * Supports Down Payment Creation & Standalone Payment Validation
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
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
  }

  // 🔒 1. Validation: Prevent standalone payments exceeding remaining balance
  // (Down payment on order creation is already validated against total order amount)
  if (!isDownPayment) {
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
      const updatedBalance = Math.max(0, (Number(customer.remainingBalance) || 0) - numericAmount);
      window.updateCustomer(entityId, {
        paid: updatedPaid,
        remainingBalance: updatedBalance
      });
    }
  } else if (entityType === 'supplier') {
    const supplier = window.getSupplierById(entityId);
    if (supplier) {
      const updatedPaid = (Number(supplier.paid) || 0) + numericAmount;
      const updatedBalance = Math.max(0, (Number(supplier.remainingBalance) || 0) - numericAmount);
      window.updateSupplier(entityId, {
        paid: updatedPaid,
        remainingBalance: updatedBalance
      });
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

/**
 * Payment Service Module
 */

window.getPayments = function() {
  return window.getCollection(window.STORAGE_KEYS.PAYMENTS);
};

window.searchPayments = function(query) {
  const payments = window.getPayments();
  if (!query) return payments;
  const q = query.trim().toLowerCase();
  return payments.filter(p => 
    p.entityName.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    (p.notes && p.notes.toLowerCase().includes(q))
  );
};

window.getPaymentsByEntity = function(entityType, entityId) {
  const payments = window.getPayments();
  return payments.filter(p => p.entityType === entityType && p.entityId === entityId);
};

window.createPaymentRecord = function({ entityType, entityId, entityName, amount, date, paymentMethod = 'cash', notes = '', createdBy = 'المدير العام' }) {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('يرجى إدخال مبلغ صحيح أكبر من الصفر');
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

  const payments = window.getPayments();
  payments.unshift(newPayment);
  window.saveCollection(window.STORAGE_KEYS.PAYMENTS, payments);

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

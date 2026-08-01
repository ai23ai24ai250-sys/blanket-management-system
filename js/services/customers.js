/**
 * Customer Service Module - Cloud Firestore Connected
 * Self-correcting recalculation formula for exact ledger debt math
 */

// 👥 Customer Categories - shared across the customer module and order creation
window.CUSTOMER_CATEGORIES = [
  'تاجر جملة',
  'تاجر تجزئة',
  'عميل قطاعي / فردي',
  'جمعية خيرية / مؤسسة',
  'معرض / وكيل',
  'عميل محتمل'
];

window.DEFAULT_CUSTOMER_CATEGORY = 'عميل قطاعي / فردي';

window.getCustomers = function() {
  return window.getCollection(window.STORAGE_KEYS.CUSTOMERS);
};

window.searchCustomers = function(query) {
  const customers = window.getCustomers();
  if (!query) return customers;
  const q = query.trim().toLowerCase();
  return customers.filter(c => 
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.phone && c.phone.includes(q)) ||
    (c.secondaryPhone && c.secondaryPhone.includes(q)) ||
    (c.id && c.id.toLowerCase().includes(q))
  );
};

window.findCustomerByPhone = function(phone) {
  if (!phone) return null;
  const customers = window.getCustomers();
  const cleaned = phone.trim();
  return customers.find(c => c.phone === cleaned || (c.secondaryPhone && c.secondaryPhone === cleaned)) || null;
};

window.getCustomerById = function(id) {
  const customers = window.getCustomers();
  return customers.find(c => c.id === id) || null;
};

window.createCustomer = function(data) {
  const existing = window.findCustomerByPhone(data.phone);
  if (existing) {
    return existing;
  }

  const newCustomer = {
    id: window.generateAutoId('CUST'),
    name: data.name.trim(),
    phone: data.phone.trim(),
    secondaryPhone: (data.secondaryPhone || '').trim(),
    category: data.category || window.DEFAULT_CUSTOMER_CATEGORY,
    address: (data.address || '').trim(),
    notes: (data.notes || '').trim(),
    ordersCount: 0,
    totalPurchases: 0,
    paid: 0,
    remainingBalance: 0,
    lastOrderDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return window.addFirestoreDoc(window.STORAGE_KEYS.CUSTOMERS, newCustomer);
};

window.updateCustomer = function(id, updatedFields) {
  const payload = {
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };
  window.updateFirestoreDoc(window.STORAGE_KEYS.CUSTOMERS, id, payload);
  return window.getCustomerById(id);
};

/**
 * Audit & Recalculation Engine:
 * Customer Debt = Total Order Amounts - Total Order Down Payments - Total Direct Ledger Payments
 */
window.recalculateCustomerBalance = function(customerId) {
  const customer = window.getCustomerById(customerId);
  if (!customer) return;
  const orders = window.getOrders().filter(o => o.customerId === customerId && o.status !== 'returned' && o.status !== 'cancelled');
  const payments = window.getPaymentsByEntity('customer', customerId);

  const totalPurchases = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalDownPayments = orders.reduce((sum, o) => sum + (Number(o.downPayment) || 0), 0);
  const totalDirectPayments = payments.filter(p => !p.isDownPayment && !p.allocatedToOrders && Number(p.amount) > 0).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPaid = totalDownPayments + totalDirectPayments;
  const remainingBalance = Math.max(0, totalPurchases - totalPaid);
  const ordersCount = orders.length;
  const lastOrderDate = orders.length ? orders.map(o => o.createdAt || o.updatedAt || '').filter(Boolean).sort().pop() : null;

  window.updateCustomer(customerId, {
    totalPurchases,
    paid: totalPaid,
    remainingBalance,
    ordersCount,
    lastOrderDate
  });
};

window.recalculateAllCustomerBalances = function() {
  const customers = window.getCustomers();
  customers.forEach(c => {
    window.recalculateCustomerBalance(c.id);
  });
};

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

window.findCustomerByPhone = function(phone, excludeId = '') {
  if (!phone) return null;
  const normalized = window.normalizePhone(phone);
  if (!normalized) return null;
  const customers = window.getCustomers();
  return customers.find(c => {
    if (c.id === excludeId) return false;
    const primary = c.phone ? window.normalizePhone(c.phone) : '';
    const secondary = c.secondaryPhone ? window.normalizePhone(c.secondaryPhone) : '';
    return (primary && primary === normalized) || (secondary && secondary === normalized);
  }) || null;
};

// V3.25 — Customer phone uniqueness across BOTH primary & secondary numbers,
// enforced through ONE shared helper (same rule + same message everywhere a
// customer is added or edited, mirroring the supplier service).
window.findCustomerPhoneConflict = function(phone, secondaryPhone, excludeId = '') {
  return (phone ? window.findCustomerByPhone(phone, excludeId) : null)
    || (secondaryPhone ? window.findCustomerByPhone(secondaryPhone, excludeId) : null);
};

window.assertCustomerPhoneAvailable = function(phone, secondaryPhone, excludeId = '') {
  const conflict = window.findCustomerPhoneConflict(phone, secondaryPhone, excludeId);
  if (conflict) {
    throw new Error('رقم الهاتف هذا مسجل بالفعل لعميل آخر (' + conflict.name + ')');
  }
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

  const secondaryPhone = (data.secondaryPhone || '').trim();
  // V3.25 — Reject a secondary phone that already belongs to another customer
  // (its primary OR secondary), and never allow secondary === primary.
  if (secondaryPhone) {
    if (window.normalizePhone(secondaryPhone) === window.normalizePhone(data.phone)) {
      throw new Error('رقم الهاتف الثانوي لا يمكن أن يطابق الرقم الرئيسي');
    }
    window.assertCustomerPhoneAvailable('', secondaryPhone, '');
  }

  const addressText = (data.address || '').trim();
  const addresses = Array.isArray(data.addresses)
    ? data.addresses
    : (addressText
        ? [{ id: window.generateAutoId('ADDR'), label: 'العنوان الأساسي', address: addressText, isDefault: true }]
        : []);

  const newCustomer = {
    id: window.generateAutoId('CUST'),
    name: data.name.trim(),
    phone: data.phone.trim(),
    secondaryPhone,
    category: data.category || window.DEFAULT_CUSTOMER_CATEGORY,
    address: addressText,
    addresses,
    notes: (data.notes || '').trim(),
    ordersCount: 0,
    totalPurchases: 0,
    paid: 0,
    remainingBalance: 0,
    lastOrderDate: null,
    createdAt: getCairoFormattedDate(),
    updatedAt: getCairoFormattedDate()
  };

  return window.addFirestoreDoc(window.STORAGE_KEYS.CUSTOMERS, newCustomer);
};

window.updateCustomer = function(id, updatedFields) {
  // V3.25 — Phone uniqueness enforced on edit too: changing the primary or the
  // secondary phone to a number already used by ANOTHER customer (primary or
  // secondary) is rejected, with the same rule used on create.
  const phone = (updatedFields.phone != null ? String(updatedFields.phone).trim() : '');
  const secondaryPhone = (updatedFields.secondaryPhone != null ? String(updatedFields.secondaryPhone).trim() : '');
  if (phone || secondaryPhone) {
    if (secondaryPhone && phone && window.normalizePhone(secondaryPhone) === window.normalizePhone(phone)) {
      throw new Error('رقم الهاتف الثانوي لا يمكن أن يطابق الرقم الرئيسي');
    }
    const finalPhone = phone || String((window.getCustomerById(id) || {}).phone || '');
    const finalSecondary = secondaryPhone !== '' ? secondaryPhone : String((window.getCustomerById(id) || {}).secondaryPhone || '');
    window.assertCustomerPhoneAvailable(finalPhone, finalSecondary, id);
  }
  // Addresses are managed exclusively through the dedicated address APIs
  // (addCustomerAddress / setDefaultCustomerAddress / removeCustomerAddress).
  // Stripping them here prevents accidental overwrites of the primary address.
  const sanitized = { ...updatedFields };
  delete sanitized.address;
  delete sanitized.addresses;
  const payload = {
    ...sanitized,
    updatedAt: getCairoFormattedDate()
  };
  window.updateFirestoreDoc(window.STORAGE_KEYS.CUSTOMERS, id, payload);
  return window.getCustomerById(id);
};

/**
 * Address Management APIs:
 * Each customer keeps an `addresses` array [{ id, label?, address, isDefault }].
 * The legacy `address` string field stays in sync with the current default so
 * existing displays (orders, statements, sheets) keep working untouched.
 */
window.getCustomerAddresses = function(customerId) {
  const customer = window.getCustomerById(customerId);
  if (!customer) return [];
  const list = Array.isArray(customer.addresses)
    ? customer.addresses.filter(a => a && a.address && String(a.address).trim())
    : [];
  if (list.length === 0 && customer.address && String(customer.address).trim()) {
    list.push({ id: 'ADDR-DEFAULT', label: 'العنوان الأساسي', address: String(customer.address).trim(), isDefault: true });
  }
  if (list.length && !list.some(a => a.isDefault)) {
    list[0] = { ...list[0], isDefault: true };
  }
  return list.map(a => ({ ...a }));
};

function saveCustomerAddresses(customerId, addresses) {
  const list = addresses.filter(a => a && a.address && String(a.address).trim());
  if (list.length && !list.some(a => a.isDefault)) {
    list[0] = { ...list[0], isDefault: true };
  }
  const primary = list.find(a => a.isDefault) || list[0] || null;
  window.updateFirestoreDoc(window.STORAGE_KEYS.CUSTOMERS, customerId, {
    addresses: list,
    address: primary ? String(primary.address).trim() : '',
    updatedAt: getCairoFormattedDate()
  });
  return list;
}

window.addCustomerAddress = function(customerId, data) {
  const customer = window.getCustomerById(customerId);
  if (!customer) throw new Error('العميل غير موجود');
  const addressText = String((data && data.address) || '').trim();
  if (!addressText) throw new Error('يرجى إدخال عنوان صحيح');
  const label = String((data && data.label) || '').trim();
  const forceDefault = !!(data && data.isDefault);
  const current = window.getCustomerAddresses(customerId);
  const isFirst = current.length === 0;
  const newAddress = {
    id: window.generateAutoId('ADDR'),
    label,
    address: addressText,
    isDefault: isFirst || forceDefault
  };
  const updated = current.map(a => ({ ...a, isDefault: forceDefault ? false : a.isDefault }));
  updated.push(newAddress);
  saveCustomerAddresses(customerId, updated);
  return newAddress;
};

window.setDefaultCustomerAddress = function(customerId, addressId) {
  const customer = window.getCustomerById(customerId);
  if (!customer) throw new Error('العميل غير موجود');
  const current = window.getCustomerAddresses(customerId);
  if (!current.some(a => a.id === addressId)) throw new Error('العنوان غير موجود');
  const updated = current.map(a => ({ ...a, isDefault: a.id === addressId }));
  saveCustomerAddresses(customerId, updated);
  return updated;
};

window.removeCustomerAddress = function(customerId, addressId) {
  const customer = window.getCustomerById(customerId);
  if (!customer) throw new Error('العميل غير موجود');
  const current = window.getCustomerAddresses(customerId);
  if (current.length <= 1) throw new Error('لا يمكن حذف العنوان الوحيد للعميل');
  const remaining = current.filter(a => a.id !== addressId);
  if (remaining.length === current.length) throw new Error('العنوان غير موجود');
  const removedDefault = current.some(a => a.id === addressId && a.isDefault);
  if (removedDefault) remaining[0] = { ...remaining[0], isDefault: true };
  saveCustomerAddresses(customerId, remaining);
  return remaining;
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
  const toNum = window.toNumber;

  const totalPurchases = window.round2(orders.reduce((sum, o) => sum + toNum(o.totalAmount), 0));
  const totalDownPayments = window.round2(orders.reduce((sum, o) => sum + toNum(o.downPayment), 0));
  const totalDirectPayments = window.round2(payments.filter(p => !p.isDownPayment && !p.allocatedToOrders && toNum(p.amount) > 0).reduce((sum, p) => sum + toNum(p.amount), 0));

  const totalPaid = window.round2(totalDownPayments + totalDirectPayments);
  // V3.15.1 — Keep an overpayment (credit balance) EXPLICIT instead of wiping it:
  //   remainingBalance keeps the legacy non-negative contract, while creditBalance
  //   surfaces any excess the customer paid so it can be refunded or carried over.
  const rawBalance = window.round2(totalPurchases - totalPaid);
  const remainingBalance = window.round2(Math.max(0, rawBalance));
  const creditBalance = rawBalance < 0 ? window.round2(Math.abs(rawBalance)) : 0;
  const ordersCount = orders.length;
  const lastOrderDate = orders.length ? orders.map(o => o.createdAt || o.updatedAt || '').filter(Boolean).sort().pop() : null;

  // V3.23 — Performance: only persist when a value actually changed. The legacy
  // unconditional updateCustomer wrote every customer on every page load (a
  // localStorage write + a queued Firestore write per customer) even when the
  // recomputed figures were identical — wasteful and slow on large datasets.
  const unchanged =
    window.toNumber(customer.totalPurchases) === totalPurchases &&
    window.toNumber(customer.paid) === totalPaid &&
    window.toNumber(customer.remainingBalance) === remainingBalance &&
    window.toNumber(customer.creditBalance) === creditBalance &&
    window.toNumber(customer.ordersCount) === ordersCount &&
    String(customer.lastOrderDate || '') === String(lastOrderDate || '');
  if (unchanged) return;

  window.updateCustomer(customerId, {
    totalPurchases,
    paid: totalPaid,
    remainingBalance,
    creditBalance,
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

/**
 * Customer Service Module
 */

window.getCustomers = function() {
  return window.getCollection(window.STORAGE_KEYS.CUSTOMERS);
};

window.searchCustomers = function(query) {
  const customers = window.getCustomers();
  if (!query) return customers;
  const q = query.trim().toLowerCase();
  return customers.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.id.toLowerCase().includes(q)
  );
};

window.findCustomerByPhone = function(phone) {
  if (!phone) return null;
  const customers = window.getCustomers();
  const cleaned = phone.trim();
  return customers.find(c => c.phone === cleaned) || null;
};

window.getCustomerById = function(id) {
  const customers = window.getCustomers();
  return customers.find(c => c.id === id) || null;
};

window.createCustomer = function(data) {
  const customers = window.getCustomers();
  
  const existing = window.findCustomerByPhone(data.phone);
  if (existing) {
    return existing;
  }

  const newCustomer = {
    id: window.generateAutoId('CUST'),
    name: data.name.trim(),
    phone: data.phone.trim(),
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

  customers.unshift(newCustomer);
  window.saveCollection(window.STORAGE_KEYS.CUSTOMERS, customers);
  return newCustomer;
};

window.updateCustomer = function(id, updatedFields) {
  const customers = window.getCustomers();
  const index = customers.findIndex(c => c.id === id);
  if (index !== -1) {
    customers[index] = {
      ...customers[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    window.saveCollection(window.STORAGE_KEYS.CUSTOMERS, customers);
    return customers[index];
  }
  return null;
};

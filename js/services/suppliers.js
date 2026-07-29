/**
 * Supplier Service Module
 */

window.getSuppliers = function() {
  return window.getCollection(window.STORAGE_KEYS.SUPPLIERS);
};

window.searchSuppliers = function(query) {
  const suppliers = window.getSuppliers();
  if (!query) return suppliers;
  const q = query.trim().toLowerCase();
  return suppliers.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.phone.includes(q) ||
    s.id.toLowerCase().includes(q)
  );
};

window.getSupplierById = function(id) {
  const suppliers = window.getSuppliers();
  return suppliers.find(s => s.id === id) || null;
};

window.createSupplier = function(data) {
  const suppliers = window.getSuppliers();
  const newSupplier = {
    id: window.generateAutoId('SUP'),
    name: data.name.trim(),
    phone: (data.phone || '').trim(),
    address: (data.address || '').trim(),
    notes: (data.notes || '').trim(),
    totalPurchases: Number(data.totalPurchases) || 0,
    paid: Number(data.paid) || 0,
    remainingBalance: (Number(data.totalPurchases) || 0) - (Number(data.paid) || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  suppliers.unshift(newSupplier);
  window.saveCollection(window.STORAGE_KEYS.SUPPLIERS, suppliers);
  return newSupplier;
};

window.updateSupplier = function(id, updatedFields) {
  const suppliers = window.getSuppliers();
  const index = suppliers.findIndex(s => s.id === id);
  if (index !== -1) {
    suppliers[index] = {
      ...suppliers[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    window.saveCollection(window.STORAGE_KEYS.SUPPLIERS, suppliers);
    return suppliers[index];
  }
  return null;
};

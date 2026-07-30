/**
 * Supplier Service Module - Cloud Firestore Connected
 */

window.getSuppliers = function() {
  return window.getCollection(window.STORAGE_KEYS.SUPPLIERS);
};

window.searchSuppliers = function(query) {
  const suppliers = window.getSuppliers();
  if (!query) return suppliers;
  const q = query.trim().toLowerCase();
  return suppliers.filter(s => 
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.phone && s.phone.includes(q)) ||
    (s.id && s.id.toLowerCase().includes(q))
  );
};

window.getSupplierById = function(id) {
  const suppliers = window.getSuppliers();
  return suppliers.find(s => s.id === id) || null;
};

window.createSupplier = function(data) {
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

  return window.addFirestoreDoc(window.STORAGE_KEYS.SUPPLIERS, newSupplier);
};

window.updateSupplier = function(id, updatedFields) {
  const payload = {
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };
  window.updateFirestoreDoc(window.STORAGE_KEYS.SUPPLIERS, id, payload);
  return window.getSupplierById(id);
};

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
    (s.secondaryPhone && s.secondaryPhone.includes(q)) ||
    (s.id && s.id.toLowerCase().includes(q))
  );
};

window.getSupplierById = function(id) {
  const suppliers = window.getSuppliers();
  return suppliers.find(s => s.id === id) || null;
};

window.findSupplierByPhone = function(phone, excludeId = '') {
  if (!phone) return null;
  const suppliers = window.getSuppliers();
  const cleaned = phone.trim();
  return suppliers.find(s => s.id !== excludeId && (s.phone === cleaned || (s.secondaryPhone && s.secondaryPhone === cleaned))) || null;
};

window.createSupplier = function(data) {
  const phone = (data.phone || '').trim();
  if (phone && window.findSupplierByPhone(phone)) {
    throw new Error('رقم الهاتف الرئيسي مسجل بالفعل لمورد آخر');
  }
  const secondaryPhone = (data.secondaryPhone || '').trim();
  if (secondaryPhone && secondaryPhone === phone) {
    throw new Error('رقم الهاتف الثانوي لا يمكن أن يطابق الرقم الرئيسي');
  }

  const newSupplier = {
    id: window.generateAutoId('SUP'),
    name: data.name.trim(),
    phone,
    secondaryPhone,
    address: (data.address || '').trim(),
    notes: (data.notes || '').trim(),
    totalPurchases: Number(data.totalPurchases) || 0,
    paid: Number(data.paid) || 0,
    remainingBalance: (Number(data.totalPurchases) || 0) - (Number(data.paid) || 0),
    createdAt: getCairoFormattedDate(),
    updatedAt: getCairoFormattedDate()
  };

  return window.addFirestoreDoc(window.STORAGE_KEYS.SUPPLIERS, newSupplier);
};

window.updateSupplier = function(id, updatedFields) {
  const phone = (updatedFields.phone || '').trim();
  const secondaryPhone = (updatedFields.secondaryPhone || '').trim();
  if (phone && window.findSupplierByPhone(phone, id)) {
    throw new Error('رقم الهاتف الرئيسي مسجل بالفعل لمورد آخر');
  }
  if (secondaryPhone && secondaryPhone === phone) {
    throw new Error('رقم الهاتف الثانوي لا يمكن أن يطابق الرقم الرئيسي');
  }

  const payload = {
    ...updatedFields,
    updatedAt: getCairoFormattedDate()
  };
  window.updateFirestoreDoc(window.STORAGE_KEYS.SUPPLIERS, id, payload);
  return window.getSupplierById(id);
};

/**
 * Product & Inventory Service Module - Cloud Firestore Connected
 */

window.getProducts = function() {
  return window.getCollection(window.STORAGE_KEYS.PRODUCTS);
};

window.searchProducts = function(query) {
  const products = window.getProducts();
  if (!query) return products;
  const q = query.trim().toLowerCase();
  return products.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.id && p.id.toLowerCase().includes(q))
  );
};

window.getLowStockProducts = function() {
  const products = window.getProducts();
  return products.filter(p => Number(p.stock) <= Number(p.minStock));
};

window.getProductById = function(id) {
  const products = window.getProducts();
  return products.find(p => p.id === id) || null;
};

window.createProduct = function(data) {
  const newProduct = {
    id: window.generateAutoId('PRD'),
    name: data.name.trim(),
    stock: Number(data.stock) || 0,
    purchasePrice: Number(data.purchasePrice) || 0,
    sellingPrice: Number(data.sellingPrice) || 0,
    minStock: Number(data.minStock) || 5,
    notes: (data.notes || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return window.addFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, newProduct);
};

window.updateProduct = function(id, updatedFields) {
  const payload = {
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };
  window.updateFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, id, payload);
  return window.getProductById(id);
};

window.deleteProduct = function(id) {
  window.deleteFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, id);
};

window.decrementProductStock = function(id, qty) {
  const product = window.getProductById(id);
  if (product) {
    const newStock = Math.max(0, Number(product.stock) - Number(qty));
    window.updateProduct(id, { stock: newStock });
  }
};

/**
 * Product & Inventory Service Module
 */

window.getProducts = function() {
  return window.getCollection(window.STORAGE_KEYS.PRODUCTS);
};

window.searchProducts = function(query) {
  const products = window.getProducts();
  if (!query) return products;
  const q = query.trim().toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q)
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
  const products = window.getProducts();
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

  products.unshift(newProduct);
  window.saveCollection(window.STORAGE_KEYS.PRODUCTS, products);
  return newProduct;
};

window.updateProduct = function(id, updatedFields) {
  const products = window.getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    window.saveCollection(window.STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  }
  return null;
};

window.decrementProductStock = function(id, qty) {
  const product = window.getProductById(id);
  if (product) {
    const newStock = Math.max(0, Number(product.stock) - Number(qty));
    window.updateProduct(id, { stock: newStock });
  }
};

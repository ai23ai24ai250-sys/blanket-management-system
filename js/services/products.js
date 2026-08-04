/**
 * Products & Stock Service Module - Cloud Firestore Connected
 * Supports Inventory Supply, Stock Restocking & Supplier Debt Accumulation
 */

window.getProducts = function() {
  return window.getCollection(window.STORAGE_KEYS.PRODUCTS);
};

window.getProductById = function(id) {
  const products = window.getProducts();
  return products.find(p => p.id === id || p.code === id) || null;
};

window.findDuplicateProduct = function({ name, code, excludeId = '' }) {
  const products = window.getProducts();
  const cleanName = (name || '').trim().toLowerCase();
  const cleanCode = (code || '').trim().toLowerCase();
  return products.find(p =>
    p.id !== excludeId && (
      (cleanName && p.name && p.name.trim().toLowerCase() === cleanName) ||
      (cleanCode && p.code && p.code.trim().toLowerCase() === cleanCode)
    )
  ) || null;
};

window.searchProducts = function(query) {
  const products = window.getProducts();
  if (!query) return products;
  const q = query.trim().toLowerCase();
  return products.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.code && p.code.toLowerCase().includes(q)) ||
    (p.id && p.id.toLowerCase().includes(q)) ||
    (p.category && p.category.toLowerCase().includes(q)) ||
    (p.supplierName && p.supplierName.toLowerCase().includes(q))
  );
};

window.getLowStockProducts = function() {
  const products = window.getProducts();
  return products.filter(p => {
    const minStock = Number(p.minStock);
    const threshold = (!isNaN(minStock) && minStock >= 0) ? minStock : 5;
    return Number(p.stock) <= threshold;
  });
};

window.createProduct = function({ code, name, category, purchasePrice, sellingPrice, stock, minStock, supplierId = '', supplierName = '' }) {
  const numStock = Number(stock) || 0;

  if (window.findDuplicateProduct({ name, code })) {
    throw new Error('يوجد منتج مسجل بالفعل بنفس الاسم أو الكود (SKU) — اختر اسماً أو كوداً مختلفاً');
  }

  const productId = window.generateAutoId('PRD');
  const now = getCairoFormattedDate();

  const newProduct = {
    id: productId,
    code: code ? code.trim() : productId,
    name: name.trim(),
    category: category ? category.trim() : 'عام',
    purchasePrice: Number(purchasePrice) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    stock: numStock,
    minStock: Number(minStock) || 5,
    supplierId,
    supplierName,
    createdAt: now,
    updatedAt: now
  };

  // Add Product to Cloud Firestore
  window.addFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, newProduct);

  // If supplier provided with stock > 0, accumulate supplier debt
  if (supplierId && numStock > 0 && newProduct.purchasePrice > 0) {
    const totalCost = window.round2(numStock * newProduct.purchasePrice);
    const supplier = window.getSupplierById(supplierId);
    if (supplier) {
      window.updateSupplier(supplierId, {
        totalPurchases: window.round2((Number(supplier.totalPurchases) || 0) + totalCost),
        remainingBalance: window.round2((Number(supplier.remainingBalance) || 0) + totalCost)
      });

      if (window.logSupplierTransaction) {
        window.logSupplierTransaction({
          supplierId,
          supplierName: supplier.name,
          type: 'تسجيل منتج ومخزون',
          refId: productId,
          debit: totalCost,
          note: `إضافة منتج "${newProduct.name}" للمخزون (${numStock} قطعة × ${newProduct.purchasePrice})`,
          date: now
        });
      }
    }
  }

  return newProduct;
};

window.updateProduct = function(id, data) {
  if (window.findDuplicateProduct({ name: data.name, code: data.code, excludeId: id })) {
    throw new Error('يوجد منتج مسجل بالفعل بنفس الاسم أو الكود (SKU)');
  }
  window.updateFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, id, {
    ...data,
    updatedAt: getCairoFormattedDate()
  });
};

window.deleteProduct = async function(id) {
  return window.deleteFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, id);
};

/**
 * Consume available stock for a sale, clamping stock at 0 (never negative).
 * Any shortfall is returned as a deficit (backorder) quantity which the caller
 * converts into a pending supplier payable.
 */
window.decrementProductStock = function(productId, qty) {
  const product = window.getProductById(productId);
  if (!product) return { consumedQty: 0, deficitQty: Number(qty) || 0 };

  const currentStock = Number(product.stock) || 0;
  const requestedQty = Number(qty) || 0;
  const consumedQty = Math.min(currentStock, requestedQty);
  const newStock = currentStock - consumedQty;
  const deficitQty = requestedQty - consumedQty;

  window.updateFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, productId, {
    stock: newStock,
    updatedAt: getCairoFormattedDate()
  });

  return { consumedQty, deficitQty };
};

window.incrementProductStock = function(productId, qty) {
  const product = window.getProductById(productId);
  if (!product) return;

  const currentStock = Number(product.stock) || 0;
  const newStock = currentStock + Number(qty);

  window.updateFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, productId, {
    stock: newStock,
    updatedAt: getCairoFormattedDate()
  });
};

/**
 * Add Stock Supply Shipment & Update Supplier Debt
 *
 * F3 — Shipment logistics costs (شحن + نسريات/مستلزمات) are NOT added to the
 * supplier's debt (supplier debt stays on the goods value only); instead they
 * are distributed into COGS, raising the product's weighted-average cost per
 * unit (تكلفة شراء القطعة / متوسط التكلفة).
 */
window.addStockShipment = function(productId, addedQty, supplierId = '', unitPurchasePrice = 0, notes = '', extras = {}) {
  const product = window.getProductById(productId);
  if (!product) throw new Error('المنتج غير موجود');

  const qty = Number(addedQty);
  if (isNaN(qty) || qty <= 0) throw new Error('يرجى إدخال كمية شحنة صحيحة أكبر من الصفر');

  const currentStock = Number(product.stock) || 0;
  const newStock = currentStock + qty;

  const shipCost = window.round2(Number(extras && extras.shippingCost) || 0);
  const suppliesCost = window.round2(Number(extras && extras.suppliesCost) || 0);
  const extrasTotal = window.round2(shipCost + suppliesCost);
  if (extrasTotal < 0) throw new Error('قيمة مصاريف الشحن/النسريات غير صالحة');

  const updatePayload = {
    stock: newStock,
    updatedAt: getCairoFormattedDate()
  };

  const purPrice = Number(unitPurchasePrice);
  const oldPurchasePrice = Number(product.purchasePrice) || 0;

  // F3 — COGS split: new unit cost = weighted average of (old stock cost +
  // goods cost + shipment logistics costs) across the new total stock.
  if ((!isNaN(purPrice) && purPrice >= 0) || extrasTotal > 0) {
    const goodsCost = (purPrice > 0 ? purPrice : oldPurchasePrice) * qty;
    const totalCost = (currentStock * oldPurchasePrice) + goodsCost + extrasTotal;
    updatePayload.purchasePrice = newStock > 0 ? window.round2(totalCost / newStock) : 0;
  }
  if (extrasTotal > 0) {
    updatePayload.shipmentExtrasTotal = window.round2((Number(product.shipmentExtrasTotal) || 0) + extrasTotal);
    updatePayload.lastShipmentExtras = { shippingCost: shipCost, suppliesCost, total: extrasTotal, date: getCairoFormattedDate() };
  }

  window.updateFirestoreDoc(window.STORAGE_KEYS.PRODUCTS, productId, updatePayload);

  // 📦 Accumulate Supplier Debt if Supplier selected — goods value ONLY
  // (F3: shipment logistics are never added to the supplier's balance).
  if (supplierId) {
    const costPerUnit = purPrice > 0 ? purPrice : oldPurchasePrice;
    const totalShipmentCost = window.round2(qty * costPerUnit);

    const supplier = window.getSupplierById(supplierId);
    if (supplier && totalShipmentCost > 0) {
      window.updateSupplier(supplierId, {
        totalPurchases: window.round2((Number(supplier.totalPurchases) || 0) + totalShipmentCost),
        remainingBalance: window.round2((Number(supplier.remainingBalance) || 0) + totalShipmentCost)
      });

      if (window.logSupplierTransaction) {
        const extrasNote = extrasTotal > 0
          ? ` + مصاريف شحن/نسريات ${window.formatCurrency(extrasTotal)} موزعة على تكلفة القطعة (لا تُضاف لمديونية المورد)`
          : '';
        window.logSupplierTransaction({
          supplierId,
          supplierName: supplier.name,
          type: 'شحنة توريد',
          refId: product.id,
          debit: totalShipmentCost,
          note: (notes || '').trim() || `توريد شحنة "${product.name}" (${qty} قطعة × ${window.formatCurrency(costPerUnit)}) للمخزن${extrasNote}`,
          date: getCairoFormattedDate()
        });
      }
    }
  }
};

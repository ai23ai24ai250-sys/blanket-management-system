/**
 * Orders Service Module - Cloud Firestore Connected
 * Fixed Down Payment, Order Returns & Stock Restocking Flow
 */

window.getOrders = function() {
  return window.getCollection(window.STORAGE_KEYS.ORDERS);
};

window.getOrderById = function(id) {
  const orders = window.getOrders();
  return orders.find(o => o.id === id) || null;
};

window.searchOrders = function(query) {
  const orders = window.getOrders();
  if (!query) return orders;
  const q = query.trim().toLowerCase();
  return orders.filter(o => 
    (o.id && o.id.toLowerCase().includes(q)) ||
    (o.customerName && o.customerName.toLowerCase().includes(q)) ||
    (o.customerPhone && o.customerPhone.includes(q))
  );
};

window.getOpenOrdersCount = function() {
  const orders = window.getOrders();
  return orders.filter(o => o.status === 'new' || o.status === 'delivered').length;
};

window.getTotalSalesAmount = function() {
  const orders = window.getOrders();
  return orders
    .filter(o => o.status !== 'returned' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
};

window.createOrder = function({ customerInfo, items, downPayment = 0, status = 'delivered', createdBy = 'المدير العام' }) {
  const phoneValidation = window.validateEgyptianPhone(customerInfo.phone);
  if (!phoneValidation.isValid) {
    throw new Error(phoneValidation.message);
  }

  let customer = window.findCustomerByPhone(phoneValidation.cleaned);
  if (!customer) {
    customer = window.createCustomer({
      name: customerInfo.name,
      phone: phoneValidation.cleaned,
      address: customerInfo.address,
      notes: customerInfo.notes
    });
  }

  const processedItems = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const sellPrice = Number(item.sellingPrice) || 0;
    const purPrice = Number(item.purchasePrice) || 0;
    return {
      productId: item.productId,
      productName: item.productName,
      quantity: qty,
      purchasePrice: purPrice,
      sellingPrice: sellPrice,
      supplierId: item.supplierId || '',
      supplierName: item.supplierName || '',
      subtotal: qty * sellPrice
    };
  });

  const totalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const dp = Math.min(totalAmount, parseFloat(downPayment) || 0);
  const remainingBalance = Math.max(0, totalAmount - dp);

  const orderId = window.generateAutoId('ORD');
  const now = new Date().toISOString();

  const newOrder = {
    id: orderId,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    items: processedItems,
    totalAmount,
    downPayment: dp,
    remainingBalance,
    status,
    createdBy,
    createdAt: now,
    updatedAt: now
  };

  // 1. Add Order document to Cloud Firestore
  window.addFirestoreDoc(window.STORAGE_KEYS.ORDERS, newOrder);

  // 2. Fulfill Order: Decrement Stock & Add Total Invoice Amount to Customer's Debt
  if (status === 'delivered' || status === 'completed') {
    window.applyOrderFulfillment(newOrder);
  }

  // 3. Record Down Payment Receipt (Subtracts Down Payment from Customer Debt)
  if (dp > 0) {
    window.createPaymentRecord({
      entityType: 'customer',
      entityId: customer.id,
      entityName: customer.name,
      amount: dp,
      date: now.split('T')[0],
      paymentMethod: 'cash',
      notes: `دفعة مقدمة للطلب رقم ${newOrder.id}`,
      isDownPayment: true,
      createdBy
    });
  }

  return newOrder;
};

window.applyOrderFulfillment = function(order) {
  // Decrement Stock
  order.items.forEach(item => {
    window.decrementProductStock(item.productId, item.quantity);
  });

  // Update Customer Account Debt with full totalAmount first
  const customer = window.getCustomerById(order.customerId);
  if (customer) {
    const newCount = (Number(customer.ordersCount) || 0) + 1;
    const newPurchases = (Number(customer.totalPurchases) || 0) + order.totalAmount;
    const newBalance = (Number(customer.remainingBalance) || 0) + order.totalAmount;

    window.updateCustomer(customer.id, {
      ordersCount: newCount,
      totalPurchases: newPurchases,
      remainingBalance: newBalance,
      lastOrderDate: new Date().toISOString()
    });
  }
};

/**
 * Handle Order Status Transitions including Returns & Restocking
 */
window.updateOrderStatus = function(orderId, newStatus) {
  const orders = window.getOrders();
  const currentOrder = orders.find(o => o.id === orderId);
  if (!currentOrder) return null;

  const oldStatus = currentOrder.status;
  if (oldStatus === newStatus) return currentOrder;

  const payload = {
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  window.updateFirestoreDoc(window.STORAGE_KEYS.ORDERS, orderId, payload);

  // 1. Transition from New to Delivered/Completed: Fulfill order and decrement stock
  if (oldStatus === 'new' && (newStatus === 'delivered' || newStatus === 'completed')) {
    window.applyOrderFulfillment(currentOrder);
  }

  // 2. Transition to Returned from Delivered/Completed: Revert Stock & Customer Debt
  if ((oldStatus === 'delivered' || oldStatus === 'completed') && newStatus === 'returned') {
    // Re-add product quantities back to stock
    currentOrder.items.forEach(item => {
      window.incrementProductStock(item.productId, item.quantity);
    });

    // Revert customer debt balance
    const customer = window.getCustomerById(currentOrder.customerId);
    if (customer) {
      const updatedPurchases = Math.max(0, (Number(customer.totalPurchases) || 0) - currentOrder.totalAmount);
      const updatedBalance = Math.max(0, (Number(customer.remainingBalance) || 0) - currentOrder.remainingBalance);
      window.updateCustomer(customer.id, {
        totalPurchases: updatedPurchases,
        remainingBalance: updatedBalance
      });
    }
  }

  return { ...currentOrder, ...payload };
};

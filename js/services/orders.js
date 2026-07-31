/**
 * Orders Service Module - Cloud Firestore Connected
 * Fixed Down Payment, Full Settlement, Cash Treasury Receipts, Order Returns & Stock Restocking Flow
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
    (o.customerPhone && o.customerPhone.includes(q)) ||
    (o.customerSecondaryPhone && o.customerSecondaryPhone.includes(q))
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

window.createOrder = function({ customerInfo, items, downPayment = 0, shippingCost = 0, shippingPayer = 'customer', extraExpenses = 0, extraExpensesPayer = 'customer', status = 'delivered', createdBy = 'المدير العام', directShipping = false }) {
  const phoneValidation = window.validateEgyptianPhone(customerInfo.phone);
  if (!phoneValidation.isValid) {
    throw new Error(phoneValidation.message);
  }

  const secondaryPhone = (customerInfo.secondaryPhone || '').trim();
  const customerCategory = customerInfo.category || window.DEFAULT_CUSTOMER_CATEGORY;

  let customer = window.findCustomerByPhone(phoneValidation.cleaned);
  if (!customer) {
    customer = window.createCustomer({
      name: customerInfo.name,
      phone: phoneValidation.cleaned,
      secondaryPhone: secondaryPhone,
      category: customerCategory,
      address: customerInfo.address,
      notes: customerInfo.notes
    });
  } else {
    // Keep the existing customer record in sync with the order form's contact
    // info (never wipe an existing secondary phone with a blank value).
    const syncUpdates = {};
    if (secondaryPhone && customer.secondaryPhone !== secondaryPhone) {
      syncUpdates.secondaryPhone = secondaryPhone;
    }
    if (customer.category !== customerCategory) {
      syncUpdates.category = customerCategory;
    }
    if (Object.keys(syncUpdates).length > 0) {
      window.updateCustomer(customer.id, syncUpdates);
    }
  }

  const orderSecondaryPhone = secondaryPhone || customer.secondaryPhone || '';
  const orderCategory = customerCategory || customer.category || window.DEFAULT_CUSTOMER_CATEGORY;

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

  const itemsSubtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shipCost = Number(shippingCost) || 0;
  const exExpenses = Number(extraExpenses) || 0;

  const totalAmount = itemsSubtotal
    + (shippingPayer === 'customer' ? shipCost : 0)
    + (extraExpensesPayer === 'customer' ? exExpenses : 0);
  // "مكتمل نهائي (تسليم وتم تحصيل الحساب)" = تحصيل كامل للفاتورة تلقائياً:
  // paidAmount = totalInvoiceAmount والمتبقي 0 (لا دين وهمي على العميل).
  const dp = (status === 'completed') ? totalAmount : Math.min(totalAmount, parseFloat(downPayment) || 0);
  const remainingBalance = Math.max(0, totalAmount - dp);
  const paidInFull = (dp === totalAmount);

  const orderId = window.generateAutoId('ORD');
  const now = new Date().toISOString();

  const newOrder = {
    id: orderId,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerSecondaryPhone: orderSecondaryPhone,
    customerCategory: orderCategory,
    items: processedItems,
    itemsSubtotal,
    shippingCost: shipCost,
    shippingPayer,
    extraExpenses: exExpenses,
    extraExpensesPayer,
    totalAmount,
    downPayment: dp,
    remainingBalance,
    paidInFull,
    status,
    directShipping: !!directShipping,
    createdBy,
    createdAt: now,
    updatedAt: now
  };

  // 1. Add Order document to Cloud Firestore
  window.addFirestoreDoc(window.STORAGE_KEYS.ORDERS, newOrder);

  // 2. Fulfill Order: Decrement Stock & Update Customer's Debt
  if (status === 'delivered' || status === 'completed') {
    window.applyOrderFulfillment(newOrder);
  }

  // 3. Log Cash Treasury Receipt for Down Payment or Full Settlement
  if (dp > 0) {
    window.createPaymentRecord({
      entityType: 'customer',
      entityId: customer.id,
      entityName: customer.name,
      amount: dp,
      date: now.split('T')[0],
      paymentMethod: 'cash',
      notes: paidInFull ? `تحصيل كامل قيمة الفاتورة رقم ${newOrder.id}` : `دفعة مقدمة (عربون) للطلب رقم ${newOrder.id}`,
      isDownPayment: true,
      createdBy
    });
  }

  return newOrder;
};

window.applyOrderFulfillment = function(order) {
  // Update Customer Ledger: Add remaining debt if remainingBalance > 0
  const updateCustomerLedger = () => {
    const customer = window.getCustomerById(order.customerId);
    if (!customer) return;
    const newCount = (Number(customer.ordersCount) || 0) + 1;
    const newPurchases = (Number(customer.totalPurchases) || 0) + order.totalAmount;
    const newBalance = (Number(customer.remainingBalance) || 0) + order.remainingBalance;

    window.updateCustomer(customer.id, {
      ordersCount: newCount,
      totalPurchases: newPurchases,
      remainingBalance: newBalance,
      lastOrderDate: new Date().toISOString()
    });
  };

  // DIRECT SHIPPING: the order goes straight from the supplier to the customer.
  // No warehouse stock is consumed, no deficit payable is generated. Instead the
  // selected supplier is charged a direct-supply shipment (توريد) at the item's
  // purchase price; the shipments are persisted on the order so a later
  // return/cancel reverses exactly those supplier ledger entries.
  if (order.directShipping) {
    const supplierShipments = [];

    order.items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const costPerUnit = Number(item.purchasePrice) || 0;
      const supplierId = item.supplierId || '';
      const supplierName = item.supplierName || '';
      item.consumed = 0;

      if (supplierId && costPerUnit > 0 && qty > 0) {
        const totalShipmentCost = qty * costPerUnit;
        const supplier = window.getSupplierById(supplierId);
        if (supplier) {
          window.updateSupplier(supplierId, {
            totalPurchases: (Number(supplier.totalPurchases) || 0) + totalShipmentCost,
            remainingBalance: (Number(supplier.remainingBalance) || 0) + totalShipmentCost
          });

          if (window.logSupplierTransaction) {
            window.logSupplierTransaction({
              supplierId,
              supplierName: supplier.name,
              type: 'شحنة توريد',
              refId: order.id,
              debit: totalShipmentCost,
              note: `شحن مباشر من المورد للطلب ${order.id}: "${item.productName}" (${qty} قطعة × ${costPerUnit}) بدون مرور المخزن`,
              date: new Date().toISOString()
            });
          }

          supplierShipments.push({
            supplierId,
            supplierName,
            productId: item.productId,
            productName: item.productName,
            units: qty,
            amount: totalShipmentCost
          });
        }
      }
    });

    const persistPayload = { items: order.items.map(item => ({ ...item })) };
    if (supplierShipments.length > 0) persistPayload.supplierShipments = supplierShipments;
    window.updateFirestoreDoc(window.STORAGE_KEYS.ORDERS, order.id, persistPayload);

    updateCustomerLedger();
    return;
  }

  // Stock is consumed down to 0 (never negative). Any shortfall (deficit/backorder)
  // becomes a Pending Supplier Payable attributed STRICTLY to the supplier selected
  // on that item line. Each supplier's ledger stays independent & isolated, and the
  // debt can be settled later via Payments → تسديد دفعة لمورد.
  const deficits = [];

  order.items.forEach(item => {
    const { consumedQty, deficitQty } = window.decrementProductStock(item.productId, item.quantity);
    // Track how many units were physically removed from stock so a later
    // return/cancel restores exactly those units — never the full order quantity.
    // (Deficit/backorder units were never physically in stock; their supplier
    //  payable is reversed separately, so restoring them too would inflate stock.)
    item.consumed = consumedQty;
    const product = window.getProductById(item.productId);

    if (deficitQty > 0 && product) {
      const costPerUnit = Number(item.purchasePrice) || Number(product.purchasePrice) || 0;
      const supplierId = item.supplierId || '';
      const supplierName = item.supplierName || '';

      if (supplierId && costPerUnit > 0) {
        const payableAmount = deficitQty * costPerUnit;
        const supplier = window.getSupplierById(supplierId);
        if (supplier) {
          window.updateSupplier(supplierId, {
            totalPurchases: (Number(supplier.totalPurchases) || 0) + payableAmount,
            remainingBalance: (Number(supplier.remainingBalance) || 0) + payableAmount
          });

          if (window.logSupplierTransaction) {
            window.logSupplierTransaction({
              supplierId,
              supplierName: supplier.name,
              type: 'مديونية عجز مخزون',
              refId: order.id,
              debit: payableAmount,
              note: `طلب مؤجل ${order.id}: عجز ${deficitQty} قطعة من "${product.name}" بسعر الشراء`,
              date: new Date().toISOString()
            });
          }

          deficits.push({
            supplierId,
            supplierName,
            productId: product.id,
            productName: product.name,
            units: deficitQty,
            amount: payableAmount
          });
        }
      }
    }
  });

  // Persist the pending payable records on the order so they can be reversed on return/cancel,
  // and persist the per-item consumed units so reversal restores exactly those units.
  const persistPayload = { items: order.items.map(item => ({ ...item })) };
  if (deficits.length > 0) {
    persistPayload.supplierDeficits = deficits;
  }
  window.updateFirestoreDoc(window.STORAGE_KEYS.ORDERS, order.id, persistPayload);

  updateCustomerLedger();
};

/**
 * V3.4 — Flexible Deposit Refund on Order Cancellation.
 * The paid deposit (downPayment) is RETAINED by default as operational
 * shipping/processing revenue. Only the explicitly-confirmed refundAmount
 * (0..downPayment) is returned to the customer:
 *   retainedDeposit = downPayment − refundAmount  → kept in treasury/reports as income
 *   refundAmount                                  → logged as an outgoing refund_deposit
 *     treasury payment (reduces cash flow & net revenue).
 */
function handleDepositRefund(order, refundAmount) {
  const deposit = Number(order.downPayment) || 0;
  if (deposit <= 0) return;

  const refundAmt = Math.min(Math.max(0, Number(refundAmount) || 0), deposit);
  const retained = deposit - refundAmt;

  window.updateFirestoreDoc(window.STORAGE_KEYS.ORDERS, order.id, {
    refundedAmount: refundAmt,
    retainedDeposit: retained
  });

  // Money the customer has "on account" drops by the RETAINED portion now; the
  // actual cash refund record below then drops it by the refunded portion, so
  // the total reduction equals the full down payment (the cancelled order's
  // deposit no longer counts toward the customer's paid balance).
  const customer = window.getCustomerById(order.customerId);
  if (customer) {
    window.updateCustomer(customer.id, {
      paid: Math.max(0, (Number(customer.paid) || 0) - retained)
    });
  }

  if (refundAmt > 0) {
    window.createPaymentRecord({
      entityType: 'customer',
      entityId: order.customerId,
      entityName: order.customerName,
      amount: -refundAmt,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: `إرجاع عربون للعميل عن الطلب الملغي رقم ${order.id}`,
      createdBy: 'المدير العام'
    });
  }
}

/**
 * Handle Automated Order Status Update Actions (Delivered, Returned, Cancelled)
 */
window.updateOrderStatus = function(orderId, newStatus, refundAmount) {
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

  // V3.4: Cancel a pending (new) order — fulfillment never ran, so there is no
  // stock/supplier-debt/ledger to revert; only the deposit (refund) handling applies.
  if (oldStatus === 'new' && newStatus === 'cancelled') {
    handleDepositRefund(currentOrder, refundAmount);
  }

  // 3. Transition from Cancelled/Returned back to Delivered/Completed: Re-fulfill order and decrement stock
  //    (prevents double-restock: cancelled order re-added stock, reactivating it must decrement again)
  //    Also re-record the down payment that was refunded on cancellation so the customer ledger stays consistent.
  if ((oldStatus === 'returned' || oldStatus === 'cancelled') && (newStatus === 'delivered' || newStatus === 'completed')) {
    window.applyOrderFulfillment(currentOrder);
    // Re-record only the deposit that was actually RETAINED (V3.4: if a partial
    // refund was given on cancellation, the refunded part was handed back in cash
    // and must not be re-credited). Legacy orders without refund fields → full downPayment.
    const reCreditAmount = Math.max(0, (Number(currentOrder.downPayment) || 0) - (Number(currentOrder.refundedAmount) || 0));
    if (reCreditAmount > 0) {
      window.createPaymentRecord({
        entityType: 'customer',
        entityId: currentOrder.customerId,
        entityName: currentOrder.customerName,
        amount: reCreditAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        isDownPayment: true,
        notes: `إعادة تسجيل دفعة / رد مبلغ للطلب رقم ${currentOrder.id} بعد إعادة تفعيله`,
        createdBy: 'المدير العام'
      });
    }
  }

  // 2. Transition to Returned / Cancelled from Delivered/Completed: Revert Stock & Cancel Customer Debt
  if ((oldStatus === 'delivered' || oldStatus === 'completed') && (newStatus === 'returned' || newStatus === 'cancelled')) {
    // Re-add product quantities back into inventory stock.
    // Restore exactly the physically-consumed units (recorded at fulfillment time);
    // fall back to the full order quantity for legacy orders created before this was tracked.
    // Direct-shipping orders never touched the warehouse, so nothing is restored.
    if (!currentOrder.directShipping) {
      currentOrder.items.forEach(item => {
        const consumed = typeof item.consumed === 'number' && item.consumed >= 0 ? item.consumed : (Number(item.quantity) || 0);
        window.incrementProductStock(item.productId, consumed);
      });
    }

    // Reverse the supplier debt that was accumulated for negative-stock deficits
    (currentOrder.supplierDeficits || []).forEach(d => {
      const supplier = window.getSupplierById(d.supplierId);
      if (supplier) {
        window.updateSupplier(d.supplierId, {
          totalPurchases: Math.max(0, (Number(supplier.totalPurchases) || 0) - Number(d.amount)),
          remainingBalance: Math.max(0, (Number(supplier.remainingBalance) || 0) - Number(d.amount))
        });

        if (window.logSupplierTransaction) {
          window.logSupplierTransaction({
            supplierId: d.supplierId,
            supplierName: supplier.name,
            type: 'إلغاء مديونية عجز',
            refId: currentOrder.id,
            credit: Number(d.amount) || 0,
            note: `إلغاء مديونية عجز مخزون للطلب ${currentOrder.id} (${d.productName} x${d.units}) بعد الإرجاع/الإلغاء`,
            date: new Date().toISOString()
          });
        }
      }
    });

    // Reverse the direct-supply shipments recorded at fulfillment time
    (currentOrder.supplierShipments || []).forEach(d => {
      const supplier = window.getSupplierById(d.supplierId);
      if (supplier) {
        window.updateSupplier(d.supplierId, {
          totalPurchases: Math.max(0, (Number(supplier.totalPurchases) || 0) - Number(d.amount)),
          remainingBalance: Math.max(0, (Number(supplier.remainingBalance) || 0) - Number(d.amount))
        });

        if (window.logSupplierTransaction) {
          window.logSupplierTransaction({
            supplierId: d.supplierId,
            supplierName: supplier.name,
            type: 'إلغاء شحنة توريد مباشر',
            refId: currentOrder.id,
            credit: Number(d.amount) || 0,
            note: `إلغاء شحنة التوريد المباشر للطلب ${currentOrder.id} (${d.productName} x${d.units}) بعد الإرجاع/الإلغاء`,
            date: new Date().toISOString()
          });
        }
      }
    });

    // Revert customer debt balance
    const customer = window.getCustomerById(currentOrder.customerId);
    if (customer) {
      const oldPaid = Number(customer.paid) || 0;
      const oldPurchases = Number(customer.totalPurchases) || 0;
      const oldBalance = Number(customer.remainingBalance) || 0;

      const updatedPurchases = Math.max(0, oldPurchases - currentOrder.totalAmount);
      const updatedBalance = Math.max(0, oldBalance - currentOrder.remainingBalance);
      window.updateCustomer(customer.id, {
        totalPurchases: updatedPurchases,
        remainingBalance: updatedBalance
      });

      if (newStatus === 'cancelled') {
        // V3.4: CANCELLED → the deposit is retained by default as operational
        // revenue; only the admin-confirmed refundAmount is returned. This also
        // persists refundedAmount/retainedDeposit on the order for reports.
        handleDepositRefund(currentOrder, refundAmount);
      } else {
        // RETURNED → legacy behavior: auto-refund all the money the customer paid
        // toward this order (total customer payments minus what they still owe).
        const newOwed = Math.max(0, updatedPurchases - updatedBalance);
        const autoRefund = Math.max(0, oldPaid - newOwed);
        if (autoRefund > 0) {
          window.createPaymentRecord({
            entityType: 'customer',
            entityId: currentOrder.customerId,
            entityName: currentOrder.customerName,
            amount: -autoRefund,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            notes: `رد مبلغ مسدد / تسوية مرتجع للطلب رقم ${currentOrder.id}`,
            createdBy: 'المدير العام'
          });
        }
      }
    }
  }

  // 4. AUTO-SETTLE: "مكتمل نهائي (تسليم وتم تحصيل الحساب)" = تحصيل كامل للفاتورة.
  //    يُسدد المتبقي فوراً (paidAmount = totalAmount والمتبقي 0) فلا يظهر دين وهمي على
  //    الفاتورة، مع تسجيل القبض في خزينة النقدية وإعادة حساب دفتر العميل للمطابقة.
  if (newStatus === 'completed') {
    const remainingToSettle = Number(currentOrder.remainingBalance) || 0;
    if (remainingToSettle > 0) {
      currentOrder.downPayment = Number(currentOrder.totalAmount) || 0;
      currentOrder.remainingBalance = 0;
      currentOrder.paidInFull = true;

      window.updateFirestoreDoc(window.STORAGE_KEYS.ORDERS, orderId, {
        downPayment: currentOrder.downPayment,
        remainingBalance: 0,
        paidInFull: true
      });

      window.createPaymentRecord({
        entityType: 'customer',
        entityId: currentOrder.customerId,
        entityName: currentOrder.customerName,
        amount: remainingToSettle,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        isDownPayment: true,
        notes: `تحصيل كامل المتبقي عند إتمام الفاتورة رقم ${currentOrder.id} (مكتمل نهائي)`,
        createdBy: 'المدير العام'
      });

      window.recalculateCustomerBalance(currentOrder.customerId);
    }
  }

  return { ...currentOrder, ...payload };
};

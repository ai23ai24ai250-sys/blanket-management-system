/**
 * Cloud Firestore Data Storage & Service Layer
 * Synchronizes real-time data across all devices (PC, Mobile, Web) using Cloud Firestore SDK
 */

window.STORAGE_KEYS = {
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  USER: 'users',
};

// In-memory cache for ultra-fast instant UI rendering
window.firestoreCache = {
  customers: [],
  suppliers: [],
  products: [],
  orders: [],
  payments: []
};

// Seed Data for initial store demonstration if Firestore collection is completely empty
const INITIAL_PRODUCTS = [
  { id: 'PRD-1001', name: 'بطانية مورا إسباني مزدوجة 6 كيلو', stock: 25, purchasePrice: 1200, sellingPrice: 1650, minStock: 5, notes: 'بطانية عالية الجودة' },
  { id: 'PRD-1002', name: 'بطانية سانتامورا مفردة 4 كيلو', stock: 3, purchasePrice: 750, sellingPrice: 980, minStock: 10, notes: 'منتج عليه إقبال عالي' },
  { id: 'PRD-1003', name: 'سجادة النساجون شرقي قياس 2×3 م', stock: 12, purchasePrice: 2100, sellingPrice: 2800, minStock: 4, notes: 'تصاميم كلاسيكية' },
  { id: 'PRD-1004', name: 'طقم لحاف مفروشات عروسة 6 قطع', stock: 8, purchasePrice: 1400, sellingPrice: 1950, minStock: 3, notes: 'خامة قطنية' },
  { id: 'PRD-1005', name: 'مفرش سرير مطرز فاخر', stock: 2, purchasePrice: 450, sellingPrice: 650, minStock: 5, notes: 'مخزون منخفض' },
];

const INITIAL_CUSTOMERS = [
  { id: 'CUST-1001', name: 'أحمد محمود العبد', phone: '01012345678', address: 'القاهرة - مدينة نصر', notes: 'عميل جملة ممتاز', ordersCount: 2, totalPurchases: 4600, paid: 3000, remainingBalance: 1600, lastOrderDate: '2026-07-28T14:30:00Z' },
  { id: 'CUST-1002', name: 'مصطفى حسن إبراهيم', phone: '01198765432', address: 'الجيزة - الدقي', notes: 'عميل تجزئة', ordersCount: 1, totalPurchases: 1950, paid: 1950, remainingBalance: 0, lastOrderDate: '2026-07-25T11:15:00Z' },
];

const INITIAL_SUPPLIERS = [
  { id: 'SUP-1001', name: 'شركة النساجون الشرقيون للمفروشات', phone: '01234567890', address: 'العاشر من رمضان', notes: 'مورد سجادات ومفارش', totalPurchases: 45000, paid: 35000, remainingBalance: 10000 },
  { id: 'SUP-1002', name: 'مصنع المورا لتصنيع البطانيات', phone: '01511223344', address: 'المحلة الكبرى', notes: 'مورد بطانيات إسباني ومحلي', totalPurchases: 32000, paid: 32000, remainingBalance: 0 },
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-1001',
    customerId: 'CUST-1001',
    customerName: 'أحمد محمود العبد',
    customerPhone: '01012345678',
    items: [
      { productId: 'PRD-1001', productName: 'بطانية مورا إسباني مزدوجة 6 كيلو', quantity: 2, purchasePrice: 1200, sellingPrice: 1650, supplierId: 'SUP-1002', supplierName: 'مصنع المورا لتصنيع البطانيات', subtotal: 3300 }
    ],
    totalAmount: 3300,
    downPayment: 2000,
    remainingBalance: 1300,
    status: 'delivered',
    createdBy: 'المدير العام',
    createdAt: '2026-07-28T14:30:00Z'
  }
];

const INITIAL_PAYMENTS = [
  {
    id: 'PAY-1001',
    entityType: 'customer',
    entityId: 'CUST-1001',
    entityName: 'أحمد محمود العبد',
    amount: 2000,
    date: '2026-07-28',
    paymentMethod: 'cash',
    notes: 'دفعة مقدمة للطلب ORD-1001',
    createdBy: 'المدير العام',
    createdAt: '2026-07-28T14:30:00Z'
  }
];

// Initialize Real-time Listeners (onSnapshot) for all Firestore Collections
window.initDB = function() {
  if (window.db) {
    const collections = [
      { key: window.STORAGE_KEYS.PRODUCTS, initial: INITIAL_PRODUCTS },
      { key: window.STORAGE_KEYS.CUSTOMERS, initial: INITIAL_CUSTOMERS },
      { key: window.STORAGE_KEYS.SUPPLIERS, initial: INITIAL_SUPPLIERS },
      { key: window.STORAGE_KEYS.ORDERS, initial: INITIAL_ORDERS },
      { key: window.STORAGE_KEYS.PAYMENTS, initial: INITIAL_PAYMENTS }
    ];

    collections.forEach(({ key, initial }) => {
      // Setup Real-time Listener
      window.db.collection(key).onSnapshot((snapshot) => {
        if (snapshot.empty) {
          // Seed Firestore if empty
          initial.forEach(item => {
            window.db.collection(key).doc(item.id).set(item).catch(err => console.error(err));
          });
        } else {
          const items = [];
          snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
          });
          window.firestoreCache[key] = items;
          
          // Backup locally for offline resilience
          localStorage.setItem(`bms_data_${key}`, JSON.stringify(items));

          // Trigger view refresh if App instance is active
          if (window.appInstance && window.isAuthenticated && window.isAuthenticated()) {
            window.appInstance.navigateTo(window.appInstance.currentView);
          }
        }
      }, (error) => {
        console.warn(`Firestore snapshot error for ${key}:`, error);
        // Fallback to local storage if Firestore connection fails
        const fallback = localStorage.getItem(`bms_data_${key}`);
        if (fallback) {
          try { window.firestoreCache[key] = JSON.parse(fallback); } catch (e) {}
        }
      });
    });
  } else {
    // LocalStorage Fallback Mode
    Object.keys(window.firestoreCache).forEach(key => {
      const stored = localStorage.getItem(`bms_data_${key}`);
      if (stored) {
        try { window.firestoreCache[key] = JSON.parse(stored); } catch (e) {}
      } else {
        const seedMap = {
          products: INITIAL_PRODUCTS,
          customers: INITIAL_CUSTOMERS,
          suppliers: INITIAL_SUPPLIERS,
          orders: INITIAL_ORDERS,
          payments: INITIAL_PAYMENTS
        };
        if (seedMap[key]) {
          window.firestoreCache[key] = seedMap[key];
          localStorage.setItem(`bms_data_${key}`, JSON.stringify(seedMap[key]));
        }
      }
    });
  }
};

window.getCollection = function(key) {
  if (window.firestoreCache && window.firestoreCache[key]) {
    return window.firestoreCache[key];
  }
  const fallbackKey = `bms_data_${key}`;
  try {
    return JSON.parse(localStorage.getItem(fallbackKey)) || [];
  } catch (e) {
    return [];
  }
};

window.saveCollection = function(key, data) {
  window.firestoreCache[key] = data;
  localStorage.setItem(`bms_data_${key}`, JSON.stringify(data));

  // Sync to Cloud Firestore if online
  if (window.db) {
    data.forEach(item => {
      if (item.id) {
        window.db.collection(key).doc(item.id).set(item, { merge: true }).catch(err => console.error(err));
      }
    });
  }
};

// Document-level Cloud Firestore Helpers
window.addFirestoreDoc = function(collectionKey, item) {
  if (!item.id) item.id = window.generateAutoId();
  
  // Add to local cache immediately for zero latency
  const current = window.getCollection(collectionKey);
  current.unshift(item);
  window.firestoreCache[collectionKey] = current;
  localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(current));

  // Write to Cloud Firestore
  if (window.db) {
    window.db.collection(collectionKey).doc(item.id).set(item).catch(err => console.error('Firestore Add Error:', err));
  }
  return item;
};

window.updateFirestoreDoc = function(collectionKey, docId, updatedFields) {
  const current = window.getCollection(collectionKey);
  const index = current.findIndex(i => i.id === docId);
  if (index !== -1) {
    current[index] = { ...current[index], ...updatedFields };
    window.firestoreCache[collectionKey] = current;
    localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(current));
  }

  // Update Cloud Firestore
  if (window.db) {
    window.db.collection(collectionKey).doc(docId).update(updatedFields).catch(err => console.error('Firestore Update Error:', err));
  }
};

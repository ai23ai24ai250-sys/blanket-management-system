/**
 * Cloud Firestore Data Storage & Service Layer
 * Synchronous LocalStorage Pre-Hydration to prevent Zero-State Race Conditions on Page Refresh
 * Uses Firebase config from firebase-config.js if available, with inline fallback
 */

// Inline fallback config in case firebase-config.js is not loaded
const _FB_FALLBACK_CONFIG = {
  apiKey: "AIzaSyC_dzAtGDRfR759bVWgCdfqdiqD5B8tPSg",
  authDomain: "blankts-version-2.firebaseapp.com",
  projectId: "blankts-version-2",
  storageBucket: "blankts-version-2.firebasestorage.app",
  messagingSenderId: "73961546991",
  appId: "1:73961546991:web:47981903c996088551a71a",
  measurementId: "G-YHTBC8P79V"
};

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      var fbConfig = (typeof window.getFirebaseConfig === 'function') ? window.getFirebaseConfig() : _FB_FALLBACK_CONFIG;
      firebase.initializeApp(fbConfig);
    }
    window.db = firebase.firestore();
    window.auth = firebase.auth();
  }
} catch (e) {
  console.warn('Firebase Initialization Note:', e);
}

window.STORAGE_KEYS = {
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  USER: 'users',
  SUPPLIER_RETURNS: 'supplierReturns',
  SUPPLIER_TRANSACTIONS: 'supplierTransactions',
};

// In-memory cache starting completely clean for real store operations
window.firestoreCache = {
  customers: [],
  suppliers: [],
  products: [],
  orders: [],
  payments: [],
  users: [],
  supplierReturns: [],
  supplierTransactions: []
};

// Initialize DB: Synchronously pre-hydrate cache from LocalStorage FIRST, then attach FirestoreListeners
window.initDB = function() {
  const collections = [
    window.STORAGE_KEYS.PRODUCTS,
    window.STORAGE_KEYS.CUSTOMERS,
    window.STORAGE_KEYS.SUPPLIERS,
    window.STORAGE_KEYS.ORDERS,
    window.STORAGE_KEYS.PAYMENTS,
    window.STORAGE_KEYS.USER,
    window.STORAGE_KEYS.SUPPLIER_RETURNS,
    window.STORAGE_KEYS.SUPPLIER_TRANSACTIONS
  ];

  // ⚡ 1. Synchronously pre-hydrate firestoreCache from localStorage BEFORE network resolves
  collections.forEach(key => {
    const stored = localStorage.getItem(`bms_data_${key}`);
    if (stored) {
      try {
        window.firestoreCache[key] = JSON.parse(stored) || [];
      } catch (e) {
        window.firestoreCache[key] = [];
      }
    } else {
      window.firestoreCache[key] = [];
    }
  });

  // 🔒 2. Attach Real-time Listeners (onSnapshot) for Cloud Firestore Sync
  if (window.db) {
    collections.forEach((key) => {
      window.db.collection(key).onSnapshot((snapshot) => {
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        window.firestoreCache[key] = items;
        localStorage.setItem(`bms_data_${key}`, JSON.stringify(items));
        
        // Notify application of live sync update
        window.dispatchEvent(new CustomEvent('bms-data-synced', { detail: { key, items } }));
      }, (error) => {
        console.warn(`Firestore snapshot note for ${key}:`, error);
      });
    });
  }
};

window.getCollection = function(key) {
  if (window.firestoreCache && window.firestoreCache[key] && window.firestoreCache[key].length > 0) {
    return window.firestoreCache[key];
  }
  const fallbackKey = `bms_data_${key}`;
  try {
    const stored = JSON.parse(localStorage.getItem(fallbackKey)) || [];
    if (stored.length > 0 && window.firestoreCache) {
      window.firestoreCache[key] = stored;
    }
    return stored;
  } catch (e) {
    return window.firestoreCache[key] || [];
  }
};

window.saveCollection = function(key, data) {
  window.firestoreCache[key] = data;
  localStorage.setItem(`bms_data_${key}`, JSON.stringify(data));

  if (window.db) {
    data.forEach(item => {
      if (item.id) {
        window.db.collection(key).doc(item.id).set(item, { merge: true }).catch(err => console.error(err));
      }
    });
  }
};

window.addFirestoreDoc = function(collectionKey, docData) {
  if (!window.firestoreCache[collectionKey]) {
    window.firestoreCache[collectionKey] = [];
  }
  window.firestoreCache[collectionKey].unshift(docData);
  localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(window.firestoreCache[collectionKey]));

  if (window.db && docData.id) {
    window.db.collection(collectionKey).doc(docData.id).set(docData).catch(err => console.error(err));
  }
  return docData;
};

window.updateFirestoreDoc = function(collectionKey, docId, updatedFields) {
  if (window.firestoreCache[collectionKey]) {
    const idx = window.firestoreCache[collectionKey].findIndex(item => item.id === docId);
    if (idx !== -1) {
      window.firestoreCache[collectionKey][idx] = {
        ...window.firestoreCache[collectionKey][idx],
        ...updatedFields
      };
      localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(window.firestoreCache[collectionKey]));
    }
  }

  if (window.db) {
    window.db.collection(collectionKey).doc(docId).update(updatedFields).catch(err => console.error(err));
  }
};

window.deleteFirestoreDoc = function(collectionKey, docId) {
  if (window.firestoreCache[collectionKey]) {
    window.firestoreCache[collectionKey] = window.firestoreCache[collectionKey].filter(item => item.id !== docId);
    localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(window.firestoreCache[collectionKey]));
  }

  if (window.db) {
    window.db.collection(collectionKey).doc(docId).delete().catch(err => console.error(err));
  }
};

window.forceWipeDatabase = function(providedAdminPassword = '') {
  if (!window.verifyAdminPassword(providedAdminPassword)) {
    window.showToast('كلمة المرور غير صحيحة! تم حظر وإيقاف عملية تصفير البيانات 🛑', 'error');
    return false;
  }

  Object.keys(window.STORAGE_KEYS).forEach(k => {
    const key = window.STORAGE_KEYS[k];
    window.firestoreCache[key] = [];
    localStorage.removeItem(`bms_data_${key}`);

    if (window.db) {
      window.db.collection(key).get().then(snapshot => {
        snapshot.forEach(doc => doc.ref.delete());
      }).catch(err => console.error(err));
    }
  });

  window.showToast('تم مسح وتصفير القواعد السحابية بنجاح 🧹', 'success');
  return true;
};

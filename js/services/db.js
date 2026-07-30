/**
 * Cloud Firestore Data Storage & Service Layer
 * Clean Slate Production Mode & Strict Admin Password-Protected Database Wipe
 */

// Firebase SDK Credentials Initialization
const firebaseConfig = {
  apiKey: "AIzaSyCbAdo6Lm2qqCRTPKaLOLelC5v6IOEbHvM",
  authDomain: "blankts-c0c68.firebaseapp.com",
  projectId: "blankts-c0c68",
  storageBucket: "blankts-c0c68.firebasestorage.app",
  messagingSenderId: "663398193544",
  appId: "1:663398193544:web:70d90a058315bd7a3cc23d",
  measurementId: "G-1V7KXKVL8J"
};

try {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
  } else if (typeof firebase !== 'undefined' && firebase.apps.length) {
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
};

// In-memory cache starting completely clean for real store operations
window.firestoreCache = {
  customers: [],
  suppliers: [],
  products: [],
  orders: [],
  payments: [],
  users: []
};

// Initialize Real-time Listeners (onSnapshot) for all Firestore Collections
window.initDB = function() {
  if (window.db) {
    const collections = [
      window.STORAGE_KEYS.PRODUCTS,
      window.STORAGE_KEYS.CUSTOMERS,
      window.STORAGE_KEYS.SUPPLIERS,
      window.STORAGE_KEYS.ORDERS,
      window.STORAGE_KEYS.PAYMENTS,
      window.STORAGE_KEYS.USER
    ];

    collections.forEach((key) => {
      window.db.collection(key).onSnapshot((snapshot) => {
        const items = [];
        snapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        window.firestoreCache[key] = items;
        localStorage.setItem(`bms_data_${key}`, JSON.stringify(items));
      }, (error) => {
        console.warn(`Firestore snapshot note for ${key}:`, error);
        const fallback = localStorage.getItem(`bms_data_${key}`);
        if (fallback) {
          try { window.firestoreCache[key] = JSON.parse(fallback); } catch (e) {}
        }
      });
    });
  } else {
    Object.keys(window.firestoreCache).forEach(key => {
      const stored = localStorage.getItem(`bms_data_${key}`);
      if (stored) {
        try { window.firestoreCache[key] = JSON.parse(stored); } catch (e) {}
      } else {
        window.firestoreCache[key] = [];
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

  if (window.db) {
    data.forEach(item => {
      if (item.id) {
        window.db.collection(key).doc(item.id).set(item, { merge: true }).catch(err => console.error(err));
      }
    });
  }
};

window.addFirestoreDoc = function(collectionKey, item) {
  if (!item.id) item.id = window.generateAutoId();
  
  const current = window.getCollection(collectionKey);
  current.unshift(item);
  window.firestoreCache[collectionKey] = current;
  localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(current));

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

  if (window.db) {
    window.db.collection(collectionKey).doc(docId).update(updatedFields).catch(err => console.error('Firestore Update Error:', err));
  }
};

window.deleteFirestoreDoc = function(collectionKey, docId) {
  const current = window.getCollection(collectionKey);
  const updated = current.filter(i => i.id !== docId);
  window.firestoreCache[collectionKey] = updated;
  localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(updated));

  if (window.db) {
    window.db.collection(collectionKey).doc(docId).delete().catch(err => console.error('Firestore Delete Error:', err));
  }
};

/**
 * Strict Admin Password-Protected Force Wipe for Cloud Firestore Collections
 */
window.forceWipeDatabase = function(providedPassword) {
  if (!window.isAdmin()) {
    if (window.showToast) window.showToast('عفواً! عملية تصفير ومسح القواعد محصورة بحساب المدير فقط', 'error');
    return false;
  }

  const isValid = window.verifyAdminPassword(providedPassword);
  if (!isValid) {
    if (window.showToast) window.showToast('كلمة المرور غير صحيحة! تم حظر وإيقاف عملية مسح القواعد السحابية 🛑', 'error');
    return false; // STOP EXECUTION COMPLETELY
  }

  const collectionsToWipe = [
    window.STORAGE_KEYS.ORDERS,
    window.STORAGE_KEYS.CUSTOMERS,
    window.STORAGE_KEYS.SUPPLIERS,
    window.STORAGE_KEYS.PAYMENTS,
    window.STORAGE_KEYS.PRODUCTS
  ];

  collectionsToWipe.forEach(collKey => {
    window.firestoreCache[collKey] = [];
    localStorage.removeItem(`bms_data_${collKey}`);

    if (window.db) {
      window.db.collection(collKey).get().then(snapshot => {
        snapshot.forEach(doc => {
          doc.ref.delete().catch(e => console.error('Doc delete error:', e));
        });
      }).catch(err => console.error('Collection fetch error:', err));
    }
  });

  if (window.showToast) {
    window.showToast('تم مسح وإعادة ضبط كافة بيانات Cloud Firestore بنجاح 🧹', 'success');
  }
  return true;
};

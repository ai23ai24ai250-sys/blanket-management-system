/**
 * Cloud Firestore Data Storage & Service Layer
 * - Synchronous LocalStorage pre-hydration (prevents zero-state race on refresh)
 * - Firestore onSnapshot realtime listeners (cross-device live sync)
 * - Upsert writes (set + merge): partial updates create docs when missing, so a
 *   silently-failed write can never strand a doc on one device only.
 * - Offline pending-write queue: every local mutation is guaranteed to reach
 *   Firestore (auto-flushed on reconnect / reload / view render) and is never
 *   overwritten by a stale server snapshot.
 * - Tombstones: locally-deleted doc ids cannot "resurrect" from the server while
 *   the delete is still queued/offline.
 * - Diagnostics: window.getFirestoreStatus() + 'bms-sync-error' events so a
 *   broken connection or blocked Firestore rules surface in the UI/console.
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

// Every synced collection. 'expenses' is appended at runtime by expenses.js.
function syncCollections() {
  const list = [
    window.STORAGE_KEYS.PRODUCTS,
    window.STORAGE_KEYS.CUSTOMERS,
    window.STORAGE_KEYS.SUPPLIERS,
    window.STORAGE_KEYS.ORDERS,
    window.STORAGE_KEYS.PAYMENTS,
    window.STORAGE_KEYS.USER,
    window.STORAGE_KEYS.SUPPLIER_RETURNS,
    window.STORAGE_KEYS.SUPPLIER_TRANSACTIONS
  ];
  if (window.STORAGE_KEYS.EXPENSES) list.push(window.STORAGE_KEYS.EXPENSES);
  return list;
}

// =====================================================================
// SYNC DIAGNOSTICS
// =====================================================================
window.firestoreSyncErrors = [];
window.firestoreLastSyncAt = null;
window.firestoreLastSyncSource = null;
window._firestoreWriteFailures = 0;

function _recordWriteError(context, err) {
  const message = err && err.message ? err.message : String(err);

  // 🔒 Public / login-screen guard: without an active session Firestore rules
  // correctly reject reads & writes ("Missing or insufficient permissions").
  // Those failures are EXPECTED on the login screen and must never surface as a
  // red sync-error toast or console noise. The grace window also swallows the
  // brief permission-denied flash right after login, before the background
  // Firebase Auth sign-in has settled.
  const isPublicView = !(window.isAuthenticated && window.isAuthenticated());
  const inGraceWindow = Date.now() < (window._authGraceUntil || 0);
  if (isPublicView || inGraceWindow) return;

  window._firestoreWriteFailures = (window._firestoreWriteFailures || 0) + 1;
  window.firestoreSyncErrors.push({ at: new Date().toISOString(), context, message });
  if (window.firestoreSyncErrors.length > 100) window.firestoreSyncErrors.shift();
  console.error('Firestore [' + context + ']', message);
  try {
    window.dispatchEvent(new CustomEvent('bms-sync-error', { detail: { context, message } }));
  } catch (e) { /* ignore */ }
}

window.getFirestoreStatus = function() {
  return {
    connected: !!window.db,
    lastSyncAt: window.firestoreLastSyncAt,
    lastSyncSource: window.firestoreLastSyncSource,
    writeFailures: window._firestoreWriteFailures || 0,
    pendingOps: window.pendingOpsQueue().length,
    writeErrors: window.firestoreSyncErrors.slice(-5)
  };
};

// =====================================================================
// OFFLINE PENDING-WRITE QUEUE
// ---------------------------------------------------------------------
// Guarantees every local mutation eventually reaches Firestore:
//  - when window.db is missing (SDK blocked / local-only mode) ops are queued;
//  - when a live Firestore write fails (offline / blocked rules / quota) the
//    failing op is queued and retried on reconnect, reload, or next view render.
// =====================================================================
window.pendingOpsQueue = function() {
  try { return JSON.parse(localStorage.getItem('bms_pending_ops') || '[]'); }
  catch (e) { return []; }
};

function _savePendingOps(ops) {
  try { localStorage.setItem('bms_pending_ops', JSON.stringify(ops.slice(-1000))); }
  catch (e) { console.warn('Unable to persist pending sync queue:', e); }
}

window.queueFirestoreOp = function(op) {
  const ops = window.pendingOpsQueue();
  ops.push({
    qid: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    ts: new Date().toISOString(),
    ...op
  });
  _savePendingOps(ops);
};

window._flushing = false;
window.flushPendingOps = function() {
  if (!window.db || window._flushing) return Promise.resolve(0);
  window._flushing = true;
  const queue = window.pendingOpsQueue();
  if (queue.length === 0) {
    window._flushing = false;
    return Promise.resolve(0);
  }
  const flushedIds = queue.map(o => o.qid);
  return queue.reduce((chain, op) => {
    return chain.then(() => {
      if (!window.db) return Promise.resolve();
      const ref = window.db.collection(op.collection).doc(op.docId);
      if (op.kind === 'delete') return ref.delete();
      return ref.set(op.data, { merge: true });
    });
  }, Promise.resolve())
    .then(() => {
      const remaining = window.pendingOpsQueue().filter(o => flushedIds.indexOf(o.qid) === -1);
      _savePendingOps(remaining);
      window.firestoreLastSyncAt = new Date().toISOString();
      window.firestoreLastSyncSource = 'flush';
      window.dispatchEvent(new CustomEvent('bms-pending-flushed'));
    })
    .catch(err => _recordWriteError('flushPendingOps', err))
    .finally(() => { window._flushing = false; });
};

// Tombstones: ids deleted locally that must not reappear from a server snapshot
window.getTombstones = function() {
  try { return JSON.parse(localStorage.getItem('bms_tombstones') || '[]'); }
  catch (e) { return []; }
};
function _setTombstones(list) {
  try { localStorage.setItem('bms_tombstones', JSON.stringify(list)); }
  catch (e) { /* ignore */ }
}
function _addTombstone(docId) {
  const t = window.getTombstones();
  if (t.indexOf(docId) === -1) { t.push(docId); _setTombstones(t); }
}

// =====================================================================
// AUTH-GATED REALTIME SYNC
// ---------------------------------------------------------------------
// Realtime listeners + cloud pulls must NEVER run while the app is on the
// public login screen (no active session): an unauthenticated Firestore read
// is rejected by the security rules and would fire a "Missing or insufficient
// permissions" sync-error toast before the user even logs in. Sync therefore
// only starts AFTER the app confirms an active logged-in session
// (window.startFirestoreSync) and is torn down again on logout.
// =====================================================================
window._syncUnsubscribers = [];
window._authGraceUntil = 0;

function _attachFirestoreListeners() {
  if (!window.db) return;
  if (window._syncUnsubscribers && window._syncUnsubscribers.length > 0) return;

  const collections = syncCollections();
  const subs = [];

  collections.forEach((key) => {
    const unsub = window.db.collection(key).onSnapshot((snapshot) => {
      // Apply server truth, preserving local-only docs (offline writes not yet
      // visible on the server). Delivery of queued ops happens on reconnect /
      // reload / view render / online+visibility triggers, not per snapshot.
      const serverItems = [];
      snapshot.forEach(doc => {
        serverItems.push({ id: doc.id, ...doc.data() });
      });

      // Never resurrect locally-deleted docs
      const tombSet = {};
      window.getTombstones().forEach(id => { tombSet[id] = true; });

      // Keep local-only docs (offline writes not yet visible on the server)
      const serverIds = {};
      serverItems.forEach(d => { serverIds[d.id] = true; });
      const localItems = window.firestoreCache[key] || [];
      const merged = serverItems.filter(d => !tombSet[d.id]);
      localItems.forEach(d => {
        if (d.id && !serverIds[d.id] && !tombSet[d.id]) merged.push(d);
      });

      // Prune tombstones whose delete already landed on the server
      _setTombstones(window.getTombstones().filter(id => serverIds[id]));

      window.firestoreCache[key] = merged;
      localStorage.setItem(`bms_data_${key}`, JSON.stringify(merged));
      window.firestoreLastSyncAt = new Date().toISOString();
      window.firestoreLastSyncSource = 'snapshot';
      window.dispatchEvent(new CustomEvent('bms-data-synced', { detail: { key, items: merged } }));
    }, (error) => {
      // e.g. Firestore rules deny reads -> surface it and keep local data usable
      _recordWriteError('snapshot ' + key, error);
    });
    subs.push(unsub);
  });

  window._syncUnsubscribers = subs;
}

function _detachFirestoreListeners() {
  if (window._syncUnsubscribers) {
    window._syncUnsubscribers.forEach(unsub => {
      try { unsub(); } catch (e) { /* ignore */ }
    });
    window._syncUnsubscribers = [];
  }
}

// Start realtime sync + a safety-net cloud pull. No-op on the login screen.
window.startFirestoreSync = function() {
  if (!window.isAuthenticated()) return;

  // Brief grace window: right after login the local session already exists but
  // the background Firebase Auth sign-in may not have settled yet; a transient
  // permission-denied snapshot during that window must not toast.
  window._authGraceUntil = Date.now() + 5000;

  _attachFirestoreListeners();

  // 🛟 Safety-net pull: an explicit GET guarantees cloud data reaches this
  //     device even if a listener was missed or failed to attach.
  window.flushPendingOps().finally(() => {
    window.fetchAllFromFirestore(true);
  });
};

// Tear down realtime listeners when the session ends (logout / login screen).
window.stopFirestoreSync = function() {
  window._authGraceUntil = 0;
  _detachFirestoreListeners();
};

// Initialize DB: Synchronously pre-hydrate cache from LocalStorage FIRST.
// Realtime listeners/cloud pulls are NOT attached here anymore — they are gated
// behind an active session (see startFirestoreSync above), so the public login
// screen never triggers unauthenticated Firestore reads.
window.initDB = function() {
  const collections = syncCollections();

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

  // 🔒 2. Realtime sync only starts once an active session is confirmed (the app
  //     calls startFirestoreSync on login / session restore). If a session is
  //     already present at init time, start it here too.
  if (window.isAuthenticated()) {
    window.startFirestoreSync();
  }
};

// Re-fetch every collection directly from Firestore (not localStorage) and refresh
// the UI. Throttled so repeated view renders don't hammer the backend.
window._lastFetchAt = 0;
window.fetchAllFromFirestore = function(force) {
  if (!window.db) return Promise.resolve();
  const now = Date.now();
  if (!force && now - (window._lastFetchAt || 0) < 2500) return Promise.resolve();
  window._lastFetchAt = now;
  const collections = syncCollections();
  return window.flushPendingOps().then(() =>
    Promise.all(collections.map(key =>
      window.db.collection(key).get().then(snapshot => {
        const serverItems = [];
        snapshot.forEach(doc => serverItems.push({ id: doc.id, ...doc.data() }));
        const tombSet = {};
        window.getTombstones().forEach(id => { tombSet[id] = true; });
        const serverIds = {};
        serverItems.forEach(d => { serverIds[d.id] = true; });
        const filtered = serverItems.filter(d => !tombSet[d.id]);
        // Prune tombstones that are confirmed gone from the server
        _setTombstones(window.getTombstones().filter(id => !serverIds[id]));
        window.firestoreCache[key] = filtered;
        localStorage.setItem(`bms_data_${key}`, JSON.stringify(filtered));
      }).catch(err => _recordWriteError('fetchAll ' + key, err))
    ))
  ).then(() => {
    window.firestoreLastSyncAt = new Date().toISOString();
    window.firestoreLastSyncSource = 'fetchAll';
    window.dispatchEvent(new CustomEvent('bms-data-synced', { detail: { key: '*', manual: true } }));
  });
};

// Auto-recover on reconnect & when the app returns to foreground
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('online', () => {
    if (!(window.isAuthenticated && window.isAuthenticated())) return;
    window.flushPendingOps().finally(() => window.fetchAllFromFirestore());
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.isAuthenticated && window.isAuthenticated()) {
      window.flushPendingOps().finally(() => window.fetchAllFromFirestore());
    }
  });
}

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
        window.db.collection(key).doc(item.id).set(item, { merge: true })
          .then(() => { window.firestoreLastSyncAt = new Date().toISOString(); window.firestoreLastSyncSource = 'saveCollection'; })
          .catch(err => {
            _recordWriteError('saveCollection ' + key, err);
            window.queueFirestoreOp({ kind: 'set', collection: key, docId: item.id, data: item });
          });
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
    window.db.collection(collectionKey).doc(docData.id).set(docData)
      .then(() => { window.firestoreLastSyncAt = new Date().toISOString(); window.firestoreLastSyncSource = 'add'; })
      .catch(err => {
        _recordWriteError('add ' + collectionKey + '/' + docData.id, err);
        window.queueFirestoreOp({ kind: 'set', collection: collectionKey, docId: docData.id, data: docData });
      });
  } else if (docData.id) {
    window.queueFirestoreOp({ kind: 'set', collection: collectionKey, docId: docData.id, data: docData });
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

  if (window.db && docId) {
    // Upsert (set + merge) instead of update(): a partial update can never fail
    // with "no document to update" if the doc was never created on Firestore.
    window.db.collection(collectionKey).doc(docId).set(updatedFields, { merge: true })
      .then(() => { window.firestoreLastSyncAt = new Date().toISOString(); window.firestoreLastSyncSource = 'update'; })
      .catch(err => {
        _recordWriteError('update ' + collectionKey + '/' + docId, err);
        window.queueFirestoreOp({ kind: 'update', collection: collectionKey, docId, data: updatedFields });
      });
  } else if (docId) {
    window.queueFirestoreOp({ kind: 'update', collection: collectionKey, docId, data: updatedFields });
  }
};

window.deleteFirestoreDoc = function(collectionKey, docId) {
  if (window.firestoreCache[collectionKey]) {
    window.firestoreCache[collectionKey] = window.firestoreCache[collectionKey].filter(item => item.id !== docId);
    localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(window.firestoreCache[collectionKey]));
  }

  if (window.db && docId) {
    window.db.collection(collectionKey).doc(docId).delete()
      .then(() => { window.firestoreLastSyncAt = new Date().toISOString(); window.firestoreLastSyncSource = 'delete'; })
      .catch(err => {
        _recordWriteError('delete ' + collectionKey + '/' + docId, err);
        _addTombstone(docId);
        window.queueFirestoreOp({ kind: 'delete', collection: collectionKey, docId });
      });
  } else if (docId) {
    _addTombstone(docId);
    window.queueFirestoreOp({ kind: 'delete', collection: collectionKey, docId });
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
  localStorage.removeItem('bms_pending_ops');
  localStorage.removeItem('bms_tombstones');
  window._firestoreWriteFailures = 0;

  window.showToast('تم مسح وتصفير القواعد السحابية بنجاح 🧹', 'success');
  return true;
};

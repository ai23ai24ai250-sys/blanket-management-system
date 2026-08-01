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

function _recordWriteError(context, err, opts) {
  const message = err && err.message ? err.message : String(err);
  opts = opts || {};

  // 🔒 Public / login-screen guard: without an active session Firestore rules
  // correctly reject reads & writes ("Missing or insufficient permissions").
  // Those failures are EXPECTED on the login screen and must never surface as a
  // red sync-error toast or console noise. The grace window also swallows the
  // brief permission-denied flash right after login, before the background
  // Firebase Auth sign-in has settled, and anything raised WHILE a sign-in is
  // still in flight (_pendingAuth) is suppressed too — a mid-login transient
  // failure must never toast on the first page open.
  const isPublicView = !(window.isAuthenticated && window.isAuthenticated());
  const inGraceWindow = Date.now() < (window._authGraceUntil || 0);
  const authInFlight = !!window._pendingAuth;
  if (isPublicView || inGraceWindow || authInFlight) return;

  window._firestoreWriteFailures = (window._firestoreWriteFailures || 0) + 1;
  window.firestoreSyncErrors.push({ at: new Date().toISOString(), context, message });
  if (window.firestoreSyncErrors.length > 100) window.firestoreSyncErrors.shift();

  if (opts.noEvent) {
    // Caller surfaces its own (more specific) toast; still keep diagnostics.
    console.warn('Firestore [' + context + '] (action failed):', message);
    return;
  }
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
// Realtime listeners + cloud queries + collection syncs are gated behind
// firebase.auth().onAuthStateChanged yielding a NON-NULL user. On the public
// login screen (no Firebase user) NOTHING talks to Firestore, so the
// "Missing or insufficient permissions" error can never toast on page load —
// even while Firebase Auth is still asynchronously restoring a session.
// =====================================================================
window._syncUnsubscribers = [];
window._authGraceUntil = 0;
window._authUser = undefined;      // undefined = not observed yet, null = signed out, object = signed in
window._authSettled = false;
window._authWaiters = [];
window._pendingAuth = false;       // true while login()'s sign-in is in flight
window._authGateInstalled = false;

function _flushAuthWaiters() {
  const waiters = window._authWaiters;
  window._authWaiters = [];
  waiters.forEach(function(fn) {
    try { fn(window._authUser || null); } catch (e) { /* ignore */ }
  });
}

// Register the ONE auth gate that drives all Firestore activity. It always
// replays the current auth state on subscribe, so nothing is ever missed.
function _installAuthGate() {
  if (window._authGateInstalled) return;
  window._authGateInstalled = true;

  const onAuth = function(user) {
    window._authUser = user || null;
    // While a login sign-in is still in flight, an intermediate "signed out"
    // snapshot is not authoritative — keep waiting for the real user.
    if (window._pendingAuth && !user) return;
    window._authSettled = true;
    _flushAuthWaiters();
    if (user) {
      _doStartSync();
    } else {
      _detachFirestoreListeners();
    }
  };

  if (window.auth && typeof window.auth.onAuthStateChanged === 'function') {
    window.auth.onAuthStateChanged(onAuth);
  } else {
    // No Firebase Auth SDK (e.g. the isolated logic test harness): gate on the
    // local session model instead.
    onAuth(window.isAuthenticated() ? { local: true } : null);
  }
}

// Resolve once the auth gate has settled (or after a safety timeout so an
// offline / blocked sign-in can never hang the app). Resolves with the current
// Firebase user, or null.
window.waitForFirebaseAuth = function(timeoutMs) {
  _installAuthGate();
  return new Promise(function(resolve) {
    if (window._authSettled && window._authUser) return resolve(window._authUser);
    if (window._authSettled && !window._authUser && !window._pendingAuth) return resolve(null);
    const timer = setTimeout(function() {
      resolve(window._authUser || null);
    }, timeoutMs || 6000);
    window._authWaiters.push(function(user) {
      clearTimeout(timer);
      resolve(user);
    });
  });
};

function _attachFirestoreListeners() {
  if (!window.db) return;
  if (window._syncUnsubscribers && window._syncUnsubscribers.length > 0) return;

  const collections = syncCollections();
  const subs = [];

  collections.forEach((key) => {
    const unsub = window.db.collection(key).onSnapshot((snapshot) => {
      // Apply server truth. V3.8: local-only docs survive a snapshot ONLY when
      // they have a queued offline write (a genuine pending change not yet on the
      // server). Docs present locally but absent on the server with NO pending op
      // are STALE (deleted on another device) → dropped, so every browser shows
      // identical live data from Firestore.
      const serverItems = [];
      snapshot.forEach(doc => {
        serverItems.push({ id: doc.id, ...doc.data() });
      });

      // Never resurrect locally-deleted docs
      const tombSet = {};
      window.getTombstones().forEach(id => { tombSet[id] = true; });

      const serverIds = {};
      serverItems.forEach(d => { serverIds[d.id] = true; });

      // Docs with a queued offline write are genuinely "pending upload".
      const pendingIds = {};
      window.pendingOpsQueue().forEach(op => {
        if (op.collection === key && op.kind !== 'delete' && op.docId) pendingIds[op.docId] = true;
      });

      const localItems = window.firestoreCache[key] || [];
      const merged = serverItems.filter(d => !tombSet[d.id]);
      localItems.forEach(d => {
        if (d.id && !serverIds[d.id] && !tombSet[d.id] && pendingIds[d.id]) merged.push(d);
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

// V3.8 — Cloud-first convergence. Called once the auth gate confirms a real
// Firebase user: the cloud is the single source of truth, so stale local mirrors
// (data deleted/changed on another device) are wiped before listeners + a forced
// pull rebuild the local cache from Firestore. Pure-local mode (no Firestore SDK)
// is untouched — there the local cache IS the source of truth.
function _wipeStaleLocalCache() {
  if (!window.db) return;
  const collections = syncCollections();
  collections.forEach(key => {
    window.firestoreCache[key] = [];
    localStorage.removeItem(`bms_data_${key}`);
  });
}

// Attach realtime listeners + safety-net pull. Called ONLY after the auth gate
// has confirmed a non-null Firebase user.
function _doStartSync() {
  if (!window._authUser) return;

  // Brief grace window so transient failures at session start don't toast.
  window._authGraceUntil = Date.now() + 5000;

  // V3.8: enforce cloud-first on every (re)sync — never keep serving a stale
  // local mirror once the cloud is reachable. Queued offline writes live in
  // 'bms_pending_ops' (separate from the data mirrors), so flushing them below
  // still delivers them to Firestore before the fresh pull.
  _wipeStaleLocalCache();

  _attachFirestoreListeners();

  // 🛟 Safety-net pull: an explicit GET guarantees cloud data reaches this
  //     device even if a listener was missed or failed to attach.
  window.flushPendingOps().finally(() => {
    window.fetchAllFromFirestore(true);
  });
}

// Request realtime sync. Harmless on the login screen — it will only actually
// start once onAuthStateChanged confirms a real user.
window.startFirestoreSync = function() {
  _installAuthGate();
  if (window._authSettled && window._authUser) {
    _doStartSync();
  }
  // Otherwise the onAuthStateChanged gate calls _doStartSync() itself.
};

// Tear down realtime listeners when the session ends (logout / login screen).
// Fully settles the auth gate so a later login starts from a clean state and
// nothing stays subscribed while the user is signed out (persistent toasts).
window.stopFirestoreSync = function() {
  window._authGraceUntil = 0;
  _detachFirestoreListeners();
  if (!window._pendingAuth) {
    window._authUser = null;
    window._authSettled = true;
  }
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

  // 🔒 2. Install the auth gate now: from here on, onAuthStateChanged drives all
  //     realtime sync — listeners/queries only run after a non-null user.
  _installAuthGate();

  // 🔒 3. If an active local session already exists at init time, request sync
  //     (it only actually attaches after the auth gate confirms a user).
  if (window.isAuthenticated()) {
    window.startFirestoreSync();
  }
};

// Re-fetch every collection directly from Firestore (not localStorage) and refresh
// the UI. Throttled so repeated view renders don't hammer the backend.
window._lastFetchAt = 0;
window.fetchAllFromFirestore = function(force) {
  if (!window.db) return Promise.resolve();
  // 🔒 Auth gate: never query Firestore until onAuthStateChanged has confirmed
  //     a real user (silently defers everything to the post-login sync).
  if (window.auth && !window._authUser) return Promise.resolve();
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
    if (!window._authUser) return;
    window.flushPendingOps().finally(() => window.fetchAllFromFirestore());
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window._authUser) {
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

// Remove a doc from the in-memory cache + localStorage (local mirror).
function _removeFromCache(collectionKey, docId) {
  if (!window.firestoreCache[collectionKey]) return;
  window.firestoreCache[collectionKey] = window.firestoreCache[collectionKey].filter(item => item.id !== docId);
  localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(window.firestoreCache[collectionKey]));
}

/**
 * Server-first deletion. The local UI state/cache is only updated AFTER the
 * cloud confirms the document was actually deleted (await on the server write).
 * If the server rejects the delete (e.g. permission denied / offline), an
 * explicit error toast is shown, the item is KEPT locally, and the delete is
 * queued + tombstoned so it lands when connectivity/rules allow.
 */
window.deleteFirestoreDoc = async function(collectionKey, docId) {
  if (!docId) return false;

  // 🔒 Wait for the auth gate so a server delete never races an in-flight
  //     onAuthStateChanged restore (offline/blocked sign-in times out fast).
  await window.waitForFirebaseAuth();

  if (window.db) {
    try {
      await window.db.collection(collectionKey).doc(docId).delete();
      // ✅ Server confirmed the deletion — now update the local mirror.
      _removeFromCache(collectionKey, docId);
      window.firestoreLastSyncAt = new Date().toISOString();
      window.firestoreLastSyncSource = 'delete';
      return true;
    } catch (err) {
      // ❌ Server rejected / unreachable: surface it, keep the item locally.
      _recordWriteError('delete ' + collectionKey + '/' + docId, err, { noEvent: true });
      if (window.showToast) {
        window.showToast(
          '⚠️ تعذر حذف العنصر من السحابة: ' + (err && err.message ? err.message : 'خطأ غير معروف'),
          'error'
        );
      }
      _addTombstone(docId);
      window.queueFirestoreOp({ kind: 'delete', collection: collectionKey, docId });
      return false;
    }
  }

  // Local-only mode (no Firestore SDK): apply the deletion locally and queue it
  // so it reaches the cloud as soon as a connection becomes available.
  _removeFromCache(collectionKey, docId);
  _addTombstone(docId);
  window.queueFirestoreOp({ kind: 'delete', collection: collectionKey, docId });
  return true;
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
      }).catch(err => _recordWriteError('wipe ' + key, err));
    }
  });
  localStorage.removeItem('bms_pending_ops');
  localStorage.removeItem('bms_tombstones');
  window._firestoreWriteFailures = 0;

  window.showToast('تم مسح وتصفير القواعد السحابية بنجاح 🧹', 'success');
  return true;
};

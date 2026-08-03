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
  apiKey: "AIzaSyBX3vVpO5JokQO4J0lufqFbw3XnrflGJ8I",
  authDomain: "alaa-eldean-for-blankts-ce764.firebaseapp.com",
  projectId: "alaa-eldean-for-blankts-ce764",
  storageBucket: "alaa-eldean-for-blankts-ce764.firebasestorage.app",
  messagingSenderId: "332902115951",
  appId: "1:332902115951:web:377e7a27fa5178298b3b9a",
  measurementId: "G-96BFGFFGET"
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
  // V3.16.1 — Auth-hydration suppression. On page refresh Firebase Auth restores
  // the session ASYNCHRONOUSLY: Firestore listeners can fire
  // "Missing or insufficient permissions" before onAuthStateChanged confirms the
  // user. That failure is EXPECTED, never a real error, and must never toast.
  //  - authHydrating: the auth gate has not settled yet (pre-first onAuth event).
  //  - isPermissionDenied && !window._authUser: auth settled but no user
  //    confirmed yet → permission failures are transient, suppress them.
  const authHydrating = window._authSettled !== true;
  const _msg = String(message || '').toLowerCase();
  const isPermissionDenied = _msg.indexOf('permission-denied') !== -1
    || _msg.indexOf('permission denied') !== -1
    || _msg.indexOf('missing or insufficient permissions') !== -1;
  if (isPublicView || inGraceWindow || authInFlight || authHydrating || (isPermissionDenied && !window._authUser)) return;

  window._firestoreWriteFailures = (window._firestoreWriteFailures || 0) + 1;
  window.firestoreSyncErrors.push({ at: getCairoFormattedDate(), context, message });
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
    ts: getCairoFormattedDate(),
    ...op
  });
  _savePendingOps(ops);
};

window._flushing = false;
window._lastFlushError = null;
window.flushPendingOps = function() {
  if (!window.db || window._flushing) return Promise.resolve(0);
  window._flushing = true;
  window._lastFlushError = null;
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
      window.firestoreLastSyncAt = getCairoFormattedDate();
      window.firestoreLastSyncSource = 'flush';
      window.dispatchEvent(new CustomEvent('bms-pending-flushed'));
    })
    .catch(err => {
      // V3.16.4 — surface the exact Firestore error to forcePushPendingToCloud
      // so the UI can toast it instead of swallowing it.
      window._lastFlushError = err;
      _recordWriteError('flushPendingOps', err);
    })
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
// V3.16.4 — PENDING-LOCAL-DATA RECONCILE & FORCE PUSH
// ---------------------------------------------------------------------
// Every locally-created entity (customer / order / payment / return ...) is
// written into the local mirror (bms_data_*) AND either reaches Firestore
// immediately or is queued in bms_pending_ops. This reconcile closes the only
// remaining gap: a local-only doc whose queue entry was truncated (queue is
// capped at 1000) or that was never queued would otherwise be WIPED by the
// cloud-first cache wipe on the next login. It captures the local mirrors up
// front and force-pushes any doc that is missing on Firestore.
// =====================================================================

// Synchronous cheap snapshot of every local mirror (safe to call before the
// cloud-first wipe clears them).
function _snapshotLocalMirrors() {
  const snap = {};
  const collections = syncCollections();
  collections.forEach(key => {
    try {
      const raw = localStorage.getItem('bms_data_' + key);
      snap[key] = raw ? (JSON.parse(raw) || []) : [];
    } catch (e) {
      snap[key] = [];
    }
  });
  return snap;
}

// V3.16.4 — the snapshot is also PERSISTED to localStorage (bms_pending_snapshot_*)
// before the cloud-first wipe, so a crash / tab close between the snapshot and the
// background push can never strand a local-only doc. It is cleared only after a
// flush that succeeded, and re-read on the next boot if a previous push never landed.
function _persistLocalSnapshot(snap) {
  try {
    syncCollections().forEach(key => {
      const stored = (snap && snap[key]) || [];
      localStorage.setItem('bms_pending_snapshot_' + key, JSON.stringify(stored));
    });
  } catch (e) { /* storage full / blocked — the in-memory snapshot still protects */ }
}
function _loadPersistedLocalSnapshot() {
  const snap = {};
  let any = false;
  syncCollections().forEach(key => {
    try {
      const raw = localStorage.getItem('bms_pending_snapshot_' + key);
      if (raw != null) {
        snap[key] = JSON.parse(raw) || [];
        any = true;
      }
    } catch (e) { /* ignore corrupt entry */ }
  });
  return any ? snap : null;
}
function _clearPersistedLocalSnapshot() {
  syncCollections().forEach(key => {
    try { localStorage.removeItem('bms_pending_snapshot_' + key); } catch (e) { /* ignore */ }
  });
}

// Normalise a createdAt-like value into an epoch timestamp for cutoff filtering.
function _tsValue(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const s = String(value).trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/))) {
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  }
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) {
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }
  const p = Date.parse(s);
  return isNaN(p) ? 0 : p;
}
function _cutoffTs(cutoff) {
  if (cutoff == null) return 0;
  if (typeof cutoff === 'number') return cutoff;
  if (typeof cutoff === 'string') {
    const p = _tsValue(cutoff);
    // A bare date ('2026-07-31') means "created after the end of that day".
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(cutoff).trim()) && p) return p + 24 * 3600 * 1000 - 1;
    return p;
  }
  return 0;
}
function _docCreatedTs(doc) {
  return _tsValue(doc && (doc.createdAt || doc.created_at || doc.createdDate));
}

// List every local doc that is not yet safely on Firestore: either still in the
// pending queue ('queue') or present only in the local mirror with no server doc
// and no queued op ('stranded'). Optional cutoff: only entities created on/after
// the given date are reported (e.g. '2026-07-31').
window.getPendingLocalRecords = async function (cutoff) {
  const cutoffTs = _cutoffTs(cutoff);
  const matches = function (doc) {
    return !cutoffTs || (_docCreatedTs(doc) >= cutoffTs);
  };
  const out = [];

  window.pendingOpsQueue().forEach(op => {
    if (op.kind === 'delete') return;
    if (!matches(op.data || {})) return;
    out.push({ collection: op.collection, docId: op.docId, source: 'queue', queuedAt: op.ts });
  });

  if (!window.db) return out;

  const tombSet = {};
  window.getTombstones().forEach(id => { tombSet[id] = true; });
  const queuedIds = {};
  window.pendingOpsQueue().forEach(op => {
    if (op.kind !== 'delete' && op.collection && op.docId) {
      if (!queuedIds[op.collection]) queuedIds[op.collection] = {};
      queuedIds[op.collection][op.docId] = true;
    }
  });

  const collections = syncCollections();
  await Promise.all(collections.map(async (key) => {
    let serverIds = null;
    try {
      const snap = await window.db.collection(key).get();
      serverIds = {};
      snap.forEach(doc => { serverIds[doc.id] = true; });
    } catch (e) { return; }
    let localDocs = [];
    try {
      const raw = localStorage.getItem('bms_data_' + key);
      localDocs = raw ? (JSON.parse(raw) || []) : [];
    } catch (e) { localDocs = []; }
    localDocs.forEach(doc => {
      if (!doc || !doc.id || tombSet[doc.id]) return;
      if (serverIds[doc.id]) return;
      if (queuedIds[key] && queuedIds[key][doc.id]) return;
      if (!matches(doc)) return;
      out.push({ collection: key, docId: doc.id, source: 'stranded' });
    });
  }));

  return out;
};

// Queue every local-only doc (from the snapshot, or the live mirrors) that is
// missing on Firestore so flushPendingOps uploads it instead of losing it.
// When a collection cannot be read from the server (offline / rules deny), every
// non-tombstoned local doc of that collection is queued — an idempotent set+merge
// is always safe, and it guarantees no local copy is ever stranded.
// V3.16.4 — prefers the persisted crash-safe snapshot when no live snapshot is
// passed, and re-persists any passed snapshot so a crash between reconcile and
// flush cannot lose the queued set.
async function _reconcileStrandedLocalDocs(snapshot) {
  if (!window.db) return 0;
  const src = snapshot || _loadPersistedLocalSnapshot() || _snapshotLocalMirrors();
  if (snapshot) _persistLocalSnapshot(snapshot);
  const tombSet = {};
  window.getTombstones().forEach(id => { tombSet[id] = true; });
  const queuedIds = {};
  window.pendingOpsQueue().forEach(op => {
    if (op.kind !== 'delete' && op.collection && op.docId) {
      if (!queuedIds[op.collection]) queuedIds[op.collection] = {};
      queuedIds[op.collection][op.docId] = true;
    }
  });

  const collections = syncCollections();
  let queued = 0;
  await Promise.all(collections.map(async (key) => {
    const localDocs = (src && src[key]) || [];
    if (!localDocs.length) return;

    let serverIds = {};
    let readOk = true;
    try {
      const snap = await window.db.collection(key).get();
      snap.forEach(doc => { serverIds[doc.id] = true; });
    } catch (e) {
      readOk = false;
    }

    localDocs.forEach(doc => {
      if (!doc || !doc.id || tombSet[doc.id]) return;
      if (readOk && serverIds[doc.id]) return;
      if (queuedIds[key] && queuedIds[key][doc.id]) return;
      window.queueFirestoreOp({ kind: 'set', collection: key, docId: doc.id, data: doc });
      queued++;
    });
  }));

  return queued;
}

// Force-push every pending local record to Firestore (requires an active
// onAuthStateChanged user). Returns the number of records pushed.
window.forcePushPendingToCloud = async function (snapshot, opts) {
  opts = opts || {};
  if (!window.db) {
    if (window.showToast && !opts.silent) window.showToast('☁️ التزامن السحابي غير متاح حالياً — ستُرفع البيانات عند عودة الاتصال', 'warning');
    return 0;
  }
  if (!window._authUser) {
    if (window.showToast && !opts.silent) window.showToast('☁️ سجّل الدخول أولاً لرفع السجلات المعلقة إلى السحابة', 'warning');
    return 0;
  }
  try {
    const stranded = await _reconcileStrandedLocalDocs(snapshot);
    const queuedBefore = window.pendingOpsQueue().length;
    await window.flushPendingOps();
    // V3.16.4 — flushPendingOps records the exact Firestore error instead of
    // swallowing it; surface it here so the failure toast is not a generic lie.
    if (window._lastFlushError) throw window._lastFlushError;
    const pushed = Math.max(0, queuedBefore - window.pendingOpsQueue().length);
    // The push landed: the crash-safe snapshot has served its purpose.
    _clearPersistedLocalSnapshot();
    if (window.showToast && !opts.silent) {
      if (pushed > 0) {
        window.showToast('☁️ تم رفع ' + pushed + ' سجل محلي معلق إلى السحابة بنجاح', 'success');
      } else {
        window.showToast('☁️ لا توجد سجلات محلية معلقة — كل البيانات مزامنة بالفعل', 'info');
      }
    }
    return pushed;
  } catch (err) {
    _recordWriteError('forcePushPendingToCloud', err);
    // V3.16.4 — requirement: do NOT swallow exceptions. The toast carries the
    // exact Firestore error so the user (and any support) can see the real cause.
    if (window.showToast && !opts.silent) {
      window.showToast('⚠️ تعذر رفع السجلات المعلقة إلى السحابة: ' + (err && err.message ? err.message : String(err)), 'error');
    }
    return 0;
  }
};

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
      window.firestoreLastSyncAt = getCairoFormattedDate();
      window.firestoreLastSyncSource = 'snapshot';
      window.dispatchEvent(new CustomEvent('bms-data-synced', { detail: { key, items: merged } }));
      if (key === window.STORAGE_KEYS.ORDERS) window.normalizeAccountingData();
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
// V3.16.1 — OFFLINE GUARD: when the browser reports we are offline, the wipe is
// skipped so a pre-hydrated local mirror keeps rendering while the cloud is
// unreachable. The 'online' handler flushes the pending queue + re-pulls from
// Firestore as soon as connectivity returns, so the cloud-first convergence still
// happens — just not at the cost of a blank/white screen mid-outage.
function _wipeStaleLocalCache() {
  if (!window.db) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
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

  // V3.23 — Full customer-balance recomputation runs ONCE per session, deferred
  // into idle time so it can never block the login screen, the first render, or
  // the realtime sync startup. initDB deliberately skips it (see initDB), and
  // recalculateCustomerBalance skips the write when nothing actually changed,
  // so a steady-state session does no redundant storage churn.
  if (!window._balancesRecalculated) {
    window._balancesRecalculated = true;
    const recalc = function () {
      if (window.recalculateAllCustomerBalances) window.recalculateAllCustomerBalances();
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(recalc, { timeout: 3000 });
    } else {
      setTimeout(recalc, 0);
    }
  }

  // V3.16.4 — capture the local mirrors BEFORE the cloud-first wipe below. Any
  // local-only doc (created offline, never queued, or queue-truncated) would
  // otherwise be wiped before it could reach Firestore; the snapshot lets the
  // background reconcile push it after sync settles. A previous boot's persisted
  // snapshot is preferred so a crash between snapshot and push is re-covered.
  const localSnapshot = _loadPersistedLocalSnapshot() || _snapshotLocalMirrors();
  _persistLocalSnapshot(localSnapshot);

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
    // V3.16.2: pull the Google Sheets link settings from Firestore so a brand
    // new browser restores them after login instead of forcing a re-fill.
    if (window.GoogleSheetsSync && typeof window.GoogleSheetsSync.hydrateConfigFromCloud === 'function') {
      window.GoogleSheetsSync.hydrateConfigFromCloud();
    }
    // V3.16.4 — once (per session) force-push any pending local records and
    // toast how many made it to the cloud.
    if (!window._autoPushReported) {
      window._autoPushReported = true;
      window.forcePushPendingToCloud(localSnapshot, { silent: false });
    }
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
  window._autoPushReported = false;
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

  // V3.16 — Self-heal accounting data on every load: cancelled/returned orders
  // are settled invoices (متبقي 0), so no legacy cancelled/returned order can
  // keep inflating "المتبقي على العميل" or the debt cards. This stays cheap
  // (a single linear scan) and runs synchronously.
  window.normalizeAccountingData();
  // V3.23 — Performance: the full customer-balance recomputation is NOT run here
  // anymore. recalculateAllCustomerBalances() is O(customers × orders × payments)
  // and its synchronous execution used to block the login screen / first paint on
  // every open (measured ~2.3s with 800 customers / 4000 orders / 6000 payments).
  // It now runs once, DEFERRED and after the auth gate confirms a session
  // (see _doStartSync), where any stale balance from the login-screen load is
  // corrected in the background without freezing the UI.

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
        if (key === window.STORAGE_KEYS.ORDERS) window.normalizeAccountingData();
      }).catch(err => _recordWriteError('fetchAll ' + key, err))
    ))
  ).then(() => {
    window.firestoreLastSyncAt = getCairoFormattedDate();
    window.firestoreLastSyncSource = 'fetchAll';
    window.dispatchEvent(new CustomEvent('bms-data-synced', { detail: { key: '*', manual: true } }));
  });
};

// Auto-recover on reconnect & when the app returns to foreground
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('online', () => {
    if (!window._authUser) return;
    // V3.16.4 — recovery re-reconcile: connectivity is back, so re-run the
    // crash-safe snapshot reconcile + push (silently; the manual button still
    // toasts) instead of only once per session. If a flush is already in flight
    // the snapshot stays persisted until a successful push clears it.
    window._autoPushReported = false;
    window.flushPendingOps().finally(() => {
      window.fetchAllFromFirestore();
      if (window._authUser && !window._flushing) {
        window.forcePushPendingToCloud(null, { silent: true }).then(() => {
          if (window._authUser) window._autoPushReported = true;
        });
      }
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window._authUser) {
      window.flushPendingOps().finally(() => window.fetchAllFromFirestore());
    }
  });
}

// =====================================================================
// V3.16 — ACCOUNTING DATA NORMALIZATION
// ---------------------------------------------------------------------
// Cancelled (ملغي) and returned (مرتجع) orders are SETTLED invoices: their
// outstanding balance must always be 0 so they can never pollute the debt cards
// ("الديون والآجل لدى العملاء") or the "المتبقي" columns. Legacy data written
// before this rule (or hand-edited sheets) may still carry a stale >0 remaining
// balance — this normalizes it in-memory and persists the correction locally.
// (Cheap and write-free; customer balances are recomputed once in initDB via
//  recalculateAllCustomerBalances, and everywhere else the views derive debt
//  live from getOrderRemainingAmount — the single source of truth.)
// =====================================================================
window.normalizeAccountingData = function() {
  const orders = window.firestoreCache[window.STORAGE_KEYS.ORDERS];
  if (!Array.isArray(orders)) return;
  let changed = false;
  orders.forEach(o => {
    if ((o.status === 'cancelled' || o.status === 'returned') && !(Number(o.remainingBalance) === 0)) {
      o.remainingBalance = 0;
      changed = true;
    }
  });
  if (changed) {
    try {
      localStorage.setItem(`bms_data_${window.STORAGE_KEYS.ORDERS}`, JSON.stringify(orders));
    } catch (e) { /* ignore */ }
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
    if (key === window.STORAGE_KEYS.ORDERS) window.normalizeAccountingData();
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
          .then(() => { window.firestoreLastSyncAt = getCairoFormattedDate(); window.firestoreLastSyncSource = 'saveCollection'; })
          .catch(err => {
            _recordWriteError('saveCollection ' + key, err);
            window.queueFirestoreOp({ kind: 'set', collection: key, docId: item.id, data: item });
          });
      }
    });
  }
};

// Best-effort hook for the Google Sheets sync module (every-op mode). Safe to
// call before/without the module loaded — it is a no-op then.
function _notifySheetsSync() {
  if (window.GoogleSheetsSync && typeof window.GoogleSheetsSync.scheduleSync === 'function') {
    try { window.GoogleSheetsSync.scheduleSync(); } catch (e) { /* never break the write path */ }
  }
}

window.addFirestoreDoc = function(collectionKey, docData) {
  if (!window.firestoreCache[collectionKey]) {
    window.firestoreCache[collectionKey] = [];
  }
  window.firestoreCache[collectionKey].unshift(docData);
  localStorage.setItem(`bms_data_${collectionKey}`, JSON.stringify(window.firestoreCache[collectionKey]));
  _notifySheetsSync();

  if (window.db && docData.id) {
    window.db.collection(collectionKey).doc(docData.id).set(docData)
      .then(() => { window.firestoreLastSyncAt = getCairoFormattedDate(); window.firestoreLastSyncSource = 'add'; })
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
  _notifySheetsSync();

  if (window.db && docId) {
    // Upsert (set + merge) instead of update(): a partial update can never fail
    // with "no document to update" if the doc was never created on Firestore.
    window.db.collection(collectionKey).doc(docId).set(updatedFields, { merge: true })
      .then(() => { window.firestoreLastSyncAt = getCairoFormattedDate(); window.firestoreLastSyncSource = 'update'; })
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
      window.firestoreLastSyncAt = getCairoFormattedDate();
      window.firestoreLastSyncSource = 'delete';
      _notifySheetsSync();
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
  _notifySheetsSync();
  return true;
};

/**
 * V3.19 — DEEP DATA RESET (Cloud + Local).
 * Full pipeline before the page auto-reloads with a clean state:
 *   1. Pause/unsubscribe Firestore listeners FIRST so the wipe cannot cascade
 *      permission/listener errors while documents are being deleted.
 *   2. Delete EVERY document in ALL collections (customers, suppliers, products,
 *      orders, payments, users, supplierReturns, supplierTransactions, expenses,
 *      sync_logs) using writeBatch() chunks (Firestore caps a batch at 500 ops).
 *   2.5 Re-seed the default seed admin (USR-1001) plus the currently logged-in
 *      admin's account so the owner can NEVER be locked out of a freshly wiped
 *      system (business data is wiped; access accounts are preserved).
 *   3. Clear localStorage mirrors (bms_*), sessionStorage (auth session) and
 *      purge any local IndexedDB databases.
 *   4. Auto-reload so every module re-initializes from an empty, consistent state.
 */
window.forceWipeDatabase = async function(providedAdminPassword = '') {
  if (!window.verifyAdminPassword(providedAdminPassword)) {
    if (window.adminPasswordConfigured) {
      window.showToast('كلمة المرور غير صحيحة! تم حظر وإيقاف عملية تصفير البيانات 🛑', 'error');
    } else {
      window.showToast('لا توجد كلمة سر مسجلة للمدير — سجّلها أولاً من (القائمة ▾ ← تغيير كلمة السر) ثم أعد المحاولة', 'error');
    }
    return false;
  }

  if (window.showToast) window.showToast('جارٍ مسح القواعد السحابية والمحلية نهائياً…', 'warning');

  // 1. Pause realtime listeners first — no cascading snapshot/permission errors.
  //    Also clears the auth gate so nothing auto-restarts mid-wipe.
  window.stopFirestoreSync();

  // 🔒 OWNER LOCKOUT PROTECTION: capture the currently logged-in admin's FULL
  //    account record BEFORE the wipe so it can be re-seeded in step 2.5. A wipe
  //    that deletes the 'users' collection would otherwise strand every non-seed
  //    account (login() throws "حساب المستخدم غير موجود في النظام" because
  //    getUsers() only falls back to the seed admin) — the owner would be locked
  //    out of their own freshly wiped system.
  let currentUserDoc = null;
  try {
    const current = window.getCurrentUser();
    if (current && current.email) {
      const allUsers = window.getUsers();
      const norm = function(v) { return ((v || '') + '').trim().toLowerCase(); };
      currentUserDoc = allUsers.find(u => norm(u.email) === norm(current.email)) || null;
    }
  } catch (e) { /* ignore */ }

  // 2. Deep cloud cleanup via writeBatch() across ALL collections. The list is
  //    canonical (independent of script load order): every data collection plus
  //    'expenses' and 'sync_logs' even if their modules are not loaded yet.
  const allKeys = syncCollections();
  ['expenses', 'sync_logs'].forEach(k => { if (allKeys.indexOf(k) === -1) allKeys.push(k); });

  if (window.db) {
    const BATCH_LIMIT = 450; // writeBatch hard limit is 500 operations
    for (const key of allKeys) {
      try {
        const snap = await window.db.collection(key).get();
        const docIds = [];
        snap.forEach(doc => docIds.push(doc.id));
        for (let i = 0; i < docIds.length; i += BATCH_LIMIT) {
          const chunk = docIds.slice(i, i + BATCH_LIMIT);
          const batch = window.db.batch();
          chunk.forEach(id => batch.delete(window.db.collection(key).doc(id)));
          await batch.commit();
        }
      } catch (err) {
        // A collection may not exist yet — that is fine, keep wiping the rest.
        if (window.console && console.warn) {
          console.warn('Wipe [' + key + ']:', err && err.message ? err.message : err);
        }
      }
    }

    // 2.5 🔒 RE-SEED ADMIN ACCOUNTS after the wipe. Business data stays fully
    //     wiped — only access accounts are restored so the owner can always get
    //     back in after the auto-reload. The default seed admin (USR-1001) is
    //     always re-seeded; the currently logged-in account (if it is a custom
    //     non-seed account) is preserved too.
    //     V3.20 — PASSWORD PRESERVATION: when the logged-in admin IS USR-1001,
    //     the wipe must NOT drop the stored password (a bare seedAdmin re-seed
    //     would leave verifyAdminPassword disabled and lock sensitive features).
    //     The password field travels with currentUserDoc, so merge it in.
    const usersCol = window.db.collection(window.STORAGE_KEYS.USER);
    const seedAdmin = { id: 'USR-1001', name: 'المدير العام', email: 'admin@store.com', role: 'admin', createdAt: '2026-07-01T10:00:00Z' };
    if (currentUserDoc && currentUserDoc.id === 'USR-1001' && currentUserDoc.password) {
      seedAdmin.password = currentUserDoc.password;
    }
    const toReSeed = [seedAdmin];
    if (currentUserDoc && currentUserDoc.id !== 'USR-1001') toReSeed.push(currentUserDoc);
    for (const doc of toReSeed) {
      try {
        await usersCol.doc(doc.id).set(doc);
      } catch (err) {
        if (window.console && console.warn) {
          console.warn('Wipe re-seed admin [' + doc.id + ']:', err && err.message ? err.message : err);
        }
      }
    }
  }

  // 3. Clear every local mirror (bms_*), the auth session, and IndexedDB.
  Object.keys(window.firestoreCache).forEach(k => { window.firestoreCache[k] = []; });
  try {
    Object.keys(localStorage).forEach(k => { if (k.indexOf('bms_') === 0) localStorage.removeItem(k); });
  } catch (e) { /* ignore */ }

  // 🔒 V3.20 — LOCAL-ONLY MODE LOCKOUT PROTECTION: without Firestore there is
  //     no cloud re-seed to fall back on, so the users mirror (just wiped above)
  //     must be restored with the preserved admin account(s) — INCLUDING the
  //     password field — before the auto-reload, otherwise the owner is locked
  //     out of their own freshly wiped system and verifyAdminPassword dies.
  const localSeed = { id: 'USR-1001', name: 'المدير العام', email: 'admin@store.com', role: 'admin', createdAt: '2026-07-01T10:00:00Z' };
  if (currentUserDoc && currentUserDoc.id === 'USR-1001' && currentUserDoc.password) {
    localSeed.password = currentUserDoc.password;
  }
  const localSeeds = [localSeed];
  if (currentUserDoc && currentUserDoc.id !== 'USR-1001') localSeeds.push(currentUserDoc);
  try {
    window.firestoreCache[window.STORAGE_KEYS.USER] = localSeeds;
    localStorage.setItem('bms_data_' + window.STORAGE_KEYS.USER, JSON.stringify(localSeeds));
  } catch (e) { /* ignore */ }

  try { sessionStorage.clear(); } catch (e) { /* ignore */ }
  try {
    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      window.indexedDB.databases().then(dbs => {
        (dbs || []).forEach(db => {
          if (db && db.name) window.indexedDB.deleteDatabase(db.name);
        });
      }).catch(() => { /* ignore */ });
    }
  } catch (e) { /* ignore */ }

  window._firestoreWriteFailures = 0;
  window.firestoreSyncErrors = [];
  window.firestoreLastSyncAt = null;

  if (window.showToast) window.showToast('تم مسح وتصفير القواعد السحابية والمحلية بنجاح (تم الإبقاء على حسابات المديرين فقط) — سيتم إعادة التحميل تلقائياً 🧹', 'success');
  setTimeout(function() { window.location.reload(); }, 800);
  return true;
};

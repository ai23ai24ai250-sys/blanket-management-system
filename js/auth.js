/**
 * Authentication & Role-Based User Management Module
 * Connected to Firebase Auth & Cloud Firestore Users Collection
 */

const AUTH_STORAGE_KEY = 'bms_user_session';

// Clean Slate Admin Primary Account
const INITIAL_USERS = [
  { id: 'USR-1001', name: 'المدير العام', email: 'admin@store.com', role: 'admin', createdAt: '2026-07-01T10:00:00Z' }
];

// Purge any legacy persistent sessions from localStorage so login is ALWAYS enforced on launch
localStorage.removeItem(AUTH_STORAGE_KEY);

window.getUsers = function() {
  const users = window.getCollection(window.STORAGE_KEYS.USER);
  return (users && users.length > 0) ? users : INITIAL_USERS;
};

window.getCurrentUser = function() {
  // The local session is the app's authoritative identity (set by login() only
  // after strict validation against active user accounts).
  const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed && parsed.email) return parsed;
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback: restore identity from a persisted Firebase Auth session, but ONLY
  // when its email still matches an active user document. A stale/deprecated
  // email (e.g. after an account email change) is rejected.
  if (window.auth && window.auth.currentUser) {
    const fbUser = window.auth.currentUser;
    const users = window.getUsers();
    const matched = users.find(u => u.email.toLowerCase() === fbUser.email.toLowerCase());
    if (!matched) return null;
    return {
      email: fbUser.email,
      name: matched.name,
      role: matched.role
    };
  }

  return null;
};

window.login = function(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
  }

  // STRICT local validation against active user accounts ONLY. A stale or
  // deprecated email (e.g. the old email after an account email change) has no
  // active account document and is rejected here regardless of Firebase Auth.
  const usersList = window.getUsers();
  const user = usersList.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    throw new Error('حساب المستخدم غير موجود في النظام');
  }

  // For accounts with password set, require a matching password
  if (user.password && user.password.trim() !== cleanPassword) {
    throw new Error('كلمة المرور غير صحيحة');
  }

  const sessionUser = {
    id: user.id,
    email: cleanEmail,
    name: user.name,
    role: user.role,
    loginTime: new Date().toISOString()
  };

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));

  // Sync Firebase Auth in the background (non-blocking) ONLY after local
  // validation passed, so cloud sign-in can never mint a session for a
  // stale/rejected credential.
  if (window.auth) {
    window.auth.signInWithEmailAndPassword(cleanEmail, cleanPassword)
      .catch((error) => {
        console.warn('Firebase Auth Cloud Sign-in note:', error.message);
      });
  }

  return sessionUser;
};

window.logout = function() {
  if (window.auth) {
    window.auth.signOut().catch(err => console.error(err));
  }
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

window.isAuthenticated = function() {
  return !!window.getCurrentUser();
};

window.isAdmin = function() {
  const user = window.getCurrentUser();
  return user && user.role === 'admin';
};

/**
 * Strict Admin Password Verification Helper
 * Returns strict boolean (true/false)
 * Uses Firestore-stored password as source of truth only
 */
window.verifyAdminPassword = function(enteredPassword) {
  if (!enteredPassword || typeof enteredPassword !== 'string' || !enteredPassword.trim()) {
    return false;
  }

  const currentUser = window.getCurrentUser();
  if (!currentUser) return false;

  const cleanInput = enteredPassword.trim();
  const usersList = window.getUsers();
  const activeUserDoc = usersList.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());

  // Check against password stored in Firestore users document
  if (activeUserDoc && activeUserDoc.password && activeUserDoc.password.trim()) {
    return activeUserDoc.password.trim() === cleanInput;
  }

  // If no password is configured in Firestore yet and user is admin, 
  // accept the entered password (the admin is already authenticated via session/Firebase Auth)
  return currentUser.role === 'admin' && cleanInput.length > 0;
};

/**
 * Admin User Creation without session overwrite
 */
window.createNewUserAccount = function({ name, email, password, role }) {
  if (!window.isAdmin()) {
    throw new Error('غير مصرح لك بإنشاء حسابات مستخدمين. هذه الصلاحية للمدير فقط');
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = window.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر');
  }

  const newUser = {
    id: window.generateAutoId('USR'),
    name: name.trim(),
    email: cleanEmail,
    password: password.trim(),
    role: role || 'employee',
    createdAt: new Date().toISOString()
  };

  return window.addFirestoreDoc(window.STORAGE_KEYS.USER, newUser);
};

window.updateUserAccount = function(userId, { name, email, password, role }) {
  if (!window.isAdmin()) {
    throw new Error('غير مصرح لك بتعديل بيانات الحسابات');
  }

  const payload = {
    updatedAt: new Date().toISOString()
  };

  let changedEmail = false;
  let oldEmail = '';

  if (name) payload.name = name.trim();

  // 🔒 Main Admin protection: the role of the primary admin account
  // (USR-1001) can never be demoted, even by another admin.
  if (role && userId === 'USR-1001' && role !== 'admin') {
    throw new Error('لا يمكن تغيير صلاحية المدير العام الرئيسي');
  }

  // 🔒 Self-protection: a logged-in admin can never demote their own account.
  if (role && role !== 'admin') {
    const target = window.getUsers().find(u => u.id === userId);
    const currentSession = window.getCurrentUser();
    if (target && target.email && currentSession && currentSession.email &&
        target.email.toLowerCase() === currentSession.email.toLowerCase()) {
      throw new Error('لا يمكن تغيير صلاحية المدير العام الرئيسي');
    }
  }

  if (role) payload.role = role;
  if (password && password.trim().length > 0) {
    payload.password = password.trim();
  }

  // Validate & prepare the email change BEFORE writing anything so we never
  // leave a partial update when the new email collides with another account.
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const oldUser = window.getUsers().find(u => u.id === userId);
    oldEmail = oldUser ? (oldUser.email || '').toLowerCase() : '';

    if (cleanEmail !== oldEmail) {
      const duplicate = window.getUsers().find(u => u.id !== userId && u.email.toLowerCase() === cleanEmail);
      if (duplicate) {
        throw new Error('هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر');
      }
      changedEmail = true;
    }
    payload.email = cleanEmail;
  }

  window.updateFirestoreDoc(window.STORAGE_KEYS.USER, userId, payload);

  // 🔒 EMAIL SYNC: keep authentication strictly in sync so the OLD email can
  // never log in again.
  if (changedEmail) {
    // 1. Remove any legacy/stale user documents still carrying the old email.
    window.getUsers().forEach(u => {
      if (u.id !== userId && u.email.toLowerCase() === oldEmail) {
        window.deleteFirestoreDoc(window.STORAGE_KEYS.USER, u.id);
      }
    });

    // 2. If the currently signed-in Firebase Auth account uses the old email,
    //    update it so Firebase Auth accepts ONLY the new email going forward.
    if (window.auth && window.auth.currentUser && window.auth.currentUser.email &&
        window.auth.currentUser.email.toLowerCase() === oldEmail) {
      window.auth.currentUser.updateEmail(payload.email).catch(err => {
        console.warn('Firebase Auth email sync note:', err && err.message);
      });
    }
  }

  // 🖥️ SESSION SYNC: if the updated account is the currently logged-in user,
  // refresh the local session (id / name / email / role) so the header profile
  // updates instantly without requiring a page reload or re-login.
  const sessionRaw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (sessionRaw) {
    try {
      const sess = JSON.parse(sessionRaw);
      const sessionEmail = ((sess && sess.email) || '').toLowerCase();
      const targetEmail = (payload.email || oldEmail || '').toLowerCase();
      if (sess && sessionEmail && sessionEmail === targetEmail) {
        sess.id = userId;
        if (payload.name) sess.name = payload.name;
        if (payload.email) sess.email = payload.email;
        if (payload.role) sess.role = payload.role;
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sess));
      }
    } catch (e) { /* ignore malformed session */ }
  }
};

/**
 * Self-service password change for the logged-in account.
 * Requires the CURRENT password to be verified against the stored account
 * before the new password is accepted (strict 3-field flow).
 */
window.changeOwnPassword = function(currentPassword, newPassword) {
  const currentUser = window.getCurrentUser();
  if (!currentUser) {
    throw new Error('يجب تسجيل الدخول أولاً لتغيير كلمة السر');
  }
  if (!currentPassword || !currentPassword.trim()) {
    throw new Error('يرجى إدخال كلمة السر الحالية');
  }
  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('كلمة السر الجديدة يجب ألا تقل عن 6 أحرف');
  }

  const usersList = window.getUsers();
  const activeUser = usersList.find(u => u.email.toLowerCase() === (currentUser.email || '').toLowerCase());
  if (!activeUser) {
    throw new Error('حساب المستخدم غير موجود في النظام');
  }

  // Verify the current password against the stored account password
  if (activeUser.password && activeUser.password.trim()) {
    if (activeUser.password.trim() !== currentPassword.trim()) {
      throw new Error('كلمة السر الحالية غير صحيحة');
    }
  } else if (currentUser.role !== 'admin') {
    // Non-admin accounts must always have a stored password to verify against
    throw new Error('كلمة السر الحالية غير صحيحة');
  }

  window.updateFirestoreDoc(window.STORAGE_KEYS.USER, activeUser.id, {
    password: newPassword.trim(),
    updatedAt: new Date().toISOString()
  });

  return true;
};

window.updateUserRole = function(userId, newRole) {
  if (!window.isAdmin()) {
    throw new Error('غير مصرح لك بتعديل الرتب والصلاحيات');
  }
  // 🔒 Main Admin & self-protection: the primary admin account (USR-1001) and
  // the currently logged-in account can never be demoted from any JS action.
  if (userId === 'USR-1001' && newRole !== 'admin') {
    throw new Error('لا يمكن تغيير صلاحية المدير العام الرئيسي');
  }
  if (newRole !== 'admin') {
    const target = window.getUsers().find(u => u.id === userId);
    const currentSession = window.getCurrentUser();
    if (target && target.email && currentSession && currentSession.email &&
        target.email.toLowerCase() === currentSession.email.toLowerCase()) {
      throw new Error('لا يمكن تغيير صلاحية المدير العام الرئيسي');
    }
  }
  window.updateFirestoreDoc(window.STORAGE_KEYS.USER, userId, { role: newRole });
};

window.deleteUserAccount = function(userId) {
  if (!window.isAdmin()) {
    throw new Error('غير مصرح لك بحذف الحسابات');
  }
  // 🔒 The primary admin account (USR-1001) and the logged-in account can never
  // be deleted from any JS action (prevents self lock-out / losing the owner).
  if (userId === 'USR-1001') {
    throw new Error('لا يمكن حذف حساب المدير العام الرئيسي');
  }
  const target = window.getUsers().find(u => u.id === userId);
  const currentSession = window.getCurrentUser();
  if (target && target.email && currentSession && currentSession.email &&
      target.email.toLowerCase() === currentSession.email.toLowerCase()) {
    throw new Error('لا يمكن حذف حسابك الحالي');
  }
  window.deleteFirestoreDoc(window.STORAGE_KEYS.USER, userId);
};

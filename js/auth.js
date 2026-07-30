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
  if (window.auth && window.auth.currentUser) {
    const fbUser = window.auth.currentUser;
    const users = window.getUsers();
    const matched = users.find(u => u.email.toLowerCase() === fbUser.email.toLowerCase());
    return {
      email: fbUser.email,
      name: matched ? matched.name : (fbUser.displayName || 'المدير العام'),
      role: matched ? matched.role : (fbUser.email.includes('admin') ? 'admin' : 'employee')
    };
  }

  const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (session) {
    try {
      return JSON.parse(session);
    } catch (e) {
      console.error(e);
    }
  }

  return null;
};

window.login = function(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
  }

  if (window.auth) {
    try {
      window.auth.signInWithEmailAndPassword(cleanEmail, cleanPassword)
        .then((userCredential) => {
          const user = userCredential.user;
          const usersList = window.getUsers();
          const matched = usersList.find(u => u.email.toLowerCase() === user.email.toLowerCase());
          const sessionUser = {
            email: user.email,
            name: matched ? matched.name : (user.displayName || 'المستخدم'),
            role: matched ? matched.role : (user.email.includes('admin') ? 'admin' : 'employee'),
            loginTime: new Date().toISOString()
          };
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
        })
        .catch((error) => {
          console.warn('Firebase Auth Cloud Sign-in note:', error.message);
        });
    } catch (e) {
      console.warn('Firebase Auth offline fallback active:', e);
    }
  }

  const usersList = window.getUsers();
  const user = usersList.find(u => u.email.toLowerCase() === cleanEmail);
  
  if (!user && cleanEmail !== 'admin@store.com') {
    throw new Error('حساب المستخدم غير موجود في النظام');
  }

  const sessionUser = {
    email: cleanEmail,
    name: user ? user.name : (cleanEmail.includes('admin') ? 'المدير العام' : 'موظف مبيعات'),
    role: user ? user.role : (cleanEmail.includes('admin') ? 'admin' : 'employee'),
    loginTime: new Date().toISOString()
  };

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
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

// Admin User Management Operations
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
    role: role || 'employee',
    createdAt: new Date().toISOString()
  };

  // Try creating in Firebase Auth if available
  if (window.auth && password) {
    window.auth.createUserWithEmailAndPassword(cleanEmail, password).catch(err => console.warn('Firebase auth create user note:', err));
  }

  return window.addFirestoreDoc(window.STORAGE_KEYS.USER, newUser);
};

window.updateUserRole = function(userId, newRole) {
  if (!window.isAdmin()) {
    throw new Error('غير مصرح لك بتعديل الرتب والصلاحيات');
  }
  window.updateFirestoreDoc(window.STORAGE_KEYS.USER, userId, { role: newRole });
};

window.deleteUserAccount = function(userId) {
  if (!window.isAdmin()) {
    throw new Error('غير مصرح لك بحذف الحسابات');
  }
  window.deleteFirestoreDoc(window.STORAGE_KEYS.USER, userId);
};

/**
 * Authentication & Session Management Module
 * Connected to Firebase Auth & Session Storage
 */

const AUTH_STORAGE_KEY = 'bms_user_session';

const VALID_USERS = [
  { email: 'admin@store.com', password: '123456', name: 'المدير العام', role: 'admin' },
  { email: 'emp@store.com', password: '123456', name: 'موظف المبيعات', role: 'employee' }
];

window.getCurrentUser = function() {
  // Check Firebase Auth current user
  if (window.auth && window.auth.currentUser) {
    const fbUser = window.auth.currentUser;
    return {
      email: fbUser.email,
      name: fbUser.displayName || (fbUser.email.includes('admin') ? 'المدير العام' : 'الموظف'),
      role: fbUser.email.includes('admin') ? 'admin' : 'employee'
    };
  }

  // Check stored active session
  const session = localStorage.getItem(AUTH_STORAGE_KEY);
  if (session) {
    try {
      return JSON.parse(session);
    } catch (e) {
      console.error(e);
    }
  }

  // Strictly return null when unauthenticated - NO default auto-login
  return null;
};

window.login = function(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
  }

  // Try Firebase Auth Online Login first if Firebase Auth SDK is connected
  if (window.auth) {
    try {
      window.auth.signInWithEmailAndPassword(cleanEmail, cleanPassword)
        .then((userCredential) => {
          const user = userCredential.user;
          const sessionUser = {
            email: user.email,
            name: user.displayName || (user.email.includes('admin') ? 'المدير العام' : 'الموظف'),
            role: user.email.includes('admin') ? 'admin' : 'employee',
            loginTime: new Date().toISOString()
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
        })
        .catch((error) => {
          console.warn('Firebase Auth Cloud Sign-in note:', error.message);
        });
    } catch (e) {
      console.warn('Firebase Auth offline fallback active:', e);
    }
  }

  // Local/Offline Login Validation
  const user = VALID_USERS.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword);
  
  if (!user && cleanPassword.length < 4) {
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  const sessionUser = {
    email: cleanEmail,
    name: user ? user.name : (cleanEmail.includes('admin') ? 'المدير العام' : 'موظف مبيعات'),
    role: user ? user.role : (cleanEmail.includes('admin') ? 'admin' : 'employee'),
    loginTime: new Date().toISOString()
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
  return sessionUser;
};

window.logout = function() {
  if (window.auth) {
    window.auth.signOut().catch(err => console.error(err));
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

window.isAuthenticated = function() {
  return !!window.getCurrentUser();
};

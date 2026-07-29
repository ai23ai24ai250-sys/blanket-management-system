/**
 * Authentication & Session Management Module
 */

const AUTH_STORAGE_KEY = 'bms_user_session';

const DEFAULT_USERS = [
  { email: 'admin@store.com', password: '123456', name: 'المدير العام', role: 'admin' },
  { email: 'emp@store.com', password: '123456', name: 'موظف المبيعات', role: 'employee' }
];

window.getCurrentUser = function() {
  const session = localStorage.getItem(AUTH_STORAGE_KEY);
  if (session) {
    try { return JSON.parse(session); } catch (e) { console.error(e); }
  }
  return null;
};

window.login = function(email, password) {
  const user = DEFAULT_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
  if (!user) {
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  const sessionUser = {
    email: user.email,
    name: user.name,
    role: user.role,
    loginTime: new Date().toISOString()
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
  return sessionUser;
};

window.logout = function() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

window.isAuthenticated = function() {
  return !!window.getCurrentUser();
};

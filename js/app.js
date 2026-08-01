/**
 * Main Application Entry Point
 * Enforces Strict Dynamic Role-Based Access Control (RBAC) & Complete UI Protection
 * Live Sync Auto-Refresh without Modal Interruptions
 */

class BMSApp {
  constructor() {
    this.currentView = 'dashboard';
    this.mainContent = document.getElementById('main-content');
    this.loginScreen = document.getElementById('login-screen');
    this.loginForm = document.getElementById('login-form');
    this.logoutBtn = document.getElementById('btn-logout');
    this.mobileLogoutBtn = document.getElementById('mobile-btn-logout');
    this.quickNewOrderBtn = document.getElementById('btn-quick-new-order');
    this.userDisplayName = document.getElementById('user-display-name');
    this.userRoleBadge = document.getElementById('user-role-badge');

    // User Menu Click-Activated Dropdown
    this.userMenuBtn = document.getElementById('user-menu-btn');
    this.userDropdownMenu = document.getElementById('user-dropdown-menu');

    // Self-service password change + forgot password notice
    this.changePasswordBtn = document.getElementById('btn-change-password');
    this.forgotPasswordBtn = document.getElementById('btn-forgot-password');

    // Mobile Drawer Elements
    this.mobileMenuToggle = document.getElementById('btn-mobile-menu-toggle');
    this.mobileDrawerClose = document.getElementById('btn-close-mobile-drawer');
    this.mobileDrawer = document.getElementById('mobile-drawer');

    this.init();
  }

  init() {
    // ⚠️ File Protocol Guard: realtime cloud sync requires a hosted origin
    // (https:// or a local web server). Opening index.html directly from disk
    // (file://) can never reach Firestore — warn loudly, keep local mode usable.
    if (window.location && window.location.protocol === 'file:') {
      console.warn('[BMSApp] Opened via file:// protocol — realtime cloud sync will NOT work. Serve the app over https:// (e.g. GitHub Pages) or a local web server.');
    }

    // 1. Synchronously Initialize & Pre-hydrate DB Storage
    if (window.initDB) window.initDB();

    // 2. Check Auth State & Render Initial View
    this.checkAuth();

    // 3. Register Global Event Handlers
    this.registerGlobalEvents();
  }

  checkAuth() {
    if (!window.isAuthenticated()) {
      // 🔒 No session = public login screen: tear down any realtime Firestore
      // listeners so unauthenticated reads never fire permission errors here.
      if (window.stopFirestoreSync) window.stopFirestoreSync();
      if (this.loginScreen) this.loginScreen.classList.remove('hidden');
      if (this.mainContent) this.mainContent.innerHTML = '';
      this.closeMobileDrawer();
    } else {
      // ✅ Active session confirmed: only NOW start realtime Firestore sync.
      if (window.startFirestoreSync) window.startFirestoreSync();
      if (this.loginScreen) this.loginScreen.classList.add('hidden');
      const user = window.getCurrentUser();
      
      // Storekeeper default view is Products & Inventory
      if (user && user.role === 'storekeeper') {
        this.currentView = 'products';
      }

      this.updateUserUI();
      this.navigateTo(this.currentView);
    }
  }

  updateUserUI() {
    const user = window.getCurrentUser();
    if (!user) return;

    if (this.userDisplayName) this.userDisplayName.textContent = user.name;
    if (this.userRoleBadge) {
      this.userRoleBadge.textContent = user.role === 'admin' ? 'مدير' : user.role === 'storekeeper' ? 'أمين مخزن' : 'موظف مبيعات';
    }

    const role = user.role || 'employee';

    // Complete Dynamic UI Hiding Rules by Role
    document.querySelectorAll('[data-nav]').forEach(el => {
      const targetNav = el.getAttribute('data-nav');
      if (!targetNav) return;

      if (role === 'storekeeper') {
        if (targetNav === 'products') {
          el.style.display = '';
          el.classList.remove('hidden');
        } else {
          el.style.display = 'none';
          el.classList.add('hidden');
        }
      } else if (role === 'employee') {
        if (targetNav === 'users' || targetNav === 'reports' || targetNav === 'settings' || targetNav === 'suppliers' || targetNav === 'payments') {
          el.style.display = 'none';
          el.classList.add('hidden');
        } else {
          el.style.display = '';
          el.classList.remove('hidden');
        }
      } else {
        el.style.display = '';
        el.classList.remove('hidden');
      }
    });

    if (this.quickNewOrderBtn) {
      if (role === 'storekeeper') {
        this.quickNewOrderBtn.style.display = 'none';
        this.quickNewOrderBtn.classList.add('hidden');
      } else {
        this.quickNewOrderBtn.style.display = '';
        this.quickNewOrderBtn.classList.remove('hidden');
      }
    }
  }

  registerGlobalEvents() {
    // Live Cloud Data Sync Listener to update UI when Firestore finishes syncing
    window.addEventListener('bms-data-synced', () => {
      const modalContainer = document.getElementById('modal-container');
      const isModalOpen = modalContainer && !modalContainer.classList.contains('hidden');
      if (window.isAuthenticated() && !isModalOpen) {
        this.navigateTo(this.currentView);
      }
    });

    // Firestore write/listener failure feedback (throttled so a flapping
    // connection or blocked Firestore rules don't spam toasts). Never surfaced
    // on the public login screen — there sync is expected to be quiet anyway.
    window.addEventListener('bms-sync-error', (e) => {
      // 🔒 Silence ALL sync toasts while the #login screen is visible.
      const loginEl = document.getElementById('login-screen');
      if (loginEl && !loginEl.classList.contains('hidden')) return;
      if (!window.isAuthenticated()) return;
      const now = Date.now();
      if (now - (window._lastSyncErrorToastAt || 0) > 30000) {
        window._lastSyncErrorToastAt = now;
        const message = (e.detail && e.detail.message) || 'تعذر الاتصال بالسحابة';
        window.showToast('⚠️ مشكلة في المزامنة: ' + message, 'error');
      }
    });

    // Login Form Submit
    if (this.loginForm) {
      this.loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          // ✅ login() is async now: it awaits Firebase Auth sign-in AND the
          // cloud-first Firestore pull, so the dashboard only renders with the
          // complete, cloud-synced user record (no relogin toLowerCase crash).
          await window.login(email, password);
          window.showToast('تم تسجيل الدخول بنجاح', 'success');
          this.checkAuth();
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }

    // Forgot Password Notice (contact admin to reset)
    if (this.forgotPasswordBtn) {
      this.forgotPasswordBtn.onclick = () => {
        window.openModal({
          title: 'نسيت كلمة السر؟',
          icon: 'key',
          maxWidth: 'max-w-md',
          contentHTML: `
            <div class="p-2">
              <div class="flex items-start gap-3 mb-4">
                <div class="w-10 h-10 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <i data-lucide="info" class="w-5 h-5 text-amber-400"></i>
                </div>
                <p class="text-sm text-slate-300 leading-relaxed">يرجى التواصل مع المدير العام (Admin) لإعادة تعيين كلمة السر الخاصة بك من شاشة الموظفين.</p>
              </div>
            </div>
          `
        });
      };
    }

    // Self-service Password Change (strict 3-field flow)
    if (this.changePasswordBtn) {
      this.changePasswordBtn.onclick = () => {
        window.openModal({
          title: 'تغيير كلمة السر',
          icon: 'key',
          maxWidth: 'max-w-md',
          contentHTML: `
            <form id="form-change-password" class="space-y-4">
              <div>
                <label for="cp-current" class="block text-xs font-bold text-slate-300 mb-1.5">كلمة السر الحالية *</label>
                <input type="password" id="cp-current" required autocomplete="current-password" placeholder="••••••••"
                  class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl text-white text-left font-mono">
              </div>
              <div>
                <label for="cp-new" class="block text-xs font-bold text-slate-300 mb-1.5">كلمة السر الجديدة *</label>
                <input type="password" id="cp-new" required minlength="6" autocomplete="new-password" placeholder="6 أحرف على الأقل"
                  class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl text-white text-left font-mono">
              </div>
              <div>
                <label for="cp-confirm" class="block text-xs font-bold text-slate-300 mb-1.5">تأكيد كلمة السر الجديدة *</label>
                <input type="password" id="cp-confirm" required minlength="6" autocomplete="new-password" placeholder="••••••••"
                  class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl text-white text-left font-mono">
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="submit" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl">تغيير كلمة السر</button>
              </div>
            </form>
          `,
          onRender: (modalEl, closeModal) => {
            const form = modalEl.querySelector('#form-change-password');
            if (form) {
              form.onsubmit = (e) => {
                e.preventDefault();
                const current = modalEl.querySelector('#cp-current').value;
                const fresh = modalEl.querySelector('#cp-new').value;
                const confirm = modalEl.querySelector('#cp-confirm').value;
                if (fresh !== confirm) {
                  window.showToast('كلمة السر الجديدة وتأكيدها غير متطابقتين', 'error');
                  return;
                }
                try {
                  window.changeOwnPassword(current, fresh);
                  window.showToast('تم تغيير كلمة السر بنجاح', 'success');
                  closeModal();
                } catch (err) {
                  window.showToast(err.message, 'error');
                }
              };
            }
          }
        });
      };
    }

    // User Dropdown Click Activation
    if (this.userMenuBtn && this.userDropdownMenu) {
      this.userMenuBtn.onclick = (e) => {
        e.stopPropagation();
        this.userDropdownMenu.classList.toggle('hidden');
      };

      document.addEventListener('click', (e) => {
        if (!this.userDropdownMenu.contains(e.target) && !this.userMenuBtn.contains(e.target)) {
          this.userDropdownMenu.classList.add('hidden');
        }
      });
    }

    // Logout Handlers
    const performLogout = () => {
      window.logout();
      window.showToast('تم تسجيل الخروج بنجاح', 'info');
      this.checkAuth();
    };

    if (this.logoutBtn) this.logoutBtn.onclick = performLogout;
    if (this.mobileLogoutBtn) this.mobileLogoutBtn.onclick = performLogout;

    // Mobile Drawer Controls
    if (this.mobileMenuToggle) {
      this.mobileMenuToggle.onclick = () => this.openMobileDrawer();
    }

    if (this.mobileDrawerClose) {
      this.mobileDrawerClose.onclick = () => this.closeMobileDrawer();
    }

    // Navigation Buttons Handler via Document-level Event Delegation
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        e.preventDefault();
        const targetView = navBtn.getAttribute('data-nav');
        if (targetView && window.isAuthenticated()) {
          this.navigateTo(targetView);
          this.closeMobileDrawer();
          if (this.userDropdownMenu) this.userDropdownMenu.classList.add('hidden');
        }
      }
    });

    // Quick New Order Header Button
    if (this.quickNewOrderBtn) {
      this.quickNewOrderBtn.onclick = () => {
        if (!window.isAuthenticated()) return;
        window.openNewOrderModal(() => {
          this.navigateTo(this.currentView);
        });
      };
    }
  }

  openMobileDrawer() {
    if (this.mobileDrawer) this.mobileDrawer.classList.remove('hidden');
  }

  closeMobileDrawer() {
    if (this.mobileDrawer) this.mobileDrawer.classList.add('hidden');
  }

  navigateTo(viewName) {
    if (!window.isAuthenticated()) return;

    const user = window.getCurrentUser();
    const role = user ? (user.role || 'employee') : 'employee';

    // Strict RBAC Route Guards
    if (role === 'storekeeper' && viewName !== 'products') {
      window.showToast('عفواً! أمين المخزن لديه صلاحية الوصول لصفحة المنتجات والمخزون فقط', 'error');
      viewName = 'products';
    } else if (role === 'employee' && viewName === 'payments') {
      window.showToast('عفواً، شاشة المدفوعات مخصصة للمدير العام فقط', 'error');
      viewName = 'orders';
    } else if (role === 'employee' && (viewName === 'users' || viewName === 'reports' || viewName === 'suppliers' || viewName === 'settings')) {
      window.showToast('عفواً! ليس لديك صلاحية الوصول لهذه الصفحة', 'error');
      viewName = 'dashboard';
    }

    this.currentView = viewName;

    // Highlight active nav buttons (Desktop & Mobile)
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-nav') === viewName;
      if (isTarget) {
        btn.className = 'nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-white bg-brand-600 shadow-sm flex items-center gap-2';
      } else {
        btn.className = 'nav-btn px-4 py-2 rounded-lg text-sm font-semibold transition-all text-slate-300 hover:text-white hover:bg-slate-700/50 flex items-center gap-2';
      }
    });

    // Render corresponding view
    switch (viewName) {
      case 'dashboard':
        this.mainContent.innerHTML = window.renderDashboard();
        this.wireDashboardEvents();
        break;

      case 'orders':
        this.mainContent.innerHTML = window.renderOrdersView();
        window.setupOrdersEvents(this.mainContent, () => this.navigateTo('orders'));
        break;

      case 'customers':
        this.mainContent.innerHTML = window.renderCustomersView();
        window.setupCustomersEvents(this.mainContent, () => this.navigateTo('customers'));
        break;

      case 'suppliers':
        this.mainContent.innerHTML = window.renderSuppliersView();
        window.setupSuppliersEvents(this.mainContent, () => this.navigateTo('suppliers'));
        break;

      case 'products':
        this.mainContent.innerHTML = window.renderProductsView();
        window.setupProductsEvents(this.mainContent, () => this.navigateTo('products'));
        break;

      case 'payments':
        this.mainContent.innerHTML = window.renderPaymentsView();
        window.setupPaymentsEvents(this.mainContent, () => this.navigateTo('payments'));
        break;

      case 'reports':
        this.mainContent.innerHTML = window.renderReportsView();
        window.setupReportsEvents(this.mainContent);
        break;

      case 'users':
        this.mainContent.innerHTML = window.renderUsersView();
        window.setupUsersEvents(this.mainContent, () => this.navigateTo('users'));
        break;

      case 'settings':
        this.mainContent.innerHTML = window.renderSettingsView();
        window.setupSettingsEvents(this.mainContent);
        break;

      default:
        this.mainContent.innerHTML = window.renderDashboard();
        this.wireDashboardEvents();
        break;
    }

    if (window.lucide) {
      window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
    }

    // Re-pull from Firestore so the freshly rendered view reflects the latest
    // cloud state (throttled inside fetchAllFromFirestore; no-op when offline).
    if (window.fetchAllFromFirestore) window.fetchAllFromFirestore();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  wireDashboardEvents() {
    const user = window.getCurrentUser();
    const role = user ? (user.role || 'employee') : 'employee';

    const btnNewOrder = this.mainContent.querySelector('#btn-action-new-order');
    if (btnNewOrder) {
      btnNewOrder.onclick = () => {
        window.openNewOrderModal(() => this.navigateTo('dashboard'));
      };
    }

    const btnPayment = this.mainContent.querySelector('#btn-action-payment');
    if (btnPayment) {
      if (role === 'admin') {
        btnPayment.onclick = () => {
          window.openPaymentModal({}, () => this.navigateTo('dashboard'));
        };
      } else {
        // 🔒 Payments are Admin-only: hide the quick "record payment" action
        // (and its card) from employees/storekeepers entirely.
        const card = btnPayment.closest('#card-action-payment') || btnPayment.closest('div[class*="bg-gradient"]');
        if (card) {
          card.style.display = 'none';
          card.classList.add('hidden');
        }
        btnPayment.style.display = 'none';
        btnPayment.classList.add('hidden');
      }
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new BMSApp();
});

/**
 * Main Application Entry Point
 * Enforces Strict Dynamic Role-Based Access Control (RBAC) & Complete UI Protection
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
    this.userAvatarInitials = document.getElementById('user-avatar-initials');
    this.userRoleBadge = document.getElementById('user-role-badge');
    
    // User Menu Click-Activated Dropdown
    this.userMenuBtn = document.getElementById('user-menu-btn');
    this.userDropdownMenu = document.getElementById('user-dropdown-menu');

    // Mobile Drawer Elements
    this.mobileMenuToggle = document.getElementById('btn-mobile-menu-toggle');
    this.mobileDrawerClose = document.getElementById('btn-close-mobile-drawer');
    this.mobileDrawer = document.getElementById('mobile-drawer');

    this.init();
  }

  init() {
    // 1. Initialize DB Storage & Firestore Listeners
    if (window.initDB) window.initDB();

    // 2. Check Auth State
    this.checkAuth();

    // 3. Register Event Handlers
    this.registerGlobalEvents();
  }

  checkAuth() {
    if (!window.isAuthenticated()) {
      if (this.loginScreen) this.loginScreen.classList.remove('hidden');
      if (this.mainContent) this.mainContent.innerHTML = '';
      this.closeMobileDrawer();
    } else {
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
    if (this.userAvatarInitials) this.userAvatarInitials.textContent = user.name.slice(0, 2);
    if (this.userRoleBadge) {
      this.userRoleBadge.textContent = user.role === 'admin' ? 'مدير' : user.role === 'storekeeper' ? 'أمين مخزن' : 'موظف مبيعات';
    }

    const role = user.role || 'employee';

    // 🔒 Complete Dynamic UI Hiding Rules by Role
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
        if (targetNav === 'users' || targetNav === 'reports' || targetNav === 'settings' || targetNav === 'suppliers') {
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
    // Login Form Submit
    if (this.loginForm) {
      this.loginForm.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          window.login(email, password);
          window.showToast('تم تسجيل الدخول بنجاح', 'success');
          this.checkAuth();
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }

    // User Dropdown Click Activation (On Click instead of Hover)
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
    const role = user ? user.role : 'employee';

    // 🛡️ Strict RBAC Route Guards
    if (role === 'storekeeper' && viewName !== 'products') {
      window.showToast('عفواً! أمين المخزن لديه صلاحية الوصول لصفحة المنتجات والمخزون فقط', 'error');
      viewName = 'products';
    } else if (role === 'employee' && (viewName === 'users' || viewName === 'reports' || viewName === 'suppliers')) {
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  wireDashboardEvents() {
    const btnNewOrder = this.mainContent.querySelector('#btn-action-new-order');
    if (btnNewOrder) {
      btnNewOrder.onclick = () => {
        window.openNewOrderModal(() => this.navigateTo('dashboard'));
      };
    }

    const btnPayment = this.mainContent.querySelector('#btn-action-payment');
    if (btnPayment) {
      btnPayment.onclick = () => {
        window.openPaymentModal({}, () => this.navigateTo('dashboard'));
      };
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new BMSApp();
});

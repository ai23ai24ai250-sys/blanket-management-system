/**
 * Main Application Entry Point
 */

class BMSApp {
  constructor() {
    this.currentView = 'dashboard';
    this.mainContent = document.getElementById('main-content');
    this.loginScreen = document.getElementById('login-screen');
    this.loginForm = document.getElementById('login-form');
    this.logoutBtn = document.getElementById('btn-logout');
    this.quickNewOrderBtn = document.getElementById('btn-quick-new-order');
    this.userDisplayName = document.getElementById('user-display-name');
    this.userAvatarInitials = document.getElementById('user-avatar-initials');
    this.userRoleBadge = document.getElementById('user-role-badge');

    this.init();
  }

  init() {
    // 1. Initialize DB Storage
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
    } else {
      if (this.loginScreen) this.loginScreen.classList.add('hidden');
      this.updateUserUI();
      this.navigateTo(this.currentView);
    }
  }

  updateUserUI() {
    const user = window.getCurrentUser();
    if (user) {
      if (this.userDisplayName) this.userDisplayName.textContent = user.name;
      if (this.userAvatarInitials) this.userAvatarInitials.textContent = user.name.slice(0, 2);
      if (this.userRoleBadge) this.userRoleBadge.textContent = user.role === 'admin' ? 'مدير' : 'موظف';
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

    // Logout
    if (this.logoutBtn) {
      this.logoutBtn.onclick = () => {
        window.logout();
        window.showToast('تم تسجيل الخروج بنجاح', 'info');
        this.checkAuth();
      };
    }

    // Navigation Buttons Handler via Document-level Event Delegation
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-nav]');
      if (navBtn) {
        e.preventDefault();
        const targetView = navBtn.getAttribute('data-nav');
        if (targetView && window.isAuthenticated()) {
          this.navigateTo(targetView);
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

  navigateTo(viewName) {
    if (!window.isAuthenticated()) return;

    this.currentView = viewName;

    // Highlight active nav buttons
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

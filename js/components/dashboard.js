/**
 * Dashboard View Component
 */

window.renderDashboard = function() {
  const totalSales = window.getTotalSalesAmount();
  const customerReceivables = window.getTotalCustomerReceivables();
  const supplierPayables = window.getTotalSupplierPayables();
  const openOrdersCount = window.getOpenOrdersCount();
  const lowStockCount = window.getLowStockProducts().length;

  const recentOrders = window.getOrders().slice(0, 5);

  return `
    <div class="space-y-8 animate-fadeIn">
      
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">لوحة التحكم والرصد اليومي</h1>
          <p class="text-sm text-slate-400">نظرة سريعة على مبيعات، مخزون ومستحقات محلات الوفاء للمفروشات والبطانيات</p>
        </div>
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80">
          <i data-lucide="clock" class="w-4 h-4 text-brand-400"></i>
          <span>التحديث الآلي: مباشر</span>
        </div>
      </div>

      <!-- KPI Cards Strip (5 KPI Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <!-- Total Sales Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">إجمالي المبيعات</span>
            <div class="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <i data-lucide="trending-up" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-xl font-extrabold text-white num-font mb-1">${window.formatCurrency(totalSales)}</div>
          <span class="text-[11px] text-emerald-400 font-medium">محدث فورياً</span>
        </div>

        <!-- Customer Receivables Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="customers">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">مستحقات العملاء</span>
            <div class="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <i data-lucide="arrow-down-left" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-xl font-extrabold text-white num-font mb-1">${window.formatCurrency(customerReceivables)}</div>
          <span class="text-[11px] text-slate-400">آجل لدى العملاء</span>
        </div>

        <!-- Supplier Payables Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="suppliers">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">مستحقات للموردين</span>
            <div class="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <i data-lucide="arrow-up-right" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-xl font-extrabold text-white num-font mb-1">${window.formatCurrency(supplierPayables)}</div>
          <span class="text-[11px] text-slate-400">مطلوب تسديده للمصانع</span>
        </div>

        <!-- Open Orders Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="reports">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">الطلبات المفتوحة</span>
            <div class="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-2xl font-extrabold text-white num-font mb-1">${openOrdersCount}</div>
          <span class="text-[11px] text-amber-400">جديد أو قيد التوصيل</span>
        </div>

        <!-- Low Stock Items Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer ${lowStockCount > 0 ? 'border-rose-900/50 bg-rose-950/10' : ''}" data-nav="products">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">منتجات نواقص</span>
            <div class="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-2xl font-extrabold ${lowStockCount > 0 ? 'text-rose-400' : 'text-white'} num-font mb-1">${lowStockCount}</div>
          <span class="text-[11px] ${lowStockCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}">تحت الحد الأدنى</span>
        </div>

      </div>

      <!-- Large Action Grid Buttons Section -->
      <div>
        <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <i data-lucide="zap" class="w-5 h-5 text-brand-400"></i>
          <span>العمليات اليومية السريعة</span>
        </h2>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          
          <!-- ➕ New Order Action -->
          <button id="btn-action-new-order" class="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-2xl shadow-xl shadow-brand-900/40 border border-brand-500/30 text-white transition-all transform hover:-translate-y-1">
            <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <i data-lucide="plus-circle" class="w-8 h-8"></i>
            </div>
            <span class="text-base font-extrabold mb-1">➕ طلب جديد</span>
            <span class="text-xs text-brand-100/80">إنشاء فاتورة بيع جديدة</span>
          </button>

          <!-- 👥 Customers Action -->
          <button data-nav="customers" class="group flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800/90 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 text-slate-200 transition-all transform hover:-translate-y-1">
            <div class="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <i data-lucide="users" class="w-7 h-7"></i>
            </div>
            <span class="text-base font-bold text-white mb-1">👥 العملاء</span>
            <span class="text-xs text-slate-400">دليل الحسابات والأرصدة</span>
          </button>

          <!-- 🏪 Suppliers Action -->
          <button data-nav="suppliers" class="group flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800/90 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 text-slate-200 transition-all transform hover:-translate-y-1">
            <div class="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <i data-lucide="truck" class="w-7 h-7"></i>
            </div>
            <span class="text-base font-bold text-white mb-1">🏪 الموردين</span>
            <span class="text-xs text-slate-400">مصانع وموردي البضاعة</span>
          </button>

          <!-- 📦 Products Action -->
          <button data-nav="products" class="group flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800/90 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 text-slate-200 transition-all transform hover:-translate-y-1">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <i data-lucide="boxes" class="w-7 h-7"></i>
            </div>
            <span class="text-base font-bold text-white mb-1">📦 المنتجات</span>
            <span class="text-xs text-slate-400">مخزون البطانيات والسجاد</span>
          </button>

          <!-- 💰 Payments Action -->
          <button id="btn-action-payment" class="group flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800/90 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 text-slate-200 transition-all transform hover:-translate-y-1">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <i data-lucide="wallet" class="w-7 h-7"></i>
            </div>
            <span class="text-base font-bold text-white mb-1">💰 المدفوعات</span>
            <span class="text-xs text-slate-400">تسجيل دفعة عميل أو مورد</span>
          </button>

          <!-- 📊 Reports Action -->
          <button data-nav="reports" class="group flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800/90 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 text-slate-200 transition-all transform hover:-translate-y-1">
            <div class="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <i data-lucide="bar-chart-3" class="w-7 h-7"></i>
            </div>
            <span class="text-base font-bold text-white mb-1">📊 التقارير</span>
            <span class="text-xs text-slate-400">كشوفات وتصدير Excel</span>
          </button>

          <!-- ⚙ Settings Action -->
          <button data-nav="settings" class="group flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800/90 rounded-2xl shadow-lg border border-slate-800 hover:border-slate-700 text-slate-200 transition-all transform hover:-translate-y-1">
            <div class="w-14 h-14 rounded-2xl bg-slate-700/30 text-slate-300 border border-slate-700/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
              <i data-lucide="settings" class="w-7 h-7"></i>
            </div>
            <span class="text-base font-bold text-white mb-1">⚙ الإعدادات</span>
            <span class="text-xs text-slate-400">تهيئة Firebase والنظام</span>
          </button>

        </div>
      </div>

      <!-- Recent Orders Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i data-lucide="history" class="w-5 h-5 text-brand-400"></i>
            <h3 class="font-bold text-white">أحدث طلبات البيع اليومية</h3>
          </div>
          <button data-nav="reports" class="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1">
            <span>عرض الكل</span>
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>الإجمالي</th>
                <th>المقدم</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${recentOrders.length === 0 ? `
                <tr>
                  <td colspan="8" class="text-center py-8 text-slate-500">لا توجد طلبات مسجلة حتى الآن</td>
                </tr>
              ` : recentOrders.map(order => `
                <tr>
                  <td class="font-bold text-brand-400">${order.id}</td>
                  <td class="font-semibold text-white">${order.customerName}</td>
                  <td class="num-font text-slate-400">${order.customerPhone}</td>
                  <td class="font-extrabold text-white num-font">${window.formatCurrency(order.totalAmount)}</td>
                  <td class="text-emerald-400 num-font">${window.formatCurrency(order.downPayment)}</td>
                  <td class="${order.remainingBalance > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'} num-font">${window.formatCurrency(order.remainingBalance)}</td>
                  <td>
                    <span class="px-2.5 py-1 text-xs font-bold rounded-lg ${
                      order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      order.status === 'completed' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }">
                      ${order.status === 'delivered' ? 'تم التوصيل' : order.status === 'completed' ? 'مكتمل' : 'جديد'}
                    </span>
                  </td>
                  <td class="text-xs text-slate-400">${window.formatDate(order.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

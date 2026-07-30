/**
 * Dashboard View Component - علاء الدين
 */

window.renderDashboard = function() {
  const orders = window.getOrders();
  const validOrders = orders.filter(o => o.status !== 'returned' && o.status !== 'cancelled');

  const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // COGS Calculation
  const cogs = validOrders.reduce((totalCogs, order) => {
    const orderCogs = (order.items || []).reduce((itemSum, item) => {
      const purPrice = Number(item.purchasePrice) || 0;
      const qty = Number(item.quantity) || 0;
      return itemSum + (purPrice * qty);
    }, 0);
    return totalCogs + orderCogs;
  }, 0);

  const expenses = window.getExpenses ? window.getExpenses() : [];
  const totalOpExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = (totalSales - cogs) - totalOpExpenses;

  const customerReceivables = window.getTotalCustomerReceivables();
  const supplierPayables = window.getTotalSupplierPayables();
  const openOrdersCount = window.getOpenOrdersCount();
  const lowStockCount = (window.getLowStockProducts ? window.getLowStockProducts().length : 0);

  const recentOrders = orders.slice(0, 5);

  return `
    <div class="space-y-8 animate-fadeIn">
      
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <span>لوحة التحكم والرصد اليومي - علاء الدين 🪄</span>
          </h1>
          <p class="text-sm text-slate-400">متابعة المبيعات الحية، الأرباح، المصروفات، والديون الآجلة</p>
        </div>
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80">
          <i data-lucide="clock" class="w-4 h-4 text-brand-400"></i>
          <span>التحديث الآلي: مباشر</span>
        </div>
      </div>

      <!-- KPI Cards Strip (6 KPI Cards Grid) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        
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

        <!-- Net Profit Card -->
        <div class="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="reports">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-emerald-300">صافي الربح 🎉</span>
            <div class="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <i data-lucide="coins" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-xl font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} num-font mb-1">${window.formatCurrency(netProfit)}</div>
          <span class="text-[11px] text-slate-400">بعد التكلفة والمصروفات</span>
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
          <span class="text-[11px] text-purple-400">مستحق سداده</span>
        </div>

        <!-- Open Orders Count Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">الطلبات الفعالة</span>
            <div class="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-xl font-extrabold text-white num-font mb-1">${openOrdersCount} طلبات</div>
          <span class="text-[11px] text-amber-400 font-medium">قيد التنفيذ والتوصيل</span>
        </div>

        <!-- Low Stock Alert Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="products">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">نواقص المخزون</span>
            <div class="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
          </div>
          <div class="text-xl font-extrabold ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-200'} num-font mb-1">${lowStockCount} أصناف</div>
          <span class="text-[11px] ${lowStockCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}">تحتاج توريد</span>
        </div>

      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div class="bg-gradient-to-br from-brand-900/40 to-slate-900 border border-brand-500/30 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="p-3 bg-brand-600/20 text-brand-400 rounded-xl border border-brand-500/30">
                <i data-lucide="plus-circle" class="w-6 h-6"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">إنشاء طلب جديد / فاتورة بيع</h3>
                <p class="text-xs text-slate-400">إضافة طلب للعميل وتخصيم المخزون وحساب الآجل آلياً</p>
              </div>
            </div>
          </div>
          <button id="btn-action-new-order" class="mt-4 w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
            <span>فتح نافذة فاتورة البيع ⚡</span>
          </button>
        </div>

        <div class="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <i data-lucide="wallet" class="w-6 h-6"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">تسديد / تحصيل دفعة مالية</h3>
                <p class="text-xs text-slate-400">تسجيل مقبوضات نقدية من عميل أو دفعات صاردة لمورد</p>
              </div>
            </div>
          </div>
          <button id="btn-action-payment" class="mt-4 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <i data-lucide="credit-card" class="w-5 h-5"></i>
            <span>تسجيل إيصال جديد 💰</span>
          </button>
        </div>

      </div>

      <!-- Recent Orders Data Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="history" class="w-5 h-5 text-brand-400"></i>
            <span>أحدث الطلبات والفواتير المسجلة</span>
          </h3>
          <button data-nav="reports" class="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1">
            <span>عرض كافة التقارير</span>
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>إجمالي الفاتورة</th>
                <th>المقدم</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${recentOrders.length === 0 ? `
                <tr>
                  <td colspan="8" class="text-center py-6 text-slate-500">لا توجد طلبات مسجلة حتى الآن</td>
                </tr>
              ` : recentOrders.map(o => `
                <tr>
                  <td class="font-bold text-brand-400">${o.id}</td>
                  <td class="font-bold text-white">${o.customerName}</td>
                  <td class="num-font text-slate-300">${o.customerPhone}</td>
                  <td class="num-font font-bold text-white">${window.formatCurrency(o.totalAmount)}</td>
                  <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
                  <td class="num-font font-bold ${Number(o.remainingBalance) > 0 ? 'text-rose-400' : 'text-slate-400'}">${window.formatCurrency(o.remainingBalance)}</td>
                  <td>
                    <span class="px-2.5 py-1 text-xs rounded-lg font-bold ${o.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : o.status === 'returned' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'}">
                      ${o.status === 'delivered' ? 'تم التوصيل' : o.status === 'returned' ? 'مرتجع' : o.status}
                    </span>
                  </td>
                  <td class="text-xs text-slate-400">${window.formatDate(o.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

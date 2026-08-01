/**
 * Dashboard View Component - علاء الدين
 * Updated KPI Labels & Relabeling for Clarity
 */

window.renderDashboard = function() {
  const orders = window.getOrders();
  const calc = window.calculateNetProfit(orders);

  const totalSales = calc.itemsSales;
  const netProfit = calc.netProfit;

  // Total Inventory Valuation
  const products = window.getProducts();
  const totalInventoryValuation = products.reduce((sum, p) => {
    const stock = Math.max(0, Number(p.stock) || 0);
    const buyPrice = Number(p.purchasePrice) || 0;
    return sum + (stock * buyPrice);
  }, 0);

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
          <p class="text-sm text-slate-400">متابعة المبيعات الحية، تكلفة المخزون، الأرباح، المصروفات، والديون الآجلة</p>
        </div>
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80">
          <i data-lucide="clock" class="w-4 h-4 text-brand-400"></i>
          <span>التحديث الآلي: مباشر</span>
        </div>
      </div>

      <!-- KPI Cards Strip (7 KPI Cards Grid) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        
        <!-- Total Sales Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400">إجمالي المبيعات</span>
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <i data-lucide="trending-up" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-lg font-extrabold text-white num-font mb-1">${window.formatCurrency(totalSales)}</div>
          <span class="text-[10px] text-emerald-400 font-medium">مبيعات البضاعة الصافية (بدون شحن أو مصاريف العميل)</span>
        </div>

        <!-- Total Inventory Valuation Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="products">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-amber-300">إجمالي التكلفة بالمخزن 📦</span>
            <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <i data-lucide="boxes" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-lg font-extrabold text-amber-400 num-font mb-1">${window.formatCurrency(totalInventoryValuation)}</div>
          <span class="text-[10px] text-slate-400">محسوبة بسعر الشراء من المورد</span>
        </div>

        <!-- Net Profit Card -->
        <div class="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="reports">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-emerald-300">صافي الربح 🎉</span>
            <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <i data-lucide="coins" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-lg font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} num-font mb-1">${window.formatCurrency(netProfit)}</div>
          <span class="text-[10px] text-slate-400">ربح البضاعة فقط بعد التكلفة ومصاريف التاجر (بدون شحن العميل)</span>
        </div>

        <!-- Customer Receivables Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="customers">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400">ديون على العملاء (آجل)</span>
            <div class="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <i data-lucide="arrow-down-left" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-lg font-extrabold text-white num-font mb-1">${window.formatCurrency(customerReceivables)}</div>
          <span class="text-[10px] text-slate-400">أموال متبقية للتحصيل</span>
        </div>

        <!-- Supplier Payables Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="suppliers">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400">ديون للموردين (مستحقة)</span>
            <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-lg font-extrabold text-white num-font mb-1">${window.formatCurrency(supplierPayables)}</div>
          <span class="text-[10px] text-purple-400">مبالغ واجبة السداد للمصانع</span>
        </div>

        <!-- Open Orders Count Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="orders">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400">الطلبات الفعالة</span>
            <div class="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-lg font-extrabold text-white num-font mb-1">${openOrdersCount} طلبات</div>
          <span class="text-[10px] text-sky-400 font-medium">قيد التنفيذ</span>
        </div>

        <!-- Low Stock Alert Card -->
        <div class="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all cursor-pointer" data-nav="products">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-400">نواقص المخزون</span>
            <div class="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
          </div>
          <div class="text-lg font-extrabold ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-200'} num-font mb-1">${lowStockCount} أصناف</div>
          <span class="text-[10px] ${lowStockCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}">تحتاج توريد</span>
        </div>

      </div>

      <!-- V3.11: Shipping & Packaging Revenue (إيراد خدمات شحن ونقل) — separate line -->
      <div class="bg-sky-950/30 border border-sky-800/40 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <i data-lucide="truck" class="w-5 h-5"></i>
          </div>
          <div>
            <span class="text-sm font-bold text-sky-300 block">إيراد خدمات شحن ونقل 🚚</span>
            <span class="text-[11px] text-slate-500">من عربون الشحن/التغليف — بند منفصل لا يُحتسب ضمن مبيعات البضاعة ولا صافي ربح المنتجات</span>
          </div>
        </div>
        <span class="text-xl font-extrabold text-sky-400 num-font">${window.formatCurrency(calc.shippingRevenueIncome || 0)}</span>
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
          <button id="btn-action-new-order" onclick="window.openNewOrderModal()" class="mt-4 w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
            <span>فتح نافذة فاتورة البيع ⚡</span>
          </button>
        </div>

        <div id="card-action-payment" class="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
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
          <button id="btn-action-payment" onclick="window.openPaymentModal()" class="mt-4 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
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
          <button data-nav="orders" class="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1">
            <span>عرض كافة الفواتير</span>
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
                  <td class="num-font text-slate-300">${o.customerPhone}${o.customerSecondaryPhone ? ' / ' + o.customerSecondaryPhone : ''}</td>
                  <td class="num-font font-bold text-white">${window.formatCurrency(o.totalAmount)}</td>
                  <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
                  <td class="num-font font-bold ${Number(o.remainingBalance) > 0 ? 'text-rose-400' : 'text-slate-400'}">${window.formatCurrency(o.remainingBalance)}</td>
                  <td>
                    <span class="px-2.5 py-1 text-xs rounded-lg font-bold ${o.status === 'delivered' || o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : o.status === 'returned' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : o.status === 'cancelled' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                      ${window.getOrderStatusLabel(o.status)}
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

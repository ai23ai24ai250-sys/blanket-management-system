/**
 * Reports View Component - Net Profit Calculator, Operational Expenses & Order Status Management
 * Strict Accounting Formula for Shipping & Order Extra Expenses
 */

window.renderReportsView = function() {
  const orders = window.getOrders();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="bar-chart-3" class="w-6 h-6 text-teal-400"></i>
            <span>التقارير اليومية، صافي الأرباح ومصاريف التشغيل</span>
          </h1>
          <p class="text-sm text-slate-400">حساب صافي الأرباح الحقيقي، تتبع المصروفات الإدارية، وإدارة حالات الفواتير والمرتجعات</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button id="btn-recalc-totals" onclick="window.recalculateTotalsThenRefresh()" class="px-3.5 py-2 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-xl border border-brand-500/40 transition-all flex items-center gap-1.5" title="إعادة بناء سجل مرتجعات الموردين وإعادة احتساب الأرصدة والأرباح والتقارير من المصادر الأصلية">
            <i data-lucide="rotate-ccw" class="w-4 h-4 text-brand-400"></i>
            <span>إعادة احتساب الأرباح والتقارير</span>
          </button>

          <button id="btn-force-wipe-db" onclick="window.promptWipeDatabase()" class="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-all flex items-center gap-1.5" title="حذف مسودات البيانات التجريبية نهائياً من القواعد السحابية">
            <i data-lucide="trash-2" class="w-4 h-4 text-rose-400"></i>
            <span>تصفير ومسح القواعد السحابية 🔒</span>
          </button>

          <button id="btn-export-full-db" onclick="window.exportFullDatabaseToExcel()" class="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
            <i data-lucide="database" class="w-4 h-4"></i>
            <span>تصدير كافة بيانات النظام إلى Excel موحد</span>
          </button>
        </div>
      </div>

      <!-- Date Filter Bar & Report Tabs -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        
        <!-- Report Tabs Selector -->
        <div class="flex flex-wrap items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 w-fit">
          <button id="tab-report-sales" class="report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-white bg-brand-600 shadow-sm flex items-center gap-2">
            <i data-lucide="trending-up" class="w-4 h-4"></i>
            <span>الأرباح والمبيعات</span>
          </button>
          <button id="tab-report-expenses" class="report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-2">
            <i data-lucide="receipt" class="w-4 h-4 text-amber-400"></i>
            <span>مصاريف التشغيل</span>
          </button>
          <button id="tab-report-customer" class="report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-2">
            <i data-lucide="user-check" class="w-4 h-4"></i>
            <span>كشف حساب عميل</span>
          </button>
          <button id="tab-report-supplier" class="report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-2">
            <i data-lucide="truck" class="w-4 h-4"></i>
            <span>كشف حساب مورد</span>
          </button>
        </div>

        <!-- Smart Date Range Picker & Filter -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <label class="text-[11px] font-bold text-slate-400">من:</label>
            <input type="date" id="filter-date-from" class="bg-transparent text-xs text-white num-font focus:outline-none">
          </div>
          <div class="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <label class="text-[11px] font-bold text-slate-400">إلى:</label>
            <input type="date" id="filter-date-to" class="bg-transparent text-xs text-white num-font focus:outline-none">
          </div>
          <button id="btn-apply-date-filter" class="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1">
            <i data-lucide="filter" class="w-3.5 h-3.5"></i>
            <span>تطبيق التاريخ</span>
          </button>
          <button id="btn-reset-date-filter" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all">
            إعادة ضبط
          </button>
        </div>

      </div>

      <!-- Dynamic Report Body Container -->
      <div id="report-content-body" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        ${renderSalesReport(filterOrdersSmart(orders))}
      </div>

    </div>
  `;
};

// Precise Date Range Comparison Logic
function filterOrdersSmart(ordersList, dateFrom = null, dateTo = null) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const hasDateFilter = dateFrom || dateTo;

  return ordersList.filter(o => {
    const rawDateStr = o.createdAt || o.date || getCairoFormattedDate();
    const itemDateStr = String(rawDateStr).replace('T', ' ').split(' ')[0];
    const itemDate = new Date(itemDateStr + 'T00:00:00');
    if (isNaN(itemDate.getTime())) return true;

    if (hasDateFilter) {
      const fromMatch = dateFrom ? itemDateStr >= dateFrom : true;
      const toMatch = dateTo ? itemDateStr <= dateTo : true;
      return fromMatch && toMatch;
    }

    return itemDate >= thirtyDaysAgo;
  });
}

function renderSalesReport(filteredOrders) {
  const customers = window.getCustomers();
  const calc = window.calculateNetProfit(filteredOrders);

  const grossSales = calc.grossSales;
  const itemsSales = calc.itemsSales;
  const cogs = calc.cogs;
  const merchantExpenses = calc.merchantExpenses;
  const totalOpExpenses = calc.totalOpExpenses;
  const netProfit = calc.netProfit;

  // V3.16 — Receivables come from the order-level remaining formula (active
  // orders only), never from possibly-stale customer balances, so cancelled and
  // returned orders can't inflate the debt card.
  const totalRemainingReceivables = window.getTotalCustomerReceivables();

  // V3.4 Treasury & Cash Flow: receipts (inflow) minus refunds (outflow).
  // V3.19: a cash refund from a SUPPLIER (negative supplier payment) is money
  // actually received back into the treasury — an INFLOW, not an outgoing
  // refund. It is reclassified out of totalRefunds and into totalInflow (and
  // added to net profit via calc.supplierCashRefunds) so it can never be
  // double-deducted and flip the profit/treasury negative.
  const payments = window.getPayments();
  // V3.22 — Treasury recalibration (double-count protection). إجمالي المقبوضات
  // يطابق 100% المبالغ المحصَّلة فعلياً ولا يتضاعف عند تحويل الفاتورة إلى
  // "مكتمل ومسدد":
  //   1) لكل طلب: مجموع قيود العربون/التحصيل (isDownPayment مع refOrderId) يُقيَّد
  //      بسقف = إجمالي الفاتورة — أي سجل مكرر قديم (عربون كامل + تحصيل كامل لنفس
  //      الفاتورة) لا يمكن أن يضخّم الوارد بعد الآن، والفاتورة المكتملة تُسهم بقيمتها
  //      الكاملة مرة واحدة فقط.
  //   2) دفعات العملاء المستقلة (غير مرتبطة بطلب) تُحتسب كاملة.
  //   3) المردودات النقدية المستردة من الموردين وارد فعلي.
  //   4) مدفوعات الموردين (تسديد دفعة لمورد) مال يخرج من الخزينة — خرجت من الوارد
  //      وتُخصم في معادلة الصافي بدلاً من تضخيمه.
  const allOrders = window.getOrders();
  const ordersById = {};
  allOrders.forEach(o => { ordersById[o.id] = o; });
  const perOrderCollected = {};
  payments.forEach(p => {
    if (p.entityType === 'customer' && (Number(p.amount) || 0) > 0 && p.isDownPayment && p.refOrderId) {
      perOrderCollected[p.refOrderId] = window.round2((perOrderCollected[p.refOrderId] || 0) + (Number(p.amount) || 0));
    }
  });
  const cappedOrderCollected = Object.keys(perOrderCollected).reduce((sum, orderId) => {
    const order = ordersById[orderId];
    const raw = perOrderCollected[orderId];
    const cap = (order && (Number(order.totalAmount) || 0) > 0) ? Number(order.totalAmount) : raw;
    return sum + window.round2(Math.min(raw, cap));
  }, 0);
  const standaloneCustomerCollected = payments
    .filter(p => p.entityType === 'customer' && (Number(p.amount) || 0) > 0 && !(p.isDownPayment && p.refOrderId))
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const supplierCashRefundPayments = payments.filter(p => p.entityType === 'supplier' && (Number(p.amount) || 0) < 0);
  const supplierCashBack = supplierCashRefundPayments.reduce((s, p) => s + Math.abs(Number(p.amount) || 0), 0);
  const totalInflow = window.round2(cappedOrderCollected + standaloneCustomerCollected + supplierCashBack);

  const customerRefunds = payments.filter(p => p.entityType === 'customer' && (Number(p.amount) || 0) < 0).reduce((s, p) => s + Math.abs(Number(p.amount) || 0), 0);
  const totalSupplierPayments = payments.filter(p => p.entityType === 'supplier' && (Number(p.amount) || 0) > 0).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalRefunds = customerRefunds;
  const netTreasury = window.round2(totalInflow - totalRefunds - totalSupplierPayments);
  const supplierCashRefunds = calc.supplierCashRefunds || 0;
  const retainedDepositIncome = calc.retainedDepositIncome || 0;

  // قيد الانتظار (pending / status 'new'): not confirmed sales yet — their value is NOT
  // part of confirmed goods sales, but their collected deposits ARE real treasury cash.
  const pendingOrders = filteredOrders.filter(o => o.status === 'new');
  const pendingTotalValue = pendingOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const pendingCollectedDeposits = pendingOrders.reduce((s, o) => s + (Number(o.downPayment) || 0), 0);
  const pendingShippingDeposits = pendingOrders.reduce((s, o) => s + window.getOrderShippingRevenue(o), 0);

  return `
    <div class="space-y-6">
      
      <!-- Financial P&L Cards Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي مبيعات البضاعة</span>
          <span class="text-lg font-extrabold text-white num-font">${window.formatCurrency(itemsSales)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">قيمة البضاعة فقط (بدون شحن/مصاريف العميل)</span>
        </div>

        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي الفواتير (شامل شحن العميل)</span>
          <span class="text-lg font-extrabold text-white num-font">${window.formatCurrency(grossSales)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">شحن/مصاريف العميل تُحصَّل لشركات الشحن ولا تدخل في الربح</span>
        </div>

        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">تكلفة البضاعة المباعة (COGS)</span>
          <span class="text-lg font-bold text-amber-400 num-font">${window.formatCurrency(cogs)}</span>
        </div>

        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">مصاريف الشحن والتشغيل للتاجر</span>
          <span class="text-lg font-bold text-purple-400 num-font">${window.formatCurrency(merchantExpenses)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">شحن + مصروفات تحملها التاجر فقط (0 إذا دفعها العميل)</span>
        </div>

        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">مصاريف التشغيل والإيجار</span>
          <span class="text-lg font-bold text-rose-400 num-font">${window.formatCurrency(totalOpExpenses)}</span>
        </div>

        <div class="p-4 bg-gradient-to-br from-emerald-950/60 to-slate-900 rounded-xl border border-emerald-500/40">
          <span class="text-xs text-emerald-300 font-bold block mb-1">صافي الربح الحقيقي 🎉</span>
          <span class="text-xl font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} num-font">${window.formatCurrency(netProfit)}</span>
        </div>

        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">الديون والآجل لدى العملاء</span>
          <span class="text-lg font-extrabold text-rose-400 num-font">${window.formatCurrency(totalRemainingReceivables)}</span>
        </div>
      </div>

      <!-- Treasury & Daily Cash Flow Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي المقبوضات (وارد الخزينة)</span>
          <span class="text-lg font-extrabold text-emerald-400 num-font">${window.formatCurrency(totalInflow)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">محصَّل فعلي: عربون/تحصيل الفواتير (مقيَّد بسقف إجمالي الفاتورة فلا يتضاعف) + دفعات العملاء المستقلة + مردودات نقدية من الموردين</span>
        </div>
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي المردودات والاستردادات (صادر)</span>
          <span class="text-lg font-extrabold text-rose-400 num-font">${window.formatCurrency(totalRefunds)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">مرتجعات + رد عربون الطلبات الملغاة (بدون استردادات الموردين فهي وارد)</span>
        </div>
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">مدفوعات الموردين (صادر)</span>
          <span class="text-lg font-extrabold text-orange-400 num-font">${window.formatCurrency(totalSupplierPayments)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">تسديد دفعات/تحويلات للموردين — تخرج من صافي الخزينة ولا تُحتسب وارداً</span>
        </div>
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">صافي الخزينة النقدية</span>
          <span class="text-lg font-extrabold text-white num-font">${window.formatCurrency(netTreasury)}</span>
        </div>
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">عربون محتفظ به (إيراد تشغيلي)</span>
          <span class="text-lg font-extrabold text-amber-400 num-font">${window.formatCurrency(retainedDepositIncome)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">عربون الملغي/المرتجع المحتفظ به عدا جزء الشحن المحجوز منفصلاً</span>
        </div>
        <div class="p-4 bg-sky-950/30 rounded-xl border border-sky-800/40">
          <span class="text-xs text-sky-300 font-bold block mb-1">إيراد خدمات شحن ونقل 🚚</span>
          <span class="text-lg font-extrabold text-sky-400 num-font">${window.formatCurrency(calc.shippingRevenueIncome || 0)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">عربون الشحن/التغليف المحصَّل بجميع الحالات (شامل قيد الانتظار) — بند منفصل لا يدخل في صافي ربح المنتجات</span>
        </div>
        <div class="p-4 bg-teal-950/30 rounded-xl border border-teal-800/40">
          <span class="text-xs text-teal-300 font-bold block mb-1">مردودات نقدية مستردة من الموردين 💸</span>
          <span class="text-lg font-extrabold text-teal-400 num-font">${window.formatCurrency(supplierCashRefunds)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">كاش استُلم فعلياً من المورد مقابل مرتجع مشتريات — يُضاف لوارد الخزينة وصافي الربح</span>
        </div>
      </div>

      <!-- Pending Orders Clarification (قيد الانتظار): value not confirmed, deposits already in treasury -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 bg-amber-950/20 rounded-xl border border-amber-800/40">
          <span class="text-xs text-amber-300 font-bold block mb-1">فواتير قيد الانتظار (غير مؤكدة البيع)</span>
          <span class="text-lg font-extrabold text-amber-400 num-font">${pendingOrders.length} فاتورة</span>
          <span class="text-[10px] text-slate-500 block mt-1">لم تُشحن بعد — لا تدخل في مبيعات البضاعة المؤكدة ولا صافي الربح</span>
        </div>
        <div class="p-4 bg-amber-950/20 rounded-xl border border-amber-800/40">
          <span class="text-xs text-amber-300 font-bold block mb-1">إجمالي قيمة فواتير قيد الانتظار</span>
          <span class="text-lg font-extrabold text-white num-font">${window.formatCurrency(pendingTotalValue)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">إجمالي الفاتورة (بضاعة + شحن/مصاريف العميل)</span>
        </div>
        <div class="p-4 bg-amber-950/20 rounded-xl border border-amber-800/40">
          <span class="text-xs text-amber-300 font-bold block mb-1">عربون محصَّل من قيد الانتظار (نقداً بالخزينة)</span>
          <span class="text-lg font-extrabold text-emerald-400 num-font">${window.formatCurrency(pendingCollectedDeposits)}</span>
          <span class="text-[10px] text-slate-500 block mt-1">مقبوضات فعلية تظهر فوراً في وارد الخزينة — و${window.formatCurrency(pendingShippingDeposits)} منها ضمن إيراد الشحن</span>
        </div>
      </div>

      <!-- Sales Orders Table -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="history" class="w-4 h-4 text-brand-400"></i>
            <span>جدول فواتير المبيعات والحالات</span>
          </h4>
          <span class="text-xs text-brand-400 font-bold bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
            عدد المعاملات: ${filteredOrders.length}
          </span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="data-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>إجمالي الفاتورة</th>
                <th>المقدم</th>
                <th>المتبقي</th>
                <th>حالة الفاتورة</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.length === 0 ? `
                <tr><td colspan="9" class="text-center py-6 text-slate-500">لا توجد مبيعات في النطاق المحدد</td></tr>
              ` : filteredOrders.map(o => {
                const statusBadge = o.status === 'returned'
                  ? '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">مرتجع (تم إرجاع المخزون)</span>'
                  : o.status === 'cancelled'
                  ? '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-800 text-slate-400 border border-slate-700">ملغي</span>'
                  : o.status === 'new'
                  ? '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">قيد الانتظار</span>'
                  : window.getOrderRemainingAmount(o) > 0
                  ? '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">آجل غير مسدد</span>'
                  : '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">مكتمل ومسدد</span>';

                const oRemaining = window.getOrderRemainingAmount(o);
                return `
                  <tr>
                    <td class="font-bold text-brand-400">${o.id}</td>
                    <td class="font-bold text-white">${o.customerName}</td>
                    <td class="num-font text-slate-300 font-mono">${window.formatPhonePair(o.customerPhone, o.customerSecondaryPhone)}</td>
                    <td class="num-font font-bold text-white">${window.formatCurrency(o.totalAmount)}</td>
                    <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
                    <td class="num-font font-bold ${oRemaining > 0 ? 'text-rose-400' : 'text-slate-400'}">${window.formatCurrency(oRemaining)}</td>
                    <td>${statusBadge}</td>
                    <td class="text-xs text-slate-400">${window.formatDate(o.createdAt)}</td>
                    <td>
                      <div class="flex items-center gap-1.5">
                        <button class="btn-view-order-details px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all" data-order-id="${o.id}">
                          تفاصيل 📄
                        </button>
                        <button class="btn-change-order-status px-2.5 py-1 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 transition-all" data-order-id="${o.id}" data-current-status="${o.status}">
                          تحديث 🔄
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

function renderExpensesReport() {
  const expenses = window.getExpenses ? window.getExpenses() : [];
  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between bg-slate-850 p-4 rounded-xl border border-slate-800">
        <div>
          <h4 class="font-bold text-white text-base">دليل مصاريف التشغيل والمصروفات الإدارية</h4>
          <p class="text-xs text-slate-400">سجل الإيجارات، الأجور، المرافق والتكلفة التشغيلية للمحل</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-left">
            <span class="text-xs text-slate-400 block">إجمالي المصروفات:</span>
            <span class="text-lg font-extrabold text-rose-400 num-font">${window.formatCurrency(total)}</span>
          </div>
          <button id="btn-add-expense" onclick="window.openAddExpenseModal()" class="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>إضافة مصروف جديد</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="data-table">
          <thead>
            <tr>
              <th>كود المصروف</th>
              <th>بيان المصروف</th>
              <th>الفئة والتصنيف</th>
              <th>المبلغ</th>
              <th>التاريخ</th>
              <th>الملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.length === 0 ? `
              <tr><td colspan="7" class="text-center py-6 text-slate-500">لا توجد مصروفات مسجلة حتى الآن</td></tr>
            ` : expenses.map(e => `
              <tr>
                <td class="font-bold text-slate-400 font-mono">${e.id}</td>
                <td class="font-bold text-white">${e.title}</td>
                <td><span class="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold">${e.category || 'عمومية'}</span></td>
                <td class="num-font font-extrabold text-rose-400">${window.formatCurrency(e.amount)}</td>
                <td class="text-xs text-slate-400">${e.date}</td>
                <td class="text-xs text-slate-400">${e.notes || '—'}</td>
                <td>
                  <button class="btn-delete-expense text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/40 rounded-lg" data-expense-id="${e.id}" data-expense-title="${e.title}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCustomerStatementReport() {
  const customers = window.getCustomers();
  return `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="text-xs font-bold text-slate-300">اختر العميل:</label>
        <select id="report-customer-select" class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-bold">
          ${customers.length ? customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('') : '<option value="">لا يوجد عملاء مسجلين</option>'}
        </select>
      </div>

      <div id="customer-statement-details" class="pt-2">
      </div>
    </div>
  `;
}

function renderSupplierStatementReport() {
  const suppliers = window.getSuppliers();
  return `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="text-xs font-bold text-slate-300">اختر المورد / المصنع:</label>
        <select id="report-supplier-select" class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-bold">
          ${suppliers.length ? suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('') : '<option value="">لا يوجد موردين مسجلين</option>'}
        </select>
      </div>

      <div id="supplier-statement-details" class="pt-2">
      </div>
    </div>
  `;
}

window.setupReportsEvents = function(container) {
  const bodyEl = container.querySelector('#report-content-body');
  const exportFullBtn = container.querySelector('#btn-export-full-db');
  const forceWipeBtn = container.querySelector('#btn-force-wipe-db');
  const applyDateBtn = container.querySelector('#btn-apply-date-filter');
  const resetDateBtn = container.querySelector('#btn-reset-date-filter');

  const tabSales = container.querySelector('#tab-report-sales');
  const tabExpenses = container.querySelector('#tab-report-expenses');
  const tabCustomer = container.querySelector('#tab-report-customer');
  const tabSupplier = container.querySelector('#tab-report-supplier');

  const updateTabStyles = (activeTab) => {
    [tabSales, tabExpenses, tabCustomer, tabSupplier].forEach(tab => {
      if (tab) tab.className = 'report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-2';
    });
    if (activeTab) activeTab.className = 'report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-white bg-brand-600 shadow-sm flex items-center gap-2';
  };

  const attachSalesReportEvents = () => {
    container.querySelectorAll('.btn-view-order-details').forEach(btn => {
      btn.onclick = () => {
        const oId = btn.getAttribute('data-order-id');
        window.openOrderDetailsModal(oId);
      };
    });

    container.querySelectorAll('.btn-change-order-status').forEach(btn => {
      btn.onclick = () => {
        const oId = btn.getAttribute('data-order-id');
        const currStatus = btn.getAttribute('data-current-status');
        window.openOrderStatusModal(oId, currStatus, () => {
          bodyEl.innerHTML = renderSalesReport(filterOrdersSmart(window.getOrders()));
          if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
          attachSalesReportEvents();
        });
      };
    });
  };

  tabSales.onclick = () => {
    updateTabStyles(tabSales);
    const dFrom = container.querySelector('#filter-date-from').value;
    const dTo = container.querySelector('#filter-date-to').value;
    bodyEl.innerHTML = renderSalesReport(filterOrdersSmart(window.getOrders(), dFrom, dTo));
    if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
    attachSalesReportEvents();
  };

  if (tabExpenses) {
    tabExpenses.onclick = () => {
      updateTabStyles(tabExpenses);
      bodyEl.innerHTML = renderExpensesReport();
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });

      const addExpBtn = bodyEl.querySelector('#btn-add-expense');
      if (addExpBtn) {
        addExpBtn.onclick = () => window.openAddExpenseModal(() => {
          bodyEl.innerHTML = renderExpensesReport();
          if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
        });
      }

      bodyEl.querySelectorAll('.btn-delete-expense').forEach(b => {
        b.onclick = async () => {
          const eId = b.getAttribute('data-expense-id');
          const eTitle = b.getAttribute('data-expense-title');
          if (confirm(`هل أنت تأكد من حذف المصروف "${eTitle}"؟`)) {
            const ok = await window.deleteExpense(eId);
            if (ok) window.showToast('تم حذف المصروف بنجاح', 'info');
            bodyEl.innerHTML = renderExpensesReport();
            if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
          }
        };
      });
    };
  }

  tabCustomer.onclick = () => {
    updateTabStyles(tabCustomer);
    bodyEl.innerHTML = renderCustomerStatementReport();
    if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
    
    const custSelect = bodyEl.querySelector('#report-customer-select');
    const custDetails = bodyEl.querySelector('#customer-statement-details');

    const updateCustStatement = () => {
      if (!custSelect) return;
      const cId = custSelect.value;
      if (!cId) {
        custDetails.innerHTML = '<p class="text-xs text-slate-500 py-4 text-center">لا توجد بيانات عميل متاحة</p>';
        return;
      }
      custDetails.innerHTML = window.renderCustomerStatementHTML(cId);
    };

    if (custSelect) {
      custSelect.onchange = updateCustStatement;
      updateCustStatement();
    }
  };

  tabSupplier.onclick = () => {
    updateTabStyles(tabSupplier);
    bodyEl.innerHTML = renderSupplierStatementReport();
    if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });

    const supSelect = bodyEl.querySelector('#report-supplier-select');
    const supDetails = bodyEl.querySelector('#supplier-statement-details');

    const updateSupStatement = () => {
      if (!supSelect) return;
      const sId = supSelect.value;
      if (!sId) {
        supDetails.innerHTML = '<p class="text-xs text-slate-500 py-4 text-center">لا توجد بيانات مورد متاحة</p>';
        return;
      }
      supDetails.innerHTML = window.renderSupplierStatementHTML(sId);
    };

    if (supSelect) {
      supSelect.onchange = updateSupStatement;
      updateSupStatement();
    }
  };

  attachSalesReportEvents();

  // Export Unified Excel Workspace
  if (exportFullBtn) {
    exportFullBtn.onclick = () => window.exportFullDatabaseToExcel();
  }

  // Force Wipe Database Button with Strict Admin Password Validation
  if (forceWipeBtn) {
    forceWipeBtn.onclick = () => window.promptWipeDatabase();
  }

  // Date Range Filter apply & reset handlers
  if (applyDateBtn) {
    applyDateBtn.onclick = () => {
      const dFrom = container.querySelector('#filter-date-from').value;
      const dTo = container.querySelector('#filter-date-to').value;
      const filtered = filterOrdersSmart(window.getOrders(), dFrom, dTo);
      bodyEl.innerHTML = renderSalesReport(filtered);
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      attachSalesReportEvents();
      window.showToast(`تم تطبيق فلتر التاريخ من (${dFrom || 'البداية'}) إلى (${dTo || 'الآن'})`, 'info');
    };
  }

  if (resetDateBtn) {
    resetDateBtn.onclick = () => {
      container.querySelector('#filter-date-from').value = '';
      container.querySelector('#filter-date-to').value = '';
      bodyEl.innerHTML = renderSalesReport(filterOrdersSmart(window.getOrders()));
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      attachSalesReportEvents();
      window.showToast('تم إعادة ضبط الفلتر لـ (آخر 30 يوم + المتبقي)', 'info');
    };
  }
};

/**
 * V3.19 — إعادة احتساب الأرباح والتقارير (Recalculate Totals): rebuilds the
 * supplier-returns ledger (treasury + statements), recomputes derived supplier
 * balances, refreshes the reports page and confirms to the admin.
 */
window.recalculateTotalsThenRefresh = function() {
  try {
    const restated = window.recalculateTotals ? window.recalculateTotals() : 0;
    window.showToast('تمت إعادة احتساب الأرباح والتقارير بنجاح' + (restated > 0 ? ' — تم ترميم ' + restated + ' قيد' : ''), 'success');
    if (window.appInstance) window.appInstance.navigateTo('reports');
  } catch (err) {
    window.showToast((err && err.message) || String(err), 'error');
  }
};

window.promptWipeDatabase = function() {
  const enteredPassword = prompt('🔒 إجراء أمني صارم: يرجى إدخال كلمة مرور المدير الحالية لتأكيد مسح وتصفير البيانات نهائياً:');
  if (enteredPassword === null || !enteredPassword.trim()) {
    window.showToast('تم إلغاء العملية. يرجى إدخال كلمة المرور لتنفيذ مسح القواعد', 'warning');
    return; // STOP EXECUTION COMPLETELY
  }

  const isValid = window.verifyAdminPassword(enteredPassword);
  if (!isValid) {
    if (!window.adminPasswordConfigured()) {
      window.showToast('لا توجد كلمة سر مسجلة للمدير — سجّلها أولاً من (القائمة ▾ ← تغيير كلمة السر) ثم أعد المحاولة', 'error');
    } else {
      window.showToast('كلمة المرور غير صحيحة! تم حظر وإيقاف عملية مسح القواعد السحابية 🛑', 'error');
    }
    return; // STOP EXECUTION COMPLETELY DO NOT CALL forceWipeDatabase()
  }

  window.forceWipeDatabase(enteredPassword).then(success => {
    if (success && window.appInstance) window.appInstance.navigateTo('reports');
  });
};

window.openAddExpenseModal = function(refreshParentFn = null) {
  const contentHTML = `
    <form id="form-add-expense" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">بيان المصروف *</label>
        <input type="text" id="exp-title" required placeholder="مثال: فاتورة كهرباء المحل / إيجار شهر يوليو" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">قيمة المصروف (ج.م) *</label>
          <input type="number" id="exp-amount" min="1" required placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-400 font-extrabold text-lg num-font">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">فئة المصروف</label>
          <select id="exp-category" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
            <option value="عمومية" selected>مصروفات عمومية</option>
            <option value="إيجارات">إيجار المحل والمخزن</option>
            <option value="كهرباء ومرافق">كهرباء ومياه ومرافق</option>
            <option value="أجور ومرتبات">أجور ومرتبات موظفين</option>
            <option value="تغليف ومطبوعات">أكياس وتغليف ومطبوعات</option>
            <option value="شحن ونقل">شحن ونقل بضائع</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">التاريخ</label>
        <input type="date" id="exp-date" value="${getCairoFormattedDate().slice(0, 10)}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات إضافية</label>
        <input type="text" id="exp-notes" placeholder="ملاحظات توضيحية..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/20">
          حفظ المصروف
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: '💸 تسجيل مصروف جديد لمحل الوفاء',
    icon: 'receipt',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#form-add-expense').onsubmit = (e) => {
        e.preventDefault();
        try {
          window.createExpense({
            title: modalEl.querySelector('#exp-title').value,
            amount: modalEl.querySelector('#exp-amount').value,
            category: modalEl.querySelector('#exp-category').value,
            date: modalEl.querySelector('#exp-date').value,
            notes: modalEl.querySelector('#exp-notes').value
          });

          window.showToast('تم قيد المصروف بنجاح وخصم قيمته من الأرباح', 'success');
          closeModal();
          if (refreshParentFn) refreshParentFn();
          else if (window.appInstance) window.appInstance.navigateTo('reports');
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
};



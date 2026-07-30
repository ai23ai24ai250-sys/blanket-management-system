/**
 * Reports View Component - Real-Time Connected with Smart 30-Day Filtering & Unified Export
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
            <span>التقارير اليومية وكشوفات الحسابات الشاملة</span>
          </h1>
          <p class="text-sm text-slate-400">عرض افتراضي لآخر 30 يوماً + جميع الذمم الآجلة المفتوحة وتصدير كامل السيستم</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button id="btn-export-full-db" class="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
            <i data-lucide="database" class="w-4 h-4"></i>
            <span>تصدير كافة بيانات النظام إلى Excel موحد</span>
          </button>
        </div>
      </div>

      <!-- Date Filter Bar & Report Tabs -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        
        <!-- Report Tabs Selector -->
        <div class="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 w-fit">
          <button id="tab-report-sales" class="report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-white bg-brand-600 shadow-sm flex items-center gap-2">
            <i data-lucide="trending-up" class="w-4 h-4"></i>
            <span>المبيعات والمدفوعات</span>
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
          <button id="btn-apply-date-filter" class="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all">
            تطبيق التاريخ
          </button>
          <button id="btn-reset-date-filter" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all">
            آخر 30 يوم + الآجل
          </button>
        </div>

      </div>

      <!-- Dynamic Report Body Container -->
      <div id="report-content-body" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        ${renderSalesReport(orders)}
      </div>

    </div>
  `;
};

// Smart 30-day filter with open debt exceptions
function filterOrdersSmart(ordersList, dateFrom = null, dateTo = null) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return ordersList.filter(o => {
    const oDate = new Date(o.createdAt || o.date);
    const hasRemainingDebt = Number(o.remainingBalance) > 0;

    // Custom Date Range filter
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      return (oDate >= from && oDate <= to) || hasRemainingDebt;
    }

    // Default Smart Filter: Last 30 Days OR Open Debt Exception
    return (oDate >= thirtyDaysAgo) || hasRemainingDebt;
  });
}

function renderSalesReport(orders) {
  const filteredOrders = filterOrdersSmart(orders);
  const payments = window.getPayments();
  const customers = window.getCustomers();

  const totalSalesAmount = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  
  const customerPaymentsTotal = payments
    .filter(p => p.entityType === 'customer')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const supplierPaymentsTotal = payments
    .filter(p => p.entityType === 'supplier')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalRemainingReceivables = customers.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);

  return `
    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي قيمة فواتير المبيعات</span>
          <span class="text-xl font-extrabold text-white num-font">${window.formatCurrency(totalSalesAmount)}</span>
        </div>
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي التحصيلات من العملاء</span>
          <span class="text-xl font-extrabold text-emerald-400 num-font">${window.formatCurrency(customerPaymentsTotal)}</span>
        </div>
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي الدفعات للموردين</span>
          <span class="text-xl font-extrabold text-purple-400 num-font">${window.formatCurrency(supplierPaymentsTotal)}</span>
        </div>
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-400 font-bold block mb-1">المتبقي (الديون الآجلة)</span>
          <span class="text-xl font-extrabold text-rose-400 num-font">${window.formatCurrency(totalRemainingReceivables)}</span>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="history" class="w-4 h-4 text-brand-400"></i>
            <span>جدول فواتير المبيعات والآجل (معاملات آخر 30 يوماً + الديون المفتوحة)</span>
          </h4>
          <span class="text-xs text-brand-400 font-bold bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
            عدد المعاملات المعروضة: ${filteredOrders.length}
          </span>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="data-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>رقم الهاتف</th>
                <th>إجمالي الفاتورة</th>
                <th>المقدم</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.length === 0 ? `
                <tr><td colspan="8" class="text-center py-6 text-slate-500">لا توجد مبيعات في النطاق المحدد</td></tr>
              ` : filteredOrders.map(o => `
                <tr>
                  <td class="font-bold text-brand-400">${o.id}</td>
                  <td class="font-bold text-white">${o.customerName}</td>
                  <td class="num-font text-slate-300">${o.customerPhone}</td>
                  <td class="num-font font-bold text-white">${window.formatCurrency(o.totalAmount)}</td>
                  <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
                  <td class="num-font font-bold ${Number(o.remainingBalance) > 0 ? 'text-rose-400' : 'text-slate-400'}">${window.formatCurrency(o.remainingBalance)}</td>
                  <td>
                    ${Number(o.remainingBalance) > 0 ? `
                      <span class="px-2 py-0.5 text-xs rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">آجل غير مسدد</span>
                    ` : `
                      <span class="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300">${o.status}</span>
                    `}
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
}

function renderCustomerStatementReport() {
  const customers = window.getCustomers();
  return `
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="text-xs font-bold text-slate-300">اختر العميل:</label>
        <select id="report-customer-select" class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-bold">
          ${customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('')}
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
          ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
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
  const applyDateBtn = container.querySelector('#btn-apply-date-filter');
  const resetDateBtn = container.querySelector('#btn-reset-date-filter');

  const tabSales = container.querySelector('#tab-report-sales');
  const tabCustomer = container.querySelector('#tab-report-customer');
  const tabSupplier = container.querySelector('#tab-report-supplier');

  const updateTabStyles = (activeTab) => {
    [tabSales, tabCustomer, tabSupplier].forEach(tab => {
      tab.className = 'report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-white flex items-center gap-2';
    });
    activeTab.className = 'report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-white bg-brand-600 shadow-sm flex items-center gap-2';
  };

  tabSales.onclick = () => {
    updateTabStyles(tabSales);
    bodyEl.innerHTML = renderSalesReport(window.getOrders());
    if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
  };

  tabCustomer.onclick = () => {
    updateTabStyles(tabCustomer);
    bodyEl.innerHTML = renderCustomerStatementReport();
    if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
    
    const custSelect = bodyEl.querySelector('#report-customer-select');
    const custDetails = bodyEl.querySelector('#customer-statement-details');

    const updateCustStatement = () => {
      const cId = custSelect.value;
      const customer = window.getCustomers().find(c => c.id === cId);
      if (!customer) return;
      const cOrders = window.getOrders().filter(o => o.customerId === cId);
      const cPayments = window.getPaymentsByEntity('customer', cId);

      custDetails.innerHTML = `
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800 mb-4 flex justify-between items-center">
          <div>
            <h4 class="font-bold text-white text-base">${customer.name}</h4>
            <p class="text-xs text-slate-400 font-mono">${customer.phone}</p>
          </div>
          <div class="text-left">
            <span class="text-xs text-slate-400 block">الرصيد المتبقي عليه</span>
            <span class="text-xl font-extrabold text-rose-400 num-font">${window.formatCurrency(customer.remainingBalance)}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <h5 class="text-xs font-bold text-slate-300 mb-2">فواتير العميل (${cOrders.length})</h5>
            <table class="data-table">
              <thead>
                <tr><th>رقم الطلب</th><th>المبلغ الإجمالي</th><th>المقدم</th><th>المتبقي</th><th>التاريخ</th></tr>
              </thead>
              <tbody>
                ${cOrders.map(o => `
                  <tr>
                    <td class="font-bold text-brand-400">${o.id}</td>
                    <td class="num-font text-white">${window.formatCurrency(o.totalAmount)}</td>
                    <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
                    <td class="num-font text-rose-400">${window.formatCurrency(o.remainingBalance)}</td>
                    <td class="text-xs text-slate-400">${window.formatDate(o.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div>
            <h5 class="text-xs font-bold text-slate-300 mb-2">تحصيلات العميل المسجلة (${cPayments.length})</h5>
            <table class="data-table">
              <thead>
                <tr><th>رقم الإيصال</th><th>المبلغ المحصل</th><th>طريقة الدفع</th><th>ملاحظات</th><th>التاريخ</th></tr>
              </thead>
              <tbody>
                ${cPayments.map(p => `
                  <tr>
                    <td class="font-bold text-slate-400">${p.id}</td>
                    <td class="num-font text-emerald-400 font-bold">${window.formatCurrency(p.amount)}</td>
                    <td>${p.paymentMethod}</td>
                    <td class="text-slate-400 text-xs">${p.notes || '—'}</td>
                    <td class="text-xs text-slate-400">${p.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
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
      const sId = supSelect.value;
      const supplier = window.getSuppliers().find(s => s.id === sId);
      if (!supplier) return;
      const sPayments = window.getPaymentsByEntity('supplier', sId);

      supDetails.innerHTML = `
        <div class="p-4 bg-slate-850 rounded-xl border border-slate-800 mb-4 flex justify-between items-center">
          <div>
            <h4 class="font-bold text-white text-base">${supplier.name}</h4>
            <p class="text-xs text-slate-400 font-mono">${supplier.phone || ''}</p>
          </div>
          <div class="text-left">
            <span class="text-xs text-slate-400 block">الرصيد المستحق للمورد</span>
            <span class="text-xl font-extrabold text-purple-400 num-font">${window.formatCurrency(supplier.remainingBalance)}</span>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr><th>رقم الإيصال</th><th>المبلغ المسدد</th><th>طريقة الدفع</th><th>الملاحظات</th><th>التاريخ</th></tr>
          </thead>
          <tbody>
            ${sPayments.map(p => `
              <tr>
                <td class="font-bold text-slate-400">${p.id}</td>
                <td class="num-font text-emerald-400 font-bold">${window.formatCurrency(p.amount)}</td>
                <td>${p.paymentMethod}</td>
                <td class="text-slate-400 text-xs">${p.notes || '—'}</td>
                <td class="text-xs text-slate-400">${p.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    };

    if (supSelect) {
      supSelect.onchange = updateSupStatement;
      updateSupStatement();
    }
  };

  // Export Unified Excel Workspace
  if (exportFullBtn) {
    exportFullBtn.onclick = () => window.exportFullDatabaseToExcel();
  }

  // Date Range Filter apply/reset
  if (applyDateBtn) {
    applyDateBtn.onclick = () => {
      const dFrom = container.querySelector('#filter-date-from').value;
      const dTo = container.querySelector('#filter-date-to').value;
      const filtered = filterOrdersSmart(window.getOrders(), dFrom, dTo);
      bodyEl.innerHTML = renderSalesReport(filtered);
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
    };
  }

  if (resetDateBtn) {
    resetDateBtn.onclick = () => {
      container.querySelector('#filter-date-from').value = '';
      container.querySelector('#filter-date-to').value = '';
      bodyEl.innerHTML = renderSalesReport(window.getOrders());
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
    };
  }
};

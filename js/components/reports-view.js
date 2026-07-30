/**
 * Reports View Component - Real-Time Connected with Payments & Collections
 */

window.renderReportsView = function() {
  const orders = window.getOrders();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="bar-chart-3" class="w-6 h-6 text-teal-400"></i>
            <span>التقارير اليومية وكشوفات الحسابات الشاملة</span>
          </h1>
          <p class="text-sm text-slate-400">متابعة المبيعات، التحصيلات من العملاء، المدفوعات للموردين، وكشوفات الحسابات وتصدير إكسل</p>
        </div>

        <div class="flex items-center gap-3">
          <button id="btn-export-excel" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2">
            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
            <span>تصدير التقرير إلى Excel</span>
          </button>
        </div>
      </div>

      <!-- Report Tabs Selector -->
      <div class="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button id="tab-report-sales" class="report-tab-btn px-4 py-2 rounded-lg text-xs font-bold transition-all text-white bg-brand-600 shadow-sm flex items-center gap-2">
          <i data-lucide="trending-up" class="w-4 h-4"></i>
          <span>تقرير حركة المبيعات والمدفوعات</span>
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

      <!-- Dynamic Report Body Container -->
      <div id="report-content-body" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        ${renderSalesReport(orders)}
      </div>

    </div>
  `;
};

function renderSalesReport(orders) {
  const payments = window.getPayments();
  const customers = window.getCustomers();

  const totalSalesAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  
  // Total Collections from Customers (Payment records + Down payments)
  const customerPaymentsTotal = payments
    .filter(p => p.entityType === 'customer')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Total Supplier Payments
  const supplierPaymentsTotal = payments
    .filter(p => p.entityType === 'supplier')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Total Remaining Customer Receivables
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
        <h4 class="text-sm font-bold text-white flex items-center gap-2">
          <i data-lucide="history" class="w-4 h-4 text-brand-400"></i>
          <span>جدول فواتير المبيعات المسجلة</span>
        </h4>
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
              ${orders.length === 0 ? `
                <tr><td colspan="8" class="text-center py-6 text-slate-500">لا توجد مبيعات مسجلة حتى الآن</td></tr>
              ` : orders.map(o => `
                <tr>
                  <td class="font-bold text-brand-400">${o.id}</td>
                  <td class="font-bold text-white">${o.customerName}</td>
                  <td class="num-font text-slate-300">${o.customerPhone}</td>
                  <td class="num-font font-bold text-white">${window.formatCurrency(o.totalAmount)}</td>
                  <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
                  <td class="num-font font-bold text-rose-400">${window.formatCurrency(o.remainingBalance)}</td>
                  <td><span class="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300">${o.status}</span></td>
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
  const exportBtn = container.querySelector('#btn-export-excel');

  let activeReport = 'sales';

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
    activeReport = 'sales';
    updateTabStyles(tabSales);
    bodyEl.innerHTML = renderSalesReport(window.getOrders());
    if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
  };

  tabCustomer.onclick = () => {
    activeReport = 'customer';
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
    activeReport = 'supplier';
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

  exportBtn.onclick = () => {
    const orders = window.getOrders();
    const dataForExport = orders.map(o => ({
      'رقم الفاتورة': o.id,
      'اسم العميل': o.customerName,
      'رقم الهاتف': o.customerPhone,
      'إجمالي الفاتورة (ج.م)': o.totalAmount,
      'المدفوع مقدماً (ج.م)': o.downPayment,
      'المتبقي (ج.م)': o.remainingBalance,
      'حالة الطلب': o.status === 'delivered' ? 'تم التوصيل' : 'جديد',
      'التاريخ': window.formatDate(o.createdAt)
    }));

    window.exportToExcel(dataForExport, `تقرير_المبيعات_${new Date().toISOString().split('T')[0]}.xlsx`, 'المبيعات');
    window.showToast('تم تصدير تقرير المبيعات إلى Excel بنجاح', 'success');
  };
};

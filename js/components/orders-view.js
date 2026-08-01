/**
 * Orders View Component - Dedicated Orders Log & Status Management (سجل الطلبات)
 * Explicit Status Labels, Arabic Status Translations in Modals & Stock/Ledger Restocking
 */

window.renderOrdersView = function() {
  const orders = window.getOrders();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="shopping-bag" class="w-6 h-6 text-brand-400"></i>
            <span>سجل الطلبات والفواتير</span>
          </h1>
          <p class="text-sm text-slate-400">متابعة كشوفات جميع الفواتير، تحديث الحالات، المرتجعات وتتبع الديون</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <input type="text" id="orders-search-input" placeholder="بحث برقم الطلب، اسم العميل، الهاتف..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
          <button id="btn-add-new-order-view" onclick="window.openNewOrderModal()" class="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>إنشاء طلب جديد</span>
          </button>
        </div>
      </div>

      <!-- Orders Data Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="orders-table">
            <thead>
              <tr>
                <th>كود الطلب</th>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>إجمالي الفاتورة</th>
                <th>المقدم</th>
                <th>المتبقي</th>
                <th>الشحن</th>
                <th>نوع العربون</th>
                <th>حالة الطلب</th>
                <th>التاريخ</th>
                <th>الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody id="orders-table-body">
              ${renderOrdersTableRows(orders)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

function renderOrdersTableRows(ordersList) {
  if (!ordersList || ordersList.length === 0) {
    return `
      <tr>
        <td colspan="11" class="text-center py-8 text-slate-500">لا توجد طلبات مسجلة المطابقة للبحث</td>
      </tr>
    `;
  }

  return ordersList.map(o => {
    const statusBadge = window.getOrderStatusBadge(o.status);
    const depositTypeBadge = o.depositType === 'shipping'
      ? '<span class="px-2 py-1 text-xs rounded-lg font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">عربون الشحن</span>'
      : o.depositType === 'shipping_extra'
      ? '<span class="px-2 py-1 text-xs rounded-lg font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">عربون شحن + مصروفات</span>'
      : '<span class="px-2 py-1 text-xs rounded-lg font-bold bg-slate-800 text-slate-400 border border-slate-700">عربون عادي</span>';

    return `
      <tr>
        <td class="font-bold text-brand-400 font-mono text-xs">${o.id}</td>
        <td class="font-bold text-white">${o.customerName}</td>
        <td class="num-font text-slate-300 font-mono text-xs">${window.formatPhonePair(o.customerPhone, o.customerSecondaryPhone)}</td>
        <td class="num-font font-bold text-white">${window.formatCurrency(o.totalAmount)}</td>
        <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
        <td class="num-font font-bold ${Number(o.remainingBalance) > 0 ? 'text-rose-400' : 'text-slate-400'}">${window.formatCurrency(o.remainingBalance)}</td>
        <td class="text-xs text-slate-300">${o.shippingCost ? window.formatCurrency(o.shippingCost) + ' (' + (o.shippingPayer === 'customer' ? 'عميل' : 'تاجر') + ')' : '—'}</td>
        <td>${depositTypeBadge}</td>
        <td>${statusBadge}</td>
        <td class="text-xs text-slate-400">${window.formatDate(o.createdAt)}</td>
        <td>
          <div class="flex items-center gap-1.5">
            <button class="btn-view-order-details px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all" data-order-id="${o.id}">
              تفاصيل 📄
            </button>
            <button class="btn-change-order-status px-2.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 transition-all" data-order-id="${o.id}" data-current-status="${o.status}">
              تحديث 🔄
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.getOrderStatusBadge = function(status) {
  switch (status) {
    case 'delivered':
      return '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">تم التوصيل</span>';
    case 'completed':
      return '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">مكتمل نهائي</span>';
    case 'returned':
      return '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">مرتجع</span>';
    case 'cancelled':
      return '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-800 text-slate-400 border border-slate-700">ملغي</span>';
    case 'new':
    default:
      return '<span class="px-2.5 py-1 text-xs rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">قيد الانتظار</span>';
  }
};

window.setupOrdersEvents = function(container, refreshFn) {
  const searchInput = container.querySelector('#orders-search-input');
  const tableBody = container.querySelector('#orders-table-body');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filtered = window.searchOrders(e.target.value);
      tableBody.innerHTML = renderOrdersTableRows(filtered);
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      attachActionEvents();
    });
  }

  const attachActionEvents = () => {
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
          if (refreshFn) refreshFn();
          else if (window.appInstance) window.appInstance.navigateTo('orders');
        });
      };
    });
  };

  attachActionEvents();
};

window.openOrderDetailsModal = function(orderId) {
  const order = window.getOrderById(orderId);
  if (!order) return;

  const statusBadge = window.getOrderStatusBadge(order.status);

  // Per-order profit breakdown (same model as calculateNetProfit):
  // Profit is pure merchandise margin: (Items Selling Price − COGS) − Merchant-borne costs.
  // Client-paid shipping/fees are pass-through collections for carriers → excluded from profit.
  const orderItemsCost = (order.items || []).reduce((s, i) => s + ((Number(i.purchasePrice) || 0) * (Number(i.quantity) || 0)), 0);
  const orderMerchantShipping = order.shippingPayer === 'merchant' ? (Number(order.shippingCost) || 0) : 0;
  const orderMerchantExtra = order.extraExpensesPayer === 'merchant' ? (Number(order.extraExpenses) || 0) : 0;
  const orderMerchantExpenses = orderMerchantShipping + orderMerchantExtra;
  const orderClientShipping = order.shippingPayer === 'customer' ? (Number(order.shippingCost) || 0) : 0;
  const orderClientExtra = order.extraExpensesPayer === 'customer' ? (Number(order.extraExpenses) || 0) : 0;
  const orderClientPaidFees = orderClientShipping + orderClientExtra;
  const orderItemsSales = Number(order.itemsSubtotal)
    || (order.items || []).reduce((s, i) => s + ((Number(i.sellingPrice) || 0) * (Number(i.quantity) || 0)), 0);
  const orderNetProfit = orderItemsSales - orderItemsCost - orderMerchantExpenses;

  const contentHTML = `
    <div class="space-y-4">
      <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
        <div>
          <h4 class="font-extrabold text-white text-lg">طلب رقم: ${order.id}</h4>
          <p class="text-xs text-brand-400 font-bold">${order.customerName} - ${order.customerPhone}${order.customerSecondaryPhone ? ' - ' + order.customerSecondaryPhone : ''}</p>
        </div>
        <div class="text-left">
          <span class="text-xs text-slate-400 block mb-1">حالة الطلب</span>
          ${statusBadge}
        </div>
      </div>

      <div class="space-y-2">
        <h5 class="text-xs font-bold text-slate-300">المنتجات المباعة في الفاتورة:</h5>
        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
          ${(order.items || []).map(i => `
            <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span class="font-bold text-white block">${i.productName}</span>
                <span class="text-slate-400">الكمية: <strong class="text-emerald-400">${i.quantity} قطعة</strong> بسعر <strong class="text-white">${window.formatCurrency(i.sellingPrice)}</strong></span>
              </div>
              <span class="font-bold text-white num-font text-sm">${window.formatCurrency(i.subtotal)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
        ${order.directShipping ? `
          <div class="flex justify-between items-center">
            <span class="text-slate-300">نوع التنفيذ:</span>
            <span class="font-bold text-purple-400 flex items-center gap-1"><i data-lucide="truck" class="w-3.5 h-3.5"></i> شحن مباشر من المورد (بدون خصم مخزون)</span>
          </div>
        ` : ''}
        <div class="flex justify-between text-slate-300"><span>مجموع البضاعة المباعة:</span><span class="font-bold text-white num-font">${window.formatCurrency(order.itemsSubtotal || order.totalAmount)}</span></div>
        ${order.shippingCost ? `<div class="flex justify-between text-slate-400"><span>تكلفة الشحن (${order.shippingPayer === 'customer' ? 'على العميل' : 'على التاجر'}):</span><span class="font-bold text-purple-400 num-font">${window.formatCurrency(order.shippingCost)}</span></div>` : ''}
        ${order.extraExpenses ? `<div class="flex justify-between text-slate-400"><span>مصروفات إضافية (${order.extraExpensesPayer === 'merchant' ? 'على التاجر' : 'على العميل'}):</span><span class="font-bold text-amber-400 num-font">${window.formatCurrency(order.extraExpenses)}</span></div>` : ''}
        <div class="flex justify-between text-slate-300 font-bold border-t border-slate-800 pt-1"><span>إجمالي الفاتورة:</span><span class="font-bold text-white num-font text-sm">${window.formatCurrency(order.totalAmount)}</span></div>
        <div class="flex justify-between text-slate-400"><span>المسدد مقدماً:</span><span class="font-bold text-emerald-400 num-font">${window.formatCurrency(order.downPayment)}</span></div>
        ${order.depositType && order.depositType !== 'custom' ? `
          <div class="flex justify-between text-slate-400">
            <span>نوع العربون:</span>
            <span class="font-bold text-sky-400">${order.depositType === 'shipping' ? 'عربون بقيمة الشحن' : 'عربون الشحن + المصروفات الإضافية'}</span>
          </div>
        ` : ''}
        ${window.getOrderShippingRevenue(order) > 0 ? `
          <div class="flex justify-between text-slate-500">
            <span>إيراد خدمات شحن ونقل (من العربون):</span>
            <span class="font-bold text-sky-400 num-font">${window.formatCurrency(window.getOrderShippingRevenue(order))}</span>
          </div>
        ` : ''}
        <div class="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-1"><span>المتبقي الآجل:</span><span class="font-extrabold text-rose-400 num-font text-sm">${window.formatCurrency(order.remainingBalance)}</span></div>
        <div class="border-t border-slate-800 mt-2 pt-2 space-y-1">
          <span class="text-xs font-bold text-slate-300 block mb-1">🧮 التحليل المالي للفاتورة:</span>
          <div class="flex justify-between text-slate-400"><span>إجمالي الفاتورة (المحصل من العميل):</span><span class="font-bold text-white num-font">${window.formatCurrency(order.totalAmount)}</span></div>
          <div class="flex justify-between text-slate-400"><span>مبيعات البضاعة الصافية:</span><span class="font-bold text-white num-font">${window.formatCurrency(orderItemsSales)}</span></div>
          ${orderClientPaidFees > 0 ? `<div class="flex justify-between text-slate-500"><span>شحن ومصاريف العميل (خدمة عبور):</span><span class="font-bold text-sky-400 num-font">${window.formatCurrency(orderClientPaidFees)}</span></div>` : ''}
          <div class="flex justify-between text-slate-400"><span>تكلفة البضاعة (COGS):</span><span class="font-bold text-amber-400 num-font">${window.formatCurrency(orderItemsCost)}</span></div>
          <div class="flex justify-between text-slate-400"><span>مصاريف التاجر (شحن + إضافية):</span><span class="font-bold text-purple-400 num-font">${window.formatCurrency(orderMerchantExpenses)}</span></div>
          <div class="flex justify-between font-bold border-t border-slate-800 pt-1"><span class="text-emerald-300">صافي الربح:</span><span class="font-extrabold ${orderNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} num-font">${window.formatCurrency(orderNetProfit)}</span></div>
          <p class="text-[10px] font-mono text-slate-500">صافي الربح (${window.formatCurrency(orderNetProfit)}) = مبيعات البضاعة الصافية (${window.formatCurrency(orderItemsSales)}) − تكلفة البضاعة (${window.formatCurrency(orderItemsCost)}) − مصاريف التاجر (${window.formatCurrency(orderMerchantExpenses)})</p>
          <p class="text-[10px] text-slate-500">شحن/مصاريف يدفعها العميل تُحصَّل لحساب شركات الشحن ولا تُحتسب في الربح.</p>
        </div>
        ${(order.supplierDeficits && order.supplierDeficits.length) ? `
          <div class="border-t border-rose-900/60 pt-2 mt-1 space-y-1">
            <span class="text-rose-400 font-bold">⚠️ طلب مؤجل (عجز مخزون) — مديونية للمورد:</span>
            ${order.supplierDeficits.map(d => `
              <div class="flex justify-between items-center">
                <span class="text-slate-300">${d.supplierName || 'المورد'} - ${d.productName} (${d.units} قطعة)</span>
                <span class="font-bold text-rose-400 num-font">${window.formatCurrency(d.amount)}</span>
              </div>
            `).join('')}
            <p class="text-[10px] text-slate-500">تسدد هذه المديونية من خلال صفحة المدفوعات → تسديد دفعة لمورد</p>
          </div>
        ` : ''}
        ${(order.supplierShipments && order.supplierShipments.length) ? `
          <div class="border-t border-purple-900/60 pt-2 mt-1 space-y-1">
            <span class="text-purple-400 font-bold">🚚 شحنات توريد مباشر مسجلة على المورد:</span>
            ${order.supplierShipments.map(d => `
              <div class="flex justify-between items-center">
                <span class="text-slate-300">${d.supplierName || 'المورد'} - ${d.productName} (${d.units} قطعة)</span>
                <span class="font-bold text-purple-400 num-font">${window.formatCurrency(d.amount)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  window.openModal({
    title: `📄 تفاصيل فاتورة رقم: ${order.id}`,
    icon: 'file-text',
    contentHTML
  });
};

window.openOrderStatusModal = function(orderId, currentStatus, refreshParentFn) {
  const order = window.getOrderById(orderId);
  const deposit = order ? (Number(order.downPayment) || 0) : 0;

  const contentHTML = `
    <form id="form-update-order-status" class="space-y-4">
      <p class="text-xs text-slate-300">تعديل حالة الفاتورة رقم <strong class="text-white font-bold">${orderId}</strong>:</p>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">اختر الحالة الجديدة *</label>
        <select id="select-new-order-status" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs">
          <option value="delivered" ${currentStatus === 'delivered' ? 'selected' : ''}>تم التوصيل (خصم الكميات من المخزن)</option>
          <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>مكتمل نهائي (تسليم وتم تحصيل الحساب كامل بالكامل)</option>
          <option value="returned" ${currentStatus === 'returned' ? 'selected' : ''}>مرتجع (بعد الشحن: إعادة البضاعة للمخزن وخصم تكاليف الشحن الفعلية)</option>
          <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>ملغي (قبل الشحن: إلغاء الطلب بالكامل بلا تكاليف شحن)</option>
        </select>
      </div>

      <div class="p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 text-xs text-amber-300">
        ℹ️ تنبيه: اختيار "مرتجع" أو "ملغي" سيقوم آلياً بإعادة المنتجات لحساب المخزون، إلغاء مديونية الفاتورة من حساب العميل، وإلغاء مديونية عجز المخزون المسجلة على المورد.
        <p class="mt-1.5 text-amber-200/90">💡 ملاحظة: "ملغي" يُستخدم قبل الشحن فلا تُخصم أي تكاليف شحن، ويُبقي العربون المدفوع محتفظاً به كإيراد تشغيلي افتراضياً مع إمكانية استرداد كامل أو جزء منه. أما "مرتجع" فيُستخدم بعد محاولة الشحن وتُخصم تكاليف الشحن الفعلية، ويُرجع المسدد للعميل افتراضياً مع إمكانية تحديد مبلغ استرداد جزئي من الخيارات التالية. في الحالتين يُسجَّل قيد الاسترداد في الخزينة وتُعاد المنتجات للمخزون وتُلغى مديونية الفاتورة.</p>
      </div>

      ${deposit > 0 ? `
      <div id="refund-section" class="hidden p-3 bg-rose-950/30 rounded-xl border border-rose-800/40 space-y-3">
        <label class="flex items-center gap-2 text-xs font-bold text-rose-300 cursor-pointer">
          <input type="checkbox" id="refund-checkbox" class="accent-rose-500 w-4 h-4">
          <span>استرداد مبلغ من العربون للعميل</span>
        </label>
        <div id="refund-input-wrap" class="hidden">
          <label class="block text-xs font-bold text-slate-300 mb-1.5">المبلغ المسترد (من إجمالي عربون: ${window.formatCurrency(deposit)})</label>
          <input type="number" id="refund-amount" min="1" max="${deposit}" step="any" value="${deposit}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-400 font-extrabold num-font">
          <p id="refund-validation-msg" class="text-[11px] font-bold text-rose-400 mt-1.5 hidden">⚠️ المبلغ المسترد يجب أن يكون من 1 حتى ${window.formatCurrency(deposit)}</p>
        </div>
      </div>
      ` : ''}

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl">
          تحديث الحالة
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: `🔄 تحديث حالة الطلب رقم: ${orderId}`,
    icon: 'refresh-cw',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      const statusSelect = modalEl.querySelector('#select-new-order-status');
      const refundSection = modalEl.querySelector('#refund-section');
      const refundCheckbox = modalEl.querySelector('#refund-checkbox');
      const refundWrap = modalEl.querySelector('#refund-input-wrap');
      const refundInput = modalEl.querySelector('#refund-amount');
      const refundMsg = modalEl.querySelector('#refund-validation-msg');

      const refreshRefundVisibility = () => {
        if (refundSection) {
          // Refund deposit is available for BOTH "ملغي" (cancelled) and "مرتجع"
          // (returned): the admin may refund all or part of the customer's deposit.
          const showRefund = statusSelect.value === 'cancelled' || statusSelect.value === 'returned';
          refundSection.classList.toggle('hidden', !showRefund);
          if (!showRefund && refundCheckbox) {
            refundCheckbox.checked = false;
            if (refundWrap) refundWrap.classList.add('hidden');
          }
        }
      };

      if (statusSelect) statusSelect.onchange = refreshRefundVisibility;
      if (refundCheckbox) {
        refundCheckbox.onchange = () => {
          if (refundWrap) refundWrap.classList.toggle('hidden', !refundCheckbox.checked);
        };
      }
      if (refundInput) {
        refundInput.oninput = () => {
          if (refundMsg) {
            const val = parseFloat(refundInput.value) || 0;
            refundMsg.classList.toggle('hidden', !(val < 1 || val > deposit));
          }
        };
      }

      refreshRefundVisibility();

      modalEl.querySelector('#form-update-order-status').onsubmit = (e) => {
        e.preventDefault();
        const newStatus = statusSelect.value;

        // V3.4/V3.9: Flexible deposit refund — available for BOTH cancellation
        // (ملغي) and return (مرتجع). Validate refund amount within 1..downPayment.
        let refundAmount = 0;
        if ((newStatus === 'cancelled' || newStatus === 'returned') && refundCheckbox && refundCheckbox.checked && deposit > 0) {
          refundAmount = parseFloat(refundInput.value) || 0;
          if (refundAmount < 1 || refundAmount > deposit) {
            window.showToast(`المبلغ المسترد يجب أن يكون من 1 حتى ${window.formatCurrency(deposit)}`, 'error');
            return;
          }
        }

        try {
          window.updateOrderStatus(orderId, newStatus, refundAmount);
          const toastMsg = refundAmount > 0
            ? (newStatus === 'cancelled'
                ? `تم إلغاء الطلب ${orderId} واسترداد ${window.formatCurrency(refundAmount)} من العربون للعميل`
                : `تم إرجاع الطلب ${orderId} واسترداد ${window.formatCurrency(refundAmount)} من العربون للعميل`)
            : `تم تحديث حالة الفاتورة رقم ${orderId} إلى (${newStatus}) بنجاح`;
          window.showToast(toastMsg, 'success');
          closeModal();
          if (refreshParentFn) refreshParentFn();
          else if (window.appInstance) window.appInstance.navigateTo('orders');
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
};

/**
 * Payments View Component
 */

window.renderPaymentsView = function() {
  const payments = window.getPayments();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Quick Payment Button -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="wallet" class="w-6 h-6 text-emerald-400"></i>
            <span>إدارة التحصيلات والمدفوعات</span>
          </h1>
          <p class="text-sm text-slate-400">تسجيل المقبوضات النقدية من العملاء والمصروفة للموردين مع تحديث الأرصدة آلياً</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <input type="text" id="payments-search-input" placeholder="بحث بالمبلغ، الاسم، الملاحظات..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
          <button id="btn-record-payment" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>تسجيل دفعة جديدة</span>
          </button>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="payments-table">
            <thead>
              <tr>
                <th>رقم الإيصال</th>
                <th>الجهة (عميل / مورد)</th>
                <th>الاسم</th>
                <th>المبلغ</th>
                <th>طريقة الدفع</th>
                <th>الملاحظات</th>
                <th>التاريخ</th>
                <th>المسجل</th>
              </tr>
            </thead>
            <tbody id="payments-table-body">
              ${renderPaymentRows(payments)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

function renderPaymentRows(paymentsList) {
  if (!paymentsList || paymentsList.length === 0) {
    return `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-500">لا توجد مدفوعات مسجلة مطابقة للبحث</td>
      </tr>
    `;
  }

  return paymentsList.map(p => `
    <tr>
      <td class="font-bold text-slate-400">${p.id}</td>
      <td>
        <span class="px-2.5 py-1 text-xs font-bold rounded-lg ${p.entityType === 'customer' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}">
          ${p.entityType === 'customer' ? 'تحصيل من عميل' : 'تسديد لمورد'}
        </span>
      </td>
      <td class="font-bold text-white">${p.entityName}</td>
      <td class="num-font font-extrabold text-emerald-400 text-base">${window.formatCurrency(p.amount)}</td>
      <td class="text-xs text-slate-300">${p.paymentMethod === 'cash' ? 'نقدي (كاش)' : p.paymentMethod === 'transfer' ? 'تحويل بنكي / فودافون كاش' : 'شيك'}</td>
      <td class="text-slate-400 text-xs">${p.notes || '—'}</td>
      <td class="text-xs text-slate-400">${p.date}</td>
      <td class="text-xs text-slate-400">${p.createdBy || 'المدير العام'}</td>
    </tr>
  `).join('');
}

window.setupPaymentsEvents = function(container, refreshFn) {
  const searchInput = container.querySelector('#payments-search-input');
  const tableBody = container.querySelector('#payments-table-body');
  const recordBtn = container.querySelector('#btn-record-payment');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filtered = window.searchPayments(e.target.value);
      tableBody.innerHTML = renderPaymentRows(filtered);
    });
  }

  if (recordBtn) {
    recordBtn.onclick = () => window.openPaymentModal({}, refreshFn);
  }
};

window.openPaymentModal = function({ defaultEntityType = 'customer', defaultEntityId = null } = {}, refreshParentFn = null) {
  const customers = window.getCustomers();
  const suppliers = window.getSuppliers();

  const contentHTML = `
    <form id="form-record-payment" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">نوع العملية *</label>
        <select id="pay-entity-type" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
          <option value="customer" ${defaultEntityType === 'customer' ? 'selected' : ''}>تحصيل دفعة من عميل (قبض)</option>
          <option value="supplier" ${defaultEntityType === 'supplier' ? 'selected' : ''}>تسديد دفعة لمورد / مصنع (دفع)</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5" id="pay-entity-label">العميل *</label>
        <select id="pay-entity-select" required class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
        </select>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">المبلغ * (ج.م)</label>
        <input type="number" id="pay-amount" min="1" required placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-extrabold text-lg num-font">
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">طريقة الدفع</label>
          <select id="pay-method" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
            <option value="cash" selected>نقدي (كاش)</option>
            <option value="transfer">تحويل بنكي / محفظة فودافون كاش</option>
            <option value="check">شيك بنكي</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">التاريخ</label>
          <input type="date" id="pay-date" value="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font">
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات وشرح الإيصال</label>
        <input type="text" id="pay-notes" placeholder="مثال: تسديد دفعة تحت حساب طلب رقم ORD-1001" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20">
          تسجيل الدفعة وتحديث الرصيد
        </button>
      </div>

    </form>
  `;

  window.openModal({
    title: '💰 تسجيل دفعة / إيصال قبض أو دفع',
    icon: 'wallet',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      const typeSelect = modalEl.querySelector('#pay-entity-type');
      const entitySelect = modalEl.querySelector('#pay-entity-select');
      const entityLabel = modalEl.querySelector('#pay-entity-label');

      const populateEntities = () => {
        const type = typeSelect.value;
        if (type === 'customer') {
          entityLabel.textContent = 'العميل *';
          entitySelect.innerHTML = customers.map(c => `
            <option value="${c.id}" ${c.id === defaultEntityId ? 'selected' : ''}>${c.name} (${c.phone}) - الرصيد المتبقي عليه: ${window.formatCurrency(c.remainingBalance)}</option>
          `).join('');
        } else {
          entityLabel.textContent = 'المورد / المصنع *';
          entitySelect.innerHTML = suppliers.map(s => `
            <option value="${s.id}" ${s.id === defaultEntityId ? 'selected' : ''}>${s.name} - الرصيد المستحق له: ${window.formatCurrency(s.remainingBalance)}</option>
          `).join('');
        }
      };

      typeSelect.onchange = populateEntities;
      populateEntities();

      modalEl.querySelector('#form-record-payment').onsubmit = (e) => {
        e.preventDefault();
        const type = typeSelect.value;
        const eId = entitySelect.value;
        const amount = Number(modalEl.querySelector('#pay-amount').value) || 0;

        let entityObj = type === 'customer' ? customers.find(c => c.id === eId) : suppliers.find(s => s.id === eId);
        if (!entityObj) return;

        try {
          window.createPaymentRecord({
            entityType: type,
            entityId: eId,
            entityName: entityObj.name,
            amount,
            date: modalEl.querySelector('#pay-date').value,
            paymentMethod: modalEl.querySelector('#pay-method').value,
            notes: modalEl.querySelector('#pay-notes').value
          });

          window.showToast('تم تسجيل الدفعة وتحديث رصيد الحساب بنجاح', 'success');
          closeModal();
          if (refreshParentFn) refreshParentFn();
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
};

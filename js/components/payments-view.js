/**
 * Payments View Component
 * Supports Quick Full Remaining Debt Settlement Auto-Fill & Strict Validation Blocking
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

  return paymentsList.map(p => {
    const isRefund = (Number(p.amount) || 0) < 0;
    return `
    <tr>
      <td class="font-bold text-slate-400">${p.id}</td>
      <td>
        <span class="px-2.5 py-1 text-xs font-bold rounded-lg ${isRefund ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : p.entityType === 'customer' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}">
          ${isRefund ? 'استرداد / رد عربون (صادر)' : p.entityType === 'customer' ? 'تحصيل من عميل' : 'تسديد لمورد'}
        </span>
      </td>
      <td class="font-bold text-white">${p.entityName}</td>
      <td class="num-font font-extrabold ${isRefund ? 'text-rose-400' : 'text-emerald-400'} text-base">${window.formatCurrency(p.amount)}</td>
      <td class="text-xs text-slate-300">${p.paymentMethod === 'cash' ? 'نقدي (كاش)' : p.paymentMethod === 'transfer' ? 'تحويل بنكي / فودافون كاش' : p.paymentMethod === 'check' ? 'شيك بنكي' : 'أخرى'}</td>
      <td class="text-slate-400 text-xs">${p.notes || '—'}</td>
      <td class="text-xs text-slate-400">${p.date}</td>
      <td class="text-xs text-slate-400">${p.createdBy || 'المدير العام'}</td>
    </tr>
  `;
  }).join('');
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
  // 🔒 Admin-only: payments handle cash settlements (including outgoing money to
  // suppliers), so only the general manager may open this screen/modal.
  const currentUser = window.getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    window.showToast('عفواً، شاشة المدفوعات مخصصة للمدير العام فقط', 'error');
    return;
  }

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
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-xs font-bold text-slate-300">المبلغ * (ج.م)</label>
          <!-- Quick Auto-Fill Full Remaining Debt Button -->
          <button type="button" id="btn-pay-full-debt" class="px-2.5 py-1 text-xs font-bold bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white rounded-lg border border-brand-500/40 transition-all flex items-center gap-1">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>سداد كامل المديونية المتبقية ⚡</span>
          </button>
        </div>
        <input type="number" id="pay-amount" min="1" required placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-extrabold text-lg num-font">
        <p id="pay-validation-msg" class="text-xs font-bold text-rose-400 mt-1 hidden"></p>
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
        <input type="text" id="pay-notes" placeholder="مثال: تسديد كامل الحساب المتبقي" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" id="btn-submit-payment" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20">
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
      const amountInput = modalEl.querySelector('#pay-amount');
      const validationMsg = modalEl.querySelector('#pay-validation-msg');
      const payFullBtn = modalEl.querySelector('#btn-pay-full-debt');
      const submitBtn = modalEl.querySelector('#btn-submit-payment');

      const getMaxRemaining = () => {
        const type = typeSelect.value;
        const eId = entitySelect.value;
        if (type === 'customer') {
          const c = customers.find(item => item.id === eId);
          return c ? Number(c.remainingBalance) || 0 : 0;
        } else {
          const s = suppliers.find(item => item.id === eId);
          return s ? Number(s.remainingBalance) || 0 : 0;
        }
      };

      const populateEntities = () => {
        const type = typeSelect.value;
        if (type === 'customer') {
          entityLabel.textContent = 'العميل *';
          entitySelect.innerHTML = customers.length ? customers.map(c => `
            <option value="${c.id}" ${c.id === defaultEntityId ? 'selected' : ''}>${c.name} (${c.phone}) - الرصيد المتبقي عليه: ${window.formatCurrency(c.remainingBalance)}</option>
          `).join('') : '<option value="">لا يوجد عملاء مسجلين</option>';
        } else {
          entityLabel.textContent = 'المورد / المصنع *';
          entitySelect.innerHTML = suppliers.length ? suppliers.map(s => `
            <option value="${s.id}" ${s.id === defaultEntityId ? 'selected' : ''}>${s.name} - الرصيد المستحق له: ${window.formatCurrency(s.remainingBalance)}</option>
          `).join('') : '<option value="">لا يوجد موردين مسجلين</option>';
        }
        checkAmountValidation();
      };

      const checkAmountValidation = () => {
        const amt = Number(amountInput.value) || 0;
        const max = getMaxRemaining();
        if (amt > max && max > 0) {
          validationMsg.textContent = `⚠️ لا يمكن إدخال مبلغ أكبر من الرصيد المتبقي (${window.formatCurrency(max)})`;
          validationMsg.classList.remove('hidden');
        } else {
          validationMsg.classList.add('hidden');
        }
      };

      if (payFullBtn) {
        payFullBtn.onclick = () => {
          const maxRemaining = getMaxRemaining();
          if (maxRemaining <= 0) {
            window.showToast('الرصيد المتبقي مسدد بالكامل بالفعل (0 ج.م)', 'info');
            amountInput.value = 0;
          } else {
            amountInput.value = maxRemaining;
            window.showToast(`تم تعبئة المبلغ بالكامل تلقائياً: ${window.formatCurrency(maxRemaining)}`, 'success');
          }
          checkAmountValidation();
        };
      }

      typeSelect.onchange = populateEntities;
      entitySelect.onchange = checkAmountValidation;
      amountInput.oninput = checkAmountValidation;

      populateEntities();

      modalEl.querySelector('#form-record-payment').onsubmit = (e) => {
        e.preventDefault();

        const type = typeSelect.value;
        const eId = entitySelect.value;
        const amount = parseFloat(amountInput.value) || 0;

        let entityObj = type === 'customer' ? customers.find(c => c.id === eId) : suppliers.find(s => s.id === eId);
        if (!entityObj) {
          window.showToast('يرجى اختيار العميل أو المورد أولاً', 'error');
          return false;
        }

        // 🔒 STRICT VALIDATION: Block Save if Amount > Max Remaining Balance
        const maxRemaining = getMaxRemaining();
        if (amount > maxRemaining) {
          window.showToast(`خطأ: لا يمكن إدخال مبلغ (${window.formatCurrency(amount)}) أكبر من الرصيد المتبقي (${window.formatCurrency(maxRemaining)})`, 'error');
          return false; // BLOCK SUBMIT COMPLETELY! NO FIRESTORE WRITE
        }

        // 🛑 Anti-Multi-Click Protection
        if (submitBtn.disabled) return false;

        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

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
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      };
    }
  });
};

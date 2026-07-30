/**
 * Customers View Component - 3-Part Address & Strict Egyptian Phone Validation
 */

window.renderCustomersView = function() {
  const customers = window.getCustomers();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="users" class="w-6 h-6 text-sky-400"></i>
            <span>دليل العملاء وحسابات الديون</span>
          </h1>
          <p class="text-sm text-slate-400">إدارة بيانات العملاء، إجمالي المشتريات، والمدفوعات والمستحقات المتبقية</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <input type="text" id="customers-search-input" placeholder="بحث بالاسم، رقم الهاتف، الكود..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
          <button id="btn-add-customer" class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="customers-table">
            <thead>
              <tr>
                <th>كود العميل</th>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>العنوان والمحافظة</th>
                <th>عدد الفواتير</th>
                <th>إجمالي المشتريات</th>
                <th>المسدد</th>
                <th>الرصيد المتبقي (آجل)</th>
                <th>العمليات والإجراءات</th>
              </tr>
            </thead>
            <tbody id="customers-table-body">
              ${renderCustomerRows(customers)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

function renderCustomerRows(customersList) {
  if (!customersList || customersList.length === 0) {
    return `
      <tr>
        <td colspan="9" class="text-center py-8 text-slate-500">لا يوجد عملاء مسجلين المطابقين للبحث</td>
      </tr>
    `;
  }

  return customersList.map(c => `
    <tr>
      <td class="font-bold text-sky-400">${c.id}</td>
      <td class="font-bold text-white">${c.name}</td>
      <td class="num-font text-slate-300 font-mono">${c.phone}</td>
      <td class="text-slate-400 text-xs">${c.address || '—'}</td>
      <td class="num-font text-center font-bold text-slate-300">${c.ordersCount || 0}</td>
      <td class="num-font text-white font-bold">${window.formatCurrency(c.totalPurchases)}</td>
      <td class="num-font text-emerald-400 font-bold">${window.formatCurrency(c.paid)}</td>
      <td class="num-font font-extrabold ${Number(c.remainingBalance) > 0 ? 'text-rose-400' : 'text-slate-400'} text-base">
        ${window.formatCurrency(c.remainingBalance)}
      </td>
      <td>
        <div class="flex items-center gap-2">
          <button class="btn-pay-customer px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1" data-customer-id="${c.id}">
            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
            <span>تحصيل دفعة</span>
          </button>
          <button class="btn-edit-customer px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 transition-all flex items-center gap-1" data-customer-id="${c.id}">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>تعديل</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.setupCustomersEvents = function(container, refreshFn) {
  const searchInput = container.querySelector('#customers-search-input');
  const tableBody = container.querySelector('#customers-table-body');
  const addBtn = container.querySelector('#btn-add-customer');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filtered = window.searchCustomers(e.target.value);
      tableBody.innerHTML = renderCustomerRows(filtered);
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      attachActionEvents();
    });
  }

  if (addBtn) {
    addBtn.onclick = () => openCustomerModal(null, refreshFn);
  }

  const attachActionEvents = () => {
    container.querySelectorAll('.btn-pay-customer').forEach(btn => {
      btn.onclick = () => {
        const cId = btn.getAttribute('data-customer-id');
        window.openPaymentModal({ defaultEntityType: 'customer', defaultEntityId: cId }, refreshFn);
      };
    });

    container.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.onclick = () => {
        const cId = btn.getAttribute('data-customer-id');
        const customer = window.getCustomerById(cId);
        if (customer) openCustomerModal(customer, refreshFn);
      };
    });
  };

  attachActionEvents();
};

function openCustomerModal(customerToEdit = null, refreshParentFn = null) {
  const isEdit = !!customerToEdit;
  const govs = Object.keys(window.EGYPT_GOVERNORATES || {});

  const parsedAddr = window.parseAddressComponents(customerToEdit ? customerToEdit.address : '');

  const contentHTML = `
    <form id="form-customer" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">اسم العميل *</label>
        <input type="text" id="cust-name" required value="${isEdit ? customerToEdit.name : ''}" placeholder="اسم العميل الثلاثي" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف (11 رقماً يبدأ بـ 01) *</label>
        <input type="text" id="cust-phone" required maxlength="11" value="${isEdit ? customerToEdit.phone : ''}" placeholder="01012345678" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-left num-font">
      </div>

      <!-- 3-Part Address System -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">المحافظة *</label>
          <select id="cust-gov" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
            ${govs.map(g => `<option value="${g}" ${g === parsedAddr.governorate ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">المدينة / المركز *</label>
          <select id="cust-city" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">تفاصيل العنوان / العلامة المميزة (اختياري)</label>
        <input type="text" id="cust-addr-details" value="${parsedAddr.details || ''}" placeholder="مثال: الشارع الرئيسي، بجوار مسجد الهدى، قرية..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات العميل</label>
        <input type="text" id="cust-notes" value="${isEdit ? (customerToEdit.notes || '') : ''}" placeholder="عميل جملة / تجزئة / تفاصيل إضافية" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl">
          ${isEdit ? 'حفظ التعديلات' : 'إضافة العميل'}
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: isEdit ? `تعديل بيانات العميل: ${customerToEdit.name}` : 'إضافة عميل جديد',
    icon: 'user-plus',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      const govSelect = modalEl.querySelector('#cust-gov');
      const citySelect = modalEl.querySelector('#cust-city');

      const populateCities = () => {
        const selectedGov = govSelect.value;
        const cities = window.EGYPT_GOVERNORATES[selectedGov] || [];
        citySelect.innerHTML = cities.map(c => `
          <option value="${c}" ${c === parsedAddr.city ? 'selected' : ''}>${c}</option>
        `).join('');
      };

      govSelect.onchange = populateCities;
      populateCities();

      modalEl.querySelector('#form-customer').onsubmit = (e) => {
        e.preventDefault();
        const rawPhone = modalEl.querySelector('#cust-phone').value;
        
        const phoneValid = window.validateEgyptianPhone(rawPhone);
        if (!phoneValid.isValid) {
          window.showToast(phoneValid.message, 'error');
          return;
        }

        const gov = govSelect.value;
        const city = citySelect.value;
        const details = modalEl.querySelector('#cust-addr-details').value.trim();
        const addressCombined = details ? `${gov} - ${city} - ${details}` : `${gov} - ${city}`;

        const data = {
          name: modalEl.querySelector('#cust-name').value,
          phone: phoneValid.cleaned,
          address: addressCombined,
          notes: modalEl.querySelector('#cust-notes').value
        };

        try {
          if (isEdit) {
            window.updateCustomer(customerToEdit.id, data);
            window.showToast('تم تحديث بيانات العميل بنجاح', 'success');
          } else {
            window.createCustomer(data);
            window.showToast('تم إضافة العميل الجديد بنجاح', 'success');
          }

          closeModal();
          if (refreshParentFn) refreshParentFn();
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
}

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

        <div class="flex flex-wrap items-center gap-3">
          <div class="relative w-full sm:w-64">
            <input type="text" id="customers-search-input" placeholder="بحث بالاسم، رقم الهاتف، الكود..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
          <div class="relative w-full sm:w-52">
            <select id="customers-category-filter" class="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition-all cursor-pointer">
              <option value="">كل التصنيفات</option>
              ${window.CUSTOMER_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <button id="btn-add-customer" onclick="window.openAddCustomerModal()" class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
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
                <th>التصنيف</th>
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

const CATEGORY_BADGE_STYLES = {
  'تاجر جملة': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'تاجر تجزئة': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'عميل قطاعي / فردي': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'جمعية خيرية / مؤسسة': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'معرض / وكيل': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'عميل محتمل': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
};

function renderCategoryBadge(category) {
  const style = CATEGORY_BADGE_STYLES[category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  return `<span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg border whitespace-nowrap ${style}">${category || '—'}</span>`;
}

function renderCustomerRows(customersList) {
  if (!customersList || customersList.length === 0) {
    return `
      <tr>
        <td colspan="10" class="text-center py-8 text-slate-500">لا يوجد عملاء مسجلين المطابقين للبحث</td>
      </tr>
    `;
  }

  return customersList.map(c => `
    <tr>
      <td class="font-bold text-sky-400">${c.id}</td>
      <td class="font-bold text-white">${c.name}</td>
      <td>${renderCategoryBadge(c.category)}</td>
      <td class="num-font text-slate-300 font-mono">${c.phone}${c.secondaryPhone ? `<div class="text-[10px] text-slate-500 font-mono">${c.secondaryPhone}</div>` : ''}</td>
      <td class="text-slate-400 text-xs">${c.address || '—'}</td>
      <td class="num-font text-center font-bold text-slate-300">${c.ordersCount || 0}</td>
      <td class="num-font text-white font-bold">${window.formatCurrency(c.totalPurchases)}</td>
      <td class="num-font text-emerald-400 font-bold">${window.formatCurrency(c.paid)}</td>
      <td class="num-font font-extrabold ${Number(c.remainingBalance) > 0 ? 'text-rose-400' : 'text-slate-400'} text-base">
        ${window.formatCurrency(c.remainingBalance)}
      </td>
      <td>
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-pay-customer px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1" data-customer-id="${c.id}">
            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
            <span>تحصيل دفعة</span>
          </button>
          <button class="btn-customer-statement px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 text-xs font-bold rounded-lg border border-sky-500/30 transition-all flex items-center gap-1" data-customer-id="${c.id}">
            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
            <span>كشف حساب</span>
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
  const categoryFilter = container.querySelector('#customers-category-filter');
  const tableBody = container.querySelector('#customers-table-body');
  const addBtn = container.querySelector('#btn-add-customer');

  const applyFilters = () => {
    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
    const cat = categoryFilter ? categoryFilter.value : '';
    let filtered = window.getCustomers();
    if (cat) filtered = filtered.filter(c => (c.category || '') === cat);
    if (q) {
      filtered = filtered.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.secondaryPhone && c.secondaryPhone.includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q))
      );
    }
    tableBody.innerHTML = renderCustomerRows(filtered);
    if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
    attachActionEvents();
  };

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }

  if (addBtn) {
    addBtn.onclick = () => window.openAddCustomerModal(null, refreshFn);
  }

  const attachActionEvents = () => {
    container.querySelectorAll('.btn-pay-customer').forEach(btn => {
      btn.onclick = () => {
        const cId = btn.getAttribute('data-customer-id');
        window.openPaymentModal({ defaultEntityType: 'customer', defaultEntityId: cId }, refreshFn);
      };
    });

    container.querySelectorAll('.btn-customer-statement').forEach(btn => {
      btn.onclick = () => {
        const cId = btn.getAttribute('data-customer-id');
        window.openCustomerStatementModal(cId);
      };
    });

    container.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.onclick = () => {
        const cId = btn.getAttribute('data-customer-id');
        const customer = window.getCustomerById(cId);
        if (customer) window.openAddCustomerModal(customer, refreshFn);
      };
    });
  };

  attachActionEvents();
};

window.openAddCustomerModal = function(customerToEdit = null, refreshParentFn = null) {
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

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">رقم هاتف ثانوي (اختياري)</label>
        <input type="text" id="cust-phone-2" maxlength="11" value="${isEdit ? (customerToEdit.secondaryPhone || '') : ''}" placeholder="01012345678" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-left num-font">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">تصنيف العميل (Category) *</label>
        <select id="cust-category" required class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold cursor-pointer">
          ${window.CUSTOMER_CATEGORIES.map(cat => `
            <option value="${cat}" ${(isEdit ? customerToEdit.category : window.DEFAULT_CUSTOMER_CATEGORY) === cat ? 'selected' : ''}>${cat}</option>
          `).join('')}
        </select>
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

        const secondaryRaw = modalEl.querySelector('#cust-phone-2').value;
        const secondaryValid = window.validateEgyptianPhone(secondaryRaw);
        if (secondaryRaw.trim() && !secondaryValid.isValid) {
          window.showToast(secondaryValid.message, 'error');
          return;
        }

        const gov = govSelect.value;
        const city = citySelect.value;
        const details = modalEl.querySelector('#cust-addr-details').value.trim();
        const addressCombined = details ? `${gov} - ${city} - ${details}` : `${gov} - ${city}`;

        const data = {
          name: modalEl.querySelector('#cust-name').value,
          phone: phoneValid.cleaned,
          secondaryPhone: secondaryRaw.trim() ? secondaryValid.cleaned : '',
          category: modalEl.querySelector('#cust-category').value,
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
          else if (window.appInstance) window.appInstance.navigateTo('customers');
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
};

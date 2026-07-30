/**
 * Suppliers View Component - 3-Part Address & Strict Egyptian Phone Validation
 */

window.renderSuppliersView = function() {
  const suppliers = window.getSuppliers();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="truck" class="w-6 h-6 text-purple-400"></i>
            <span>دليل الموردين والمصانع</span>
          </h1>
          <p class="text-sm text-slate-400">إدارة حسابات المصانع، إجمالي التعاملات، والمدفوعات والمستحقات للموردين</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <input type="text" id="suppliers-search-input" placeholder="بحث بالاسم، رقم الهاتف..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
          <button id="btn-add-supplier" class="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>إضافة مورد جديد</span>
          </button>
        </div>
      </div>

      <!-- Suppliers Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="suppliers-table">
            <thead>
              <tr>
                <th>كود المورد</th>
                <th>اسم المورد / المصنع</th>
                <th>رقم الهاتف</th>
                <th>العنوان والمحافظة</th>
                <th>إجمالي التعاملات</th>
                <th>المبلغ المسدد</th>
                <th>الرصيد المستحق له</th>
                <th>العمليات والإجراءات</th>
              </tr>
            </thead>
            <tbody id="suppliers-table-body">
              ${renderSupplierRows(suppliers)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

function renderSupplierRows(suppliersList) {
  if (!suppliersList || suppliersList.length === 0) {
    return `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-500">لا يوجد موردين مسجلين المطابقين للبحث</td>
      </tr>
    `;
  }

  return suppliersList.map(s => `
    <tr>
      <td class="font-bold text-purple-400">${s.id}</td>
      <td class="font-bold text-white">${s.name}</td>
      <td class="num-font text-slate-300 font-mono">${s.phone || '—'}</td>
      <td class="text-slate-400 text-xs">${s.address || '—'}</td>
      <td class="num-font text-white font-bold">${window.formatCurrency(s.totalPurchases)}</td>
      <td class="num-font text-emerald-400 font-bold">${window.formatCurrency(s.paid)}</td>
      <td class="num-font font-extrabold ${Number(s.remainingBalance) > 0 ? 'text-purple-400' : 'text-slate-400'} text-base">
        ${window.formatCurrency(s.remainingBalance)}
      </td>
      <td>
        <div class="flex items-center gap-2">
          <button class="btn-pay-supplier px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1" data-supplier-id="${s.id}">
            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
            <span>تسديد دفعة</span>
          </button>
          <button class="btn-edit-supplier px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 transition-all flex items-center gap-1" data-supplier-id="${s.id}">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>تعديل</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.setupSuppliersEvents = function(container, refreshFn) {
  const searchInput = container.querySelector('#suppliers-search-input');
  const tableBody = container.querySelector('#suppliers-table-body');
  const addBtn = container.querySelector('#btn-add-supplier');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filtered = window.searchSuppliers(e.target.value);
      tableBody.innerHTML = renderSupplierRows(filtered);
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      attachActionEvents();
    });
  }

  if (addBtn) {
    addBtn.onclick = () => openSupplierModal(null, refreshFn);
  }

  const attachActionEvents = () => {
    container.querySelectorAll('.btn-pay-supplier').forEach(btn => {
      btn.onclick = () => {
        const sId = btn.getAttribute('data-supplier-id');
        window.openPaymentModal({ defaultEntityType: 'supplier', defaultEntityId: sId }, refreshFn);
      };
    });

    container.querySelectorAll('.btn-edit-supplier').forEach(btn => {
      btn.onclick = () => {
        const sId = btn.getAttribute('data-supplier-id');
        const supplier = window.getSupplierById(sId);
        if (supplier) openSupplierModal(supplier, refreshFn);
      };
    });
  };

  attachActionEvents();
};

function openSupplierModal(supplierToEdit = null, refreshParentFn = null) {
  const isEdit = !!supplierToEdit;
  const govs = Object.keys(window.EGYPT_GOVERNORATES || {});

  const parsedAddr = window.parseAddressComponents(supplierToEdit ? supplierToEdit.address : '');

  const contentHTML = `
    <form id="form-supplier" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">اسم المورد / المصنع *</label>
        <input type="text" id="sup-name" required value="${isEdit ? supplierToEdit.name : ''}" placeholder="اسم الشركة أو المصنع" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف (11 رقماً يبدأ بـ 01) *</label>
        <input type="text" id="sup-phone" required maxlength="11" value="${isEdit ? (supplierToEdit.phone || '') : ''}" placeholder="01012345678" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-left num-font">
      </div>

      <!-- 3-Part Address System -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">المافظة *</label>
          <select id="sup-gov" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
            ${govs.map(g => `<option value="${g}" ${g === parsedAddr.governorate ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">المدينة / المركز *</label>
          <select id="sup-city" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">تفاصيل العنوان / المقر (اختياري)</label>
        <input type="text" id="sup-addr-details" value="${parsedAddr.details || ''}" placeholder="مثال: المنطقة الصناعية، الشارع الرئيسي، بجوار..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات عن التعامل</label>
        <input type="text" id="sup-notes" value="${isEdit ? (supplierToEdit.notes || '') : ''}" placeholder="نوع البضائع، التخصص، تفاهمات السعر..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl">
          ${isEdit ? 'حفظ التعديلات' : 'إضافة المورد'}
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: isEdit ? `تعديل بيانات المورد: ${supplierToEdit.name}` : 'إضافة مورد جديد',
    icon: 'truck',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      const govSelect = modalEl.querySelector('#sup-gov');
      const citySelect = modalEl.querySelector('#sup-city');

      const populateCities = () => {
        const selectedGov = govSelect.value;
        const cities = window.EGYPT_GOVERNORATES[selectedGov] || [];
        citySelect.innerHTML = cities.map(c => `
          <option value="${c}" ${c === parsedAddr.city ? 'selected' : ''}>${c}</option>
        `).join('');
      };

      govSelect.onchange = populateCities;
      populateCities();

      modalEl.querySelector('#form-supplier').onsubmit = (e) => {
        e.preventDefault();
        const rawPhone = modalEl.querySelector('#sup-phone').value;
        
        const phoneValid = window.validateEgyptianPhone(rawPhone);
        if (!phoneValid.isValid) {
          window.showToast(phoneValid.message, 'error');
          return;
        }

        const gov = govSelect.value;
        const city = citySelect.value;
        const details = modalEl.querySelector('#sup-addr-details').value.trim();
        const addressCombined = details ? `${gov} - ${city} - ${details}` : `${gov} - ${city}`;

        const data = {
          name: modalEl.querySelector('#sup-name').value,
          phone: phoneValid.cleaned,
          address: addressCombined,
          notes: modalEl.querySelector('#sup-notes').value
        };

        try {
          if (isEdit) {
            window.updateSupplier(supplierToEdit.id, data);
            window.showToast('تم تحديث بيانات المورد بنجاح', 'success');
          } else {
            window.createSupplier(data);
            window.showToast('تم إضافة المورد الجديد بنجاح', 'success');
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

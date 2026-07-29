/**
 * Suppliers View & Details Component
 */

window.renderSuppliersView = function() {
  const suppliers = window.getSuppliers();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Search Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="truck" class="w-6 h-6 text-purple-400"></i>
            <span>إدارة الموردين والمصانع</span>
          </h1>
          <p class="text-sm text-slate-400">متابعة حسابات الموردين، المنتجات الموردة والدفعات</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <input type="text" id="suppliers-search-input" placeholder="بحث باسم المورد، الهاتف..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
          <button id="btn-add-supplier" class="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>إضافة مورد</span>
          </button>
        </div>
      </div>

      <!-- Suppliers Data Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="suppliers-table">
            <thead>
              <tr>
                <th>كود المورد</th>
                <th>اسم المورد / المصنع</th>
                <th>رقم الهاتف</th>
                <th>العنوان</th>
                <th>إجمالي التعاملات</th>
                <th>المبلغ المسدد</th>
                <th>الرصيد المتبقي</th>
                <th>التفاصيل</th>
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
        <td colspan="8" class="text-center py-8 text-slate-500">لا يوجد موردين مسجلين</td>
      </tr>
    `;
  }

  return suppliersList.map(s => `
    <tr class="cursor-pointer hover:bg-slate-800/50 transition-all supplier-row" data-supplier-id="${s.id}">
      <td class="font-bold text-purple-400">${s.id}</td>
      <td class="font-bold text-white">${s.name}</td>
      <td class="num-font text-slate-300">${s.phone || '—'}</td>
      <td class="text-slate-400 text-xs">${s.address || '—'}</td>
      <td class="num-font font-bold text-white">${window.formatCurrency(s.totalPurchases)}</td>
      <td class="num-font text-emerald-400">${window.formatCurrency(s.paid)}</td>
      <td class="num-font font-extrabold ${s.remainingBalance > 0 ? 'text-purple-400' : 'text-slate-400'}">
        ${window.formatCurrency(s.remainingBalance)}
      </td>
      <td>
        <button class="btn-view-supplier-details px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/30 transition-all flex items-center gap-1">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          <span>عرض الحساب</span>
        </button>
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
      attachRowClicks();
    });
  }

  if (addBtn) {
    addBtn.onclick = () => openAddSupplierModal(refreshFn);
  }

  const attachRowClicks = () => {
    container.querySelectorAll('.supplier-row').forEach(row => {
      row.onclick = () => {
        const supId = row.getAttribute('data-supplier-id');
        window.openSupplierDetailsModal(supId, refreshFn);
      };
    });
  };

  attachRowClicks();
};

window.openSupplierDetailsModal = function(supplierId, refreshParentFn = null) {
  const suppliers = window.getSuppliers();
  const supplier = suppliers.find(s => s.id === supplierId);
  if (!supplier) return;

  const supplierPayments = window.getPaymentsByEntity('supplier', supplierId);

  const contentHTML = `
    <div class="space-y-6">
      
      <div class="grid grid-cols-3 gap-3 p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center">
        <div>
          <span class="text-xs text-slate-400 block mb-1">إجمالي التعاملات</span>
          <span class="text-base font-bold text-white num-font">${window.formatCurrency(supplier.totalPurchases)}</span>
        </div>
        <div>
          <span class="text-xs text-slate-400 block mb-1">المسدد للمورد</span>
          <span class="text-base font-bold text-emerald-400 num-font">${window.formatCurrency(supplier.paid)}</span>
        </div>
        <div>
          <span class="text-xs text-slate-400 block mb-1">الرصيد المستحق للمورد</span>
          <span class="text-lg font-extrabold text-purple-400 num-font">${window.formatCurrency(supplier.remainingBalance)}</span>
        </div>
      </div>

      <div class="flex gap-3 pt-1 border-t border-slate-800">
        <button id="sup-modal-btn-payment" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5">
          <i data-lucide="wallet" class="w-4 h-4"></i>
          <span>تسديد دفعة للمورد</span>
        </button>
      </div>

      <div class="space-y-3">
        <h4 class="text-sm font-bold text-white flex items-center gap-2">
          <i data-lucide="receipt" class="w-4 h-4 text-purple-400"></i>
          <span>سجل المدفوعات للمورد (${supplierPayments.length})</span>
        </h4>

        <div class="bg-slate-950/40 rounded-xl border border-slate-800 overflow-hidden">
          <div class="max-h-48 overflow-y-auto">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th>رقم الإيصال</th>
                  <th>المبلغ المسدد</th>
                  <th>طريقة الدفع</th>
                  <th>الملاحظات</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${supplierPayments.length === 0 ? `
                  <tr><td colspan="5" class="text-center py-4 text-slate-500">لا توجد مدفوعات مسجلة للمورد</td></tr>
                ` : supplierPayments.map(p => `
                  <tr>
                    <td class="font-bold text-slate-400">${p.id}</td>
                    <td class="num-font font-bold text-emerald-400">${window.formatCurrency(p.amount)}</td>
                    <td>${p.paymentMethod === 'cash' ? 'نقدي' : p.paymentMethod === 'transfer' ? 'تحويل' : 'شيك'}</td>
                    <td class="text-slate-400">${p.notes || '—'}</td>
                    <td class="text-slate-400">${p.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  `;

  window.openModal({
    title: `حساب المورد / المصنع: ${supplier.name}`,
    icon: 'truck',
    contentHTML,
    maxWidth: 'max-w-3xl',
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#sup-modal-btn-payment').onclick = () => {
        closeModal();
        window.openPaymentModal({ defaultEntityType: 'supplier', defaultEntityId: supplier.id }, () => {
          if (refreshParentFn) refreshParentFn();
        });
      };
    }
  });
};

function openAddSupplierModal(refreshParentFn) {
  const contentHTML = `
    <form id="form-add-supplier" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">اسم المورد / المصنع *</label>
        <input type="text" id="add-sup-name" required placeholder="شركة... أو مصنع..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف</label>
        <input type="text" id="add-sup-phone" placeholder="01xxxxxxxxx" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-left">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">العنوان</label>
        <input type="text" id="add-sup-address" placeholder="المدينة / المنطقة" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">رصيد البداية المستحق للمورد (اختياري)</label>
        <input type="number" id="add-sup-balance" min="0" value="0" placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-purple-400 font-bold num-font">
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl">إضافة المورد</button>
      </div>
    </form>
  `;

  window.openModal({
    title: 'إضافة مورد / مصنع جديد',
    icon: 'truck',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#form-add-supplier').onsubmit = (e) => {
        e.preventDefault();
        const initBal = Number(modalEl.querySelector('#add-sup-balance').value) || 0;

        window.createSupplier({
          name: modalEl.querySelector('#add-sup-name').value,
          phone: modalEl.querySelector('#add-sup-phone').value,
          address: modalEl.querySelector('#add-sup-address').value,
          totalPurchases: initBal,
          paid: 0
        });

        window.showToast('تمت إضافة المورد بنجاح', 'success');
        closeModal();
        if (refreshParentFn) refreshParentFn();
      };
    }
  });
}

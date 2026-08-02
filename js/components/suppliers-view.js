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
          <button id="btn-add-supplier" onclick="window.openAddSupplierModal()" class="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
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
      <td class="num-font text-slate-300 font-mono">${window.formatPhonePair(s.phone, s.secondaryPhone)}</td>
      <td class="text-slate-400 text-xs whitespace-normal break-words">${window.formatAddress(s.address)}</td>
      <td class="num-font text-white font-bold">${window.formatCurrency(s.totalPurchases)}</td>
      <td class="num-font text-emerald-400 font-bold">${window.formatCurrency(s.paid)}</td>
      <td class="num-font font-extrabold ${Number(s.remainingBalance) > 0 ? 'text-purple-400' : 'text-slate-400'} text-base">
        ${window.formatCurrency(s.remainingBalance)}
      </td>
      <td>
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-pay-supplier px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1" data-supplier-id="${s.id}">
            <i data-lucide="wallet" class="w-3.5 h-3.5"></i>
            <span>تسديد دفعة</span>
          </button>
          <button class="btn-supplier-return px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 text-xs font-bold rounded-lg border border-orange-500/30 transition-all flex items-center gap-1" data-supplier-id="${s.id}">
            <i data-lucide="undo-2" class="w-3.5 h-3.5"></i>
            <span>مرتجع مشتريات</span>
          </button>
          <button class="btn-supplier-statement px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/30 transition-all flex items-center gap-1" data-supplier-id="${s.id}">
            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
            <span>كشف حساب</span>
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
    addBtn.onclick = () => window.openAddSupplierModal(null, refreshFn);
  }

  const attachActionEvents = () => {
    container.querySelectorAll('.btn-pay-supplier').forEach(btn => {
      btn.onclick = () => {
        const sId = btn.getAttribute('data-supplier-id');
        window.openPaymentModal({ defaultEntityType: 'supplier', defaultEntityId: sId }, refreshFn);
      };
    });

    container.querySelectorAll('.btn-supplier-return').forEach(btn => {
      btn.onclick = () => {
        const sId = btn.getAttribute('data-supplier-id');
        window.openSupplierReturnModal(sId, refreshFn);
      };
    });

    container.querySelectorAll('.btn-supplier-statement').forEach(btn => {
      btn.onclick = () => {
        const sId = btn.getAttribute('data-supplier-id');
        window.openSupplierStatementModal(sId);
      };
    });

    container.querySelectorAll('.btn-edit-supplier').forEach(btn => {
      btn.onclick = () => {
        const sId = btn.getAttribute('data-supplier-id');
        const supplier = window.getSupplierById(sId);
        if (supplier) window.openAddSupplierModal(supplier, refreshFn);
      };
    });
  };

  attachActionEvents();
};

window.openAddSupplierModal = function(supplierToEdit = null, refreshParentFn = null) {
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

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">رقم هاتف ثانوي (اختياري)</label>
        <input type="text" id="sup-phone-2" maxlength="11" value="${isEdit ? (supplierToEdit.secondaryPhone || '') : ''}" placeholder="01012345678" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-left num-font">
      </div>

      <!-- 3-Part Address System -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">المحافظة *</label>
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

        const secondaryRaw = modalEl.querySelector('#sup-phone-2').value;
        const secondaryValid = window.validateEgyptianPhone(secondaryRaw);
        if (secondaryRaw.trim() && !secondaryValid.isValid) {
          window.showToast(secondaryValid.message, 'error');
          return;
        }

        const gov = govSelect.value;
        const city = citySelect.value;
        const details = modalEl.querySelector('#sup-addr-details').value.trim();
        const addressCombined = details ? `${gov} - ${city} - ${details}` : `${gov} - ${city}`;

        const data = {
          name: modalEl.querySelector('#sup-name').value,
          phone: phoneValid.cleaned,
          secondaryPhone: secondaryRaw.trim() ? secondaryValid.cleaned : '',
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
          else if (window.appInstance) window.appInstance.navigateTo('suppliers');
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
};

window.openSupplierReturnModal = function(defaultSupplierId = '', refreshParentFn = null) {
  const suppliers = window.getSuppliers();
  const products = window.getProducts();

  let returnLineItems = [{
    id: Date.now(),
    productId: products[0]?.id || '',
    productName: products[0]?.name || '',
    quantity: 1,
    unitCost: products[0]?.purchasePrice || 0
  }];

  const contentHTML = `
    <form id="form-supplier-return" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">المورد / المصنع المسترجع إليه *</label>
        <select id="sret-supplier-select" required class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
          <option value="">-- اختر المورد / المصنع --</option>
          ${suppliers.map(s => `
            <option value="${s.id}" ${s.id === defaultSupplierId ? 'selected' : ''}>
              ${s.name} — الرصيد المستحق له: ${window.formatCurrency(s.remainingBalance)}
            </option>
          `).join('')}
        </select>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-xs font-bold text-slate-300">المنتجات المرتجعة للمورد *</label>
          <button type="button" id="sret-add-product-row" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>إضافة منتج</span>
          </button>
        </div>

        <div id="sret-product-rows" class="space-y-3 max-h-56 overflow-y-auto pr-1">
        </div>
      </div>

      <div class="p-3 bg-orange-950/30 rounded-xl border border-orange-800/40 flex justify-between items-center text-sm">
        <span class="text-orange-300 font-bold">إجمالي قيمة المرتجع (يخصم من المخزون والمورد):</span>
        <span id="sret-total-disp" class="text-lg font-extrabold text-orange-400 num-font">0 ج.م</span>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">نوع الاسترداد *</label>
        <select id="sret-refund-type" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs">
          <option value="debt" selected>تخفيض المديونية (خصم قيمة المرتجع من رصيد المورد آلياً)</option>
          <option value="cash">استرداد نقدي (استلام كاش من المورد + قيد استرداد بالخزينة)</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">سبب المرتجع / ملاحظات</label>
        <input type="text" id="sret-notes" placeholder="مثال: عيوب صناعة / جودة غير مطابقة للمواصفات" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" id="btn-submit-supplier-return" class="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2">
          <i data-lucide="undo-2" class="w-4 h-4"></i>
          <span>تسجيل المرتجع وخصم الكميات من المخزن</span>
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: '↩️ تسجيل مرتجع مشتريات لمورد / مصنع',
    icon: 'undo-2',
    maxWidth: 'max-w-2xl',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      const rowsContainer = modalEl.querySelector('#sret-product-rows');
      const totalDisp = modalEl.querySelector('#sret-total-disp');
      const submitBtn = modalEl.querySelector('#btn-submit-supplier-return');

      const renderReturnRows = () => {
        rowsContainer.innerHTML = returnLineItems.map((item, idx) => {
          const pObj = products.find(p => p.id === item.productId);
          return `
            <div class="return-row grid grid-cols-12 gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 items-center" data-row-index="${idx}">
              <div class="col-span-12 sm:col-span-5">
                <select class="return-product-select w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500">
                  <option value="">اختر المنتج...</option>
                  ${products.map(p => `<option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>${p.name} (المخزون: ${p.stock ?? 0})</option>`).join('')}
                </select>
              </div>
              <div class="col-span-6 sm:col-span-3">
                <input type="number" min="1" value="${item.quantity}" class="return-qty w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white num-font text-center focus:outline-none focus:border-orange-500" title="الكمية المرتجعة">
              </div>
              <div class="col-span-5 sm:col-span-3">
                <input type="number" min="0" step="0.01" value="${item.unitCost}" class="return-cost w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white num-font text-center focus:outline-none focus:border-orange-500" title="سعر الوحدة المسترجع">
              </div>
              <div class="col-span-1 flex justify-end">
                ${returnLineItems.length > 1 ? `
                  <button type="button" class="return-remove-row text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-950/40 rounded-lg transition-all">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
        if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      };

      const updateTotal = () => {
        let total = 0;
        modalEl.querySelectorAll('.return-row').forEach(row => {
          const qty = Number(row.querySelector('.return-qty').value) || 0;
          const cost = Number(row.querySelector('.return-cost').value) || 0;
          total += qty * cost;
        });
        totalDisp.textContent = window.formatCurrency(total);
        return total;
      };

      const attachRowListeners = () => {
        modalEl.querySelectorAll('.return-row').forEach(row => {
          const idx = Number(row.getAttribute('data-row-index'));
          const productSelect = row.querySelector('.return-product-select');
          const qtyInput = row.querySelector('.return-qty');
          const costInput = row.querySelector('.return-cost');
          const removeBtn = row.querySelector('.return-remove-row');

          productSelect.onchange = () => {
            const pId = productSelect.value;
            const pObj = products.find(p => p.id === pId);
            returnLineItems[idx].productId = pId;
            returnLineItems[idx].productName = pObj ? pObj.name : '';
            if (pObj) costInput.value = pObj.purchasePrice || 0;
            returnLineItems[idx].unitCost = Number(costInput.value) || 0;
            updateTotal();
          };

          qtyInput.oninput = () => {
            returnLineItems[idx].quantity = Number(qtyInput.value) || 1;
            updateTotal();
          };

          costInput.oninput = () => {
            returnLineItems[idx].unitCost = Number(costInput.value) || 0;
            updateTotal();
          };

          if (removeBtn) {
            removeBtn.onclick = () => {
              returnLineItems.splice(idx, 1);
              renderReturnRows();
              attachRowListeners();
              updateTotal();
            };
          }
        });
      };

      modalEl.querySelector('#sret-add-product-row').onclick = () => {
        returnLineItems.push({
          id: Date.now(),
          productId: products[0]?.id || '',
          productName: products[0]?.name || '',
          quantity: 1,
          unitCost: products[0]?.purchasePrice || 0
        });
        renderReturnRows();
        attachRowListeners();
        updateTotal();
      };

      renderReturnRows();
      attachRowListeners();
      updateTotal();

      modalEl.querySelector('#form-supplier-return').onsubmit = (e) => {
        e.preventDefault();

        const supplierId = modalEl.querySelector('#sret-supplier-select').value;
        if (!supplierId) {
          window.showToast('يرجى اختيار المورد / المصنع أولاً', 'error');
          return false;
        }

        const items = [];
        modalEl.querySelectorAll('.return-row').forEach(row => {
          const pid = row.querySelector('.return-product-select').value;
          const qty = Number(row.querySelector('.return-qty').value) || 0;
          const cost = Number(row.querySelector('.return-cost').value) || 0;
          if (pid && qty > 0) {
            const pObj = window.getProductById(pid);
            items.push({
              productId: pid,
              productName: pObj ? pObj.name : '',
              quantity: qty,
              unitCost: cost
            });
          }
        });

        if (items.length === 0) {
          window.showToast('يرجى إدخال منتج واحد على الأقل بكمية صحيحة أكبر من الصفر', 'error');
          return false;
        }

        if (submitBtn.disabled) return false;
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

        const supplier = window.getSupplierById(supplierId);

        try {
          const returnRecord = window.createSupplierReturn({
            supplierId,
            supplierName: supplier ? supplier.name : '',
            items,
            refundType: modalEl.querySelector('#sret-refund-type').value,
            notes: modalEl.querySelector('#sret-notes').value
          });

          window.showToast(`تم تسجيل المرتجع ${returnRecord.id} بقيمة ${window.formatCurrency(returnRecord.totalValue)} وتحديث المخزون وحساب المورد بنجاح`, 'success');
          closeModal();
          if (refreshParentFn) refreshParentFn();
          else if (window.appInstance) window.appInstance.navigateTo('suppliers');
        } catch (err) {
          window.showToast(err.message, 'error');
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      };
    }
  });
};

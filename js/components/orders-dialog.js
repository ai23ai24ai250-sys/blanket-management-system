/**
 * New Order Modal Component
 */

window.openNewOrderModal = function(onSuccessCallback = null) {
  const products = window.getProducts();
  const suppliers = window.getSuppliers();

  if (products.length === 0) {
    window.showToast('يرجى إدخال منتج واحد على الأقل في قائمة المنتجات قبل إضافة طلب جديد', 'warning');
  }

  let lineItems = [
    {
      id: Date.now(),
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 1,
      purchasePrice: products[0]?.purchasePrice || 0,
      sellingPrice: products[0]?.sellingPrice || 0,
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || ''
    }
  ];

  const renderProductRows = () => {
    return lineItems.map((item, index) => {
      const subtotal = (Number(item.quantity) || 0) * (Number(item.sellingPrice) || 0);

      return `
        <div class="product-item-row grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 items-center relative" data-row-id="${item.id}">
          
          <div class="sm:col-span-4">
            <label class="block text-[11px] font-bold text-slate-400 mb-1">المنتج *</label>
            <select class="product-select w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500">
              <option value="">اختر المنتج...</option>
              ${products.map(p => `
                <option value="${p.id}" ${p.id === item.productId ? 'selected' : ''}>
                  ${p.name} (متوفر: ${p.stock})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[11px] font-bold text-slate-400 mb-1">الكمية *</label>
            <input type="number" min="1" value="${item.quantity}" class="item-qty w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white num-font focus:outline-none focus:border-brand-500 text-center">
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[11px] font-bold text-slate-400 mb-1">سعر البيع *</label>
            <input type="number" min="0" value="${item.sellingPrice}" class="item-sell-price w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white num-font focus:outline-none focus:border-brand-500 text-center">
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[11px] font-bold text-slate-400 mb-1">المورد المصنع</label>
            <select class="supplier-select w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500">
              <option value="">(اختياري)</option>
              ${suppliers.map(s => `
                <option value="${s.id}" ${s.id === item.supplierId ? 'selected' : ''}>${s.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="sm:col-span-1 flex flex-col items-center justify-end h-full">
            ${lineItems.length > 1 ? `
              <button type="button" class="btn-remove-row text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-950/40 rounded-lg transition-all" title="حذف السطر">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>

          <div class="sm:col-span-12 flex justify-between items-center pt-2 border-t border-slate-700/40 text-xs">
            <span class="text-slate-400">سعر الشراء الاصلي: <span class="item-buy-price-disp num-font text-slate-300">${window.formatCurrency(item.purchasePrice)}</span></span>
            <span class="font-bold text-emerald-400">الإجمالي الفرعي: <span class="item-subtotal num-font font-extrabold text-sm">${window.formatCurrency(subtotal)}</span></span>
          </div>

        </div>
      `;
    }).join('');
  };

  const contentHTML = `
    <form id="form-new-order" class="space-y-6">
      
      <div class="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-brand-400 flex items-center gap-2">
            <i data-lucide="user-check" class="w-4 h-4"></i>
            <span>بيانات العميل</span>
          </h4>
          <span id="customer-status-badge" class="hidden px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
            عميل مسجل حالياً
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف * (11 رقم يبدأ بـ 0)</label>
            <input type="text" id="order-cust-phone" required placeholder="01012345678" maxlength="11" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-left transition-all">
            <p id="phone-validation-hint" class="text-[11px] text-slate-400 mt-1">يُستخدم للتحقق والربط التلقائي بحساب العميل</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">اسم العميل *</label>
            <input type="text" id="order-cust-name" required placeholder="اسم العميل الثلاثي" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">العنوان</label>
            <input type="text" id="order-cust-address" placeholder="المدينة / المنطقة / الشارع" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات العميل</label>
            <input type="text" id="order-cust-notes" placeholder="ملاحظات تسليم خاصة..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-brand-400 flex items-center gap-2">
            <i data-lucide="boxes" class="w-4 h-4"></i>
            <span>المنتجات المطلوبة</span>
          </h4>
          <button type="button" id="btn-add-product-row" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-brand-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>إضافة منتج آخر</span>
          </button>
        </div>

        <div id="product-rows-container" class="space-y-3 max-h-64 overflow-y-auto pr-1">
          ${renderProductRows()}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">الدفعة المقدمة (اختياري)</label>
          <div class="relative">
            <input type="number" id="order-down-payment" min="0" value="0" placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold num-font transition-all">
            <span class="absolute left-3 top-3 text-xs text-slate-500">ج.م</span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">حالة الطلب</label>
          <select id="order-status-select" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm transition-all">
            <option value="delivered" selected>تم التوصيل (تخصم فورياً من المخزن)</option>
            <option value="new">جديد (انتهاء الاتفاق)</option>
            <option value="completed">مكتمل النهائي</option>
          </select>
        </div>
      </div>

      <div class="bg-gradient-to-r from-slate-900 to-slate-850 p-5 rounded-2xl border border-slate-700/80 shadow-lg space-y-2">
        <div class="flex justify-between items-center text-slate-300 text-sm">
          <span>إجمالي الفاتورة:</span>
          <span id="summary-total-amount" class="text-xl font-extrabold text-white num-font">0 ج.م</span>
        </div>
        <div class="flex justify-between items-center text-slate-400 text-xs">
          <span>المدفوع مقدماً:</span>
          <span id="summary-down-payment" class="font-bold text-emerald-400 num-font">0 ج.م</span>
        </div>
        <div class="border-t border-slate-700 pt-2 flex justify-between items-center text-sm">
          <span class="font-bold text-slate-200">المبلغ المتبقي على العميل:</span>
          <span id="summary-remaining-balance" class="text-lg font-extrabold text-rose-400 num-font">0 ج.م</span>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" id="btn-cancel-order" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all">
          إلغاء
        </button>
        <button type="submit" class="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          <span>حفظ وتأكيد الطلب</span>
        </button>
      </div>

    </form>
  `;

  window.openModal({
    title: '➕ إنشاء طلب جديد / فاتورة بيع',
    icon: 'shopping-cart',
    contentHTML,
    maxWidth: 'max-w-3xl',
    onRender: (modalEl, closeModal) => {
      const phoneInput = modalEl.querySelector('#order-cust-phone');
      const nameInput = modalEl.querySelector('#order-cust-name');
      const addressInput = modalEl.querySelector('#order-cust-address');
      const notesInput = modalEl.querySelector('#order-cust-notes');
      const badgeEl = modalEl.querySelector('#customer-status-badge');
      const downPaymentInput = modalEl.querySelector('#order-down-payment');
      const statusSelect = modalEl.querySelector('#order-status-select');

      const totalDisp = modalEl.querySelector('#summary-total-amount');
      const dpDisp = modalEl.querySelector('#summary-down-payment');
      const remDisp = modalEl.querySelector('#summary-remaining-balance');

      phoneInput.addEventListener('input', () => {
        const val = phoneInput.value.trim();
        if (val.length === 11 && val.startsWith('0')) {
          const existing = window.findCustomerByPhone(val);
          if (existing) {
            nameInput.value = existing.name;
            if (existing.address) addressInput.value = existing.address;
            if (existing.notes) notesInput.value = existing.notes;
            badgeEl.classList.remove('hidden');
            window.showToast(`تم التعرف على العميل: ${existing.name}`, 'info', 2000);
          } else {
            badgeEl.classList.add('hidden');
          }
        } else {
          badgeEl.classList.add('hidden');
        }
      });

      const updateCalculations = () => {
        let total = 0;
        modalEl.querySelectorAll('.product-item-row').forEach(row => {
          const qty = Number(row.querySelector('.item-qty').value) || 0;
          const sellPrice = Number(row.querySelector('.item-sell-price').value) || 0;
          const subtotal = qty * sellPrice;
          row.querySelector('.item-subtotal').textContent = window.formatCurrency(subtotal);
          total += subtotal;
        });

        const dp = Math.min(total, Number(downPaymentInput.value) || 0);
        const rem = Math.max(0, total - dp);

        totalDisp.textContent = window.formatCurrency(total);
        dpDisp.textContent = window.formatCurrency(dp);
        remDisp.textContent = window.formatCurrency(rem);
      };

      const attachRowListeners = () => {
        modalEl.querySelectorAll('.product-item-row').forEach((row, idx) => {
          const select = row.querySelector('.product-select');
          const qtyInput = row.querySelector('.item-qty');
          const sellPriceInput = row.querySelector('.item-sell-price');
          const buyPriceDisp = row.querySelector('.item-buy-price-disp');
          const removeBtn = row.querySelector('.btn-remove-row');

          select.onchange = () => {
            const pId = select.value;
            const pObj = products.find(p => p.id === pId);
            if (pObj) {
              lineItems[idx].productId = pObj.id;
              lineItems[idx].productName = pObj.name;
              lineItems[idx].purchasePrice = pObj.purchasePrice;
              lineItems[idx].sellingPrice = pObj.sellingPrice;
              sellPriceInput.value = pObj.sellingPrice;
              buyPriceDisp.textContent = window.formatCurrency(pObj.purchasePrice);
            }
            updateCalculations();
          };

          qtyInput.oninput = () => {
            lineItems[idx].quantity = Number(qtyInput.value) || 1;
            updateCalculations();
          };

          sellPriceInput.oninput = () => {
            lineItems[idx].sellingPrice = Number(sellPriceInput.value) || 0;
            updateCalculations();
          };

          if (removeBtn) {
            removeBtn.onclick = () => {
              lineItems.splice(idx, 1);
              modalEl.querySelector('#product-rows-container').innerHTML = renderProductRows();
              if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
              attachRowListeners();
              updateCalculations();
            };
          }
        });
      };

      attachRowListeners();
      updateCalculations();

      downPaymentInput.addEventListener('input', updateCalculations);

      modalEl.querySelector('#btn-add-product-row').onclick = () => {
        lineItems.push({
          id: Date.now(),
          productId: products[0]?.id || '',
          productName: products[0]?.name || '',
          quantity: 1,
          purchasePrice: products[0]?.purchasePrice || 0,
          sellingPrice: products[0]?.sellingPrice || 0,
          supplierId: suppliers[0]?.id || '',
          supplierName: suppliers[0]?.name || ''
        });
        modalEl.querySelector('#product-rows-container').innerHTML = renderProductRows();
        if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
        attachRowListeners();
        updateCalculations();
      };

      modalEl.querySelector('#btn-cancel-order').onclick = closeModal;

      modalEl.querySelector('#form-new-order').onsubmit = (e) => {
        e.preventDefault();

        const phoneVal = phoneInput.value.trim();
        const phoneValidation = window.validateEgyptianPhone(phoneVal);
        if (!phoneValidation.isValid) {
          window.showToast(phoneValidation.message, 'error');
          return;
        }

        const validItems = lineItems.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
          window.showToast('يرجى اختيار منتج واحد على الأقل وإدخال كمية صحيحة', 'error');
          return;
        }

        try {
          const newOrder = window.createOrder({
            customerInfo: {
              name: nameInput.value,
              phone: phoneVal,
              address: addressInput.value,
              notes: notesInput.value
            },
            items: validItems,
            downPayment: Number(downPaymentInput.value) || 0,
            status: statusSelect.value
          });

          window.showToast(`تم حفظ وتأكيد الطلب رقم ${newOrder.id} بنجاح`, 'success');
          closeModal();
          if (typeof onSuccessCallback === 'function') onSuccessCallback();

        } catch (err) {
          console.error(err);
          window.showToast(err.message || 'حدث خطأ أثناء إتمام الطلب', 'error');
        }
      };

    }
  });
};

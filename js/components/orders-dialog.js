/**
 * New Order Modal Component
 * Live Stock & Deficit Indicator, Shipping Costs, Extra Expenses, Strict Down Payment Validation & Multi-click Protection
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

          <!-- Live Stock & Deficit Indicator Bar -->
          <div class="sm:col-span-12 flex justify-between items-center pt-2 border-t border-slate-700/40 text-xs">
            <span class="text-slate-400">سعر الشراء الأصلي: <span class="item-buy-price-disp num-font text-slate-300">${window.formatCurrency(item.purchasePrice)}</span></span>
            <span class="item-stock-indicator font-bold text-xs"></span>
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
            <label class="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف * (11 رقم يبدأ بـ 01)</label>
            <input type="text" id="order-cust-phone" required placeholder="01012345678" maxlength="11" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-left transition-all">
            <p id="phone-validation-hint" class="text-[11px] text-slate-400 mt-1">يُستخدم للتحقق والربط التلقائي بحساب العميل</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">اسم العميل *</label>
            <input type="text" id="order-cust-name" required placeholder="اسم العميل الثلاثي" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
          </div>
        </div>

        <!-- 3-Part Address System (مثل إضافة عميل) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">المحافظة *</label>
            <select id="order-cust-gov" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
              ${Object.keys(window.EGYPT_GOVERNORATES || {}).map(g => `<option value="${g}" ${g === 'القاهرة' ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">المدينة / المركز *</label>
            <select id="order-cust-city" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">تفاصيل العنوان / العلامة المميزة (اختياري)</label>
          <input type="text" id="order-cust-addr-details" placeholder="مثال: الشارع الرئيسي، بجوار مسجد الهدى، قرية..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات العميل</label>
          <input type="text" id="order-cust-notes" placeholder="ملاحظات تسليم خاصة..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
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

      <!-- Financial Shipping & Extra Expenses Inputs -->
      <div class="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-4">
        <h4 class="text-sm font-bold text-purple-400 flex items-center gap-2">
          <i data-lucide="truck" class="w-4 h-4"></i>
          <span>تكاليف الشحن والمصروفات الإضافية</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">تكلفة الشحن (ج.م)</label>
            <input type="number" id="order-shipping-cost" min="0" value="0" placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">الشحن على مَن؟</label>
            <select id="order-shipping-payer" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs">
              <option value="customer" selected>على العميل (يضاف للفاتورة والمديونية)</option>
              <option value="merchant">على التاجر (يخصم من صافي الربح)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">مصروفات إضافية (تغليف/نقل)</label>
            <input type="number" id="order-extra-expenses" min="0" value="0" placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 font-bold num-font">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">المصروفات الإضافية على مَن؟</label>
            <select id="order-extra-expenses-payer" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs">
              <option value="customer" selected>على العميل (يضاف للفاتورة والمديونية)</option>
              <option value="merchant">على التاجر (يخصم من صافي الربح)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">الدفعة المقدمة (اختياري)</label>
          <div class="relative">
            <input type="number" id="order-down-payment" min="0" value="0" placeholder="0" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold num-font transition-all">
            <span class="absolute left-3 top-3 text-xs text-slate-500">ج.م</span>
          </div>
          <p id="dp-validation-msg" class="text-xs font-bold text-rose-400 mt-1 hidden"></p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">حالة الطلب الإبتدائية</label>
          <select id="order-status-select" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs transition-all">
            <option value="delivered" selected>تم التوصيل / خرج للشحن (خصم الكميات فوراً من المخزن)</option>
            <option value="new">جديد / قيد الانتظار (بدون خصم من المخزون حالياً)</option>
            <option value="completed">مكتمل نهائي (تسليم وتم تحصيل الحساب)</option>
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
        <div id="summary-supplier-deficit" class="hidden border-t border-slate-800 pt-2 flex flex-col gap-1 text-[11px] font-bold text-rose-400"></div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" id="btn-cancel-order" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all">
          إلغاء
        </button>
        <button type="submit" id="btn-submit-order" class="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
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
      const govSelect = modalEl.querySelector('#order-cust-gov');
      const citySelect = modalEl.querySelector('#order-cust-city');
      const addrDetailsInput = modalEl.querySelector('#order-cust-addr-details');
      const notesInput = modalEl.querySelector('#order-cust-notes');
      const badgeEl = modalEl.querySelector('#customer-status-badge');
      
      const shippingCostInput = modalEl.querySelector('#order-shipping-cost');
      const shippingPayerSelect = modalEl.querySelector('#order-shipping-payer');
      const extraExpensesInput = modalEl.querySelector('#order-extra-expenses');
      const extraExpensesPayerSelect = modalEl.querySelector('#order-extra-expenses-payer');

      const downPaymentInput = modalEl.querySelector('#order-down-payment');
      const statusSelect = modalEl.querySelector('#order-status-select');
      const submitBtn = modalEl.querySelector('#btn-submit-order');
      const dpValidationMsg = modalEl.querySelector('#dp-validation-msg');

      const totalDisp = modalEl.querySelector('#summary-total-amount');
      const dpDisp = modalEl.querySelector('#summary-down-payment');
      const remDisp = modalEl.querySelector('#summary-remaining-balance');

      const populateCities = () => {
        const selectedGov = govSelect.value;
        const cities = window.EGYPT_GOVERNORATES[selectedGov] || [];
        citySelect.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
      };
      govSelect.onchange = populateCities;
      populateCities();

      phoneInput.addEventListener('input', () => {
        const val = phoneInput.value.trim();
        if (val.length === 11 && val.startsWith('0')) {
          const existing = window.findCustomerByPhone(val);
          if (existing) {
            nameInput.value = existing.name;
            if (existing.address) {
              const parts = window.parseAddressComponents(existing.address);
              if (parts.governorate) govSelect.value = parts.governorate;
              populateCities();
              if (parts.city) citySelect.value = parts.city;
              if (parts.details) addrDetailsInput.value = parts.details;
            }
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
        let itemsSubtotal = 0;
        const deficitGroups = {};
        modalEl.querySelectorAll('.product-item-row').forEach((row, idx) => {
          const select = row.querySelector('.product-select');
          const qtyInput = row.querySelector('.item-qty');
          const indicator = row.querySelector('.item-stock-indicator');
          
          const pObj = products.find(p => p.id === select.value);
          const qty = Number(qtyInput.value) || 0;
          const sellPrice = Number(row.querySelector('.item-sell-price').value) || 0;
          const subtotal = qty * sellPrice;
          row.querySelector('.item-subtotal').textContent = window.formatCurrency(subtotal);
          itemsSubtotal += subtotal;

          if (pObj && indicator) {
            const currentStock = Number(pObj.stock);
            if (qty > currentStock) {
              const deficit = qty - currentStock;
              indicator.innerHTML = `<span class="text-rose-400 font-bold">⚠️ عجز ${deficit} قطعة (سيتصفر المخزون ويُسجل عجز للمورد)</span>`;

              // The deficit (backorder) becomes a pending payable to the supplier
              // selected on this line (strictly the line's supplier, each ledger isolated)
              const supplierId = lineItems[idx].supplierId || '';
              const supplierName = lineItems[idx].supplierName || '';
              const costPerUnit = Number(lineItems[idx].purchasePrice) || Number(pObj.purchasePrice) || 0;
              const amount = deficit * costPerUnit;
              if (supplierId && amount > 0) {
                if (!deficitGroups[supplierId]) deficitGroups[supplierId] = { name: supplierName, units: 0, amount: 0 };
                deficitGroups[supplierId].units += deficit;
                deficitGroups[supplierId].amount += amount;
              }
            } else {
              indicator.innerHTML = `<span class="text-slate-400 font-medium">(المخزون الحالي: ${currentStock} قطعة)</span>`;
            }
          } else if (indicator) {
            indicator.innerHTML = '';
          }
        });

        // Show live supplier deficit summary
        const deficitEntries = Object.entries(deficitGroups);
        if (deficitEntries.length > 0) {
          const deficitDisp = modalEl.querySelector('#summary-supplier-deficit');
          deficitDisp.classList.remove('hidden');
          deficitDisp.innerHTML = `
            <span>⚠️ عجز مخزون (طلب مؤجل) سيُسجل كمديونية للمورد المختار:</span>
            ${deficitEntries.map(([id, d]) => `
              <div class="flex justify-between items-center">
                <span class="text-slate-300">${d.name} (${d.units} قطعة بسعر الشراء)</span>
                <span class="num-font">${window.formatCurrency(d.amount)}</span>
              </div>
            `).join('')}
          `;
        } else {
          modalEl.querySelector('#summary-supplier-deficit').classList.add('hidden');
        }

        const shipCost = Number(shippingCostInput.value) || 0;
        const shippingPayer = shippingPayerSelect.value;
        const exExpenses = Number(extraExpensesInput.value) || 0;
        const extraExpensesPayer = extraExpensesPayerSelect.value;
        const totalAmount = itemsSubtotal
          + (shippingPayer === 'customer' ? shipCost : 0)
          + (extraExpensesPayer === 'customer' ? exExpenses : 0);

        const rawDp = parseFloat(downPaymentInput.value) || 0;
        
        if (rawDp > totalAmount && totalAmount > 0) {
          dpValidationMsg.textContent = `⚠️ تنبيه: الدفعة المقدمة (${window.formatCurrency(rawDp)}) لا يمكن أن تتجاوز إجمالي الفاتورة (${window.formatCurrency(totalAmount)})`;
          dpValidationMsg.classList.remove('hidden');
        } else {
          dpValidationMsg.classList.add('hidden');
        }

        const dp = Math.min(totalAmount, rawDp);
        const rem = Math.max(0, totalAmount - dp);

        totalDisp.textContent = window.formatCurrency(totalAmount);
        dpDisp.textContent = window.formatCurrency(rawDp);
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

              // Auto-fill the row supplier with the product's default supplier
              // (the one who supplied its stock); the user can still override it.
              if (pObj.supplierId) {
                lineItems[idx].supplierId = pObj.supplierId;
                lineItems[idx].supplierName = pObj.supplierName || '';
                const supSelect = row.querySelector('.supplier-select');
                if (supSelect) supSelect.value = pObj.supplierId;
              }
            }
            updateCalculations();
          };

          const supplierSelect = row.querySelector('.supplier-select');
          if (supplierSelect) {
            supplierSelect.onchange = () => {
              const sId = supplierSelect.value;
              const sObj = suppliers.find(s => s.id === sId);
              lineItems[idx].supplierId = sId;
              lineItems[idx].supplierName = sObj ? sObj.name : '';
              updateCalculations();
            };
          }

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
      shippingCostInput.addEventListener('input', updateCalculations);
      shippingPayerSelect.addEventListener('change', updateCalculations);
      extraExpensesInput.addEventListener('input', updateCalculations);
      extraExpensesPayerSelect.addEventListener('change', updateCalculations);

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

        // 🔒 STRICT VALIDATION: Phone Number
        const phoneVal = phoneInput.value.trim();
        const phoneValidation = window.validateEgyptianPhone(phoneVal);
        if (!phoneValidation.isValid) {
          window.showToast(phoneValidation.message, 'error');
          return false;
        }

        // 🔒 STRICT VALIDATION: Valid Products & Quantity
        const validItems = lineItems.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
          window.showToast('يرجى اختيار منتج واحد على الأقل وإدخال كمية صحيحة', 'error');
          return false;
        }

        const shipCost = Number(shippingCostInput.value) || 0;
        const shippingPayer = shippingPayerSelect.value;
        const exExpenses = Number(extraExpensesInput.value) || 0;
        const extraExpensesPayer = extraExpensesPayerSelect.value;

        const itemsSubtotal = validItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.sellingPrice)), 0);
        const totalInvoiceAmount = itemsSubtotal
          + (shippingPayer === 'customer' ? shipCost : 0)
          + (extraExpensesPayer === 'customer' ? exExpenses : 0);
        const rawDownPayment = parseFloat(downPaymentInput.value) || 0;

        const gov = govSelect.value;
        const city = citySelect.value;
        const addrDetails = addrDetailsInput.value.trim();
        const addressCombined = addrDetails ? `${gov} - ${city} - ${addrDetails}` : `${gov} - ${city}`;

        if (rawDownPayment > totalInvoiceAmount) {
          window.showToast(`خطأ: الدفعة المقدمة (${window.formatCurrency(rawDownPayment)}) لا يمكن أن تتجاوز إجمالي الفاتورة (${window.formatCurrency(totalInvoiceAmount)})`, 'error');
          return false;
        }

        // 🛑 Anti-Multi-Click Protection
        if (submitBtn.disabled) return false;

        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        submitBtn.innerHTML = `
          <span class="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>جاري حفظ الطلب...</span>
        `;

        try {
          const newOrder = window.createOrder({
            customerInfo: {
              name: nameInput.value,
              phone: phoneVal,
              address: addressCombined,
              notes: notesInput.value
            },
            items: validItems,
            downPayment: rawDownPayment,
            shippingCost: shipCost,
            shippingPayer: shippingPayer,
            extraExpenses: exExpenses,
            extraExpensesPayer: extraExpensesPayer,
            status: statusSelect.value
          });

          window.showToast(`تم حفظ وتأكيد الطلب رقم ${newOrder.id} بنجاح`, 'success');
          closeModal();
          if (typeof onSuccessCallback === 'function') onSuccessCallback();

        } catch (err) {
          console.error(err);
          window.showToast(err.message || 'حدث خطأ أثناء إتمام الطلب', 'error');
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          submitBtn.innerHTML = `
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>حفظ وتأكيد الطلب</span>
          `;
          if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
        }
      };

    }
  });
};

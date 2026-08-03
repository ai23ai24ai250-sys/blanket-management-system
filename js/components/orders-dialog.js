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
                  ${p.name} (متوفر: ${p.stock ?? 0})
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

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">رقم هاتف ثانوي (اختياري)</label>
            <input type="text" id="order-cust-phone-2" maxlength="11" placeholder="01012345678" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-left transition-all">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">تصنيف العميل *</label>
            <select id="order-cust-category" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold transition-all cursor-pointer">
              ${window.CUSTOMER_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- V3.20: Saved-address dropdown for registered customers; inline manual
             entry otherwise (new customers / customers without saved addresses) -->
        <div id="registered-address-wrap" class="space-y-3 hidden">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">عنوان التوصيل (من العناوين المسجلة للعميل)</label>
            <select id="order-addr-select" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
            </select>
          </div>
          <button type="button" id="btn-add-new-address" class="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>+ إضافة عنوان جديد</span>
          </button>
          <div id="order-new-address-form" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-300 mb-1.5">اسم العنوان (اختياري)</label>
              <input type="text" id="order-new-addr-label" placeholder="المنزل / محل العمل / المخزن..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">المحافظة *</label>
              <select id="order-new-addr-gov" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
                ${Object.keys(window.EGYPT_GOVERNORATES || {}).map(g => `<option value="${g}" ${g === 'القاهرة' ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">المدينة / المركز *</label>
              <select id="order-new-addr-city" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-300 mb-1.5">تفاصيل العنوان / العلامة المميزة (اختياري)</label>
              <input type="text" id="order-new-addr-details" placeholder="مثال: الشارع الرئيسي، بجوار مسجد الهدى، قرية..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white transition-all">
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <button type="button" id="btn-save-new-address" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-all">حفظ العنوان</button>
            </div>
          </div>
        </div>

        <!-- Manual inline address (new customers or customers without saved addresses) -->
        <div id="manual-address-wrap" class="space-y-3">
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

        <label class="flex items-center gap-2.5 p-3 bg-purple-950/30 rounded-xl border border-purple-800/40 cursor-pointer transition-all select-none">
          <input type="checkbox" id="order-direct-shipping" class="w-4 h-4 accent-purple-500 shrink-0">
          <span class="text-xs font-bold text-purple-300">
            شحن مباشر من المورد (الطلب يذهب من المصنع مباشرة للعميل — لا يُخصم من مخزون المستودع، ويُسجل توريد على المورد المختار لكل منتج)
          </span>
        </label>

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

      <!-- V3.11: Deposit Type (نوع العربون) — shipping deposits are booked to the
           separate "إيراد خدمات شحن ونقل" account, outside merchandise sales/profit -->
      <div class="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <i data-lucide="coins" class="w-4 h-4 text-sky-400"></i>
            نوع العربون (الدفعة المقدمة)
          </label>
          <span class="text-[10px] font-bold text-sky-400/80 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20">إيراد خدمات شحن ونقل منفصل</span>
        </div>
        <select id="order-deposit-type" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs transition-all cursor-pointer">
          <option value="custom" selected>عربون عادي — تحدد المبلغ يدوياً (دفعة مقدمة عامة)</option>
          <option value="shipping">عربون بقيمة الشحن — تُعبأ الدفعة تلقائياً = تكلفة الشحن</option>
          <option value="shipping_extra">عربون الشحن + المصروفات الإضافية — تُعبأ تلقائياً = الشحن + التغليف</option>
        </select>
        <p id="deposit-type-hint" class="text-[11px] font-bold text-sky-400 mt-1 hidden"></p>
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
            <option value="new" selected>جديد / قيد الانتظار (بدون خصم من المخزون حالياً)</option>
            <option value="delivered">تم التوصيل / خرج للشحن (خصم الكميات فوراً من المخزن)</option>
            <option value="completed">مكتمل نهائي (تسليم وتم تحصيل الحساب كامل بالكامل)</option>
          </select>
          <p id="status-auto-settle-hint" class="text-[11px] font-bold text-emerald-400 mt-1.5 hidden">✓ "مكتمل نهائي" يعني تحصيل كامل الفاتورة: سيُسدد إجمالي الفاتورة تلقائياً (المتبقي = 0 ج.م)</p>
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
      const phone2Input = modalEl.querySelector('#order-cust-phone-2');
      const nameInput = modalEl.querySelector('#order-cust-name');
      const categorySelect = modalEl.querySelector('#order-cust-category');
      const govSelect = modalEl.querySelector('#order-cust-gov');
      const citySelect = modalEl.querySelector('#order-cust-city');
      const addrDetailsInput = modalEl.querySelector('#order-cust-addr-details');
      const notesInput = modalEl.querySelector('#order-cust-notes');
      const badgeEl = modalEl.querySelector('#customer-status-badge');

      const registeredAddressWrap = modalEl.querySelector('#registered-address-wrap');
      const manualAddressWrap = modalEl.querySelector('#manual-address-wrap');
      const addrSelect = modalEl.querySelector('#order-addr-select');
      const btnAddNewAddress = modalEl.querySelector('#btn-add-new-address');
      const newAddrForm = modalEl.querySelector('#order-new-address-form');
      const newAddrLabelInput = modalEl.querySelector('#order-new-addr-label');
      const newAddrGovSelect = modalEl.querySelector('#order-new-addr-gov');
      const newAddrCitySelect = modalEl.querySelector('#order-new-addr-city');
      const newAddrDetailsInput = modalEl.querySelector('#order-new-addr-details');
      const btnSaveNewAddress = modalEl.querySelector('#btn-save-new-address');
      let matchedCustomer = null;
      let matchedAddresses = [];
      
      const shippingCostInput = modalEl.querySelector('#order-shipping-cost');
      const shippingPayerSelect = modalEl.querySelector('#order-shipping-payer');
      const extraExpensesInput = modalEl.querySelector('#order-extra-expenses');
      const extraExpensesPayerSelect = modalEl.querySelector('#order-extra-expenses-payer');

      const downPaymentInput = modalEl.querySelector('#order-down-payment');
      const depositTypeSelect = modalEl.querySelector('#order-deposit-type');
      const depositTypeHint = modalEl.querySelector('#deposit-type-hint');
      const statusSelect = modalEl.querySelector('#order-status-select');
      const submitBtn = modalEl.querySelector('#btn-submit-order');
      const dpValidationMsg = modalEl.querySelector('#dp-validation-msg');
      const directShippingCheckbox = modalEl.querySelector('#order-direct-shipping');

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

      // V3.25 — Orders Form Lock: once a registered customer is recognized from
      // the phone, the customer identity fields (name + category) are locked
      // (read-only / disabled) so the invoice can never silently change the
      // customer's registered data. Clearing the phone or switching to an
      // unregistered number unlocks and clears the fields again.
      const setCustomerLocked = (locked) => {
        nameInput.readOnly = locked;
        nameInput.classList.toggle('opacity-60', locked);
        nameInput.classList.toggle('cursor-not-allowed', locked);
        categorySelect.disabled = locked;
        categorySelect.classList.toggle('opacity-60', locked);
        categorySelect.classList.toggle('cursor-not-allowed', locked);
      };

      const clearCustomerFields = () => {
        setCustomerLocked(false);
        matchedCustomer = null;
        matchedAddresses = [];
        badgeEl.classList.add('hidden');
        registeredAddressWrap.classList.add('hidden');
        manualAddressWrap.classList.remove('hidden');
        nameInput.value = '';
        phone2Input.value = '';
        if (categorySelect.options.length) categorySelect.selectedIndex = 0;
        notesInput.value = '';
        govSelect.selectedIndex = 0;
        populateCities();
        citySelect.selectedIndex = 0;
        addrDetailsInput.value = '';
      };

      // V3.23 — Auto-recognition works from BOTH phone fields. Typing a valid
      // 11-digit number in either field finds the customer (by primary OR
      // secondary phone), then fills BOTH fields with the customer's real
      // primary + secondary numbers (without ever duplicating the same number).
      const applyCustomerMatch = (existing) => {
        matchedCustomer = existing;
        nameInput.value = existing.name;
        const realPrimary = existing.phone ? existing.phone.trim() : '';
        const realSecondary = existing.secondaryPhone ? existing.secondaryPhone.trim() : '';
        phoneInput.value = realPrimary;
        phone2Input.value =
          (realSecondary && window.normalizePhone(realSecondary) !== window.normalizePhone(realPrimary))
            ? realSecondary : '';
        if (existing.category) categorySelect.value = existing.category;
        if (existing.notes) notesInput.value = existing.notes;
        const addresses = window.getCustomerAddresses(existing.id);
        if (addresses.length > 0) {
          manualAddressWrap.classList.add('hidden');
          registeredAddressWrap.classList.remove('hidden');
          matchedAddresses = addresses;
          const defaultIndex = addresses.findIndex(a => a.isDefault);
          const selIndex = defaultIndex >= 0 ? defaultIndex : 0;
          addrSelect.innerHTML = addresses.map((a, i) =>
            `<option value="${a.id}" ${i === selIndex ? 'selected' : ''}>${a.label ? a.label + ' — ' : ''}${a.address}${a.isDefault ? ' (الافتراضي)' : ''}</option>`
          ).join('');
          newAddrForm.classList.add('hidden');
        } else {
          registeredAddressWrap.classList.add('hidden');
          manualAddressWrap.classList.remove('hidden');
          matchedAddresses = [];
          if (existing.address) {
            const parts = window.parseAddressComponents(existing.address);
            if (parts.governorate) govSelect.value = parts.governorate;
            populateCities();
            if (parts.city) citySelect.value = parts.city;
            if (parts.details) addrDetailsInput.value = parts.details;
          }
        }
        badgeEl.classList.remove('hidden');
        setCustomerLocked(true);
        window.showToast(`تم التعرف على العميل: ${existing.name}`, 'info', 2000);
      };

      // V3.23 — Unified recognizer for both phone fields. When the number being
      // typed is a valid phone it tries to match a customer; otherwise it clears
      // any stale match (preserving V3.21 safety: a changed/cleared phone can
      // never keep a previously auto-filled identity).
      //
      // V3.26 — NEW-CUSTOMER SAFETY: typing a full (11-digit) unregistered number
      // must NEVER wipe fields the user entered manually. Only a registered match
      // (auto-fills + locks) or a deliberate clearing/change of a matched phone
      // empties the identity fields; an unregistered number for a brand-new
      // customer keeps the form intact so the user continues typing name/category/
      // notes/address with the typed number(s) still in place.
      const handleUnregisteredNumber = () => {
        if (!matchedCustomer) return; // brand-new customer: never wipe manual input
        // The previous identity was AUTO-FILLED from a registered customer — it no
        // longer belongs to this new unregistered number, so reset it completely
        // (same safe path as clearing the phone).
        clearCustomerFields();
        window.showToast('الرقم غير مسجل لعميل — استكمل إدخال بيانات العميل الجديد', 'info', 2000);
      };

      const handlePhoneAutoFill = (fromField) => {
        const typed = fromField === 'phone' ? phoneInput.value : phone2Input.value;
        const norm = window.normalizePhone ? window.normalizePhone(typed) : typed;
        if (norm.length === 11 && norm.startsWith('01')) {
          const existing = window.findCustomerByPhone(typed);
          if (existing) {
            applyCustomerMatch(existing);
          } else {
            handleUnregisteredNumber();
          }
          return;
        }
        if (matchedCustomer) {
          const expected = fromField === 'phone'
            ? (matchedCustomer.phone ? window.normalizePhone(matchedCustomer.phone) : '')
            : (matchedCustomer.secondaryPhone ? window.normalizePhone(matchedCustomer.secondaryPhone) : '');
          if (norm !== expected) {
            clearCustomerFields();
            window.showToast('تغيّر رقم الهاتف — أعد إدخال رقم العميل لتعبئة البيانات تلقائياً', 'info', 2000);
          }
        }
      };

      phoneInput.addEventListener('input', () => handlePhoneAutoFill('phone'));
      phone2Input.addEventListener('input', () => handlePhoneAutoFill('phone2'));

      const populateNewAddrCities = () => {
        const selectedGov = newAddrGovSelect.value;
        const cities = window.EGYPT_GOVERNORATES[selectedGov] || [];
        newAddrCitySelect.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
      };
      newAddrGovSelect.onchange = populateNewAddrCities;
      populateNewAddrCities();

      btnAddNewAddress.onclick = () => {
        newAddrForm.classList.toggle('hidden');
      };

      btnSaveNewAddress.onclick = () => {
        if (!matchedCustomer) {
          window.showToast('اختر العميل أولاً من رقم الهاتف', 'error');
          return;
        }
        const gov = newAddrGovSelect.value;
        const city = newAddrCitySelect.value;
        const details = newAddrDetailsInput.value.trim();
        const combined = details ? `${gov} - ${city} - ${details}` : `${gov} - ${city}`;
        try {
          const added = window.addCustomerAddress(matchedCustomer.id, { label: newAddrLabelInput.value.trim(), address: combined });
          const addresses = window.getCustomerAddresses(matchedCustomer.id);
          matchedAddresses = addresses;
          addrSelect.innerHTML = addresses.map(a =>
            `<option value="${a.id}" ${a.id === added.id ? 'selected' : ''}>${a.label ? a.label + ' — ' : ''}${a.address}${a.isDefault ? ' (الافتراضي)' : ''}</option>`
          ).join('');
          newAddrLabelInput.value = '';
          newAddrDetailsInput.value = '';
          newAddrForm.classList.add('hidden');
          window.showToast('تم حفظ العنوان الجديد بنجاح', 'success');
        } catch (err) {
          window.showToast(err.message || 'تعذر حفظ العنوان', 'error');
        }
      };

      // V3.11 — Deposit-type auto-fill & explanatory hint
      const updateDepositTypeHint = () => {
        const v = depositTypeSelect ? depositTypeSelect.value : 'custom';
        if (v === 'shipping') {
          depositTypeHint.textContent = 'سيُعبَّأ حقل الدفعة المقدمة تلقائياً بقيمة تكلفة الشحن، ويُسجَّل الجزء الخاص بالشحن في حساب «إيراد خدمات شحن ونقل» منفصلاً عن مبيعات البضاعة وصافي ربح المنتجات.';
        } else if (v === 'shipping_extra') {
          depositTypeHint.textContent = 'سيُعبَّأ حقل الدفعة المقدمة تلقائياً بقيمة الشحن + المصروفات الإضافية، ويُسجَّل جزآ الشحن والتغليف في حساب «إيراد خدمات شحن ونقل» منفصلاً عن مبيعات البضاعة وصافي ربح المنتجات.';
        } else {
          depositTypeHint.textContent = '';
        }
        if (depositTypeHint) depositTypeHint.classList.toggle('hidden', v === 'custom');
      };

      const syncDepositAutoFill = () => {
        if (!depositTypeSelect || !downPaymentInput) return;
        const v = depositTypeSelect.value;
        if (v === 'custom') return;
        const shipCost = Number(shippingCostInput.value) || 0;
        const exExp = Number(extraExpensesInput.value) || 0;
        downPaymentInput.value = v === 'shipping' ? shipCost : (shipCost + exExp);
      };

      // V3.15.3 — Lock the down-payment field when the deposit is auto-calculated
      // (عربون بقيمة الشحن / عربون الشحن + المصروفات): the amount is derived from
      // the shipping/extra inputs and must not be edited by hand. "عربون عادي" stays
      // fully editable.
      const syncDepositInputState = () => {
        if (!depositTypeSelect || !downPaymentInput) return;
        const isAuto = depositTypeSelect.value === 'shipping' || depositTypeSelect.value === 'shipping_extra';
        downPaymentInput.readOnly = isAuto;
        downPaymentInput.classList.toggle('opacity-60', isAuto);
        downPaymentInput.classList.toggle('cursor-not-allowed', isAuto);
      };

      const updateCalculations = () => {
        let itemsSubtotal = 0;
        const deficitGroups = {};
        const directShipping = directShippingCheckbox ? directShippingCheckbox.checked : false;
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
            if (directShipping) {
              indicator.innerHTML = `<span class="text-purple-400 font-bold">🚚 شحن مباشر: لن يُخصم من مخزون المستودع</span>`;
            } else if (qty > currentStock) {
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

        // Show live supplier deficit summary OR direct-shipping notice
        const deficitEntries = Object.entries(deficitGroups);
        const deficitDisp = modalEl.querySelector('#summary-supplier-deficit');
        if (directShipping) {
          deficitDisp.classList.remove('hidden');
          deficitDisp.innerHTML = `<span class="text-purple-300 font-bold">🚚 شحن مباشر من المورد: لن يُخصم أي مخزون من المستودع. ستُسجل شحنة توريد (بسعر الشراء) على المورد المختار لكل سطر.</span>`;
        } else if (deficitEntries.length > 0) {
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
          deficitDisp.classList.add('hidden');
        }

        const shipCost = Number(shippingCostInput.value) || 0;
        const shippingPayer = shippingPayerSelect.value;
        const exExpenses = Number(extraExpensesInput.value) || 0;
        const extraExpensesPayer = extraExpensesPayerSelect.value;
        const totalAmount = itemsSubtotal
          + (shippingPayer === 'customer' ? shipCost : 0)
          + (extraExpensesPayer === 'customer' ? exExpenses : 0);

        const rawDp = parseFloat(downPaymentInput.value) || 0;

        // "مكتمل نهائي (تسليم وتم تحصيل الحساب)" => يُسدد إجمالي الفاتورة تلقائياً
        const isCompletedStatus = statusSelect.value === 'completed';
        const effectiveDp = isCompletedStatus ? totalAmount : rawDp;
        if (isCompletedStatus && totalAmount > 0 && rawDp !== totalAmount) {
          downPaymentInput.value = totalAmount;
        }

        const settleHint = modalEl.querySelector('#status-auto-settle-hint');
        if (settleHint) settleHint.classList.toggle('hidden', !isCompletedStatus);

        if (effectiveDp > totalAmount && totalAmount > 0) {
          dpValidationMsg.textContent = `⚠️ تنبيه: الدفعة المقدمة (${window.formatCurrency(effectiveDp)}) لا يمكن أن تتجاوز إجمالي الفاتورة (${window.formatCurrency(totalAmount)})`;
          dpValidationMsg.classList.remove('hidden');
        } else {
          dpValidationMsg.classList.add('hidden');
        }

        const dp = Math.min(totalAmount, effectiveDp);
        const rem = Math.max(0, totalAmount - dp);

        totalDisp.textContent = window.formatCurrency(totalAmount);
        dpDisp.textContent = window.formatCurrency(effectiveDp);
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
      updateDepositTypeHint();
      syncDepositInputState();
      updateCalculations();

      if (directShippingCheckbox) {
        directShippingCheckbox.addEventListener('change', updateCalculations);
      }

      downPaymentInput.addEventListener('input', updateCalculations);
      statusSelect.addEventListener('change', () => { syncDepositAutoFill(); updateCalculations(); });
      shippingCostInput.addEventListener('input', () => { syncDepositAutoFill(); updateCalculations(); });
      shippingPayerSelect.addEventListener('change', updateCalculations);
      extraExpensesInput.addEventListener('input', () => { syncDepositAutoFill(); updateCalculations(); });
      extraExpensesPayerSelect.addEventListener('change', updateCalculations);
      if (depositTypeSelect) {
        depositTypeSelect.addEventListener('change', () => {
          updateDepositTypeHint();
          syncDepositInputState();
          syncDepositAutoFill();
          updateCalculations();
        });
      }

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

        // 🔒 STRICT VALIDATION: Optional Secondary Phone (if provided)
        const phone2Raw = phone2Input.value.trim();
        let secondaryPhone = '';
        if (phone2Raw) {
          const phone2Validation = window.validateEgyptianPhone(phone2Raw);
          if (!phone2Validation.isValid) {
            window.showToast(phone2Validation.message, 'error');
            return false;
          }
          secondaryPhone = phone2Validation.cleaned;
        }

        // 🔒 STRICT VALIDATION: Valid Products & Quantity
        const validItems = lineItems.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
          window.showToast('يرجى اختيار منتج واحد على الأقل وإدخال كمية صحيحة', 'error');
          return false;
        }

        const directShipping = directShippingCheckbox ? directShippingCheckbox.checked : false;
        if (directShipping) {
          const missingSupplier = validItems.filter(item => !item.supplierId);
          if (missingSupplier.length > 0) {
            window.showToast('للشحن المباشر من المورد يجب اختيار المورد المصنع لكل منتج', 'error');
            return false;
          }
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
        // "مكتمل نهائي" يُسدد إجمالي الفاتورة بالكامل (حماية إضافية على مستوى الواجهة)
        const finalDownPayment = (statusSelect.value === 'completed') ? totalInvoiceAmount : rawDownPayment;

        const gov = govSelect.value;
        const city = citySelect.value;
        const addrDetails = addrDetailsInput.value.trim();
        let shippingAddressId = '';
        let addressCombined = addrDetails ? `${gov} - ${city} - ${addrDetails}` : `${gov} - ${city}`;
        if (matchedCustomer && matchedAddresses.length > 0 && addrSelect.value) {
          const selectedAddr = matchedAddresses.find(a => a.id === addrSelect.value);
          if (selectedAddr) {
            shippingAddressId = selectedAddr.id;
            addressCombined = selectedAddr.address;
          }
        }

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
              secondaryPhone: secondaryPhone,
              category: categorySelect.value,
              address: addressCombined,
              addressId: shippingAddressId,
              notes: notesInput.value
            },
            items: validItems,
            downPayment: finalDownPayment,
            shippingCost: shipCost,
            shippingPayer: shippingPayer,
            extraExpenses: exExpenses,
            extraExpensesPayer: extraExpensesPayer,
            status: statusSelect.value,
            directShipping,
            depositType: depositTypeSelect ? depositTypeSelect.value : 'custom'
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

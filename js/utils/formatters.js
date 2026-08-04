/**
 * Utility Formatters & Comprehensive Egyptian Regions & 3-Part Address Helper
 */

window.EGYPT_GOVERNORATES = {
  'القاهرة': ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'التجمع الخامس', 'حلوان', 'شبرا', 'وسط البلد', 'عين شمس', 'المقطم', 'النزهة', 'الزمالك', 'المرج', 'السلام', 'الأميرية', 'الزيتون', 'الشرابية', 'روض الفرج', 'بولاق', 'باب الشعرية', 'الموسكي', 'الجمالية', 'الدرب الأحمر', 'الخليفة', 'المطرية', 'الوايلي', 'السيدة زينب', 'المعصرة', 'البساتين', 'دار السلام', 'طرة', '15 مايو', 'القطامية', 'مدينة الشروق', 'مدينة بدر', 'قصر النيل', 'الزاوية الحمراء', 'حدائق القبة'],
  'الجيزة': ['الدقي', 'المهندسين', 'الهرم', 'فيصل', '6 أكتوبر', 'الشيخ زايد', 'إمبابة', 'العجوزة', 'العياط', 'البدرشين', 'الصف', 'أطفيح', 'الواحات البحرية', 'بولاق الدكرور', 'الوراق', 'كرداسة', 'أبو النمرس', 'الحوامدية', 'منشأة القناطر', 'سقارة', 'المنصورية', 'نزلة السمان', 'المنيب', 'المريوطية', 'أوسيم'],
  'الإسكندرية': ['سموحة', 'المنتزه', 'سيدي بشر', 'العجمي', 'محرم بك', 'ستانلي', 'ميامي', 'برج العرب', 'عامرية', 'باب شرقي', 'الشاطبي', 'سيدي جابر', 'لوران', 'فيكتوريا', 'رشدي', 'سابا باشا', 'العصافرة', 'المندرة', 'سيدي كرير', 'أبو قير', 'الدخيلة', 'المنشية', 'الرمل', 'غيط العنب', 'كرموز', 'محطة الرمل', 'أنطونيادس', 'الإبراهيمية', 'الظاهرية', 'كوم الشقافة'],
  'الدقهلية': ['المنصورة', 'ميت غمر', 'طلخا', 'دكرنس', 'سنبلاوين', 'شربين', 'منزلة', 'بلقاس', 'أجا', 'بني عبيد', 'نبروه', 'تمي الأمديد', 'ميت سلسيل', 'ميت سويد', 'الجمالية', 'المنصورة الجديدة', 'محلة دمنة', 'شطا', 'ميت أبو غريب'],
  'الشرقية': ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'أبو حماد', 'فاقوس', 'منيا القمح', 'أبو كبير', 'ديرب نجم', 'الحسينية', 'أولاد صقر', 'ههيا', 'كفر صقر', 'صان الحجر', 'القرين', 'الإبراهيمية', 'مشتول السوق', 'القنايات', 'الزوامل', 'منشأة أبو عمر', 'السعادة'],
  'القليوبية': ['بنها', 'شبرا الخيمة', 'العبور', 'طوخ', 'قليوب', 'الخانكة', 'القناطر الخيرية', 'شبين القناطر', 'كفر شكر', 'الخصوص', 'بهتيم', 'مسطرد', 'القلج', 'سندنهور', 'الصفا', 'العبور'],
  'الغربية': ['طنطا', 'المحلة الكبرى', 'زفتى', 'كفر الزيات', 'سمنود', 'بسيون', 'قطور', 'السنطة', 'برما', 'كفر شبرا', 'المحلة', 'بلكيم', 'الغربية', 'شبرا الكبيرة'],
  'المنوفية': ['شبين الكوم', 'منوف', 'أشمون', 'السادات', 'قويسنا', 'تلا', 'بركة السبع', 'سرس الليان', 'الباجور', 'الشهداء', 'منشأة سلطان', 'منوف الجديدة', 'ميت برة'],
  'البحيرة': ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'أبو حمص', 'كوم حمادة', 'رشيد', 'حوش عيسى', 'إدكو', 'أبو المطامير', 'الدلنجات', 'شبراخيت', 'المحمودية', 'وادي النطرون', 'بدر', 'الرحمانية', 'نوبار', 'كفر الدوار الجديدة'],
  'كفر الشيخ': ['كفر الشيخ', 'دسوق', 'بلطيم', 'سيدي سالم', 'بيلا', 'قلين', 'الرياض', 'فوه', 'مطوبس', 'الحامول', 'كفر الشيخ الجديدة', 'مركز البرلس', 'باقوصة'],
  'الفيوم': ['الفيوم', 'سنورس', 'طامية', 'إطسا', 'أبشواي', 'يوسف الصديق', 'أهناسيا', 'شدموه', 'سيلا', 'الفيوم الجديدة', 'منشأة طلعت'],
  'بني سويف': ['بني سويف', 'الواسطى', 'ببا', 'ناصر', 'إهناسيا', 'الفشن', 'سمسطا', 'بني سويف الجديدة', 'الشريفية', 'مصر العربية'],
  'المنيا': ['المنيا', 'ملوي', 'بني مزار', 'أبو قرقاص', 'مغاغة', 'سمالوط', 'دير مواس', 'العدوة', 'مطاي', 'المنيا الجديدة', 'منها ابنوب', 'بني خالد'],
  'أسيوط': ['أسيوط', 'ديروط', 'أبو تيج', 'القوصية', 'منفلوط', 'أبنوب', 'ساحل سليم', 'البداري', 'الغنايم', 'صدفا', 'الفتح', 'أسيوط الجديدة', 'ديروط الشريف'],
  'سوهاج': ['سوهاج', 'طهطا', 'أخميم', 'جرجا', 'البلينا', 'المراغة', 'المنشأة', 'ساقلتة', 'جهينة', 'طما', 'دار السلام', 'سوهاج الجديدة', 'أخميم الجديدة'],
  'قنا': ['قنا', 'نجع حمادي', 'قوص', 'دشنا', 'أبو تشت', 'فرشوط', 'الوقف', 'نقادة', 'قفط', 'دندرة', 'قنا الجديدة', 'الكرنك الجديدة'],
  'الأقصر': ['الأقصر', 'أرمنت', 'إسنا', 'القرنة', 'الطود', 'الزينية', 'البياضية', 'البعيرات', 'الأقصر الجديدة', 'الريانية'],
  'أسوان': ['أسوان', 'كوم أمبو', 'إدفو', 'نصر النوبة', 'دراو', 'كلابشة', 'السد العالي', 'الرديسية', 'أبوسمبل', 'أسوان الجديدة', 'سبعة', 'وادي كركر'],
  'بورسعيد': ['حي الشرق', 'حي العرب', 'حي المناخ', 'حي الزهور', 'بورفؤاد', 'حي الضواحي', 'حي غرب', 'حي جنوب', 'حي الشرق', 'مدينة السلام', 'قرية بورسعيد'],
  'السويس': ['حي السويس', 'حي الأربعين', 'حي عتاقة', 'حي فيصل', 'حي الجناين', 'عرب المعمل', 'السويس الجديدة', 'كوبري أكتوبر'],
  'الإسماعيلية': ['الإسماعيلية', 'التل الكبير', 'فايد', 'القنطرة شرق', 'القنطرة غرب', 'أبو صوير', 'القصاصين', 'نفيشة', 'التمساح', 'المنايف', 'سرابيوم', 'الإسماعيلية الجديدة'],
  'دمياط': ['دمياط', 'راس البر', 'دمياط الجديدة', 'فارسكور', 'الزرقا', 'كفر سعد', 'كفر البطيخ', 'عزبة البرج', 'السرو', 'كفر ميت أبو غالب', 'دمياط القديمة'],
  'البحر الأحمر': ['الغردقة', 'سفاجا', 'القصير', 'مرسى علم', 'رأس غارب', 'الشلاتين', 'أبو رماد', 'حماطة', 'الغردقة الجديدة', 'وادي الجمال'],
  'جنوب سيناء': ['شرم الشيخ', 'دهب', 'نويبع', 'طور سيناء', 'طابا', 'رأس سدر', 'أبو زنيمة', 'سانت كاترين', 'النقب', 'أبو رديس'],
  'شمال سيناء': ['العريش', 'الشيخ زويد', 'رفح', 'بئر العبد', 'الحسنة', 'نخل', 'رمانة', 'قاطية', 'الجورة', 'العريش الجديدة'],
  'مطروح': ['مرسى مطروح', 'العلمين', 'الضبعة', 'سيوة', 'النجيلة', 'الحمام', 'رأس الحكمة', 'براني', 'السلوم', 'فوكا', 'مطروح الجديدة', 'أبيار'],
  'الوادي الجديد': ['الخارجة', 'الداخلة', 'الفرافرة', 'باريس', 'بلاط', 'موط', 'الجديدة', 'القصر', 'الشركة']
};

/* ===== Dynamic City/District helpers =====
 * F1 — a city picker that lists every city/center/markaz of the chosen
 * governorate PLUS any manually-entered custom city (persisted locally), PLUS
 * an inline manual-entry / "أخرى (إدخال يدوي)" option. Manual entries are saved
 * dynamically and offered again in future pickers.
 */
window.CITY_CUSTOM_STORAGE_KEY = 'city_custom_entries';

window.getCustomCities = function(governorate) {
  try {
    const raw = localStorage.getItem(window.CITY_CUSTOM_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    if (governorate) return (all[governorate] || []).filter(Boolean);
    return all;
  } catch (e) {
    return governorate ? [] : {};
  }
};

window.addCustomCity = function(governorate, city) {
  const g = String(governorate || '').trim();
  const c = String(city || '').trim();
  if (!g || !c) return false;
  const base = window.EGYPT_GOVERNORATES[g] || [];
  if (base.includes(c) || window.getCustomCities(g).includes(c)) return false;
  const all = window.getCustomCities();
  all[g] = all[g] || [];
  all[g].push(c);
  try { localStorage.setItem(window.CITY_CUSTOM_STORAGE_KEY, JSON.stringify(all)); } catch (e) { /* storage full */ }
  return true;
};

window.getCitiesForGovernorate = function(governorate) {
  const base = window.EGYPT_GOVERNORATES[governorate] || [];
  const custom = window.getCustomCities(governorate);
  if (!custom.length) return base;
  return base.concat(custom.filter(c => !base.includes(c)));
};

window.citySelectOptions = function(governorate, selectedCity) {
  const cities = window.getCitiesForGovernorate(governorate);
  let html = '<option value="">اختر المدينة / المركز</option>';
  cities.forEach(c => {
    html += `<option value="${String(c).replace(/"/g, '&quot;')}"${c === selectedCity ? ' selected' : ''}>${c}</option>`;
  });
  html += `<option value="__other__"${selectedCity && !cities.includes(selectedCity) ? ' selected' : ''}>أخرى (إدخال يدوي)...</option>`;
  return html;
};

/* Binds a governorate select to a city select and an optional manual-city input.
 * - when the governorate changes, the city list is rebuilt (incl. custom cities).
 * - when "أخرى (إدخال يدوي)..." is picked, a text input appears for free text;
 *   on change it is saved via addCustomCity so it shows up next time.
 * - options: { governorateSelect, citySelect, manualInput, onCityChange }
 */
window.setupCitySelect = function(opts) {
  const govSel = opts.governorateSelect;
  const citySel = opts.citySelect;
  const manualInput = opts.manualInput;
  if (!govSel || !citySel) return;

  const refreshCities = (governorate, selectedCity) => {
    const gov = governorate || govSel.value || '';
    citySel.innerHTML = window.citySelectOptions(gov, selectedCity);
  };

  govSel.addEventListener('change', () => {
    refreshCities(govSel.value, '');
    if (manualInput) {
      manualInput.value = '';
      manualInput.style.display = 'none';
    }
    if (opts.onCityChange) opts.onCityChange('', citySel.value);
  });

  citySel.addEventListener('change', () => {
    const isOther = citySel.value === '__other__';
    if (manualInput) {
      manualInput.style.display = isOther ? 'block' : 'none';
      if (!isOther) manualInput.value = '';
    }
    if (!isOther) {
      const city = window.getCitiesForGovernorate(govSel.value).includes(citySel.value) ? citySel.value : '';
      if (opts.onCityChange) opts.onCityChange(city, citySel.value);
    }
  });

  if (manualInput) {
    manualInput.style.display = 'none';
    manualInput.addEventListener('change', () => {
      const val = manualInput.value.trim();
      if (!val) return;
      window.addCustomCity(govSel.value, val);
      const saved = window.getCitiesForGovernorate(govSel.value);
      citySel.innerHTML = window.citySelectOptions(govSel.value, val);
      if (opts.onCityChange) opts.onCityChange(val, citySel.value);
    });
  }
};

/* reads the effective city from a citySelect + manualInput pair */
window.getEffectiveCity = function(citySelect, manualInput) {
  if (!citySelect) return '';
  const manualVal = manualInput ? manualInput.value.trim() : '';
  if (citySelect.value === '__other__') return manualVal;
  return citySelect.value;
};

window.formatCurrency = function(amount) {
  const r = Math.round((Number(amount) || 0) * 100) / 100;
  const hasFraction = r % 1 !== 0;
  const nf = new Intl.NumberFormat('ar-EG', hasFraction
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { maximumFractionDigits: 0 });
  return nf.format(r) + ' ج.م';
};

/**
 * V3.15 — Unified ISO/Standard display timestamp across ALL screens
 * (Orders, Payments, Dashboard, Statements): YYYY-MM-DD HH:mm.
 * Identical to the format the Google Sheets export writes, so what you see on
 * screen always matches what is stored/exported (no locale/numeral drift).
 */
window.formatDate = function(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return String(isoString);
    const p = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
  } catch (e) {
    return String(isoString);
  }
};

/**
 * V3.15 — NaN-immunity for all aggregation math.
 * undefined / null / '' / NaN / '   ' all collapse to 0 so a financial
 * aggregate can NEVER produce NaN or undefined (works with sheet-imported rows).
 */
window.toNumber = function(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/**
 * V3.16.1 — Unified money-rounding helper (banker-safe for EGP).
 * Every place a money value is COMPUTED from arithmetic (qty × price,
 * totals − payments, sums of floats) MUST round through here so a float like
 * 2000.0000000001 can never persist to Firestore or export to Google Sheets.
 * Math.round((v + Number.EPSILON) * 100) / 100 is the standard precision fix.
 */
window.round2 = function(v) {
  const n = Number(v);
  if (isNaN(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/**
 * V3.15 — Composite phone display helper (Fallback):
 *   primary + secondary → "0101xxxx / 0102xxxx"
 *   primary only        → "0101xxxx"
 *   neither             → "—"
 * Used by customers, suppliers, orders, reports & dashboard tables.
 */
window.formatPhonePair = function(primary, secondary) {
  const p = String(primary || '').trim();
  const s = String(secondary || '').trim();
  if (p) return s ? p + ' / ' + s : p;
  return s || '—';
};

/**
 * V3.15 — Full address display helper: never truncates, collapses empty to '—'.
 */
window.formatAddress = function(address) {
  const s = String(address || '').trim();
  return s || '—';
};

/**
 * Precise banking-style timestamp formatter: YYYY-MM-DD HH:mm:ss
 * Used by statements of account (كشوف الحساب) for exact transaction times.
 */
window.formatDateTime = function(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  } catch (e) {
    return isoString;
  }
};

/**
 * Cairo (Africa/Cairo) local timestamp formatter: YYYY-MM-DD HH:mm
 * Central helper so all stored timestamps (payments, orders, sheets sync)
 * use Egypt local time instead of ISO-UTC.
 */
window.getCairoFormattedDate = function(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch (e) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
};

window.generateAutoId = function(prefix = 'ID') {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

/**
 * V3.21 — Phone Normalization for robust lookups.
 * Strips spaces, dashes, parentheses and maps any country-code spelling
 * (+20… / 0020…) to the local 11-digit form (0…), so a customer or supplier
 * can be found regardless of how the number was typed or stored.
 */
window.normalizePhone = function(phone) {
  if (!phone) return '';
  let s = String(phone).replace(/[^\d+]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('00')) s = s.slice(2);
  if (s.startsWith('20') && s.length === 12) s = '0' + s.slice(2);
  return s;
};

/**
 * Strict Phone Number Validation (Egyptian Mobile Format)
 */
window.validateEgyptianPhone = function(phone) {
  if (!phone) return { isValid: false, message: 'يرجى إدخال رقم الهاتف' };
  const cleaned = phone.trim();
  const isValid = /^01[0125]\d{8}$/.test(cleaned);
  if (!isValid) {
    return {
      isValid: false,
      message: 'يرجى إدخال رقم هاتف صحيح يتكون من 11 رقماً يبدأ بـ 01 (مثال: 01012345678)'
    };
  }
  return { isValid: true, cleaned };
};

/**
 * V3.8 — Fulfilled-status helper.
 * Only orders that actually shipped/counted as sales are "fulfilled":
 *   delivered (تم التوصيل) and completed (مكتمل). Pending ('new' / قيد الانتظار)
 *   orders are NOT revenue yet and are excluded from sales & profit math.
 */
window.isFulfilledOrderStatus = function(status) {
  return status === 'delivered' || status === 'completed';
};

/**
 * V3.8 — Shared human-readable status label (used by dashboard, reports, Excel).
 * Differentiates ملغي (cancelled pre-shipping) from مرتجع (returned post-shipping).
 */
window.getOrderStatusLabel = function(status) {
  switch (status) {
    case 'delivered': return 'تم التوصيل';
    case 'completed': return 'مكتمل';
    case 'returned': return 'مرتجع';
    case 'cancelled': return 'ملغي';
    case 'new':
    default: return 'قيد الانتظار';
  }
};

/**
 * V3.15 — Unified Financial Engine (Dashboard + Reports + Statements use this).
 *
 * Single source of truth for every money figure, with these identities:
 *   Order Total       = itemsSubtotal + (shipping if payer 'customer') + (extra if payer 'customer')
 *   Gross Sales       = Σ(itemsSubtotal) + Σ(customer-paid shipping) + Σ(customer-paid extra)
 *                     = Σ(order totals)  → ALWAYS equals إجمالي الفواتير (no 1,000₴ drift).
 *   Merchant Expenses = Σ(shipping if payer 'merchant') + Σ(extra if payer 'merchant')
 *                     (the single bucket "مصاريف الشحن والتشغيل للتاجر").
 *   Gross Profit      = Gross Sales − COGS − Merchant Expenses
 *                       (additive informational metric; includes client-pass-through)
 *   Net Profit        = (Items Sales − COGS − Merchant Expenses)
 *                       − Operational Expenses + Retained-Deposit Income
 *   ⚠ Net Profit deliberately keeps its historical merchandise base: client-paid
 *   shipping/extra are collected for carriers and never count as store profit,
 *   so it stays items-based even though إجمالي المبيعات/Gross Sales equal the
 *   invoice totals.
 *
 * V3.8: Sales & Net Profit include ONLY fulfilled orders (delivered/completed).
 *   - Pending ('new') orders are excluded (not yet shipped).
 *   - Returned (مرتجع) orders: goods reverted, but the merchant's shipping/fees
 *     WERE actually incurred → still deducted as delivery expenses.
 *   - Cancelled (ملغي) orders: never shipped → shipping cost $0, never deducted.
 */
window.calculateNetProfit = function(orders) {
  const fulfilledOrders = orders.filter(o => window.isFulfilledOrderStatus(o.status));
  const toNum = window.toNumber;

  // Merchandise selling price ONLY (profit base). Shipping/extra fees paid by the
  // client are collected on behalf of carriers/delivery services and MUST NOT be
  // counted as store profit, so they are excluded from the profit base.
  const itemsSales = fulfilledOrders.reduce((sum, o) => {
    const itemsSubtotal = toNum(o.itemsSubtotal)
      || (o.items || []).reduce((s, i) => s + (toNum(i.sellingPrice) * toNum(i.quantity)), 0);
    return sum + itemsSubtotal;
  }, 0);

  // Grand invoice totals (items + any shipping/fees the CLIENT pays) — display only.
  // Gross Sales identity: items + customer-paid shipping + customer-paid extra.
  const customerShippingTotal = fulfilledOrders.reduce((sum, o) => sum + (o.shippingPayer === 'customer' ? toNum(o.shippingCost) : 0), 0);
  const customerExtraExpensesTotal = fulfilledOrders.reduce((sum, o) => sum + (o.extraExpensesPayer === 'customer' ? toNum(o.extraExpenses) : 0), 0);
  const grossSales = itemsSales + customerShippingTotal + customerExtraExpensesTotal;
  const totalSales = fulfilledOrders.reduce((sum, o) => sum + toNum(o.totalAmount), 0);

  const cogs = fulfilledOrders.reduce((totalCogs, order) => {
    const orderCogs = (order.items || []).reduce((itemSum, item) => {
      return itemSum + (toNum(item.purchasePrice) * toNum(item.quantity));
    }, 0);
    return totalCogs + orderCogs;
  }, 0);

  // V3.8: Deduct shipping/fees only for orders that actually SHIPPED
  // (fulfilled + returned). Returned orders incurred real delivery costs.
  // Cancelled orders never shipped → their shipping cost is $0.
  const shippedOrders = orders.filter(o => window.isFulfilledOrderStatus(o.status) || o.status === 'returned');

  const merchantShippingTotal = shippedOrders.reduce((sum, o) => sum + (o.shippingPayer === 'merchant' ? toNum(o.shippingCost) : 0), 0);
  // Extra expenses are only a merchant cost when the merchant pays them.
  // When the customer pays (extraExpensesPayer === 'customer', the default), they are already
  // included in totalAmount => totalSales, so the merchant breaks even and they are NOT deducted.
  const merchantExtraExpensesTotal = shippedOrders.reduce((sum, o) => sum + (o.extraExpensesPayer === 'merchant' ? toNum(o.extraExpenses) : 0), 0);
  // Unified single bucket: "مصاريف الشحن والتشغيل للتاجر".
  const merchantExpenses = merchantShippingTotal + merchantExtraExpensesTotal;

  const expenses = window.getExpenses ? window.getExpenses() : [];
  // F2 — recurring (monthly) expenses auto-deduct once their due day has passed
  // in the current month; one-time expenses always count. Falls back to the raw
  // all-time sum for legacy rows / missing helpers (identical for non-recurring).
  const totalOpExpenses = (window.getCurrentOperatingExpenses
    ? window.getCurrentOperatingExpenses().total
    : expenses.reduce((sum, e) => sum + toNum(e.amount), 0));

  // V3.4 + V3.10: Retained deposits from CANCELLED and RETURNED orders count as
  // operational shipping/processing income. Only new-style cancellations/returns
  // persist retainedDeposit (= downPayment − refundedAmount); legacy orders
  // (which auto-refunded the whole deposit) contribute nothing.
  // V3.11: any portion of that retained deposit which was DESIGNATED as a
  // shipping/packaging deposit (depositType 'shipping'/'shipping_extra') is
  // booked to the separate "إيراد خدمات شحن ونقل" account and is therefore
  // EXCLUDED here so it is never double-counted into product net profit.
  const retainedDepositIncome = orders
    .filter(o => (o.status === 'cancelled' || o.status === 'returned') && typeof o.retainedDeposit === 'number')
    .reduce((sum, o) => sum + (Math.max(0, toNum(o.retainedDeposit)) - window.getOrderRetainedShippingDeposit(o)), 0);

  // V3.11 — Shipping & Packaging Revenue (إيراد خدمات شحن ونقل): the portion of
  // deposits designated to shipping/packaging services, counted for EVERY order
  // status (including قيد الانتظار pending orders) because their deposits have
  // already entered the treasury. Kept outside merchandise sales and product net
  // profit; reported as a separate line in reports & dashboard.
  const shippingRevenueIncome = orders.reduce((sum, o) => sum + window.getOrderShippingRevenue(o), 0);

  // Gross Profit (additive, display-only): the spec identity
  // "Gross Sales − COGS − Merchant Expenses".
  const grossProfit = grossSales - cogs - merchantExpenses;
  // V3.15 — Net Profit keeps its tested semantics: the merchandise profit base
  // ONLY (customer-paid shipping/extra are collected for carriers and never
  // counted as store profit), minus merchant expenses, minus operational/admin
  // expenses, plus retained-deposit income.
  //
  // V3.19 — Recovered supplier cash refunds (المردودات المستردة فعلياً): cash
  // actually received BACK from suppliers for returned goods (refundType 'cash')
  // is real recovered money for the store and is ADDED to net profit. Debt-only
  // returns ('debt') merely settle the supplier ledger and add nothing here.
  const supplierCashRefunds = (window.getSupplierReturns ? window.getSupplierReturns() : [])
    .filter(r => r.refundType === 'cash')
    .reduce((sum, r) => sum + toNum(r.totalValue), 0);

  const netProfit = (itemsSales - cogs) - merchantExpenses - totalOpExpenses + retainedDepositIncome + supplierCashRefunds;

  return {
    totalSales: window.round2(totalSales),
    grossSales: window.round2(grossSales),
    itemsSales: window.round2(itemsSales),
    customerShippingTotal: window.round2(customerShippingTotal),
    customerExtraExpensesTotal: window.round2(customerExtraExpensesTotal),
    cogs: window.round2(cogs),
    merchantShippingTotal: window.round2(merchantShippingTotal),
    merchantExtraExpensesTotal: window.round2(merchantExtraExpensesTotal),
    merchantExpenses: window.round2(merchantExpenses),
    grossProfit: window.round2(grossProfit),
    totalOpExpenses: window.round2(totalOpExpenses),
    retainedDepositIncome: window.round2(retainedDepositIncome),
    shippingRevenueIncome: window.round2(shippingRevenueIncome),
    supplierCashRefunds: window.round2(supplierCashRefunds),
    netProfit: window.round2(netProfit)
  };
};

/**
 * V3.11 — Deposit-type helpers (أنواع العربون).
 *   'shipping'        عربون بقيمة الشحن             → deposit = shipping cost
 *   'shipping_extra'  عربون الشحن + المصروفات       → deposit = shipping cost + extra expenses
 *   'custom' / legacy عربون عادي                    → plain deposit, no service designation
 */

/**
 * Compute the portion of a down payment designated to the "إيراد خدمات شحن ونقل"
 * (Shipping & Packaging Revenue) account. Only services the CUSTOMER actually pays
 * for count (the merchant's own shipping/extra costs are expenses, not revenue).
 * The designated portion can never exceed the deposit actually collected.
 */
window.computeShippingRevenueDeposit = function(depositType, downPayment, shippingCost, extraExpenses, shippingPayer, extraExpensesPayer) {
  const dp = Math.max(0, Number(downPayment) || 0);
  if (dp <= 0) return 0;
  let services = 0;
  if (depositType === 'shipping') {
    services = shippingPayer === 'customer' ? (Number(shippingCost) || 0) : 0;
  } else if (depositType === 'shipping_extra') {
    services = (shippingPayer === 'customer' ? (Number(shippingCost) || 0) : 0)
      + (extraExpensesPayer === 'customer' ? (Number(extraExpenses) || 0) : 0);
  } else {
    return 0;
  }
  return Math.max(0, Math.min(dp, services));
};

/**
 * Shipping & Packaging revenue recognized from an order (إيراد خدمات شحن ونقل).
 * Counts the designated deposit portion ACTUALLY collected in cash — i.e.
 * shippingRevenueDeposit minus whatever was refunded back to the customer.
 * This is status-independent: deposits of قيد الانتظار (pending) orders have
 * already entered the treasury, so they count immediately, exactly like
 * delivered/completed/returned/cancelled orders.
 */
window.getOrderShippingRevenue = function(order) {
  const base = Number(order.shippingRevenueDeposit) || 0;
  if (!base) return 0;
  return Math.max(0, base - (Number(order.refundedAmount) || 0));
};

/**
 * Retained shipping/packaging portion of a cancelled/returned deposit that stays
 * in the "إيراد خدمات شحن ونقل" account (refunds deplete the designated part first).
 */
window.getOrderRetainedShippingDeposit = function(order) {
  if (order.status !== 'cancelled' && order.status !== 'returned') return 0;
  const base = Number(order.shippingRevenueDeposit) || 0;
  if (!base) return 0;
  return Math.max(0, base - (Number(order.refundedAmount) || 0));
};

/**
 * V3.16 — Single source of truth for "المتبقي على العميل" (order-level debt).
 * Cancelled (ملغي) and returned (مرتجع) orders are settled invoices — their
 * outstanding balance is ALWAYS zero, so they can never pollute the debt cards
 * or the "المتبقي" column. Only ACTIVE orders (new/delivered/completed) carry
 * a remaining balance: Math.max(0, totalAmount − collected down payment).
 */
window.getOrderRemainingAmount = function(order) {
  if (!order) return 0;
  if (order.status === 'cancelled' || order.status === 'returned') return 0;
  return window.round2(Math.max(0, (Number(order.totalAmount) || 0) - (Number(order.downPayment) || 0)));
};

/**
 * V3.16 — An order is "active" (carries debt / counts toward receivables) when
 * it has NOT been cancelled or returned. Completed orders are active but always
 * contribute 0 (auto-settled), which keeps Σ remaining identical.
 */
window.isActiveOrderStatus = function(status) {
  return status !== 'cancelled' && status !== 'returned';
};

/**
 * Parse combined 3-part address string into components
 */
window.parseAddressComponents = function(fullAddressStr) {
  const defaultGov = 'القاهرة';
  const defaultCity = window.EGYPT_GOVERNORATES['القاهرة'][0];
  if (!fullAddressStr) return { governorate: defaultGov, city: defaultCity, details: '' };

  const parts = fullAddressStr.split(' - ');
  if (parts.length >= 2 && window.EGYPT_GOVERNORATES[parts[0]]) {
    return {
      governorate: parts[0],
      city: parts[1],
      details: parts.slice(2).join(' - ')
    };
  }
  return { governorate: defaultGov, city: defaultCity, details: fullAddressStr };
};

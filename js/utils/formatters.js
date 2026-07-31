/**
 * Utility Formatters & Comprehensive Egyptian Regions & 3-Part Address Helper
 */

window.EGYPT_GOVERNORATES = {
  'القاهرة': ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'التجمع الخامس', 'حلوان', 'شبرا', 'وسط البلد', 'عين شمس', 'المقطم', 'النزهة', 'الزمالك', 'المرج'],
  'الجيزة': ['الدقي', 'المهندسين', 'الهرم', 'فيصل', '6 أكتوبر', 'الشيخ زايد', 'إمبابة', 'العجوزة', 'العياط', 'البدرشين', 'الصف'],
  'الإسكندرية': ['سموحة', 'المنتزه', 'سيدي بشر', 'العجمي', 'محرم بك', 'ستانلي', 'ميامي', 'برج العرب', 'عامرية'],
  'الدقهلية': ['المنصورة', 'ميت غمر', 'طلخا', 'دكرنس', 'سنبلاوين', 'شربين', 'منزلة', 'بلقاس'],
  'الشرقية': ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'أبو حماد', 'فاقوس', 'منيا القمح', 'أبو كبير', 'ديرب نجم'],
  'القليوبية': ['بنها', 'شبرا الخيمة', 'العبور', 'طوخ', 'قليوب', 'الخانكة', 'القناطر الخيرية'],
  'الغربية': ['طنطا', 'المحلة الكبرى', 'زفتى', 'كفر الزيات', 'سمنود', 'بسيون'],
  'المنوفية': ['شبين الكوم', 'منوف', 'أشمون', 'السادات', 'قويسنا', 'تلا', 'بركة السبع'],
  'البحيرة': ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'أبو حمص', 'كوم حمادة', 'رشيد', 'حوش عيسى'],
  'كفر الشيخ': ['كفر الشيخ', 'دسوق', 'بلطيم', 'سيدي سالم', 'بيلا', 'قلين'],
  'الفيوم': ['الفيوم', 'سنورس', 'طامية', 'إطسا', 'أبشواي'],
  'بني سويف': ['بني سويف', 'الواسطى', 'ببا', 'ناصر', 'اهناسيا', 'الفشن'],
  'المنيا': ['المنيا', 'ملوي', 'بني مزار', 'أبو قرقاص', 'مغاعة', 'سمالوط'],
  'أسيوط': ['أسيوط', 'ديروط', 'أبو تيج', 'القوصية', 'منفلوط', 'أبنوب'],
  'سوهاج': ['سوهاج', 'طهطا', 'أخميم', 'جرجا', 'البلينا', 'المراغة'],
  'قنا': ['قنا', 'نجع حمادي', 'قوص', 'دشنا', 'أبو تشت'],
  'الأقصر': ['الأقصر', 'أرمنت', 'إسنا', 'القرنة'],
  'أسوان': ['أسوان', 'كوم أمبو', 'إدفو', 'نصر النوبة'],
  'بورسعيد': ['حي الشرق', 'حي العرب', 'حي المناخ', 'حي الزهور', 'بورفؤاد'],
  'السويس': ['حي السويس', 'حي الأربعين', 'حي عتاقة', 'حي الفيصل'],
  'الإسماعيلية': ['الإسماعيلية', 'التل الكبير', 'فايد', 'القنطرة شرق', 'القنطرة غرب'],
  'دمياط': ['دمياط', 'راس البر', 'دمياط الجديدة', 'فارسكور', 'الزرقا'],
  'البحر الأحمر': ['الغردقة', 'سفاجا', 'القصير', 'مرسى علم', 'رأس غارب'],
  'جنوب سيناء': ['شرم الشيخ', 'دهب', 'نويبع', 'طور سيناء', 'طابا'],
  'شمال سيناء': ['العريش', 'الشيخ زويد', 'رفح', 'بئر العبد'],
  'مطروح': ['مرسى مطروح', 'العلمين', 'الضبعة', 'سيوة'],
  'الوادي الجديد': ['الخارجة', 'الداخلة', 'الفرافرة']
};

window.formatCurrency = function(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2
  }).format(num);
};

window.formatDate = function(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return isoString;
  }
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

window.generateAutoId = function(prefix = 'ID') {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
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
 * Shared Net Profit Calculation
 * Used by Dashboard & Reports to avoid duplication
 */
window.calculateNetProfit = function(orders) {
  const validOrders = orders.filter(o => o.status !== 'returned' && o.status !== 'cancelled');

  // Grand invoice totals (items + any shipping/fees the CLIENT pays) — display only.
  const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Merchandise selling price ONLY (profit base). Shipping/extra fees paid by the
  // client are collected on behalf of carriers/delivery services and MUST NOT be
  // counted as store profit, so they are excluded from the profit base.
  const itemsSales = validOrders.reduce((sum, o) => {
    const itemsSubtotal = Number(o.itemsSubtotal)
      || (o.items || []).reduce((s, i) => s + ((Number(i.sellingPrice) || 0) * (Number(i.quantity) || 0)), 0);
    return sum + itemsSubtotal;
  }, 0);

  const cogs = validOrders.reduce((totalCogs, order) => {
    const orderCogs = (order.items || []).reduce((itemSum, item) => {
      return itemSum + ((Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0));
    }, 0);
    return totalCogs + orderCogs;
  }, 0);

  const merchantShippingTotal = validOrders.reduce((sum, o) => sum + (o.shippingPayer === 'merchant' ? (Number(o.shippingCost) || 0) : 0), 0);
  // Extra expenses are only a merchant cost when the merchant pays them.
  // When the customer pays (extraExpensesPayer === 'customer', the default), they are already
  // included in totalAmount => totalSales, so the merchant breaks even and they are NOT deducted.
  const merchantExtraExpensesTotal = validOrders.reduce((sum, o) => sum + (o.extraExpensesPayer === 'merchant' ? (Number(o.extraExpenses) || 0) : 0), 0);

  const expenses = window.getExpenses ? window.getExpenses() : [];
  const totalOpExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // V3.4: Retained deposits from CANCELLED orders count as operational
  // shipping/processing income. Only new-style cancellations persist
  // retainedDeposit (= downPayment − refundedAmount); legacy cancelled orders
  // (which auto-refunded the whole deposit) contribute nothing.
  const retainedDepositIncome = orders
    .filter(o => o.status === 'cancelled' && typeof o.retainedDeposit === 'number')
    .reduce((sum, o) => sum + Math.max(0, Number(o.retainedDeposit) || 0), 0);

  const netProfit = (itemsSales - cogs) - merchantShippingTotal - merchantExtraExpensesTotal - totalOpExpenses + retainedDepositIncome;

  return { totalSales, itemsSales, cogs, merchantShippingTotal, merchantExtraExpensesTotal, totalOpExpenses, retainedDepositIncome, netProfit };
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

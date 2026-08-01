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
 * Shared Net Profit Calculation
 * Used by Dashboard & Reports to avoid duplication
 * V3.8: Sales & Net Profit include ONLY fulfilled orders (delivered/completed).
 *   - Pending ('new') orders are excluded (not yet shipped).
 *   - Returned (مرتجع) orders: goods reverted, but the merchant's shipping/fees
 *     WERE actually incurred → still deducted as delivery expenses.
 *   - Cancelled (ملغي) orders: never shipped → shipping cost $0, never deducted.
 */
window.calculateNetProfit = function(orders) {
  const fulfilledOrders = orders.filter(o => window.isFulfilledOrderStatus(o.status));

  // Grand invoice totals (items + any shipping/fees the CLIENT pays) — display only.
  const totalSales = fulfilledOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Merchandise selling price ONLY (profit base). Shipping/extra fees paid by the
  // client are collected on behalf of carriers/delivery services and MUST NOT be
  // counted as store profit, so they are excluded from the profit base.
  const itemsSales = fulfilledOrders.reduce((sum, o) => {
    const itemsSubtotal = Number(o.itemsSubtotal)
      || (o.items || []).reduce((s, i) => s + ((Number(i.sellingPrice) || 0) * (Number(i.quantity) || 0)), 0);
    return sum + itemsSubtotal;
  }, 0);

  const cogs = fulfilledOrders.reduce((totalCogs, order) => {
    const orderCogs = (order.items || []).reduce((itemSum, item) => {
      return itemSum + ((Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0));
    }, 0);
    return totalCogs + orderCogs;
  }, 0);

  // V3.8: Deduct shipping/fees only for orders that actually SHIPPED
  // (fulfilled + returned). Returned orders incurred real delivery costs.
  // Cancelled orders never shipped → their shipping cost is $0.
  const shippedOrders = orders.filter(o => window.isFulfilledOrderStatus(o.status) || o.status === 'returned');

  const merchantShippingTotal = shippedOrders.reduce((sum, o) => sum + (o.shippingPayer === 'merchant' ? (Number(o.shippingCost) || 0) : 0), 0);
  // Extra expenses are only a merchant cost when the merchant pays them.
  // When the customer pays (extraExpensesPayer === 'customer', the default), they are already
  // included in totalAmount => totalSales, so the merchant breaks even and they are NOT deducted.
  const merchantExtraExpensesTotal = shippedOrders.reduce((sum, o) => sum + (o.extraExpensesPayer === 'merchant' ? (Number(o.extraExpenses) || 0) : 0), 0);

  const expenses = window.getExpenses ? window.getExpenses() : [];
  const totalOpExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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
    .reduce((sum, o) => sum + (Math.max(0, Number(o.retainedDeposit) || 0) - window.getOrderRetainedShippingDeposit(o)), 0);

  // V3.11 — Shipping & Packaging Revenue (إيراد خدمات شحن ونقل): the portion of
  // deposits designated to shipping/packaging services, counted for EVERY order
  // status (including قيد الانتظار pending orders) because their deposits have
  // already entered the treasury. Kept outside merchandise sales and product net
  // profit; reported as a separate line in reports & dashboard.
  const shippingRevenueIncome = orders.reduce((sum, o) => sum + window.getOrderShippingRevenue(o), 0);

  const netProfit = (itemsSales - cogs) - merchantShippingTotal - merchantExtraExpensesTotal - totalOpExpenses + retainedDepositIncome;

  return { totalSales, itemsSales, cogs, merchantShippingTotal, merchantExtraExpensesTotal, totalOpExpenses, retainedDepositIncome, shippingRevenueIncome, netProfit };
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

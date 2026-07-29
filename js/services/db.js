/**
 * Data Storage & Service Layer
 */

window.STORAGE_KEYS = {
  CUSTOMERS: 'bms_data_customers',
  SUPPLIERS: 'bms_data_suppliers',
  PRODUCTS: 'bms_data_products',
  ORDERS: 'bms_data_orders',
  PAYMENTS: 'bms_data_payments',
  USER: 'bms_data_current_user',
};

const INITIAL_PRODUCTS = [
  { id: 'PRD-1001', name: 'بطانية مورا إسباني مزدوجة 6 كيلو', stock: 25, purchasePrice: 1200, sellingPrice: 1650, minStock: 5, notes: 'بطانية عالية الجودة' },
  { id: 'PRD-1002', name: 'بطانية سانتامورا مفردة 4 كيلو', stock: 3, purchasePrice: 750, sellingPrice: 980, minStock: 10, notes: 'منتج عليه إقبال عالي' },
  { id: 'PRD-1003', name: 'سجادة النساجون شرقي قياس 2×3 م', stock: 12, purchasePrice: 2100, sellingPrice: 2800, minStock: 4, notes: 'تصاميم كلاسيكية' },
  { id: 'PRD-1004', name: 'طقم لحاف مفروشات عروسة 6 قطع', stock: 8, purchasePrice: 1400, sellingPrice: 1950, minStock: 3, notes: 'خامة قطنية' },
  { id: 'PRD-1005', name: 'مفرش سرير مطرز فاخر', stock: 2, purchasePrice: 450, sellingPrice: 650, minStock: 5, notes: 'مخزون منخفض' },
];

const INITIAL_CUSTOMERS = [
  { id: 'CUST-1001', name: 'أحمد محمود العبد', phone: '01012345678', address: 'القاهرة - مدينة نصر', notes: 'عميل جملة ممتاز', ordersCount: 2, totalPurchases: 4600, paid: 3000, remainingBalance: 1600, lastOrderDate: '2026-07-28T14:30:00Z' },
  { id: 'CUST-1002', name: 'مصطفى حسن إبراهيم', phone: '01198765432', address: 'الجيزة - الدقي', notes: 'عميل تجزئة', ordersCount: 1, totalPurchases: 1950, paid: 1950, remainingBalance: 0, lastOrderDate: '2026-07-25T11:15:00Z' },
];

const INITIAL_SUPPLIERS = [
  { id: 'SUP-1001', name: 'شركة النساجون الشرقيون للمفروشات', phone: '01234567890', address: 'العاشر من رمضان', notes: 'مورد سجادات ومفارش', totalPurchases: 45000, paid: 35000, remainingBalance: 10000 },
  { id: 'SUP-1002', name: 'مصنع المورا لتصنيع البطانيات', phone: '01511223344', address: 'المحلة الكبرى', notes: 'مورد بطانيات إسباني ومحلي', totalPurchases: 32000, paid: 32000, remainingBalance: 0 },
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-1001',
    customerId: 'CUST-1001',
    customerName: 'أحمد محمود العبد',
    customerPhone: '01012345678',
    items: [
      { productId: 'PRD-1001', productName: 'بطانية مورا إسباني مزدوجة 6 كيلو', quantity: 2, purchasePrice: 1200, sellingPrice: 1650, supplierId: 'SUP-1002', supplierName: 'مصنع المورا لتصنيع البطانيات', subtotal: 3300 }
    ],
    totalAmount: 3300,
    downPayment: 2000,
    remainingBalance: 1300,
    status: 'delivered',
    createdBy: 'المدير العام',
    createdAt: '2026-07-28T14:30:00Z'
  }
];

const INITIAL_PAYMENTS = [
  {
    id: 'PAY-1001',
    entityType: 'customer',
    entityId: 'CUST-1001',
    entityName: 'أحمد محمود العبد',
    amount: 2000,
    date: '2026-07-28',
    paymentMethod: 'cash',
    notes: 'دفعة مقدمة للطلب ORD-1001',
    createdBy: 'المدير العام',
    createdAt: '2026-07-28T14:30:00Z'
  }
];

window.initDB = function() {
  if (!localStorage.getItem(window.STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(window.STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(window.STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(window.STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  }
  if (!localStorage.getItem(window.STORAGE_KEYS.SUPPLIERS)) {
    localStorage.setItem(window.STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
  }
  if (!localStorage.getItem(window.STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(window.STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  }
  if (!localStorage.getItem(window.STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(window.STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  }
};

window.getCollection = function(key) {
  window.initDB();
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return [];
  }
};

window.saveCollection = function(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
};

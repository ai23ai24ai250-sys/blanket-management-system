/**
 * Excel Export utility using SheetJS (xlsx)
 * Supports single table exports and full multi-sheet unified workbook exports
 */

window.exportToExcel = function(dataArray, filename = 'report.xlsx', sheetName = 'التقرير') {
  if (!window.XLSX) {
    console.error('SheetJS library is not loaded');
    alert('تعذر تحميل مكتبة التصدير إلى Excel');
    return;
  }

  try {
    const worksheet = window.XLSX.utils.json_to_sheet(dataArray);

    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ RTL: true });

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    window.XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('حدث خطأ أثناء تصدير ملف Excel');
  }
};

window.exportTableToExcel = function(tableId, filename = 'table_export.xlsx') {
  if (!window.XLSX) {
    console.error('SheetJS library is not loaded');
    return;
  }

  const table = document.getElementById(tableId);
  if (!table) return;

  const workbook = window.XLSX.utils.table_to_book(table, { sheet: "التقرير" });
  window.XLSX.writeFile(workbook, filename);
};

/**
 * Full Database Export into a Single Unified Excel Workbook with 5 Worksheets
 */
window.exportFullDatabaseToExcel = function() {
  if (!window.XLSX) {
    alert('مكتبة SheetJS غير محملة');
    return;
  }

  try {
    const workbook = window.XLSX.utils.book_new();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Sheet: Orders & Sales (المبيعات والفواتير)
    const orders = window.getOrders();
    const ordersData = orders.map(o => ({
      'رقم الفاتورة': o.id,
      'اسم العميل': o.customerName,
      'رقم الهاتف': o.customerPhone,
      'إجمالي الفاتورة (ج.م)': o.totalAmount,
      'المدفوع مقدماً (ج.م)': o.downPayment,
      'المتبقي (ج.م)': o.remainingBalance,
      'حالة الطلب': o.status === 'delivered' ? 'تم التوصيل' : o.status === 'completed' ? 'مكتمل' : 'جديد',
      'المسجل': o.createdBy || 'المدير العام',
      'التاريخ': window.formatDate(o.createdAt)
    }));
    const wsOrders = window.XLSX.utils.json_to_sheet(ordersData);
    wsOrders['!views'] = [{ RTL: true }];
    window.XLSX.utils.book_append_sheet(workbook, wsOrders, 'المبيعات والفواتير');

    // 2. Sheet: Customers (العملاء وأرصدتهم)
    const customers = window.getCustomers();
    const customersData = customers.map(c => ({
      'كود العميل': c.id,
      'اسم العميل': c.name,
      'رقم الهاتف': c.phone,
      'العنوان': c.address || '—',
      'عدد الطلبات': c.ordersCount || 0,
      'إجمالي المشتريات (ج.م)': c.totalPurchases || 0,
      'إجمالي المسدد (ج.م)': c.paid || 0,
      'الرصيد المتبقي عليه (ج.م)': c.remainingBalance || 0,
      'تاريخ آخر طلب': window.formatDate(c.lastOrderDate)
    }));
    const wsCustomers = window.XLSX.utils.json_to_sheet(customersData);
    wsCustomers['!views'] = [{ RTL: true }];
    window.XLSX.utils.book_append_sheet(workbook, wsCustomers, 'العملاء والأرصدة');

    // 3. Sheet: Suppliers & Payments (الموردين والدفعات)
    const suppliers = window.getSuppliers();
    const suppliersData = suppliers.map(s => ({
      'كود المورد': s.id,
      'اسم المورد / المصنع': s.name,
      'رقم الهاتف': s.phone || '—',
      'العنوان': s.address || '—',
      'إجمالي التعاملات (ج.م)': s.totalPurchases || 0,
      'المبلغ المسدد (ج.م)': s.paid || 0,
      'الرصيد المستحق للمورد (ج.م)': s.remainingBalance || 0
    }));
    const wsSuppliers = window.XLSX.utils.json_to_sheet(suppliersData);
    wsSuppliers['!views'] = [{ RTL: true }];
    window.XLSX.utils.book_append_sheet(workbook, wsSuppliers, 'الموردين والحسابات');

    // 4. Sheet: Products & Inventory (المنتجات والمخزون)
    const products = window.getProducts();
    const productsData = products.map(p => ({
      'كود المنتج': p.id,
      'اسم المنتج': p.name,
      'المخزون الحالي': p.stock,
      'سعر الشراء (ج.م)': p.purchasePrice,
      'سعر البيع (ج.م)': p.sellingPrice,
      'الحد الأدنى للتنبيه': p.minStock,
      'الحالة': p.stock <= p.minStock ? (p.stock < 0 ? `عجز (${p.stock})` : 'مخزون منخفض') : 'متوفر',
      'ملاحظات': p.notes || '—'
    }));
    const wsProducts = window.XLSX.utils.json_to_sheet(productsData);
    wsProducts['!views'] = [{ RTL: true }];
    window.XLSX.utils.book_append_sheet(workbook, wsProducts, 'المنتجات والمخزون');

    // 5. Sheet: Users & Accounts (حسابات الموظفين)
    const users = window.getUsers();
    const usersData = users.map(u => ({
      'كود المستخدم': u.id,
      'الاسم': u.name,
      'البريد الإلكتروني': u.email,
      'الصلاحية / الرتبة': u.role === 'admin' ? 'مدير نظام' : u.role === 'storekeeper' ? 'أمين مخزن' : 'موظف مبيعات',
      'تاريخ الإنشاء': window.formatDate(u.createdAt)
    }));
    const wsUsers = window.XLSX.utils.json_to_sheet(usersData);
    wsUsers['!views'] = [{ RTL: true }];
    window.XLSX.utils.book_append_sheet(workbook, wsUsers, 'حسابات الموظفين');

    // Write file
    window.XLSX.writeFile(workbook, `تصدير_قاعدة_البيانات_الشاملة_${todayStr}.xlsx`);
    window.showToast('تم تصدير قاعدة البيانات بالكامل إلى ملف Excel موحد بنجاح', 'success');

  } catch (err) {
    console.error('Unified Export Error:', err);
    alert('حدث خطأ أثناء تصدير كافة بيانات النظام إلى Excel');
  }
};

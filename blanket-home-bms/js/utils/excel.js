/**
 * Excel Export utility using SheetJS (xlsx)
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

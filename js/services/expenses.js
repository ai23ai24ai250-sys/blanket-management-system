/**
 * Operational Expenses Service Module - Cloud Firestore Connected
 * Supports Operational Expenses Logging, Categorization & Net Profit Calculation
 */

window.STORAGE_KEYS.EXPENSES = 'expenses';

window.getExpenses = function() {
  return window.getCollection(window.STORAGE_KEYS.EXPENSES);
};

window.createExpense = function({ title, amount, category = 'عمومية', date, notes = '', createdBy = 'المدير العام' }) {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('يرجى إدخال قيمة مصروف صحيحة أكبر من الصفر');
  }

  const expenseId = window.generateAutoId('EXP');
  const now = getCairoFormattedDate();

  const newExpense = {
    id: expenseId,
    title: title.trim(),
    amount: numAmount,
    category: category.trim(),
    date: date || now.slice(0, 10),
    notes: notes.trim(),
    createdBy,
    createdAt: now
  };

  return window.addFirestoreDoc(window.STORAGE_KEYS.EXPENSES, newExpense);
};

window.deleteExpense = async function(id) {
  return window.deleteFirestoreDoc(window.STORAGE_KEYS.EXPENSES, id);
};

window.getTotalExpenses = function() {
  const expenses = window.getExpenses();
  return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
};

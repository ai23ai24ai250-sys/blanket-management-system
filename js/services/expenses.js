/**
 * Operational Expenses Service Module - Cloud Firestore Connected
 * Supports Operational Expenses Logging, Categorization & Net Profit Calculation
 */

window.STORAGE_KEYS.EXPENSES = 'expenses';

window.getExpenses = function() {
  return window.getCollection(window.STORAGE_KEYS.EXPENSES);
};

window.createExpense = function({ title, amount, category = 'عمومية', date, notes = '', createdBy = 'المدير العام', recurring = false, dueDay = null }) {
  const numAmount = window.round2(parseFloat(amount));
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
    recurring: !!recurring,
    dueDay: recurring ? (parseInt(dueDay, 10) || null) : null,
    createdBy,
    createdAt: now,
    updatedAt: now
  };

  return window.addFirestoreDoc(window.STORAGE_KEYS.EXPENSES, newExpense);
};

window.updateExpense = function(id, updates) {
  const sanitized = { ...updates };
  if (sanitized.amount != null) sanitized.amount = window.round2(parseFloat(sanitized.amount));
  if (sanitized.recurring != null) sanitized.recurring = !!sanitized.recurring;
  if (sanitized.recurring === true) {
    sanitized.dueDay = parseInt(sanitized.dueDay, 10) || null;
  } else if (sanitized.recurring === false) {
    sanitized.dueDay = null;
  }
  window.updateFirestoreDoc(window.STORAGE_KEYS.EXPENSES, id, { ...sanitized, updatedAt: getCairoFormattedDate() });
  return window.getExpenses().find(e => e.id === id) || null;
};

window.deleteExpense = async function(id) {
  return window.deleteFirestoreDoc(window.STORAGE_KEYS.EXPENSES, id);
};

window.getTotalExpenses = function() {
  const expenses = window.getExpenses();
  return window.round2(expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
};

/* ===== Recurring (monthly) expenses =====
 * F2 — recurring expenses carry `recurring: true` + `dueDay` (the day of month
 * the expense is due). A recurring expense is DEDUCTED from net profit for the
 * current month once its due day has passed; it is not counted twice and does
 * not count before its due day in the current month.
 */
window.getExpenseNextDueDate = function(expense, baseDate) {
  if (!expense || expense.recurring !== true) return '';
  const due = parseInt(expense.dueDay, 10);
  if (isNaN(due) || due < 1 || due > 31) return '';
  const now = baseDate ? new Date(baseDate) : new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (now.getDate() >= due) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(due, lastDay);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

window.getCurrentOperatingExpenses = function(nowDate) {
  const expenses = window.getExpenses ? window.getExpenses() : [];
  const now = nowDate ? new Date(nowDate) : new Date();
  const currentDay = now.getDate();
  const toNum = window.toNumber || (v => { const n = Number(v); return isNaN(n) ? 0 : n; });
  let oneTime = 0;
  let recurringThisMonth = 0;
  let recurringFuture = 0;
  expenses.forEach(e => {
    const amt = toNum(e.amount);
    if (e.recurring === true) {
      const due = parseInt(e.dueDay, 10);
      if (isNaN(due) || due < 1 || due > 31) {
        oneTime += amt;
        return;
      }
      if (currentDay >= due) recurringThisMonth += amt;
      else recurringFuture += amt;
    } else {
      oneTime += amt;
    }
  });
  return {
    oneTime: window.round2(oneTime),
    recurringThisMonth: window.round2(recurringThisMonth),
    recurringFuture: window.round2(recurringFuture),
    total: window.round2(oneTime + recurringThisMonth)
  };
};

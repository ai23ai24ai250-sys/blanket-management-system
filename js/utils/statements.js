/**
 * Banking-Style Statements of Account (كشف حساب مصرفي)
 * Customer & Supplier statements with exact timestamps (YYYY-MM-DD HH:mm:ss),
 * debit/credit columns and a running cumulative balance that always reconciles
 * to the entity's current stored balance.
 */

window.getStatementTypeBadge = function(type) {
  const map = {
    'فاتورة': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    'دفعة مقدمة (عربون)': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'تحصيل دفعة': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'استرداد / رد مبلغ': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'رصيد افتتاحي': 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    'تسوية افتتاحية': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'شحنة توريد': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'تسجيل منتج ومخزون': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'مديونية عجز مخزون': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'تسديد دفعة': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'مرتجع مشتريات': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    'مرتجع نقدي': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    'إلغاء مديونية عجز': 'bg-slate-700/40 text-slate-300 border-slate-600/40'
  };
  const cls = map[type] || 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  return `<span class="px-2 py-0.5 text-[11px] font-bold rounded-lg border inline-block ${cls}">${type}</span>`;
};

window.isReturnStatementType = function(type) {
  return type === 'مرتجع مشتريات' || type === 'مرتجع نقدي' || type === 'استرداد / رد مبلغ';
};

/**
 * Build customer statement rows: orders (debit) + payments (credit) + refunds (debit),
 * sorted ascending by timestamp, with a running balance. An opening settlement row is
 * added only when legacy data drift exists so the statement always reconciles to the
 * customer's current remainingBalance.
 */
window.buildCustomerStatementEntries = function(customerId) {
  const customer = window.getCustomerById(customerId);
  if (!customer) return [];

  const entries = [];
  let seq = 0;

  window.getOrders().forEach(o => {
    if (o.customerId !== customerId) return;
    if (o.status === 'returned' || o.status === 'cancelled') return;
    entries.push({
      seq: seq++,
      sortKey: o.createdAt || o.date || '',
      date: o.createdAt || o.date || '',
      type: 'فاتورة',
      refId: o.id,
      note: (o.items || []).map(i => `${i.productName} x${i.quantity}`).join('، ') || 'فاتورة بيع',
      debit: Number(o.totalAmount) || 0,
      credit: 0
    });
  });

  window.getPaymentsByEntity('customer', customerId).forEach(p => {
    const amt = Number(p.amount) || 0;
    const isRefund = amt < 0;
    entries.push({
      seq: seq++,
      sortKey: p.createdAt || p.date || '',
      date: p.createdAt || p.date || '',
      type: isRefund ? 'استرداد / رد مبلغ' : (p.isDownPayment ? 'دفعة مقدمة (عربون)' : 'تحصيل دفعة'),
      refId: p.id,
      note: p.notes || (isRefund ? 'رد مبلغ مسدد للعميل' : ''),
      debit: isRefund ? Math.abs(amt) : 0,
      credit: isRefund ? 0 : amt
    });
  });

  entries.sort((a, b) => (a.sortKey || '').localeCompare(b.sortKey || '') || (a.seq - b.seq));

  const netEntries = entries.reduce((s, e) => s + (e.debit - e.credit), 0);
  // V3.15.1 — Reconciliation guard: the opening row may legitimately absorb
  // legacy pre-ledger drift (reconGap > 0), but when the net entries EXCEED the
  // stored balance (reconGap < 0) the statement can never reconcile — the old
  // Math.max(0, ...) silently clamped it and faked a match. Surface it instead.
  const reconGap = (Number(customer.remainingBalance) || 0) - netEntries;
  const opening = Math.max(0, reconGap);

  const rows = [];
  if (opening !== 0) {
    rows.push({
      date: '',
      type: 'تسوية افتتاحية',
      refId: '',
      note: 'تسوية فروق أرصدة سابقة لتطابق الكشف مع الرصيد الحالي',
      debit: 0,
      credit: 0,
      balance: opening,
      isOpening: true
    });
  }

  let running = opening;
  entries.forEach(e => {
    running = running + e.debit - e.credit;
    rows.push({ ...e, balance: running });
  });

  if (reconGap < 0) {
    rows.reconWarning = `عدم تطابق في الكشف: صافي الحركات يتجاوز الرصيد المخزن بمقدار ${window.formatCurrency(Math.abs(reconGap))} — راجع سجلات الدفعات للعميل`;
  }

  return rows;
};

/**
 * Build supplier statement rows from the unified supplier transaction ledger.
 * An opening balance row absorbs all historical events that predate the ledger
 * so the running balance always ends exactly at the supplier's current balance.
 */
window.buildSupplierStatementEntries = function(supplierId) {
  const supplier = window.getSupplierById(supplierId);
  if (!supplier) return [];

  const txns = window.getSupplierTransactionsBySupplier(supplierId);
  const netLogged = txns.reduce((sum, t) => sum + (Number(t.debit) || 0) - (Number(t.credit) || 0), 0);
  const opening = Math.max(0, (Number(supplier.remainingBalance) || 0) - netLogged);

  const rows = [];
  if (opening !== 0) {
    rows.push({
      date: '',
      type: 'رصيد افتتاحي',
      refId: '',
      note: 'أرصدة وحركات سابقة قبل تفعيل السجل التفصيلي',
      debit: 0,
      credit: 0,
      balance: opening,
      isOpening: true
    });
  }

  let running = opening;
  txns
    .slice()
    .map((t, idx) => ({ ...t, seq: idx }))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || (a.seq - b.seq))
    .forEach(t => {
      const debit = Number(t.debit) || 0;
      const credit = Number(t.credit) || 0;
      running = running + debit - credit;
      rows.push({
        date: t.createdAt || '',
        type: t.type || 'حركة',
        refId: t.refId || '',
        note: t.note || '',
        debit,
        credit,
        balance: running
      });
    });

  return rows;
};

/**
 * Shared banking-style statement table renderer with running balance.
 */
window.renderBankStatementTable = function({ entityName, entitySub = '', closingLabel, closingValue, closingColor = 'text-rose-400', rows, emptyMessage, debitLabel = 'مدين', creditLabel = 'دائن', closingBadge = '', reconWarning = '' }) {
  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const lastBalance = rows.length ? rows[rows.length - 1].balance : 0;

  return `
    <div class="space-y-4">
      ${reconWarning ? `
        <div class="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-bold leading-relaxed">
          ⚠️ ${reconWarning}
        </div>
      ` : ''}
      <div class="p-4 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h4 class="font-bold text-white text-base">${entityName}</h4>
          <p class="text-xs text-slate-400 font-mono">${entitySub || ''}</p>
        </div>
        <div class="text-left">
          <span class="text-xs text-slate-400 block">${closingLabel}</span>
          <span class="text-xl font-extrabold ${closingColor} num-font">${window.formatCurrency(closingValue)}</span>
          ${closingBadge ? `<div class="mt-1.5">${closingBadge}</div>` : ''}
        </div>
      </div>

      ${rows.length === 0 ? `
        <div class="text-center py-10 text-slate-500 text-sm">${emptyMessage || 'لا توجد حركات مسجلة'}</div>
      ` : `
        <div class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="data-table">
            <thead>
              <tr>
                <th>التاريخ والوقت</th>
                <th>نوع العملية / المرجع</th>
                <th>البيان</th>
                <th>${debitLabel}</th>
                <th>${creditLabel}</th>
                <th>الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => {
                const isReturn = window.isReturnStatementType(r.type);
                const debitDisp = r.debit > 0
                  ? (isReturn ? `<span class="text-rose-400 font-extrabold">−${window.formatCurrency(r.debit)}</span>` : window.formatCurrency(r.debit))
                  : '—';
                const creditDisp = r.credit > 0
                  ? (isReturn ? `<span class="text-rose-400 font-extrabold">−${window.formatCurrency(r.credit)}</span>` : window.formatCurrency(r.credit))
                  : '—';
                return `
                  <tr class="${isReturn ? 'bg-rose-950/20' : r.isOpening ? 'bg-slate-800/40' : ''}">
                    <td class="text-xs text-slate-400 num-font whitespace-nowrap">${r.isOpening ? '— (سابق)' : window.formatDateTime(r.date)}</td>
                    <td>
                      <div class="flex flex-col gap-1">
                        ${window.getStatementTypeBadge(r.type)}
                        ${r.refId ? `<span class="text-[10px] font-mono text-slate-500">${r.refId}</span>` : ''}
                      </div>
                    </td>
                    <td class="text-xs text-slate-300 max-w-[240px]">${r.note || '—'}</td>
                    <td class="num-font font-bold ${r.debit > 0 ? 'text-rose-400' : 'text-slate-600'}">${debitDisp}</td>
                    <td class="num-font font-bold ${r.credit > 0 ? 'text-emerald-400' : 'text-slate-600'}">${creditDisp}</td>
                    <td class="num-font font-extrabold text-white">${window.formatCurrency(r.balance)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="bg-slate-800/60 border-t-2 border-slate-700">
                <td class="text-xs font-bold text-slate-300" colspan="3">الإجمالي الختامي</td>
                <td class="num-font font-extrabold text-rose-400">${totalDebit ? window.formatCurrency(totalDebit) : '—'}</td>
                <td class="num-font font-extrabold text-emerald-400">${totalCredit ? window.formatCurrency(totalCredit) : '—'}</td>
                <td class="num-font font-extrabold text-white">${window.formatCurrency(lastBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `}
    </div>
  `;
};

window.renderCustomerStatementHTML = function(customerId) {
  const customer = window.getCustomerById(customerId);
  if (!customer) return '<p class="text-xs text-slate-500 py-4 text-center">لا توجد بيانات عميل متاحة</p>';
  const rows = window.buildCustomerStatementEntries(customerId);
  const bal = Number(customer.remainingBalance) || 0;
  const badge = bal > 0
    ? `<span class="inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-rose-500/20 text-rose-300 border-rose-500/30">مستحق على العميل (${window.formatCurrency(bal)})</span>`
    : `<span class="inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">الحساب خالص (0 ج.م)</span>`;
  return window.renderBankStatementTable({
    entityName: customer.name,
    entitySub: `${customer.phone || ''}${customer.address ? ' — ' + customer.address : ''}`,
    closingLabel: 'الرصيد المتبقي على العميل',
    closingValue: bal,
    closingColor: bal > 0 ? 'text-rose-400' : 'text-emerald-400',
    debitLabel: 'علية (فاتورة +)',
    creditLabel: 'سدده (تحصيل -)',
    closingBadge: badge,
    rows,
    reconWarning: rows.reconWarning || '',
    emptyMessage: 'لا توجد فواتير أو دفعات مسجلة لهذا العميل'
  });
};

window.renderSupplierStatementHTML = function(supplierId) {
  const supplier = window.getSupplierById(supplierId);
  if (!supplier) return '<p class="text-xs text-slate-500 py-4 text-center">لا توجد بيانات مورد متاحة</p>';
  const rows = window.buildSupplierStatementEntries(supplierId);
  const bal = Number(supplier.remainingBalance) || 0;
  const badge = bal > 0
    ? `<span class="inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-purple-500/20 text-purple-300 border-purple-500/30">مستحق للمورد (${window.formatCurrency(bal)})</span>`
    : `<span class="inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">الحساب خالص (0 ج.م)</span>`;
  return window.renderBankStatementTable({
    entityName: supplier.name,
    entitySub: `${supplier.phone || ''}${supplier.address ? ' — ' + supplier.address : ''}`,
    closingLabel: 'الرصيد المستحق للمورد',
    closingValue: bal,
    closingColor: bal > 0 ? 'text-purple-400' : 'text-emerald-400',
    debitLabel: 'له (توريد بضاعة +)',
    creditLabel: 'دفعناه له (تسديد -)',
    closingBadge: badge,
    rows,
    emptyMessage: 'لا توجد حركات مسجلة لهذا المورد'
  });
};

window.openCustomerStatementModal = function(customerId) {
  const customer = window.getCustomerById(customerId);
  if (!customer) return;
  window.openModal({
    title: `📒 كشف حساب مصرفي: ${customer.name}`,
    icon: 'book-open',
    maxWidth: 'max-w-5xl',
    contentHTML: `<div id="bank-statement-body">${window.renderCustomerStatementHTML(customerId)}</div>`
  });
};

window.openSupplierStatementModal = function(supplierId) {
  const supplier = window.getSupplierById(supplierId);
  if (!supplier) return;
  window.openModal({
    title: `📒 كشف حساب مورد: ${supplier.name}`,
    icon: 'book-open',
    maxWidth: 'max-w-5xl',
    contentHTML: `<div id="bank-statement-body">${window.renderSupplierStatementHTML(supplierId)}</div>`
  });
};

/**
 * Customers View & Details Modal Component
 */

window.renderCustomersView = function() {
  const customers = window.getCustomers();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Search Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="users" class="w-6 h-6 text-brand-400"></i>
            <span>إدارة العملاء والحسابات</span>
          </h1>
          <p class="text-sm text-slate-400">متابعة أرصدة العملاء والمشتريات الآجلة والمدفوعات</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-72">
            <input type="text" id="customers-search-input" placeholder="بحث بالاسم، الهاتف، أو الكود..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
        </div>
      </div>

      <!-- Customers Data Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="customers-table">
            <thead>
              <tr>
                <th>كود العميل</th>
                <th>اسم العميل</th>
                <th>رقم الهاتف</th>
                <th>العنوان</th>
                <th>عدد الطلبات</th>
                <th>إجمالي المشتريات</th>
                <th>المدفوع</th>
                <th>المتبقي (الرصيد)</th>
                <th>آخر طلب</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody id="customers-table-body">
              ${renderCustomerRows(customers)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

function renderCustomerRows(customersList) {
  if (!customersList || customersList.length === 0) {
    return `
      <tr>
        <td colspan="10" class="text-center py-8 text-slate-500">لا يوجد عملاء مسجلين مطابقين للبحث</td>
      </tr>
    `;
  }

  return customersList.map(c => `
    <tr class="cursor-pointer hover:bg-slate-800/50 transition-all customer-row" data-customer-id="${c.id}">
      <td class="font-bold text-brand-400">${c.id}</td>
      <td class="font-bold text-white">${c.name}</td>
      <td class="num-font text-slate-300">${c.phone}</td>
      <td class="text-slate-400 text-xs">${c.address || '—'}</td>
      <td class="num-font text-center font-semibold text-slate-200">${c.ordersCount || 0}</td>
      <td class="num-font font-bold text-white">${window.formatCurrency(c.totalPurchases)}</td>
      <td class="num-font text-emerald-400">${window.formatCurrency(c.paid)}</td>
      <td class="num-font font-extrabold ${c.remainingBalance > 0 ? 'text-rose-400' : 'text-slate-400'}">
        ${window.formatCurrency(c.remainingBalance)}
      </td>
      <td class="text-xs text-slate-400">${window.formatDate(c.lastOrderDate)}</td>
      <td>
        <button class="btn-view-customer-details px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 transition-all flex items-center gap-1">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          <span>عرض الحساب</span>
        </button>
      </td>
    </tr>
  `).join('');
}

window.setupCustomersEvents = function(container, refreshFn) {
  const searchInput = container.querySelector('#customers-search-input');
  const tableBody = container.querySelector('#customers-table-body');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filtered = window.searchCustomers(e.target.value);
      tableBody.innerHTML = renderCustomerRows(filtered);
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      attachRowClicks();
    });
  }

  const attachRowClicks = () => {
    container.querySelectorAll('.customer-row').forEach(row => {
      row.onclick = () => {
        const custId = row.getAttribute('data-customer-id');
        window.openCustomerDetailsModal(custId, refreshFn);
      };
    });
  };

  attachRowClicks();
};

window.openCustomerDetailsModal = function(customerId, refreshParentFn = null) {
  const customers = window.getCustomers();
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;

  const customerOrders = window.getOrders().filter(o => o.customerId === customerId);
  const customerPayments = window.getPaymentsByEntity('customer', customerId);

  const contentHTML = `
    <div class="space-y-6">
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div>
          <span class="text-xs text-slate-400 font-medium">الهاتف:</span>
          <p class="text-sm font-bold text-white num-font">${customer.phone}</p>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-medium">العنوان:</span>
          <p class="text-sm text-slate-200">${customer.address || 'غير محدد'}</p>
        </div>
        <div>
          <span class="text-xs text-slate-400 font-medium">الملاحظات:</span>
          <p class="text-sm text-slate-300">${customer.notes || 'لا يوجد'}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center">
        <div>
          <span class="text-xs text-slate-400 block mb-1">إجمالي المشتريات</span>
          <span class="text-base font-bold text-white num-font">${window.formatCurrency(customer.totalPurchases)}</span>
        </div>
        <div>
          <span class="text-xs text-slate-400 block mb-1">إجمالي المسدد</span>
          <span class="text-base font-bold text-emerald-400 num-font">${window.formatCurrency(customer.paid)}</span>
        </div>
        <div>
          <span class="text-xs text-slate-400 block mb-1">الرصيد المتبقي</span>
          <span class="text-lg font-extrabold ${customer.remainingBalance > 0 ? 'text-rose-400' : 'text-slate-400'} num-font">${window.formatCurrency(customer.remainingBalance)}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 pt-1 border-t border-slate-800">
        <button id="cust-modal-btn-order" class="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>طلب جديد للعميل</span>
        </button>

        <button id="cust-modal-btn-payment" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5">
          <i data-lucide="wallet" class="w-4 h-4"></i>
          <span>تسجيل دفعة</span>
        </button>

        <button id="cust-modal-btn-edit" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5">
          <i data-lucide="edit-3" class="w-4 h-4"></i>
          <span>تعديل البيانات</span>
        </button>
      </div>

      <div class="space-y-4">
        <h4 class="text-sm font-bold text-white flex items-center gap-2">
          <i data-lucide="history" class="w-4 h-4 text-brand-400"></i>
          <span>سجل الطلبات والمدفوعات</span>
        </h4>

        <div class="bg-slate-950/40 rounded-xl border border-slate-800 overflow-hidden">
          <div class="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
            الطلبات المسجلة (${customerOrders.length})
          </div>
          <div class="max-h-48 overflow-y-auto">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>الإجمالي</th>
                  <th>المقدم</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${customerOrders.length === 0 ? `
                  <tr><td colspan="6" class="text-center py-4 text-slate-500">لا توجد طلبات لهذا العميل</td></tr>
                ` : customerOrders.map(o => `
                  <tr>
                    <td class="font-bold text-brand-400">${o.id}</td>
                    <td class="num-font text-white">${window.formatCurrency(o.totalAmount)}</td>
                    <td class="num-font text-emerald-400">${window.formatCurrency(o.downPayment)}</td>
                    <td class="num-font text-rose-400">${window.formatCurrency(o.remainingBalance)}</td>
                    <td><span class="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">${o.status}</span></td>
                    <td class="text-slate-400">${window.formatDate(o.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-slate-950/40 rounded-xl border border-slate-800 overflow-hidden">
          <div class="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300">
            سجل المدفوعات والتحصيلات (${customerPayments.length})
          </div>
          <div class="max-h-48 overflow-y-auto">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th>رقم الإيصال</th>
                  <th>المبلغ</th>
                  <th>طريقة الدفع</th>
                  <th>الملاحظات</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${customerPayments.length === 0 ? `
                  <tr><td colspan="5" class="text-center py-4 text-slate-500">لا توجد مدفوعات مسجلة</td></tr>
                ` : customerPayments.map(p => `
                  <tr>
                    <td class="font-bold text-slate-400">${p.id}</td>
                    <td class="num-font font-bold text-emerald-400">${window.formatCurrency(p.amount)}</td>
                    <td>${p.paymentMethod === 'cash' ? 'نقدي' : p.paymentMethod === 'transfer' ? 'تحويل' : 'شيك'}</td>
                    <td class="text-slate-400">${p.notes || '—'}</td>
                    <td class="text-slate-400">${p.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `;

  window.openModal({
    title: `تفاصيل حساب العميل: ${customer.name}`,
    icon: 'user-check',
    contentHTML,
    maxWidth: 'max-w-3xl',
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#cust-modal-btn-order').onclick = () => {
        closeModal();
        window.openNewOrderModal(() => {
          if (refreshParentFn) refreshParentFn();
        });
      };

      modalEl.querySelector('#cust-modal-btn-payment').onclick = () => {
        closeModal();
        window.openPaymentModal({ defaultEntityType: 'customer', defaultEntityId: customer.id }, () => {
          if (refreshParentFn) refreshParentFn();
        });
      };

      modalEl.querySelector('#cust-modal-btn-edit').onclick = () => {
        closeModal();
        openEditCustomerModal(customer, refreshParentFn);
      };
    }
  });
};

function openEditCustomerModal(customer, refreshParentFn) {
  const contentHTML = `
    <form id="form-edit-customer" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">اسم العميل *</label>
        <input type="text" id="edit-cust-name" required value="${customer.name}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف * (11 رقم يبدأ بـ 0)</label>
        <input type="text" id="edit-cust-phone" required value="${customer.phone}" maxlength="11" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-left">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">العنوان</label>
        <input type="text" id="edit-cust-address" value="${customer.address || ''}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">الملاحظات</label>
        <input type="text" id="edit-cust-notes" value="${customer.notes || ''}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl">حفظ التعديلات</button>
      </div>
    </form>
  `;

  window.openModal({
    title: `تعديل بيانات العميل: ${customer.name}`,
    icon: 'edit-3',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#form-edit-customer').onsubmit = (e) => {
        e.preventDefault();
        const phoneVal = modalEl.querySelector('#edit-cust-phone').value;
        const valid = window.validateEgyptianPhone(phoneVal);
        if (!valid.isValid) {
          window.showToast(valid.message, 'error');
          return;
        }

        window.updateCustomer(customer.id, {
          name: modalEl.querySelector('#edit-cust-name').value,
          phone: phoneVal,
          address: modalEl.querySelector('#edit-cust-address').value,
          notes: modalEl.querySelector('#edit-cust-notes').value
        });

        window.showToast('تم تحديث بيانات العميل بنجاح', 'success');
        closeModal();
        if (refreshParentFn) refreshParentFn();
      };
    }
  });
}

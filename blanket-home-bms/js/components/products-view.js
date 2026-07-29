/**
 * Products View & Inventory Management Component
 */

window.renderProductsView = function() {
  const products = window.getProducts();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="boxes" class="w-6 h-6 text-amber-400"></i>
            <span>دليل المنتجات والمخزون</span>
          </h1>
          <p class="text-sm text-slate-400">متابعة مخزون البطانيات والمفارش والسجاد والأسعار وتنبيه النواقص</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <input type="text" id="products-search-input" placeholder="بحث باسم المنتج، الكود..." class="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          </div>
          <button id="btn-add-product" class="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      <!-- Products Data Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="products-table">
            <thead>
              <tr>
                <th>كود المنتج</th>
                <th>اسم المنتج</th>
                <th>المخزون الحالي</th>
                <th>سعر الشراء</th>
                <th>سعر البيع للجمهور</th>
                <th>الحد الأدنى للمخزون</th>
                <th>الحالة والتنبيه</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody id="products-table-body">
              ${renderProductRows(products)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

function renderProductRows(productsList) {
  if (!productsList || productsList.length === 0) {
    return `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-500">لا توجد منتجات مسجلة المطابقة للبحث</td>
      </tr>
    `;
  }

  return productsList.map(p => {
    const isLowStock = Number(p.stock) <= Number(p.minStock);

    return `
      <tr class="${isLowStock ? 'low-stock-row' : ''}">
        <td class="font-bold text-amber-400">${p.id}</td>
        <td class="font-bold text-white">${p.name}</td>
        <td class="num-font font-extrabold ${isLowStock ? 'text-rose-400' : 'text-emerald-400'} text-base">
          ${p.stock}
        </td>
        <td class="num-font text-slate-300">${window.formatCurrency(p.purchasePrice)}</td>
        <td class="num-font font-bold text-white">${window.formatCurrency(p.sellingPrice)}</td>
        <td class="num-font text-slate-400">${p.minStock}</td>
        <td>
          ${isLowStock ? `
            <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-max">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
              <span>مخزون منخفض!</span>
            </span>
          ` : `
            <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              متوفر في المخزن
            </span>
          `}
        </td>
        <td>
          <button class="btn-edit-product px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1" data-product-id="${p.id}">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            <span>تعديل</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.setupProductsEvents = function(container, refreshFn) {
  const searchInput = container.querySelector('#products-search-input');
  const tableBody = container.querySelector('#products-table-body');
  const addBtn = container.querySelector('#btn-add-product');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filtered = window.searchProducts(e.target.value);
      tableBody.innerHTML = renderProductRows(filtered);
      if (window.lucide) window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
      attachEditEvents();
    });
  }

  if (addBtn) {
    addBtn.onclick = () => openProductModal(null, refreshFn);
  }

  const attachEditEvents = () => {
    container.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-product-id');
        const products = window.getProducts();
        const product = products.find(p => p.id === pId);
        if (product) openProductModal(product, refreshFn);
      };
    });
  };

  attachEditEvents();
};

function openProductModal(productToEdit = null, refreshParentFn = null) {
  const isEdit = !!productToEdit;

  const contentHTML = `
    <form id="form-product" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">اسم المنتج *</label>
        <input type="text" id="prd-name" required value="${isEdit ? productToEdit.name : ''}" placeholder="مثال: بطانية مورا إسباني 6 كيلو" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">المخزون الحالي *</label>
          <input type="number" id="prd-stock" min="0" required value="${isEdit ? productToEdit.stock : '10'}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-center">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">سعر الشراء *</label>
          <input type="number" id="prd-buy-price" min="0" required value="${isEdit ? productToEdit.purchasePrice : '1000'}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-center">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1">سعر البيع *</label>
          <input type="number" id="prd-sell-price" min="0" required value="${isEdit ? productToEdit.sellingPrice : '1400'}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-center">
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">الحد الأدنى للمخزون للتنبيه</label>
        <input type="number" id="prd-min-stock" min="1" value="${isEdit ? productToEdit.minStock : '5'}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 font-bold num-font text-center">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1">ملاحظات وصفية</label>
        <input type="text" id="prd-notes" value="${isEdit ? (productToEdit.notes || '') : ''}" placeholder="خامة المنتج، المقاسات، اللون..." class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl">
          ${isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: isEdit ? `تعديل المنتج: ${productToEdit.name}` : 'إضافة منتج جديد للمخزن',
    icon: 'boxes',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#form-product').onsubmit = (e) => {
        e.preventDefault();
        const data = {
          name: modalEl.querySelector('#prd-name').value,
          stock: Number(modalEl.querySelector('#prd-stock').value) || 0,
          purchasePrice: Number(modalEl.querySelector('#prd-buy-price').value) || 0,
          sellingPrice: Number(modalEl.querySelector('#prd-sell-price').value) || 0,
          minStock: Number(modalEl.querySelector('#prd-min-stock').value) || 5,
          notes: modalEl.querySelector('#prd-notes').value
        };

        if (isEdit) {
          window.updateProduct(productToEdit.id, data);
          window.showToast('تم تحديث بيانات المنتج بنجاح', 'success');
        } else {
          window.createProduct(data);
          window.showToast('تم إضافة المنتج الجديد للمخزون بنجاح', 'success');
        }

        closeModal();
        if (refreshParentFn) refreshParentFn();
      };
    }
  });
}

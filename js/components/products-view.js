/**
 * Products View & Inventory Management Component
 * Supports Supplier-Linked Shipment Stock Addition & Automatic Supplier Debt Accumulation
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
            <span>دليل المنتجات وإدارة المخزون</span>
          </h1>
          <p class="text-sm text-slate-400">متابعة المخزون، توريد الشحنات الجديدة، تتبع الأسعار وتنبيه النواقص</p>
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
                <th>سعر الشراء الأصلي</th>
                <th>سعر البيع للجمهور</th>
                <th>الحد الأدنى للتنبيه</th>
                <th>الحالة والتنبيه</th>
                <th>الإجراءات والعمليات</th>
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
        <td colspan="8" class="text-center py-8 text-slate-500">لا توجد منتجات مسجلة في المخزن</td>
      </tr>
    `;
  }

  return productsList.map(p => {
    const isNegative = Number(p.stock) < 0;
    const isLowStock = Number(p.stock) <= Number(p.minStock);

    return `
      <tr class="${isNegative ? 'bg-rose-950/20' : isLowStock ? 'low-stock-row' : ''}">
        <td class="font-bold text-amber-400">${p.id}</td>
        <td class="font-bold text-white">${p.name}</td>
        <td class="num-font font-extrabold ${isNegative ? 'text-rose-500' : isLowStock ? 'text-amber-400' : 'text-emerald-400'} text-base">
          ${p.stock} قطعة
        </td>
        <td class="num-font text-slate-300">${window.formatCurrency(p.purchasePrice)}</td>
        <td class="num-font font-bold text-white">${window.formatCurrency(p.sellingPrice)}</td>
        <td class="num-font text-slate-400">${p.minStock}</td>
        <td>
          ${isNegative ? `
            <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/30 text-rose-300 border border-rose-500/50 flex items-center gap-1 w-max">
              <i data-lucide="alert-octagon" class="w-3.5 h-3.5 text-rose-400"></i>
              <span>عجز مخزون (${p.stock})</span>
            </span>
          ` : isLowStock ? `
            <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-max">
              <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
              <span>مخزون منخفض</span>
            </span>
          ` : `
            <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              متوفر في المخزن
            </span>
          `}
        </td>
        <td>
          <div class="flex items-center gap-2">
            <!-- Add Stock Shipment Button -->
            <button class="btn-add-shipment px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1" data-product-id="${p.id}" data-product-name="${p.name}">
              <i data-lucide="package-plus" class="w-3.5 h-3.5"></i>
              <span>إضافة شحنة</span>
            </button>
            <!-- Edit Button -->
            <button class="btn-edit-product px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 transition-all flex items-center gap-1" data-product-id="${p.id}">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>تعديل</span>
            </button>
            <!-- Delete Button -->
            <button class="btn-delete-product px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30 transition-all flex items-center gap-1" data-product-id="${p.id}" data-product-name="${p.name}">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>حذف</span>
            </button>
          </div>
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
      attachActionEvents();
    });
  }

  if (addBtn) {
    addBtn.onclick = () => openProductModal(null, refreshFn);
  }

  const attachActionEvents = () => {
    container.querySelectorAll('.btn-add-shipment').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-product-id');
        const product = window.getProductById(pId);
        if (product) openShipmentModal(product, refreshFn);
      };
    });

    container.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-product-id');
        const product = window.getProductById(pId);
        if (product) openProductModal(product, refreshFn);
      };
    });

    container.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-product-id');
        const pName = btn.getAttribute('data-product-name');
        
        if (confirm(`هل أنت تأكد من رغبتك في حذف المنتج "${pName}" من المخزون؟`)) {
          window.deleteProduct(pId);
          window.showToast(`تم حذف المنتج "${pName}" بنجاح`, 'info');
          if (refreshFn) refreshFn();
        }
      };
    });
  };

  attachActionEvents();
};

function openShipmentModal(product, refreshParentFn) {
  const suppliers = window.getSuppliers();

  const contentHTML = `
    <form id="form-add-shipment" class="space-y-4">
      <div class="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
        <div>
          <h4 class="font-bold text-white text-base">${product.name}</h4>
          <p class="text-xs text-amber-400">كود المنتج: ${product.id}</p>
        </div>
        <div class="text-left">
          <span class="text-xs text-slate-400 block">المخزون الحالي</span>
          <span class="text-lg font-extrabold text-emerald-400 num-font">${product.stock} قطعة</span>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">المورد / المصنع المورد لهذه الشحنة (اختياري لتسجيل المديونية)</label>
        <select id="shipment-supplier-select" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
          <option value="">(بدون ربط بمورد مباشر)</option>
          ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">الكمية المضافة * (قطعة)</label>
          <input type="number" id="shipment-qty" min="1" required value="10" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-extrabold text-lg num-font text-center">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">سعر الشراء / التكلفة للقطعة * (ج.م)</label>
          <input type="number" id="shipment-unit-price" min="0" required value="${product.purchasePrice || 0}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-lg num-font text-center">
        </div>
      </div>

      <div class="p-3 bg-purple-950/30 rounded-xl border border-purple-800/40 flex justify-between items-center text-xs">
        <span class="text-purple-300 font-bold">إجمالي تكلفة الشحنة (تُضاف لمديونية المورد):</span>
        <span id="shipment-total-cost-disp" class="text-sm font-extrabold text-purple-400 num-font">0 ج.م</span>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">بيانات وملاحظات الشحنة / رقم الفاتورة</label>
        <input type="text" id="shipment-notes" placeholder="مثال: توريد شحنة من مصنع المورا فاتورة رقم 804" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2">
          <i data-lucide="package-plus" class="w-4 h-4"></i>
          <span>إضافة الكمية وتسميع حساب المورد</span>
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: `📦 توريد شحنة جديدة: ${product.name}`,
    icon: 'package-plus',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      const qtyInput = modalEl.querySelector('#shipment-qty');
      const priceInput = modalEl.querySelector('#shipment-unit-price');
      const costDisp = modalEl.querySelector('#shipment-total-cost-disp');

      const updateCost = () => {
        const q = Number(qtyInput.value) || 0;
        const p = Number(priceInput.value) || 0;
        costDisp.textContent = window.formatCurrency(q * p);
      };

      qtyInput.oninput = updateCost;
      priceInput.oninput = updateCost;
      updateCost();

      modalEl.querySelector('#form-add-shipment').onsubmit = (e) => {
        e.preventDefault();
        const qty = qtyInput.value;
        const supplierId = modalEl.querySelector('#shipment-supplier-select').value;
        const unitPrice = priceInput.value;
        const notes = modalEl.querySelector('#shipment-notes').value;

        try {
          window.addStockShipment(product.id, qty, supplierId, unitPrice, notes);
          window.showToast(`تمت إضافة ${qty} قطعة للـمخزون وتحديث حساب المورد بنجاح`, 'success');
          closeModal();
          if (refreshParentFn) refreshParentFn();
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
}

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
          <input type="number" id="prd-stock" required value="${isEdit ? productToEdit.stock : '10'}" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white num-font text-center">
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
    title: isEdit ? `تعديل بيانات المنتج: ${productToEdit.name}` : 'إضافة منتج جديد للمخزن',
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

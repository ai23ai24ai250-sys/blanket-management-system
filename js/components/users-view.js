/**
 * Admin User Management Component (لوحة التحكم بالموظفين والصلاحيات)
 */

window.renderUsersView = function() {
  if (!window.isAdmin()) {
    return `
      <div class="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl animate-fadeIn">
        <i data-lucide="shield-alert" class="w-16 h-16 text-rose-400 mx-auto mb-4"></i>
        <h2 class="text-xl font-bold text-white mb-2">عفواً! الصفحة خاصة بالمدير فقط</h2>
        <p class="text-sm text-slate-400">ليس لديك الصلاحية الكافية لاستعراض لوحة إشراف الموظفين والحسابات</p>
      </div>
    `;
  }

  const users = window.getUsers();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header & Add User Button -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <i data-lucide="user-cog" class="w-6 h-6 text-brand-400"></i>
            <span>إدارة الحسابات وصلاحيات الموظفين</span>
          </h1>
          <p class="text-sm text-slate-400">إضافة موظفين جدد للنظام، تحديد الصلاحيات والرتب، وتعديل أو حذف الحسابات</p>
        </div>

        <button id="btn-add-user" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2">
          <i data-lucide="user-plus" class="w-4 h-4"></i>
          <span>إضافة موظف / حساب جديد</span>
        </button>
      </div>

      <!-- Users Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="data-table" id="users-table">
            <thead>
              <tr>
                <th>كود المستخدم</th>
                <th>اسم الموظف</th>
                <th>البريد الإلكتروني</th>
                <th>الصلاحية / الرتبة</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              ${renderUserRows(users)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
};

function renderUserRows(usersList) {
  if (!usersList || usersList.length === 0) {
    return `<tr><td colspan="6" class="text-center py-8 text-slate-500">لا يوجد موظفين مسجلين</td></tr>`;
  }

  return usersList.map(u => {
    const roleBadge = u.role === 'admin' 
      ? '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40">مدير النظام (Admin)</span>'
      : u.role === 'storekeeper'
      ? '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">أمين مخزن (Storekeeper)</span>'
      : '<span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">موظف مبيعات (Sales)</span>';

    return `
      <tr>
        <td class="font-bold text-slate-400">${u.id || 'USR'}</td>
        <td class="font-bold text-white">${u.name}</td>
        <td class="num-font text-slate-300">${u.email}</td>
        <td>${roleBadge}</td>
        <td class="text-xs text-slate-400">${window.formatDate(u.createdAt)}</td>
        <td>
          <div class="flex items-center gap-2">
            <button class="btn-change-role px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 text-xs font-bold rounded-lg border border-brand-500/30 transition-all flex items-center gap-1" data-user-id="${u.id}" data-user-name="${u.name}" data-user-role="${u.role}">
              <i data-lucide="shield" class="w-3.5 h-3.5"></i>
              <span>تعديل الصلاحية</span>
            </button>
            ${u.role !== 'admin' ? `
              <button class="btn-delete-user px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30 transition-all flex items-center gap-1" data-user-id="${u.id}" data-user-name="${u.name}">
                <i data-lucide="user-x" class="w-3.5 h-3.5"></i>
                <span>إزالة الحساب</span>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.setupUsersEvents = function(container, refreshFn) {
  const addBtn = container.querySelector('#btn-add-user');
  if (addBtn) {
    addBtn.onclick = () => openAddUserModal(refreshFn);
  }

  // Change Role Events
  container.querySelectorAll('.btn-change-role').forEach(btn => {
    btn.onclick = () => {
      const uId = btn.getAttribute('data-user-id');
      const uName = btn.getAttribute('data-user-name');
      const currentRole = btn.getAttribute('data-user-role');
      openChangeRoleModal(uId, uName, currentRole, refreshFn);
    };
  });

  // Delete User Events
  container.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.onclick = () => {
      const uId = btn.getAttribute('data-user-id');
      const uName = btn.getAttribute('data-user-name');
      if (confirm(`هل أنت تأكد من إزالة حساب الموظف "${uName}" نهائياً من النظام؟`)) {
        window.deleteUserAccount(uId);
        window.showToast(`تم إزالة حساب "${uName}" بنجاح`, 'info');
        if (refreshFn) refreshFn();
      }
    };
  });
};

function openAddUserModal(refreshParentFn) {
  const contentHTML = `
    <form id="form-add-user" class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">اسم الموظف الثلاثي *</label>
        <input type="text" id="usr-name" required placeholder="مثال: أحمد محمود علي" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">البريد الإلكتروني *</label>
        <input type="email" id="usr-email" required placeholder="employee@store.com" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-left">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور للدخول *</label>
        <input type="password" id="usr-password" required minlength="6" placeholder="••••••••" class="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-left">
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">الصلاحية / الرتبة *</label>
        <select id="usr-role" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
          <option value="employee" selected>موظف مبيعات (Sales)</option>
          <option value="storekeeper">أمين مخزن (Storekeeper)</option>
          <option value="admin">مدير نظام كامل (Admin)</option>
        </select>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl">
          إنشاء الحساب وتفعيل الصلاحية
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: '👤 إضافة موظف وحساب جديد للسيستم',
    icon: 'user-plus',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#form-add-user').onsubmit = (e) => {
        e.preventDefault();
        try {
          window.createNewUserAccount({
            name: modalEl.querySelector('#usr-name').value,
            email: modalEl.querySelector('#usr-email').value,
            password: modalEl.querySelector('#usr-password').value,
            role: modalEl.querySelector('#usr-role').value
          });

          window.showToast('تم إنشاء حساب الموظف وتفعيل الصلاحية بنجاح', 'success');
          closeModal();
          if (refreshParentFn) refreshParentFn();
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      };
    }
  });
}

function openChangeRoleModal(userId, userName, currentRole, refreshParentFn) {
  const contentHTML = `
    <form id="form-change-role" class="space-y-4">
      <p class="text-sm text-slate-300">تعديل رتبة وصلاحيات الموظف: <strong class="text-white">${userName}</strong></p>

      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5">الصلاحية الجديدة *</label>
        <select id="new-usr-role" class="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold">
          <option value="employee" ${currentRole === 'employee' ? 'selected' : ''}>موظف مبيعات (Sales)</option>
          <option value="storekeeper" ${currentRole === 'storekeeper' ? 'selected' : ''}>أمين مخزن (Storekeeper)</option>
          <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>مدير نظام كامل (Admin)</option>
        </select>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="submit" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl">
          تحديث الرتبة
        </button>
      </div>
    </form>
  `;

  window.openModal({
    title: `🛡️ تعديل صلاحية: ${userName}`,
    icon: 'shield',
    contentHTML,
    onRender: (modalEl, closeModal) => {
      modalEl.querySelector('#form-change-role').onsubmit = (e) => {
        e.preventDefault();
        const newRole = modalEl.querySelector('#new-usr-role').value;
        window.updateUserRole(userId, newRole);
        window.showToast(`تم تغيير صلاحية "${userName}" بنجاح`, 'success');
        closeModal();
        if (refreshParentFn) refreshParentFn();
      };
    }
  });
}

/**
 * Settings View Component
 */

window.renderSettingsView = function() {
  const fbConfig = window.getFirebaseConfig();
  const currentUser = window.getCurrentUser();

  return `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Header -->
      <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <i data-lucide="settings" class="w-6 h-6 text-slate-300"></i>
          <span>إعدادات النظام والربط الأوفلاين</span>
        </h1>
        <p class="text-sm text-slate-400">تكوين اتصال Firebase Cloud Firestore واستعراض بيانات الحساب</p>
      </div>

      <!-- Settings Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- User Profile Info -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <i data-lucide="user-check" class="w-5 h-5 text-brand-400"></i>
            <span>معلومات المستخدم الحالي</span>
          </h3>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between py-2 border-b border-slate-800/60">
              <span class="text-slate-400">الاسم المسجل:</span>
              <span class="font-bold text-white">${currentUser?.name || 'المدير العام'}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-800/60">
              <span class="text-slate-400">البريد الإلكتروني:</span>
              <span class="font-mono text-brand-300">${currentUser?.email || 'admin@store.com'}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-800/60">
              <span class="text-slate-400">الصلاحية والRole:</span>
              <span class="px-2.5 py-1 text-xs font-bold rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                ${currentUser?.role === 'admin' ? 'مدير نظام (Admin)' : 'موظف مبيعات (Employee)'}
              </span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-400">حالة التخزين الأوفلاين:</span>
              <span class="text-emerald-400 font-bold flex items-center gap-1">
                <i data-lucide="wifi-off" class="w-4 h-4"></i>
                <span>مُفعل تلقائياً (IndexedDB)</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Firebase Config Settings Form -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 class="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <i data-lucide="cloud" class="w-5 h-5 text-brand-400"></i>
            <span>إعدادات Firebase Cloud Firestore</span>
          </h3>

          <form id="form-firebase-config" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-300 mb-1">API Key</label>
              <input type="text" id="fb-api-key" value="${fbConfig.apiKey || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs">
            </div>
            <div>
              <label class="block font-bold text-slate-300 mb-1">Auth Domain</label>
              <input type="text" id="fb-auth-domain" value="${fbConfig.authDomain || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs">
            </div>
            <div>
              <label class="block font-bold text-slate-300 mb-1">Project ID</label>
              <input type="text" id="fb-project-id" value="${fbConfig.projectId || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs">
            </div>

            <div class="pt-2 flex justify-end">
              <button type="submit" class="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md transition-all">
                حفظ تكوين Firebase
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  `;
};

window.setupSettingsEvents = function(container) {
  const form = container.querySelector('#form-firebase-config');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const newConfig = {
        apiKey: container.querySelector('#fb-api-key').value,
        authDomain: container.querySelector('#fb-auth-domain').value,
        projectId: container.querySelector('#fb-project-id').value
      };
      window.saveFirebaseConfig(newConfig);
      window.showToast('تم حفظ إعدادات اتصال Firebase بنجاح', 'success');
    };
  }
};

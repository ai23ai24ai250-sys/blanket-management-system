/**
 * Settings View Component — V3.18
 * ===============================
 * The general Settings page is now GENERAL ONLY (app name, logo, primary
 * color, dark/light). All cloud/link settings (Firebase credentials, OAuth
 * secrets, refresh tokens, Spreadsheet ID, sync direction) moved OUT of this
 * page and into the "إعدادات الربط والسحابة 🔐" modal, reachable ONLY from
 * the account dropdown (admin + password prompt) via window.openSyncCloudModal.
 */

// Theme options for the appearance dropdown (value -> label + signature accent).
// Picking a theme applies its signature accent so the brand-* variables match.
const THEME_META = {
  'dark':         { label: 'داكن',       accent: '#0284c7' },
  'light':        { label: 'فاتح',       accent: '#0284c7' },
  'ocean':        { label: 'محيطي',      accent: '#06b6d4' },
  'emerald':      { label: 'زمردي',      accent: '#10b981' },
  'royal':        { label: 'ملكي',       accent: '#8b5cf6' },
  'coffee':       { label: 'قهوة',       accent: '#d97706' },
  'luxury-gold':  { label: 'ذهبي فاخر',  accent: '#d4af37' },
  'graphite':     { label: 'جرافيت',     accent: '#8b8f9a' }
};

// Small helper: ask for the admin password before running a sensitive action.
window.requireAdminPassword = function (note, onOk) {
  if (!window.isAdmin()) {
    if (window.showToast) window.showToast('هذه الإعدادات مخصصة للمدير فقط', 'error');
    return;
  }
  if (!window.openModal) { if (onOk) onOk(); return; }
  window.openModal({
    title: 'تأكيد هوية المدير',
    icon: 'shield-check',
    maxWidth: 'max-w-md',
    contentHTML:
      '<p style="color:var(--ui-dim);font-size:13px">' + (note || 'أدخل كلمة سر المدير للمتابعة.') + '</p>' +
      '<label style="display:block;margin-top:12px;font-size:13px">كلمة سر المدير' +
      '  <input id="admin-pass-required" type="password" placeholder="••••••••" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--ui-border);background:var(--ui-bg);color:var(--ui-text);margin-top:4px">' +
      '</label>' +
      '<p id="admin-pass-err" style="color:#f87171;font-size:12px;margin-top:8px;display:none">عفواً، كلمة السر غير صحيحة!</p>' +
      '<div style="display:flex;gap:8px;margin-top:16px">' +
      '  <button id="admin-pass-go" style="padding:8px 16px;border-radius:8px;border:none;background:#b45309;color:#fff;font-weight:bold;cursor:pointer">✓ تأكيد</button>' +
      '  <button id="admin-pass-cancel" style="padding:8px 16px;border-radius:8px;border:none;background:#334155;color:#fff;font-weight:bold;cursor:pointer">إلغاء</button>' +
      '</div>',
    onRender: (wrapper, close) => {
      const input = wrapper.querySelector('#admin-pass-required');
      const err = wrapper.querySelector('#admin-pass-err');
      const submit = () => {
        if (window.verifyAdminPassword(input.value)) {
          close();
          if (onOk) onOk();
        } else {
          if (err) err.style.display = 'block';
          if (!window.adminPasswordConfigured()) {
            if (err) err.textContent = 'لا توجد كلمة سر مسجلة للمدير — سجّلها أولاً من (القائمة ▾ ← تغيير كلمة السر)';
            if (window.showToast) window.showToast('لا توجد كلمة سر مسجلة للمدير — سجّلها أولاً من (القائمة ▾ ← تغيير كلمة السر)', 'error');
          } else {
            if (window.showToast) window.showToast('عفواً، كلمة السر غير صحيحة!', 'error');
          }
          input.select();
        }
      };
      const go = wrapper.querySelector('#admin-pass-go');
      const cancel = wrapper.querySelector('#admin-pass-cancel');
      if (go) go.addEventListener('click', submit);
      if (cancel) cancel.addEventListener('click', close);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      setTimeout(() => input.focus(), 50);
    }
  });
};

// V3.18 — "إعدادات الربط والسحابة 🔐" modal (admin only), opened from the
// account dropdown. Admin check → admin password prompt → modal containing the
// Firebase credentials form + the unlocked Google Sheets sync panel.
window.openSyncCloudModal = function () {
  if (!window.isAdmin()) {
    if (window.showToast) window.showToast('هذه الإعدادات مخصصة للمدير فقط', 'error');
    return;
  }
  window.requireAdminPassword('أدخل كلمة سر المدير للوصول إلى إعدادات الربط والسحابة (Firebase / OAuth / Refresh Token / Spreadsheet).', () => {
    if (!window.openModal) return;
    const fbConfig = window.getFirebaseConfig ? window.getFirebaseConfig() : {};
    window.openModal({
      title: 'إعدادات الربط والسحابة 🔐',
      icon: 'cloud-cog',
      maxWidth: 'max-w-3xl',
      contentHTML: `
        <div class="space-y-6 text-sm">
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p class="text-amber-300 font-bold flex items-center gap-2">
              <i data-lucide="shield-alert" class="w-4 h-4 shrink-0"></i>
              <span>إعدادات حساسة</span>
            </p>
            <p class="text-xs text-slate-300 mt-1">تُحفظ محلياً في هذا المتصفح وتُرفع للسحابة (settings/syncConfig). لا تُشارك هذه القيم مع أحد.</p>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <i data-lucide="database" class="w-5 h-5 text-brand-400"></i>
              <span>Firebase Cloud Firestore</span>
            </h3>
            <form id="form-firebase-config" class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-300 mb-1">API Key</label>
                <input type="text" id="fb-api-key" value="${fbConfig.apiKey || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand-500">
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Auth Domain</label>
                <input type="text" id="fb-auth-domain" value="${fbConfig.authDomain || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand-500">
              </div>
              <div>
                <label class="block font-bold text-slate-300 mb-1">Project ID</label>
                <input type="text" id="fb-project-id" value="${fbConfig.projectId || ''}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand-500">
              </div>
              <div class="pt-2 flex justify-end">
                <button type="submit" id="btn-save-firebase-config" class="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md transition-all">
                  حفظ تكوين Firebase
                </button>
              </div>
            </form>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-3">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="table-2" class="w-5 h-5 text-brand-400"></i>
                <span>المزامنة مع Google Sheets</span>
              </h3>
              <button type="button" id="gs-open-sheet" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-md transition-all shrink-0">
                📊 فتح ورقة البيانات
              </button>
            </div>
            <div id="gs-sync-panel"></div>
          </div>
        </div>
      `,
      onRender: (wrapper, close) => {
        const openSheetBtn = wrapper.querySelector('#gs-open-sheet');
        if (openSheetBtn) {
          openSheetBtn.addEventListener('click', () => {
            if (window.GoogleSheetsSync && typeof window.GoogleSheetsSync.openSheetUrl === 'function') {
              window.GoogleSheetsSync.openSheetUrl();
            }
          });
        }

        const form = wrapper.querySelector('#form-firebase-config');
        if (form) {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newConfig = {
              apiKey: wrapper.querySelector('#fb-api-key').value,
              authDomain: wrapper.querySelector('#fb-auth-domain').value,
              projectId: wrapper.querySelector('#fb-project-id').value
            };
            if (typeof window.saveFirebaseConfig === 'function') window.saveFirebaseConfig(newConfig);
            if (window.showToast) window.showToast('تم حفظ إعدادات اتصال Firebase بنجاح', 'success');
          });
        }

        const syncPanelEl = wrapper.querySelector('#gs-sync-panel');
        if (syncPanelEl && window.GoogleSheetsSync && typeof window.GoogleSheetsSync.renderSyncPanel === 'function') {
          window.GoogleSheetsSync.renderSyncPanel(syncPanelEl, {
            unlocked: true,
            onSaved: (cfg) => window.showToast('تم حفظ إعدادات مزامنة Google Sheets بنجاح', 'success'),
            onSynced: (cfg) => window.showToast('تمت المزامنة مع Google Sheets بنجاح', 'success'),
            onError: (err) => window.showToast((err && err.message) || String(err), 'error')
          });
        }
      }
    });
  });
};

window.renderSettingsView = function () {
  if (!window.isAuthenticated()) {
    return `
      <div class="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl animate-fadeIn">
        <i data-lucide="lock" class="w-16 h-16 text-rose-400 mx-auto mb-4"></i>
        <h2 class="text-xl font-bold text-white mb-2">سجّل الدخول أولاً</h2>
        <p class="text-sm text-slate-400">الإعدادات العامة متاحة بعد تسجيل الدخول — وإعدادات الربط والسحابة 🔐 من قائمة الحساب للمدير فقط</p>
      </div>
    `;
  }

  const gs = (window.GeneralSettings && window.GeneralSettings.get) ? window.GeneralSettings.get() : {};

  const PRESET_COLORS = ['#0284c7', '#0ea5e9', '#7c3aed', '#16a34a', '#dc2626', '#f59e0b', '#db2777', '#0f172a'];

  const generalCard = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
      <div class="border-b border-slate-800 pb-3">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="palette" class="w-5 h-5 text-brand-400"></i>
          <span>إعدادات النظام العامة</span>
        </h3>
        <p class="text-xs text-slate-500 mt-1">متاحة مباشرة دون كلمة سر — تُحفظ في هذا المتصفح وتُزامن مع السحابة تلقائياً</p>
      </div>

      <div>
        <label class="block font-bold text-slate-300 text-xs mb-1.5">اسم النظام / التطبيق</label>
        <input type="text" id="gen-app-name" value="${(gs.appName || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-brand-500">
      </div>

      <div>
        <label class="block font-bold text-slate-300 text-xs mb-1.5">الشعار</label>
        <div class="flex items-center gap-3 flex-wrap">
          <img id="gen-logo-preview" src="${(gs.logo || '2.jpg').replace(/"/g, '&quot;')}" alt="logo" class="w-14 h-14 rounded-xl border border-slate-700 object-contain bg-slate-800 shrink-0">
          <input type="text" id="gen-logo-url" value="${(gs.logo || '2.jpg').replace(/"/g, '&quot;')}" placeholder="رابط صورة (URL) أو اختر ملفاً…" class="flex-1 min-w-[180px] px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand-500">
          <label class="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all shrink-0">
            رفع صورة
            <input type="file" id="gen-logo-file" accept="image/*" class="hidden">
          </label>
        </div>
      </div>

      <div>
        <label class="block font-bold text-slate-300 text-xs mb-1.5">اللون الأساسي (Theme Accent)</label>
        <div class="flex items-center gap-2 flex-wrap">
          ${PRESET_COLORS.map(c => `
            <button type="button" data-color="${c}" class="gen-color-swatch w-8 h-8 rounded-lg border-2 border-transparent hover:scale-110 transition-all cursor-pointer"
              style="background:${c};box-shadow:inset 0 0 0 1px rgba(255,255,255,0.25)" title="${c}"></button>`).join('')}
          <input type="color" id="gen-primary-color" value="${(gs.primaryColor || '#0284c7').replace(/"/g, '&quot;')}" class="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700 p-0.5" title="لون مخصص">
          <span id="gen-color-hex" class="text-[11px] font-mono text-slate-400">${(gs.primaryColor || '#0284c7')}</span>
        </div>
      </div>

      <div>
        <label class="block font-bold text-slate-300 text-xs mb-1.5">مظهر النظام (الثيم)</label>
        <select id="gen-theme" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
          <option value="dark"${gs.theme === 'dark' ? ' selected' : ''}>🌙 داكن (افتراضي)</option>
          <option value="light"${gs.theme === 'light' ? ' selected' : ''}>☀️ فاتح</option>
          <option value="ocean"${gs.theme === 'ocean' ? ' selected' : ''}>🌊 محيطي</option>
          <option value="emerald"${gs.theme === 'emerald' ? ' selected' : ''}>💎 زمردي</option>
          <option value="royal"${gs.theme === 'royal' ? ' selected' : ''}>👑 ملكي</option>
          <option value="coffee"${gs.theme === 'coffee' ? ' selected' : ''}>☕ قهوة</option>
          <option value="luxury-gold"${gs.theme === 'luxury-gold' ? ' selected' : ''}>✨ ذهبي فاخر</option>
          <option value="graphite"${gs.theme === 'graphite' ? ' selected' : ''}>⚫ جرافيت</option>
        </select>
      </div>

      <div class="pt-2 flex flex-wrap gap-2">
        <button type="button" id="gen-save" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-md transition-all">حفظ الإعدادات العامة</button>
        <button type="button" id="gen-reset" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all">استعادة الافتراضي</button>
      </div>
    </div>
  `;

  return `
    <div class="space-y-6 animate-fadeIn">

      <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <h1 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <i data-lucide="settings" class="w-6 h-6 text-slate-300"></i>
          <span>إعدادات النظام</span>
        </h1>
        <p class="text-sm text-slate-400">الإعدادات العامة (بدون كلمة سر) — أما إعدادات الربط والسحابة 🔐 فهي من قائمة الحساب، للمدير فقط.</p>
      </div>

      ${generalCard}
    </div>
  `;
};

window.setupSettingsEvents = function (container) {
  if (!window.isAuthenticated()) return;
  const G = window.GeneralSettings;

  // ---------------------------------------------------------------
  // General settings (no password required)
  // ---------------------------------------------------------------
  const nameInput = container.querySelector('#gen-app-name');
  const logoUrl = container.querySelector('#gen-logo-url');
  const logoFile = container.querySelector('#gen-logo-file');
  const logoPreview = container.querySelector('#gen-logo-preview');
  const colorInput = container.querySelector('#gen-primary-color');
  const colorHex = container.querySelector('#gen-color-hex');
  const themeSel = container.querySelector('#gen-theme');

  const previewLogo = (src) => { if (logoPreview && src) logoPreview.setAttribute('src', src); };

  if (logoUrl) {
    logoUrl.addEventListener('input', () => previewLogo(logoUrl.value));
  }
  if (logoFile) {
    logoFile.addEventListener('change', () => {
      const f = logoFile.files && logoFile.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (logoUrl) logoUrl.value = reader.result;
        previewLogo(reader.result);
      };
      reader.readAsDataURL(f);
    });
  }
  if (container.querySelectorAll) {
    container.querySelectorAll('.gen-color-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.getAttribute('data-color');
        if (colorInput) colorInput.value = c;
        if (colorHex) colorHex.textContent = c;
        if (G && G.applyPalette) G.applyPalette(c);
      });
    });
  }
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      const c = colorInput.value;
      if (colorHex) colorHex.textContent = c;
      if (G && G.applyPalette) G.applyPalette(c);
    });
  }

  const saveGeneral = (extra) => {
    const obj = Object.assign({
      appName: nameInput ? nameInput.value.trim() : undefined,
      tagline: (G && G.get) ? G.get().tagline : undefined,
      logo: logoUrl ? logoUrl.value.trim() : undefined,
      primaryColor: colorInput ? colorInput.value : undefined,
      theme: themeSel ? themeSel.value : undefined
    }, extra || {});
    if (obj.appName === '') obj.appName = (G && G.get) ? G.get().appName : 'علاء الدين 🪔';
    const saved = G ? G.save(obj) : obj;
    if (window.showToast) window.showToast('✓ تم حفظ الإعدادات العامة محلياً', 'success');
    if (G && typeof G.pushToCloud === 'function') {
      G.pushToCloud().then((ok) => {
        if (window.showToast) window.showToast(ok ? '☁️ وتزامنت مع السحابة ✓' : '⚠️ سجّل الدخول لرفع الإعدادات للسحابة', ok ? 'success' : 'warning');
      }).catch((err) => {
        if (window.showToast) window.showToast('⚠️ حُفظت محلياً فقط — تعذر رفع السحابة: ' + (err && err.message ? err.message : String(err)), 'error');
      });
    }
    return saved;
  };

  const saveBtn = container.querySelector('#gen-save');
  if (saveBtn) saveBtn.addEventListener('click', () => saveGeneral());

  const resetBtn = container.querySelector('#gen-reset');
  if (resetBtn && G) {
    resetBtn.addEventListener('click', () => {
      G.save(G.get ? { appName: 'علاء الدين 🪔', tagline: 'للبطاطين والمفروشات', logo: '2.jpg', primaryColor: '#0284c7', theme: 'dark' } : {});
      // Re-sync the form fields from defaults
      const d = G.get();
      if (nameInput) nameInput.value = d.appName;
      if (logoUrl) logoUrl.value = d.logo;
      if (logoPreview) logoPreview.setAttribute('src', d.logo);
      if (colorInput) colorInput.value = d.primaryColor;
      if (colorHex) colorHex.textContent = d.primaryColor;
      if (themeSel) themeSel.value = d.theme;
      if (window.showToast) window.showToast('تم استعادة الإعدادات الافتراضية', 'success');
    });
  }

  // Theme toggle persists IMMEDIATELY (per requirement: preference in localStorage)
  if (themeSel) {
    themeSel.addEventListener('change', () => {
      const meta = THEME_META[themeSel.value] || THEME_META['dark'];
      if (G && typeof G.applyPalette === 'function') G.applyPalette(meta.accent);
      if (colorInput) colorInput.value = meta.accent;
      if (colorHex) colorHex.textContent = meta.accent;
      saveGeneral({ theme: themeSel.value, primaryColor: meta.accent });
      if (window.showToast) window.showToast('✓ تم التبديل إلى ثيم ' + meta.label, 'success');
    });
  }

  // Hydrate general settings from cloud when this view opens (other-browser changes)
  if (G && typeof G.hydrateFromCloud === 'function') {
    G.hydrateFromCloud().then((adopted) => {
      if (!adopted) return;
      const d = G.get();
      if (nameInput) nameInput.value = d.appName;
      if (logoUrl) logoUrl.value = d.logo;
      if (logoPreview) logoPreview.setAttribute('src', d.logo);
      if (colorInput) colorInput.value = d.primaryColor;
      if (colorHex) colorHex.textContent = d.primaryColor;
      if (themeSel) themeSel.value = d.theme;
    });
  }
};

/**
 * General System Settings Module — V3.17
 * =======================================
 * Appearance + identity settings that are available WITHOUT the admin password:
 *   - App name (updates the header, login screen, mobile drawer, <title>)
 *   - App logo (uploaded image or image URL)
 *   - Primary/accent color (runtime Tailwind `brand-*` re-theme via CSS vars)
 *   - Dark / Light mode (persisted in localStorage, mirrored to Firestore)
 *
 * Persistence:
 *   - localStorage key `bms_general_settings` (works even offline / file://)
 *   - Firestore doc `settings/appSettings` (LWW via `updatedAt`) so every
 *     browser that signs in restores the same name/logo/theme.
 *
 * Theming approach: the app is dark-by-default with hardcoded Tailwind classes.
 * Light mode is implemented as a `[data-theme="light"]` cascade in styles.css,
 * and the primary color is applied through `--brand-*` CSS variables that the
 * overrides in styles.css consume (see the brand override block).
 */

(function () {
  'use strict';

  const KEY = 'bms_general_settings';
  const NS = window.GeneralSettings = window.GeneralSettings || {};

  const DEFAULT = {
    appName: 'علاء الدين 🪔',
    tagline: 'للبطاطين والمفروشات',
    logo: '2.jpg',
    primaryColor: '#0284c7',
    theme: 'dark',
    updatedAt: 0
  };

  function readLocal() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      return v == null ? null : v;
    } catch (e) {
      return null;
    }
  }
  function writeLocal(o) {
    localStorage.setItem(KEY, JSON.stringify(o));
  }

  NS.get = function () {
    return Object.assign({}, DEFAULT, readLocal() || {});
  };

  // ---------------------------------------------------------------
  // Color helpers — derive the full brand-* palette from one accent.
  // ---------------------------------------------------------------
  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    const n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function blend(rgb, towardWhite, t) {
    const tgt = towardWhite ? [255, 255, 255] : [0, 0, 0];
    return '#' + rgb.map(function (v, i) {
      const x = Math.max(0, Math.min(255, Math.round(v + (tgt[i] - v) * t)));
      return x.toString(16).padStart(2, '0');
    }).join('');
  }
  function palette(primary) {
    const rgb = hexToRgb(primary) || hexToRgb('#0284c7');
    return {
      50: blend(rgb, true, 0.9),
      100: blend(rgb, true, 0.8),
      300: blend(rgb, true, 0.45),
      400: blend(rgb, true, 0.25),
      500: primary,
      600: blend(rgb, false, 0.1),
      700: blend(rgb, false, 0.2),
      800: blend(rgb, false, 0.3),
      900: blend(rgb, false, 0.45)
    };
  }

  const THEMES = ['dark', 'light', 'ocean', 'emerald', 'royal', 'coffee', 'luxury-gold', 'graphite'];

  NS.setTheme = function (theme) {
    const t = THEMES.indexOf(theme) !== -1 ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  NS.applyPalette = function (primary) {
    const p = palette(primary);
    const style = document.documentElement.style;
    Object.keys(p).forEach(function (k) { style.setProperty('--brand-' + k, p[k]); });
  };

  function applyBranding(g) {
    const name = g.appName || DEFAULT.appName;
    const tag = g.tagline || DEFAULT.tagline;
    const logo = g.logo || DEFAULT.logo;

    document.title = name + ' — نظام الإدارة اليومية الذكي';

    const setEl = function (ids, value, isSrc) {
      ids.forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        if (isSrc) {
          el.setAttribute('src', value);
          if (el.hasAttribute('alt')) el.setAttribute('alt', name);
        } else {
          el.textContent = value;
        }
      });
    };

    setEl(['header-brand-name', 'login-brand-name', 'mobile-brand-name'], name, false);
    setEl(['header-brand-tagline', 'login-brand-tagline', 'mobile-brand-tagline'], tag, false);
    setEl(['header-brand-logo', 'login-brand-logo', 'mobile-brand-logo'], logo, true);

    const foot = document.getElementById('footer-brand-text');
    if (foot) foot.textContent = name + ' — نظام الإدارة اليومية الذكي — جميع الحقوق محفوظة © 2026';

    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.setAttribute('href', logo);
  }

  NS.apply = function () {
    const g = NS.get();
    NS.setTheme(g.theme);
    NS.applyPalette(g.primaryColor);
    applyBranding(g);
  };

  NS.save = function (partial) {
    const prev = NS.get();
    const next = Object.assign({}, prev, partial || {});
    if (THEMES.indexOf(next.theme) === -1) next.theme = 'dark';
    if (!hexToRgb(next.primaryColor)) next.primaryColor = prev.primaryColor || DEFAULT.primaryColor;
    const prevStamp = Number(prev.updatedAt) || 0;
    next.updatedAt = Math.max(Date.now(), prevStamp + 1);
    if (window.isSandboxMode) {
      // Sandbox: apply the look visually ONLY — nothing is written to
      // localStorage or mirrored to Firestore (وضع الاختبار لا يمس البيانات).
      NS.apply();
      return next;
    }
    writeLocal(next);
    NS.apply();
    NS.pushToCloud();
    return next;
  };

  NS.pushToCloud = function () {
    if (window.isSandboxMode) return Promise.resolve(false);
    if (!window.db || !window._authUser) return Promise.resolve(false);
    const g = NS.get();
    try {
      const p = window.db.collection('settings').doc('appSettings').set({
        appName: g.appName,
        tagline: g.tagline,
        logo: g.logo,
        primaryColor: g.primaryColor,
        theme: g.theme,
        updatedAt: g.updatedAt
      }, { merge: true });
      p.catch(function (err) {
        window.dispatchEvent(new CustomEvent('bms-sync-error', {
          detail: { context: 'appSettings', message: err && err.message ? err.message : String(err) }
        }));
      });
      return p;
    } catch (e) {
      return Promise.reject(e);
    }
  };

  NS.hydrateFromCloud = function () {
    if (window.isSandboxMode || !window.db || !window._authUser) return Promise.resolve(false);
    return window.db.collection('settings').doc('appSettings').get()
      .then(function (snap) {
        if (!snap.exists) return false;
        const cloud = snap.data() || {};
        const ct = Number(cloud.updatedAt) || 0;
        if (!ct) return false;
        const local = NS.get();
        const lt = Number(local.updatedAt) || 0;
        if (ct > lt) {
          writeLocal(Object.assign({}, local, cloud, { updatedAt: ct }));
          NS.apply();
          return true;
        } else if (lt > ct) {
          NS.pushToCloud();
        }
        return false;
      })
      .catch(function () { return false; });
  };

  // Public aliases used by other modules / views.
  window.applyGeneralSettings = NS.apply;
  window.saveGeneralSettings = NS.save;
  window.hydrateGeneralSettings = NS.hydrateFromCloud;
  window.generalSettings = NS;

  function boot() {
    NS.apply();
    if (window._authUser) NS.hydrateFromCloud();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

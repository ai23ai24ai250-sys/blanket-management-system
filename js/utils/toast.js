/**
 * Arabic Toast Notification Utility
 */

window.showToast = function(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');

  let iconName = 'check-circle-2';
  let bgClasses = 'bg-slate-900 text-white';

  switch (type) {
    case 'success':
      iconName = 'check-circle-2';
      bgClasses = 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80';
      break;
    case 'error':
      iconName = 'alert-triangle';
      bgClasses = 'bg-rose-950/90 text-rose-200 border-rose-800/80';
      break;
    case 'warning':
      iconName = 'alert-circle';
      bgClasses = 'bg-amber-950/90 text-amber-200 border-amber-800/80';
      break;
    case 'info':
      iconName = 'info';
      bgClasses = 'bg-sky-950/90 text-sky-200 border-sky-800/80';
      break;
  }

  toast.className = `pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-2xl text-sm font-semibold transition-all duration-300 transform translate-y-4 opacity-0 border ${bgClasses}`;

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i data-lucide="${iconName}" class="w-5 h-5 shrink-0"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close-btn text-slate-400 hover:text-white p-1">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);

  if (window.lucide) {
    window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
  }

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  const dismiss = () => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };

  const closeBtn = toast.querySelector('.toast-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
};

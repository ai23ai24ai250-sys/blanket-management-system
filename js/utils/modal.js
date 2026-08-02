/**
 * Generic Dialog / Modal Manager Utility
 * Completely cleans backdrop container on close to prevent sticky blank modals
 */

window.openModal = function({ title, icon = 'layers', contentHTML, maxWidth = 'max-w-2xl', onRender = null, onClose = null }) {
  let container = document.getElementById('modal-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'modal-container';
    document.body.appendChild(container);
  }

  // Clear any existing leftover child elements in container
  container.innerHTML = '';
  container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto modal-animate';
  container.classList.remove('hidden');

  const modalId = `modal-${Date.now()}`;

  const modalWrapper = document.createElement('div');
  modalWrapper.id = modalId;
  modalWrapper.className = 'relative w-full ' + maxWidth + ' bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]';

  modalWrapper.innerHTML = `
    <!-- Modal Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
          <i data-lucide="${icon}" class="w-5 h-5"></i>
        </div>
        <h3 class="text-lg font-bold text-white">${title}</h3>
      </div>
      <button id="${modalId}-close" class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="p-6 overflow-y-auto flex-1 space-y-4">
      ${contentHTML}
    </div>
  `;

  const closeModal = () => {
    container.classList.add('opacity-0');
    setTimeout(() => {
      // Only wipe the container if this exact modal is still displayed.
      // Prevents destroying a newly opened (nested) modal during the fade-out delay.
      if (container.querySelector(`#${modalId}`)) {
        container.innerHTML = '';
        container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm hidden';
        if (typeof onClose === 'function') onClose();
      }
    }, 150);
  };

  container.appendChild(modalWrapper);

  const closeBtn = document.getElementById(`${modalId}-close`);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  
  container.onclick = (e) => {
    if (e.target === container) closeModal();
  };

  if (window.lucide) {
    window.lucide.createIcons({ props: {}, nameAttr: 'data-lucide' });
  }

  if (typeof onRender === 'function') {
    onRender(modalWrapper, closeModal);
  }

  return { modalId, closeModal };
};

window.closeModal = function(modalId = null) {
  const container = document.getElementById('modal-container');
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
};

window.closeModalById = function(modalId) {
  window.closeModal(modalId);
};

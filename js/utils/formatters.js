/**
 * Utility functions for Arabic currency, dates, numbers, and auto-generated IDs
 */

window.formatCurrency = function(amount, currency = 'ج.م') {
  const numeric = Number(amount) || 0;
  return `${numeric.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
};

window.formatNumber = function(num) {
  const numeric = Number(num) || 0;
  return numeric.toLocaleString('ar-EG');
};

window.formatDate = function(dateInput) {
  if (!dateInput) return '—';
  let date;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

window.formatShortDate = function(dateInput) {
  if (!dateInput) return '—';
  let date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return date.toISOString().split('T')[0];
};

window.generateAutoId = function(prefix = 'REF') {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${timestamp}${randomDigits.toString().slice(-2)}`;
};

window.validateEgyptianPhone = function(phone) {
  if (!phone) return { isValid: false, message: 'رقم الهاتف مطلوب' };
  const cleaned = phone.trim();
  const phoneRegex = /^0\d{10}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      message: 'رقم الهاتف يجب أن يتكون من 11 رقم بالضبط ويبدأ برقم 0 (مثال: 01012345678)'
    };
  }

  return { isValid: true, cleaned };
};

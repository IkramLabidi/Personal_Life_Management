export const currency = (value, code = 'TND') =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${code}`.trim();

export const formatDate = (value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, opts);
};

export const formatDateShort = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '—';

export const toInputDate = (value) => {
  const d = value ? new Date(value) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const relativeDays = (value) => {
  if (!value) return '';
  const diff = Math.round((new Date(value) - new Date()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `in ${diff} days`;
};

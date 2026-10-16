// Date and money formatting shared by every screen, in Indian conventions.

const toDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// "17 Oct 2026", or "17 Oct" with { year: false }.
export const fmtDate = (value, { year = true } = {}) => {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });
};

// "10:30" from a time string like "10:30:00", or "10:30 AM" from a full date.
export const fmtTime = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) return value.slice(0, 5);
  const d = toDate(value);
  return d ? d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';
};

// "just now", "5 min ago", "3 h ago", "yesterday", or the date beyond a week.
export const relativeTime = (value) => {
  const d = toDate(value);
  if (!d) return '';
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 172800) return 'yesterday';
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return fmtDate(d, { year: d.getFullYear() !== new Date().getFullYear() });
};

// Money is stored in whole paise; show it as rupees: "₹1,25,000".
export const fmtINR = (paise) => {
  const rupees = (Number(paise) || 0) / 100;
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: rupees % 1 ? 2 : 0 })}`;
};

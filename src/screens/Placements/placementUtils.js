import { fmtDate } from '../../utils/format';

// eligible is true, false, or null when the server can't tell (no SGPA yet).
export const eligibility = (d) => {
  if (d.eligible === true) return { tone: 'success', label: 'Eligible' };
  if (d.eligible === false) return { tone: 'danger', label: 'Not eligible' };
  if (d.eligible === null) return { tone: 'neutral', label: 'Eligibility unknown' };
  return null;
};

export const packageLabel = (d) => (d.package_lpa != null ? `${Number(d.package_lpa)} LPA` : null);

export const driveDates = (d) => {
  if (!d.drive_date) return null;
  return d.end_date && d.end_date !== d.drive_date
    ? `${fmtDate(d.drive_date, { year: false })} – ${fmtDate(d.end_date)}`
    : fmtDate(d.drive_date);
};

// Rounds are free-form JSON: plain strings, or objects with a name/title and
// maybe a date and notes.
export const roundText = (r) => {
  if (r == null) return { title: '' };
  if (typeof r === 'string') return { title: r };
  return {
    title: r.name || r.title || r.round || 'Round',
    detail: [r.date ? fmtDate(r.date) : null, r.mode, r.description || r.notes].filter(Boolean).join(' · '),
  };
};

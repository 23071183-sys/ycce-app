// Plans are dated in college time (IST), so "today" is too.
export const todayISO = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

const days = (plan) => (plan?.weeks || []).flatMap(w => (w.days || []).map(d => ({ ...d, focus: w.focus })));

export const todaysTasks = (plan) => days(plan).find(d => d.date === todayISO())?.tasks || [];

// Today first, then the days still ahead, then (for reference) the ones past.
export const orderedDays = (plan) => {
  const today = todayISO();
  const all = days(plan);
  return [
    ...all.filter(d => d.date === today),
    ...all.filter(d => d.date > today),
    ...all.filter(d => d.date < today),
  ];
};

// The saved plan is JSON; tolerate it arriving as a string.
export const planOf = (row) => {
  const p = row?.plan;
  if (typeof p !== 'string') return p || null;
  try { return JSON.parse(p); } catch { return null; }
};

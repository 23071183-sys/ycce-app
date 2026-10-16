// Random v4 UUID for a message's client_id, which makes retried sends
// idempotent on the server. Math.random is enough here: it only has to be
// unique per sender, not unguessable.
export const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

// "Professor", "Admin", or the student's year and roll number.
export const describePerson = (p) => {
  if (!p) return '';
  if (p.role === 'student') return [p.year ? `Year ${p.year}` : null, p.roll_number].filter(Boolean).join(' · ') || 'Student';
  if (p.role === 'super_admin' || p.role === 'admin') return 'Admin';
  if (p.role === 'professor') return p.designation || 'Professor';
  return p.role || '';
};

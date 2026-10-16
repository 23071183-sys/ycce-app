// The server flags a badge as new only in the response that awarded it. Home
// fetches progress before Profile usually does, so remember those flags for
// the rest of the session and Profile can still say "New".
const fresh = new Set();

export const rememberNewBadges = (progress) => {
  (progress?.badges || []).forEach(b => { if (b.new) fresh.add(b.key); });
};

export const isNewBadge = (badge) => Boolean(badge.new) || fresh.has(badge.key);

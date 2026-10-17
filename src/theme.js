// Design tokens. The admin site uses the same palette (app/globals.css in
// ycce-app-web), so the two stay consistent.
//
// The base is a clean neutral layout with one accent (blue) for selection and
// primary actions. On top of that, colour marks areas and identity: each
// brand (Compufest, Yash Fest, the assistant, Results) has a fixed gradient,
// and each subject keeps one of eight hues everywhere it appears. Status
// colours (success / warning / danger) still only carry meaning: attendance
// thresholds, fee status, pass and fail.

const lightRoles = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F2',
  border: '#E3E3E6',
  borderStrong: '#C7C7CC',
  text: '#0A0A0A',
  textSecondary: '#3C3C43',
  textMuted: '#8E8E93',
  accent: '#007AFF',
  accentFg: '#FFFFFF',
  accentSoft: 'rgba(0,122,255,0.12)',
  success: '#248A3D',
  successSoft: 'rgba(36,138,61,0.12)',
  warning: '#B25000',
  warningSoft: 'rgba(178,80,0,0.12)',
  danger: '#D70015',
  dangerSoft: 'rgba(215,0,21,0.12)',
};

const darkRoles = {
  bg: '#000000',
  surface: '#0F0F10',
  surfaceAlt: '#1A1A1C',
  border: '#262628',
  borderStrong: '#3A3A3C',
  text: '#FAFAFA',
  textSecondary: '#A1A1A6',
  textMuted: '#636366',
  accent: '#0A84FF',
  accentFg: '#FFFFFF',
  accentSoft: 'rgba(10,132,255,0.16)',
  success: '#30D158',
  successSoft: 'rgba(48,209,88,0.16)',
  warning: '#FF9F0A',
  warningSoft: 'rgba(255,159,10,0.16)',
  danger: '#FF453A',
  dangerSoft: 'rgba(255,69,58,0.16)',
};

// Subject hues, in hueFor order. fg is for letters and strips, soft for tiles.
export const HUE_KEYS = ['teal', 'indigo', 'amber', 'rose', 'emerald', 'sky', 'violet', 'orange'];

const lightHues = {
  teal: { fg: '#0D9488', soft: 'rgba(13,148,136,0.12)' },
  indigo: { fg: '#4F46E5', soft: 'rgba(79,70,229,0.12)' },
  amber: { fg: '#B45309', soft: 'rgba(180,83,9,0.12)' },
  rose: { fg: '#E11D48', soft: 'rgba(225,29,72,0.12)' },
  emerald: { fg: '#059669', soft: 'rgba(5,150,105,0.12)' },
  sky: { fg: '#0284C7', soft: 'rgba(2,132,199,0.12)' },
  violet: { fg: '#7C3AED', soft: 'rgba(124,58,237,0.12)' },
  orange: { fg: '#EA580C', soft: 'rgba(234,88,12,0.12)' },
};

const darkHues = {
  teal: { fg: '#2DD4BF', soft: 'rgba(45,212,191,0.16)' },
  indigo: { fg: '#818CF8', soft: 'rgba(129,140,248,0.16)' },
  amber: { fg: '#FBBF24', soft: 'rgba(251,191,36,0.16)' },
  rose: { fg: '#FB7185', soft: 'rgba(251,113,133,0.16)' },
  emerald: { fg: '#34D399', soft: 'rgba(52,211,153,0.16)' },
  sky: { fg: '#38BDF8', soft: 'rgba(56,189,248,0.16)' },
  violet: { fg: '#A78BFA', soft: 'rgba(167,139,250,0.16)' },
  orange: { fg: '#FB923C', soft: 'rgba(251,146,60,0.16)' },
};

export const palette = {
  light: { ...lightRoles, hues: lightHues },
  dark: { ...darkRoles, hues: darkHues },
};

// Brand gradients. Fixed, so they look the same in light and dark mode; text
// on them is always white. soft is a translucent tint for chips and fills.
export const brand = {
  compufest: { from: '#0EA5E9', to: '#6366F1', soft: 'rgba(14,165,233,0.14)', fg: '#0284C7', fgDark: '#38BDF8' },
  yash: { from: '#F97316', to: '#EC4899', soft: 'rgba(249,115,22,0.14)', fg: '#EA580C', fgDark: '#FB923C' },
  assistant: { from: '#8B5CF6', to: '#EC4899', soft: 'rgba(139,92,246,0.14)', fg: '#7C3AED', fgDark: '#A78BFA' },
  results: { from: '#10B981', to: '#0EA5E9', soft: 'rgba(16,185,129,0.14)', fg: '#059669', fgDark: '#34D399' },
  onBrand: '#FFFFFF',
  onBrandMuted: 'rgba(255,255,255,0.78)',
  onBrandFaint: 'rgba(255,255,255,0.22)',
};

// The readable solid colour of a brand for the current scheme (for text, icons
// and buttons on ordinary surfaces).
export const brandFg = (key, scheme) => (scheme === 'dark' ? brand[key].fgDark : brand[key].fg);

// A subject's hue name from its id or code. The same key always gives the same
// hue, here and on the website. No key means neutral (null).
export const hueFor = (key) => {
  if (key === null || key === undefined || key === '') return null;
  const s = String(key);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return HUE_KEYS[h % HUE_KEYS.length];
};

// { fg, soft } for a hue name in a colour set, or neutral colours for null.
export const hueColors = (colors, hue) =>
  (hue && colors.hues?.[hue]) || { fg: colors.textSecondary, soft: colors.surfaceAlt };

// Which hue a grade is shown in. null for blank or unknown grades.
export const gradeTone = (grade) => {
  const g = String(grade ?? '').trim().toUpperCase();
  if (!g || g === '—') return null;
  if (['O', 'A+'].includes(g)) return 'emerald';
  if (['A', 'B+'].includes(g)) return 'sky';
  if (['B', 'C', 'C+'].includes(g)) return 'amber';
  if (['D', 'E', 'F', 'FF', 'FAIL'].includes(g)) return 'rose';
  return null;
};

// Kept for anything that still imports them directly.
export const light = palette.light;
export const dark = palette.dark;

// 4pt grid.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 };

export const radius = { sm: 6, md: 8, lg: 12, xl: 16, full: 999 };

// label is the small uppercase, letter-spaced caption used for section titles.
export const type = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '200', fontVariant: ['tabular-nums'] },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  callout: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.9 },
  numeric: { fontSize: 28, lineHeight: 32, fontWeight: '300', fontVariant: ['tabular-nums'] },
};

// Attendance thresholds: 75% is the college minimum, under 60% is serious.
// Fee status reuses the same three tones.
export const attendanceTone = (pct) => {
  const n = Number(pct) || 0;
  if (n >= 75) return 'success';
  if (n >= 60) return 'warning';
  return 'danger';
};

// Picks the foreground and soft background for a tone from a colour set.
export const toneColors = (colors, tone) => {
  switch (tone) {
    case 'success': return { fg: colors.success, bg: colors.successSoft };
    case 'warning': return { fg: colors.warning, bg: colors.warningSoft };
    case 'danger': return { fg: colors.danger, bg: colors.dangerSoft };
    case 'accent': return { fg: colors.accent, bg: colors.accentSoft };
    default: return { fg: colors.textSecondary, bg: colors.surfaceAlt };
  }
};

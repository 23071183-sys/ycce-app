// Design tokens for the "monochrome refined" look. The admin site uses the same
// palette (app/globals.css in ycce-app-web), so the two stay consistent.
//
// One accent colour only. Status colours (success / warning / danger) are for
// meaning — attendance thresholds, fee status — never for decoration.

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

export const palette = {
  light: lightRoles,
  dark: darkRoles,
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

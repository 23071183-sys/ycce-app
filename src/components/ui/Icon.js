import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// Ionicons with the theme's colours. Use this instead of emoji, which render
// differently on every phone and can't follow light and dark mode.
export default function Icon({ name, size = 18, tone = 'secondary', color, style }) {
  const c = useTheme();
  const tones = {
    default: c.text,
    secondary: c.textSecondary,
    muted: c.textMuted,
    accent: c.accent,
    success: c.success,
    warning: c.warning,
    danger: c.danger,
    inverse: c.accentFg,
  };
  return <Ionicons name={name} size={size} color={color || tones[tone] || c.textSecondary} style={style} />;
}

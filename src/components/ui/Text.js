import React from 'react';
import { Text as RNText } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';

const TONES = {
  default: 'text',
  secondary: 'textSecondary',
  muted: 'textMuted',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  inverse: 'accentFg',
};

// Typography from the type scale. Pick a variant for size and weight and a tone
// for colour, instead of setting fontSize and colours inline.
export default function Text({ variant = 'body', tone, style, children, ...rest }) {
  const c = useTheme();
  // Labels are muted by default; everything else is full-strength text.
  const colorKey = TONES[tone || (variant === 'label' ? 'muted' : 'default')] || 'text';
  return (
    <RNText style={[type[variant] || type.body, { color: c[colorKey] }, style]} {...rest}>
      {children}
    </RNText>
  );
}

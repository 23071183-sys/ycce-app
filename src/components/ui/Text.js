import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
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
  const base = type[variant] || type.body;
  // A caller that enlarges fontSize without its own lineHeight would keep the
  // variant's smaller lineHeight, and newer React Native clips the glyphs to it
  // (the "83%" in the attendance ring was cut off top and bottom).
  const flat = StyleSheet.flatten(style) || {};
  const fit = flat.fontSize && flat.lineHeight == null && base.lineHeight != null && flat.fontSize * 1.2 > base.lineHeight
    ? { lineHeight: Math.round(flat.fontSize * 1.25) }
    : null;
  return (
    <RNText style={[base, { color: c[colorKey] }, style, fit]} {...rest}>
      {children}
    </RNText>
  );
}

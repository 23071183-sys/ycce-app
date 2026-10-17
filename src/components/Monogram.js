import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ui';
import { useTheme } from '../context/ThemeContext';
import { hueColors, hueFor, radius } from '../theme';

const letters = (name = '') =>
  name
    .split(/[\s&,-]+/)
    .filter(w => /^[A-Za-z]/.test(w) && !/^(and|of|the|for|in|to)$/i.test(w))
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase() || '?';

// A two-letter tile that stands in for a subject. Pass colorKey (the subject's
// id) for its hue: a soft hue background with hue-coloured letters. Without
// one it stays neutral.
export default function Monogram({ name, size = 40, colorKey }) {
  const c = useTheme();
  const hue = hueFor(colorKey);
  const { fg, soft } = hueColors(c, hue);
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: hue ? soft : c.surfaceAlt, borderColor: hue ? 'transparent' : c.border },
      ]}
    >
      <Text variant="callout" style={[styles.text, { color: hue ? fg : c.textSecondary, fontSize: size * 0.34 }]}>
        {letters(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '600', letterSpacing: 0.5 },
});

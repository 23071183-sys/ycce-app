import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './ui';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme';

const letters = (name = '') =>
  name
    .split(/[\s&,-]+/)
    .filter(w => /^[A-Za-z]/.test(w) && !/^(and|of|the|for|in|to)$/i.test(w))
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase() || '?';

// A neutral two-letter tile that stands in for a subject, replacing the old
// per-subject colours.
export default function Monogram({ name, size = 40 }) {
  const c = useTheme();
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      <Text variant="callout" tone="secondary" style={styles.text}>{letters(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '600', letterSpacing: 0.5 },
});

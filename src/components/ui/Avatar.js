import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Text from './Text';
import { useTheme } from '../../context/ThemeContext';

const initials = (name = '') =>
  name
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?';

// A round photo, or the person's initials when there is no photo.
export default function Avatar({ name, uri, size = 40, style }) {
  const c = useTheme();
  const frame = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[frame, { backgroundColor: c.surfaceAlt }, style]} />;
  }
  return (
    <View style={[frame, styles.center, { backgroundColor: c.surfaceAlt, borderColor: c.border }, style]}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '600', color: c.textSecondary }}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});

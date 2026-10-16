import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { useTheme } from '../../context/ThemeContext';
import { radius, space, toneColors } from '../../theme';

// A small status pill. tone is neutral, accent, success, warning or danger.
export default function Badge({ children, tone = 'neutral', style }) {
  const c = useTheme();
  const { fg, bg } = toneColors(c, tone);
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text variant="caption" style={[styles.text, { color: fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 2 },
  text: { fontWeight: '600' },
});

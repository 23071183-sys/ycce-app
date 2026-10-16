import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { useTheme } from '../../context/ThemeContext';
import { space } from '../../theme';

// A label on the left and its value on the right, with a hairline under it.
// Pass last on the final row of a group to drop the divider.
export default function InfoRow({ label, value, last = false, valueTone }) {
  const c = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Text variant="callout" tone="muted">{label}</Text>
      <Text variant="callout" tone={valueTone} style={styles.value} numberOfLines={2}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.md, gap: space.lg },
  value: { flexShrink: 1, textAlign: 'right' },
});

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { useTheme } from '../../context/ThemeContext';
import { radius, space } from '../../theme';

// A row of mutually exclusive options. options is a list of strings or
// { value, label } objects; value is the selected one. activeColor tints the
// selected segment, for screens with their own colour (a fest, a subject).
export default function SegmentedControl({ options, value, onChange, style, activeColor }) {
  const c = useTheme();
  const items = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <View style={[styles.track, { backgroundColor: c.surfaceAlt }, style]} accessibilityRole="tablist">
      {items.map(item => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              selected && {
                backgroundColor: c.surface,
                borderColor: activeColor || c.border,
                borderWidth: activeColor ? 1 : StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Text
              variant="callout"
              tone={selected ? 'default' : 'muted'}
              style={[selected && styles.selectedText, selected && activeColor && { color: activeColor }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.md, padding: 2 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: space.sm - 1, borderRadius: radius.md - 2 },
  selectedText: { fontWeight: '600' },
});

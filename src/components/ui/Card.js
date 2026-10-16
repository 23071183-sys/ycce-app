import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, space } from '../../theme';

// The standard surface: hairline border, 12 radius, no shadow. Pass onPress to
// make the whole card tappable.
export default function Card({ children, onPress, padded = true, style, ...rest }) {
  const c = useTheme();
  const base = [
    styles.card,
    { backgroundColor: c.surface, borderColor: c.border },
    padded && styles.padded,
    style,
  ];
  if (!onPress) return <View style={base} {...rest}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...base, pressed && { backgroundColor: c.surfaceAlt }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  padded: { padding: space.lg },
});

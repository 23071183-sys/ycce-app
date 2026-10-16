import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { radius, space } from '../../theme';

// primary: the one main action on a screen (accent fill).
// secondary: outlined, for everything else.
// ghost: text only. destructive: for deleting and rejecting.
export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  size = 'md',
  style,
}) {
  const c = useTheme();
  const look = {
    primary: { bg: c.accent, fg: c.accentFg, border: c.accent },
    secondary: { bg: 'transparent', fg: c.text, border: c.borderStrong },
    ghost: { bg: 'transparent', fg: c.accent, border: 'transparent' },
    destructive: { bg: c.dangerSoft, fg: c.danger, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.small,
        { backgroundColor: look.bg, borderColor: look.border },
        pressed && !inactive && { opacity: 0.75 },
        inactive && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={look.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={16} color={look.fg} /> : null}
          <Text variant={size === 'sm' ? 'callout' : 'body'} style={[styles.label, { color: look.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  small: { minHeight: 32, paddingHorizontal: space.md },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontWeight: '600' },
});

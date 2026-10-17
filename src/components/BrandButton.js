import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { GradientFill } from './brand';
import { Icon, Text } from './ui';
import { brand, radius, space } from '../theme';

// A primary button filled with a brand gradient, for an area's main action
// (e.g. Register on a fest event). White label in both themes.
export default function BrandButton({ brandKey, title, onPress, icon, loading = false, disabled = false, size = 'md', style }) {
  const g = brand[brandKey];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [pressed && !inactive && styles.pressed, inactive && styles.inactive, style]}
    >
      <GradientFill from={g.from} to={g.to} direction="horizontal" radius={radius.md} style={[styles.base, size === 'sm' && styles.small]}>
        {loading ? (
          <ActivityIndicator size="small" color={brand.onBrand} />
        ) : (
          <View style={styles.content}>
            {icon ? <Icon name={icon} size={16} color={brand.onBrand} /> : null}
            <Text variant={size === 'sm' ? 'callout' : 'body'} style={styles.label}>{title}</Text>
          </View>
        )}
      </GradientFill>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  small: { minHeight: 32, paddingHorizontal: space.md },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontWeight: '600', color: brand.onBrand },
  pressed: { opacity: 0.8 },
  inactive: { opacity: 0.5 },
});

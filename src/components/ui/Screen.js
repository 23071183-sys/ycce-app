import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { space } from '../../theme';

// The page container for every screen: themed background, standard padding,
// and pull-to-refresh whenever onRefresh is given. Pass scroll={false} for
// screens that render their own FlatList.
export default function Screen({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  padded = true,
  style,
  contentStyle,
}) {
  const c = useTheme();
  if (!scroll) {
    return (
      <View style={[styles.fill, { backgroundColor: c.bg }, padded && styles.padded, style]}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: c.bg }, style]}
      contentContainerStyle={[padded && styles.padded, styles.bottom, contentStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textMuted} colors={[c.accent]} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { padding: space.lg },
  bottom: { paddingBottom: space.huge },
});

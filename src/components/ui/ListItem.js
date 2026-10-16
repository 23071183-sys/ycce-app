import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { space } from '../../theme';

// A row for lists of subjects, people, notices or conversations: something on
// the left (icon or avatar), a title and subtitle, and something on the right.
// A chevron shows when the row is tappable unless chevron={false}.
export default function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron = true,
  last = false,
  numberOfLines = 1,
}) {
  const c = useTheme();
  const divider = !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border };
  const body = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.text}>
        <Text variant="body" numberOfLines={numberOfLines}>{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted" numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {onPress && chevron ? <Icon name="chevron-forward" size={16} tone="muted" /> : null}
    </>
  );
  if (!onPress) return <View style={[styles.row, divider]}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider, pressed && { backgroundColor: c.surfaceAlt }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md, gap: space.md },
  leading: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  subtitle: { marginTop: 2 },
  trailing: { alignItems: 'flex-end' },
});

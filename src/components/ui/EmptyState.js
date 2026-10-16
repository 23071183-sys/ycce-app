import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import Button from './Button';
import { space } from '../../theme';

// Shown when a list has nothing in it, so the screen never looks broken or
// blank. Say what belongs here and, if there's something to do, offer it.
export default function EmptyState({ icon = 'albums-outline', title, message, actionTitle, onAction, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Icon name={icon} size={32} tone="muted" />
      {title ? <Text variant="heading" style={styles.title}>{title}</Text> : null}
      {message ? <Text variant="callout" tone="muted" style={styles.message}>{message}</Text> : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} variant="secondary" size="sm" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.huge, paddingHorizontal: space.xxl },
  title: { marginTop: space.md, textAlign: 'center' },
  message: { marginTop: space.xs, textAlign: 'center' },
  action: { marginTop: space.lg },
});

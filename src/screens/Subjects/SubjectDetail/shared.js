import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../../context/ThemeContext';
import { Card, Icon, Text } from '../../../components/ui';
import { radius, space } from '../../../theme';

export const UNITS = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5', 'Unit 6', 'Unit 7', 'Unit 8'];

export const fmtLong = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtShort = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Classes still needed to climb back to 75% if every future class is attended.
export const classesToRecover = (present, total) => Math.ceil((0.75 * total - present) / 0.25);

export async function pickDocument() {
  try {
    const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.length > 0) return r.assets[0];
  } catch { Alert.alert('Error', 'Could not pick file'); }
  return null;
}

// The file part of a multipart upload, in the shape React Native's FormData expects.
export const filePart = (file) => ({ uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });

// A professor's "post something" form, folded away until tapped.
export function CollapsibleForm({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={styles.formCard}>
      <Pressable onPress={() => setOpen(!open)} style={styles.formHead} accessibilityState={{ expanded: open }}>
        <Icon name="add" tone="accent" />
        <Text variant="body" tone="accent" style={styles.flex}>{title}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} tone="muted" />
      </Pressable>
      {open ? <View style={styles.formBody}>{children(() => setOpen(false))}</View> : null}
    </Card>
  );
}

// Dashed "attach a file" target, with a remove link once something is picked.
export function FileField({ file, onPick, onClear, placeholder }) {
  const c = useTheme();
  return (
    <View style={styles.fileWrap}>
      <Pressable
        onPress={onPick}
        style={[styles.fileTarget, { backgroundColor: c.surfaceAlt, borderColor: c.borderStrong }]}
      >
        <Icon name={file ? 'attach-outline' : 'document-outline'} size={16} tone="muted" />
        <Text variant="callout" tone="secondary" numberOfLines={1} style={styles.flexShrink}>{file ? file.name : placeholder}</Text>
      </Pressable>
      {file ? (
        <Pressable onPress={onClear} hitSlop={8} style={styles.remove}>
          <Text variant="caption" tone="danger">Remove file</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// A tappable file row that opens the URL.
export function FileLink({ url, name, icon = 'document-text-outline' }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => [
        styles.fileLink,
        { backgroundColor: pressed ? c.border : c.surfaceAlt, borderColor: c.border },
      ]}
    >
      <Icon name={icon} size={15} tone="muted" />
      <Text variant="callout" numberOfLines={1} style={styles.flex}>{name || 'View attachment'}</Text>
      <Icon name="download-outline" size={15} tone="muted" />
    </Pressable>
  );
}

// Posted-by line under notes and announcements.
export function Byline({ name, date }) {
  return <Text variant="caption" tone="muted" style={styles.byline}>By {name} · {fmtLong(date)}</Text>;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  formCard: { marginBottom: space.lg },
  formHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  formBody: { marginTop: space.lg },
  fileWrap: { marginBottom: space.md },
  fileTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  remove: { alignSelf: 'center', marginTop: space.sm },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  byline: { marginTop: space.sm },
  item: { marginBottom: space.md },
  itemBody: { marginTop: space.xs },
});

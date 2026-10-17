import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from './ui';
import { space } from '../theme';

// The small slice of Markdown the AI assistant writes: **bold**, *italic*,
// `code`, [links](url), "- " / "* " / "1. " list items and "#" headings.
// Anything else shows as plain text, so nothing is ever lost.

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

function Inline({ text }) {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} variant="body" style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Text key={i} variant="body" style={styles.code}>{part.slice(1, -1)}</Text>;
    }
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
    if (link) {
      return <Text key={i} variant="body" tone="accent" onPress={() => Linking.openURL(link[2])}>{link[1]}</Text>;
    }
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return <Text key={i} variant="body" style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    return part;
  });
}

export default function RichText({ children, style }) {
  const lines = String(children ?? '').replace(/\r/g, '').split('\n');
  return (
    <View style={styles.wrap}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={i} style={styles.gap} />;
        const heading = /^#{1,6}\s+(.*)$/.exec(line);
        if (heading) {
          return <Text key={i} variant="heading" style={style}><Inline text={heading[1]} /></Text>;
        }
        const bullet = /^(\s*)[-*•]\s+(.*)$/.exec(line);
        const numbered = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line);
        if (bullet || numbered) {
          const indent = Math.min(Math.floor((bullet || numbered)[1].length / 2), 3);
          return (
            <View key={i} style={[styles.item, { paddingLeft: indent * space.md }]}>
              <Text variant="body" style={[styles.marker, style]}>{bullet ? '•' : `${numbered[2]}.`}</Text>
              <Text variant="body" style={[styles.itemText, style]}><Inline text={bullet ? bullet[2] : numbered[3]} /></Text>
            </View>
          );
        }
        return <Text key={i} variant="body" style={style}><Inline text={line} /></Text>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  gap: { height: space.sm },
  bold: { fontWeight: '600' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'Courier' },
  item: { flexDirection: 'row', gap: space.sm },
  marker: { minWidth: 14 },
  itemText: { flex: 1 },
});

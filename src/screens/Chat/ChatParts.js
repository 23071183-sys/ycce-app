import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text as RNText, TextInput, View } from 'react-native';
import { useTheme, useThemeControls } from '../../context/ThemeContext';
import RichText from '../../components/RichText';
import { AssistantLogo, GradientFill } from '../../components/brand';
import { Icon, SectionLabel, Text } from '../../components/ui';
import { brand, brandFg, radius, space, type } from '../../theme';

// Header title: the assistant mark beside the name.
export function ChatTitle() {
  const c = useTheme();
  return (
    <View style={styles.title}>
      <AssistantLogo size={24} />
      <RNText style={[type.heading, { color: c.text }]}>CT Assistant</RNText>
    </View>
  );
}

// The welcome shown when there's no conversation yet.
export function GreetingCard({ name, children }) {
  const g = brand.assistant;
  return (
    <GradientFill from={g.from} to={g.to} radius={radius.xl} style={styles.greeting}>
      <View style={styles.greetingHead}>
        <View style={styles.greetingLogo}><AssistantLogo size={44} /></View>
        <RNText style={[type.title, styles.greetingTitle]}>Hi {name}!</RNText>
      </View>
      <RNText style={[type.body, styles.greetingText]}>{children}</RNText>
    </GradientFill>
  );
}

// Assistant messages sit beside the assistant's avatar; the user's are on the right.
function Beside({ isUser, children }) {
  if (isUser) return <View style={[styles.message, styles.mine]}>{children}</View>;
  return (
    <View style={[styles.message, styles.theirs, styles.withAvatar]}>
      <View style={styles.avatar}><AssistantLogo size={28} /></View>
      <View style={styles.flexShrink}>{children}</View>
    </View>
  );
}

export function MessageBubble({ item, onOpenPdf }) {
  const c = useTheme();
  const isUser = item.role === 'user';
  return (
    <Beside isUser={isUser}>
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleMine, { backgroundColor: c.text }]
            : [styles.bubbleTheirs, { backgroundColor: c.surface, borderColor: item.error ? c.danger : c.border }],
        ]}
      >
        {isUser
          ? <Text variant="body" style={{ color: c.bg }}>{item.content}</Text>
          : <RichText>{item.content}</RichText>}

        {item.pdf_url && (
          <Pressable
            onPress={() => onOpenPdf(item.pdf_url)}
            style={({ pressed }) => [
              styles.pdf,
              { backgroundColor: pressed ? c.border : c.surfaceAlt, borderColor: c.border },
            ]}
          >
            <View style={[styles.pdfIcon, { backgroundColor: c.accentSoft }]}>
              <Icon name="document-text-outline" size={18} tone="accent" />
            </View>
            <View style={styles.flex}>
              <Text variant="callout" style={styles.pdfName}>Attendance Report.pdf</Text>
              <Text variant="caption" tone="muted">Tap to open</Text>
            </View>
            <Icon name="download-outline" size={18} tone="accent" />
          </Pressable>
        )}
      </View>
      {item.memory_note ? (
        <View style={styles.memory}>
          <Icon name="bookmark-outline" size={12} tone="muted" />
          <Text variant="caption" tone="muted" style={styles.flexShrink}>Saved to memory: {item.memory_note}</Text>
        </View>
      ) : null}
    </Beside>
  );
}

export function TypingBubble() {
  const c = useTheme();
  return (
    <Beside isUser={false}>
      <View style={[styles.bubble, styles.bubbleTheirs, { backgroundColor: c.surface, borderColor: c.border }]}>
        <ActivityIndicator size="small" color={c.textMuted} />
      </View>
    </Beside>
  );
}

export function Suggestions({ items, onPick }) {
  const { scheme } = useThemeControls();
  const g = brand.assistant;
  const fg = brandFg('assistant', scheme);
  return (
    <View style={styles.suggestions}>
      <SectionLabel>Try asking</SectionLabel>
      <View style={styles.chips}>
        {items.map(s => (
          <Pressable
            key={s}
            style={({ pressed }) => [styles.chip, { backgroundColor: g.soft }, pressed && styles.pressed]}
            onPress={() => onPick(s)}
          >
            <Text variant="callout" style={{ color: fg }}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function InputBar({ value, onChangeText, onSend, disabled }) {
  const c = useTheme();
  const canSend = Boolean(value.trim()) && !disabled;
  return (
    <View style={[styles.inputBar, { borderTopColor: c.border, backgroundColor: c.surface }]}>
      <TextInput
        style={[type.body, styles.input, { backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }]}
        placeholder="Ask anything..."
        placeholderTextColor={c.textMuted}
        value={value}
        onChangeText={onChangeText}
        multiline
        onSubmitEditing={onSend}
      />
      <Pressable
        style={[styles.send, { backgroundColor: canSend ? c.accent : c.surfaceAlt }]}
        onPress={onSend}
        disabled={!canSend}
        accessibilityLabel="Send"
      >
        <Icon name="arrow-up" size={18} color={canSend ? c.accentFg : c.textMuted} />
      </Pressable>
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  title: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  list: { paddingTop: space.lg, paddingBottom: space.sm },
  message: { maxWidth: '82%', marginBottom: space.md, marginHorizontal: space.lg },
  withAvatar: { maxWidth: '90%', flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  avatar: { marginTop: 2 },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.xl, padding: space.md },
  bubbleMine: { borderBottomRightRadius: radius.sm - 2 },
  bubbleTheirs: { borderBottomLeftRadius: radius.sm - 2, borderWidth: StyleSheet.hairlineWidth },
  memory: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs, paddingHorizontal: space.xs },
  greeting: { marginHorizontal: space.lg, marginBottom: space.lg, padding: space.xl },
  greetingHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  greetingLogo: { borderRadius: 26, borderWidth: 2, borderColor: brand.onBrandFaint, padding: 2 },
  greetingTitle: { color: brand.onBrand, fontWeight: '700' },
  greetingText: { color: brand.onBrand, opacity: 0.92 },
  pdf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    borderRadius: radius.md,
    padding: space.md - 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pdfIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  pdfName: { fontWeight: '600' },
  suggestions: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.full, paddingHorizontal: space.md + 2, paddingVertical: space.sm },
  pressed: { opacity: 0.7 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.md - 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: space.lg,
    paddingTop: space.md - 2,
    paddingBottom: space.md - 2,
    maxHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

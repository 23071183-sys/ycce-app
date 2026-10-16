import React, { useState, useRef } from 'react';
import {
  View, TextInput, Pressable, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Linking,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Icon, SectionLabel, Text } from '../../components/ui';
import { radius, space, type } from '../../theme';

const BASE_URL = api.defaults.baseURL?.replace('/api', '') || '';

const STUDENT_SUGGESTIONS = [
  'Show my attendance',
  'Download my attendance PDF',
  'What assignments are pending?',
  'Show my results & CGPA',
  'Show my timetable',
  'Any new announcements?',
  'Show my notes',
  'What Compufest events are coming?',
];

const ADMIN_SUGGESTIONS = [
  'List all controllers',
  'Show all routes in server.js',
  'Show all users in the DB',
  'Show all DB tables and columns',
  'Read attendanceController.js',
  'Check for any DB issues',
  'Fix a bug in a controller',
  'Run a query to inspect data',
];

export default function ChatScreen() {
  const c = useTheme();
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'admin'].includes(user?.role);

  const SUGGESTIONS = isAdmin ? ADMIN_SUGGESTIONS : STUDENT_SUGGESTIONS;

  const greeting = isAdmin
    ? `Hi ${user?.name?.split(' ')[0] || 'Admin'}! I'm your YCCE developer assistant.\n\nI can read and fix backend files, run DB queries, inspect routes, and diagnose issues — just describe the problem.`
    : `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your YCCE CT assistant.\n\nI can fetch your live attendance, assignments, timetable, and even generate a PDF report — just ask!`;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const scrollToBottom = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    scrollToBottom();

    try {
      const apiMessages = updated
        .filter(m => m.role !== 'assistant' || updated.indexOf(m) > 0)
        .map(m => ({ role: m.role, content: m.content }));

      const endpoint = isAdmin ? '/chat/admin' : '/chat';
      const { data } = await api.post(endpoint, { messages: apiMessages });

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply, pdf_url: data.pdf_url || null },
      ]);
    } catch (e) {
      const msg = e.response?.data?.error?.includes('Credits depleted')
        ? 'AI Chat is temporarily unavailable — credits depleted. Please try again later.'
        : 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const openPdf = (pdfPath) => {
    const fullUrl = `${BASE_URL}${pdfPath}`;
    Linking.openURL(fullUrl).catch(() =>
      alert('Could not open PDF. Try again.')
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.message, isUser ? styles.mine : styles.theirs]}>
        {!isUser && <AssistantTag />}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleMine, { backgroundColor: c.text }]
              : [styles.bubbleTheirs, { backgroundColor: c.surface, borderColor: c.border }],
          ]}
        >
          <Text variant="body" style={isUser && { color: c.bg }}>{item.content}</Text>

          {item.pdf_url && (
            <Pressable
              onPress={() => openPdf(item.pdf_url)}
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
      </View>
    );
  };

  const canSend = Boolean(input.trim()) && !loading;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={
          loading ? (
            <View style={[styles.message, styles.theirs]}>
              <AssistantTag />
              <View style={[styles.bubble, styles.bubbleTheirs, { backgroundColor: c.surface, borderColor: c.border }]}>
                <ActivityIndicator size="small" color={c.textMuted} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestions — only at start */}
      {messages.length === 1 && (
        <View style={styles.suggestions}>
          <SectionLabel>Try asking</SectionLabel>
          <View style={styles.chips}>
            {SUGGESTIONS.map(s => (
              <Pressable
                key={s}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: pressed ? c.surfaceAlt : c.surface, borderColor: c.border },
                ]}
                onPress={() => send(s)}
              >
                <Text variant="callout" tone="secondary">{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.inputBar, { borderTopColor: c.border, backgroundColor: c.surface }]}>
        <TextInput
          style={[type.body, styles.input, { backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }]}
          placeholder="Ask anything..."
          placeholderTextColor={c.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          onSubmitEditing={() => send()}
        />
        <Pressable
          style={[styles.send, { backgroundColor: canSend ? c.accent : c.surfaceAlt }]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
          accessibilityLabel="Send"
        >
          <Icon name="arrow-up" size={18} color={canSend ? c.accentFg : c.textMuted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function AssistantTag() {
  const c = useTheme();
  return (
    <View style={styles.tag}>
      <View style={[styles.tagLogo, { backgroundColor: c.text }]}>
        <Text variant="caption" style={[styles.tagLetters, { color: c.bg }]}>CT</Text>
      </View>
      <Text variant="label">Assistant</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingTop: space.lg, paddingBottom: space.sm },
  message: { maxWidth: '82%', marginBottom: space.md, marginHorizontal: space.lg },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.xl, padding: space.md },
  bubbleMine: { borderBottomRightRadius: radius.sm - 2 },
  bubbleTheirs: { borderBottomLeftRadius: radius.sm - 2, borderWidth: StyleSheet.hairlineWidth },
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
  chip: { borderRadius: radius.full, paddingHorizontal: space.md + 2, paddingVertical: space.sm, borderWidth: StyleSheet.hairlineWidth },
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
  tag: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, marginBottom: space.xs },
  tagLogo: { width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  tagLetters: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
});

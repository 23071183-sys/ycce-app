import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api, { AI_TIMEOUT_MS, reportError } from '../../services/api';
import { ErrorState, Icon, Skeleton } from '../../components/ui';
import { space } from '../../theme';
import {
  ChatTitle, GreetingCard, InputBar, MessageBubble, Suggestions, TypingBubble, styles as chat,
} from './ChatParts';

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

const openPdf = (pdfPath) => {
  const fullUrl = `${BASE_URL}${pdfPath}`;
  Linking.openURL(fullUrl).catch(() =>
    alert('Could not open PDF. Try again.')
  );
};

function useScrollToBottom() {
  const listRef = useRef(null);
  const scrollToBottom = useCallback(
    () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100),
    []
  );
  return [listRef, scrollToBottom];
}

function ChatLayout({ children, input, setInput, onSend, sending }) {
  const c = useTheme();
  return (
    <KeyboardAvoidingView
      style={[chat.flex, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {children}
      <InputBar value={input} onChangeText={setInput} onSend={onSend} disabled={sending} />
    </KeyboardAvoidingView>
  );
}

// The admin developer assistant. Its conversation lives only on this screen
// and is sent whole with every message, as before.
function AdminChat() {
  const { user } = useAuth();
  const greeting = `Hi ${user?.name?.split(' ')[0] || 'Admin'}! I'm your YCCE developer assistant.\n\nI can read and fix backend files, run DB queries, inspect routes, and diagnose issues — just describe the problem.`;
  const [messages, setMessages] = useState([{ role: 'assistant', content: greeting }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listRef, scrollToBottom] = useScrollToBottom();

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

      const { data } = await api.post('/chat/admin', { messages: apiMessages }, { timeout: AI_TIMEOUT_MS });

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

  return (
    <ChatLayout input={input} setInput={setInput} onSend={() => send()} sending={loading}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <MessageBubble item={item} onOpenPdf={openPdf} />}
        contentContainerStyle={chat.list}
        onContentSizeChange={scrollToBottom}
        ListFooterComponent={loading ? <TypingBubble /> : null}
      />
      {messages.length === 1 && <Suggestions items={ADMIN_SUGGESTIONS} onPick={send} />}
    </ChatLayout>
  );
}

// The student / professor assistant. The server keeps the conversation and
// anything the user asked it to remember, so only the new message is sent.
function AssistantChat({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listRef, scrollToBottom] = useScrollToBottom();

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/chat/history');
      setMessages(data?.messages || []);
      setHistoryError(null);
    } catch (e) {
      reportError(e);
      setHistoryError(e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const newChat = useCallback(() => {
    Alert.alert('Start a new chat?', 'This conversation will be cleared. Things you asked me to remember stay saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New chat',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/chat/history');
            setMessages([]);
          } catch (e) {
            Alert.alert('Could not start a new chat', e.response?.data?.error || 'Try again in a moment.');
          }
        },
      },
    ]);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('Memories')} hitSlop={8} accessibilityLabel="Memories">
            <Icon name="bookmark-outline" size={22} tone="default" />
          </Pressable>
          <Pressable onPress={newChat} hitSlop={8} accessibilityLabel="New chat">
            <Icon name="create-outline" size={22} tone="default" />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, newChat]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setSending(true);
    scrollToBottom();
    try {
      const { data } = await api.post('/chat', { message: userText }, { timeout: AI_TIMEOUT_MS });
      const saved = Array.isArray(data.memory_saved) ? data.memory_saved : [];
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          pdf_url: data.pdf_url || null,
          memory_note: saved.length ? saved.join(' · ') : null,
        },
      ]);
    } catch (e) {
      const msg = e.response?.data?.error || 'Sorry, something went wrong. Check your connection and try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg, error: true }]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const first = user?.name?.split(' ')[0] || 'there';
  const empty = !historyLoading && !historyError && messages.length === 0;

  let content;
  if (historyLoading) {
    content = (
      <View style={styles.skeleton}>
        <Skeleton width="70%" height={56} rounded={16} />
        <Skeleton width="55%" height={40} rounded={16} style={styles.skeletonMine} />
        <Skeleton width="80%" height={72} rounded={16} />
      </View>
    );
  } else if (historyError && messages.length === 0) {
    content = <View style={chat.flex}><ErrorState onRetry={loadHistory} /></View>;
  } else {
    content = (
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item, i) => String(item.id ?? `local-${i}`)}
        renderItem={({ item }) => <MessageBubble item={item} onOpenPdf={openPdf} />}
        contentContainerStyle={chat.list}
        onContentSizeChange={scrollToBottom}
        ListHeaderComponent={empty ? (
          <GreetingCard name={first}>
            I can fetch your live attendance, assignments, timetable, and even generate a PDF report.
            Say “remember …” and I’ll keep it in mind next time.
          </GreetingCard>
        ) : null}
        ListFooterComponent={sending ? <TypingBubble /> : null}
      />
    );
  }

  return (
    <ChatLayout input={input} setInput={setInput} onSend={() => send()} sending={sending}>
      {content}
      {empty && <Suggestions items={STUDENT_SUGGESTIONS} onPick={send} />}
    </ChatLayout>
  );
}

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'admin'].includes(user?.role);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: () => <ChatTitle /> });
  }, [navigation]);

  return isAdmin ? <AdminChat /> : <AssistantChat navigation={navigation} />;
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: space.lg, paddingHorizontal: space.lg },
  skeleton: { flex: 1, padding: space.lg, gap: space.md },
  skeletonMine: { alignSelf: 'flex-end' },
});

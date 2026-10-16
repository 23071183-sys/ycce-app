import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUnread } from '../../context/UnreadContext';
import api, { reportError } from '../../services/api';
import usePolling from '../../hooks/usePolling';
import { fmtDate, fmtTime } from '../../utils/format';
import { radius, space, type } from '../../theme';
import { Avatar, EmptyState, ErrorState, Icon, Text } from '../../components/ui';
import { describePerson, uuidv4 } from './util';

const PAGE = 50;

// Server messages have an id; ones still sending only a client_id.
const keyOf = (m) => (m.id ? `s${m.id}` : `c${m.client_id}`);
const lastServerId = (list) => {
  for (let i = list.length - 1; i >= 0; i--) if (list[i].id) return list[i].id;
  return 0;
};

// Adds server messages to the list, replacing the optimistic copy of any we
// sent (matched on client_id) and skipping ones already there.
function merge(list, incoming) {
  if (!incoming.length) return list;
  const byClient = new Map(incoming.filter(m => m.client_id).map(m => [m.client_id, m]));
  const ids = new Set(list.filter(m => m.id).map(m => m.id));
  const kept = list.map(m => (!m.id && m.client_id && byClient.has(m.client_id) ? byClient.get(m.client_id) : m));
  const keptIds = new Set(kept.filter(m => m.id).map(m => m.id));
  const added = incoming.filter(m => !ids.has(m.id) && !keptIds.has(m.id));
  // Pending messages stay at the bottom, after everything the server has.
  const confirmed = [...kept.filter(m => m.id), ...added].sort((a, b) => a.id - b.id);
  return [...confirmed, ...kept.filter(m => !m.id)];
}

const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return fmtDate(d, { year: d.getFullYear() !== today.getFullYear() });
};

export default function ConversationScreen({ route, navigation }) {
  const { conversationId } = route.params;
  const c = useTheme();
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnread();
  const [other, setOther] = useState(route.params.other || null);
  const [messages, setMessages] = useState([]);
  const [otherLastRead, setOtherLastRead] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const [input, setInput] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const lastMarked = useRef(0);

  // Opened from a notification, the other person isn't known yet.
  useEffect(() => {
    if (other) return;
    api.get('/messages/conversations')
      .then(r => { const conv = r.data.find(x => x.id === Number(conversationId)); if (conv) setOther(conv.other); })
      .catch(reportError);
  }, [conversationId, other]);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    setMuted(next);
    try { await api.put(`/messages/conversations/${conversationId}/mute`, { muted: next }); }
    catch (e) { setMuted(!next); Alert.alert('Could not change notifications', e.response?.data?.error || 'Try again.'); }
  }, [muted, conversationId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: other?.name || 'Conversation',
      headerRight: () => (
        <Pressable
          onPress={toggleMute}
          hitSlop={8}
          style={styles.headerButton}
          accessibilityLabel={muted ? 'Unmute notifications' : 'Mute notifications'}
        >
          <Icon name={muted ? 'notifications-off-outline' : 'notifications-outline'} size={22} tone={muted ? 'muted' : 'default'} />
        </Pressable>
      ),
    });
  }, [navigation, other, muted, toggleMute]);

  const markRead = useCallback(async (list) => {
    const lastFromOther = [...list].reverse().find(m => m.id && m.sender_id !== user?.id);
    if (!lastFromOther || lastFromOther.id <= lastMarked.current) return;
    lastMarked.current = lastFromOther.id;
    try {
      await api.post(`/messages/conversations/${conversationId}/read`, { last_message_id: lastFromOther.id });
      refreshUnread();
    } catch (e) { reportError(e); }
  }, [conversationId, user?.id, refreshUnread]);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}/messages`, { params: { limit: PAGE } });
      setMessages(prev => merge(prev.filter(m => !m.id), data.messages));
      setOtherLastRead(data.otherLastRead);
      setHasOlder(data.messages.length >= PAGE);
      setError(null);
      markRead(data.messages);
    } catch (e) { reportError(e); setError(e); }
    finally { setLoading(false); }
  }, [conversationId, markRead]);

  useEffect(() => { loadLatest(); }, [loadLatest]);

  const bump = usePolling(async () => {
    const after = lastServerId(messagesRef.current);
    const { data } = await api.get(`/messages/conversations/${conversationId}/messages`, { params: { after } });
    setOtherLastRead(data.otherLastRead);
    if (!data.messages.length) return false;
    setMessages(prev => merge(prev, data.messages));
    markRead(data.messages);
    return true;
  }, { enabled: !loading && !error });

  const loadOlder = async () => {
    if (loadingOlder || !hasOlder || loading) return;
    const oldest = messagesRef.current.find(m => m.id);
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}/messages`, { params: { before: oldest.id, limit: PAGE } });
      setMessages(prev => merge(prev, data.messages));
      setHasOlder(data.messages.length >= PAGE);
    } catch (e) { reportError(e); }
    finally { setLoadingOlder(false); }
  };

  const deliver = async (pending) => {
    try {
      const { data } = await api.post(`/messages/conversations/${conversationId}/messages`, {
        body: pending.body,
        client_id: pending.client_id,
      });
      setMessages(prev => merge(prev, [data]));
      bump();
    } catch (e) {
      const status = e.response?.status;
      setMessages(prev => prev.map(m => (m.client_id === pending.client_id && !m.id ? { ...m, failed: true } : m)));
      if (status === 403) setBlocked(true);
      else if (status === 429) Alert.alert('Slow down', e.response?.data?.error || 'You are sending messages too fast. Wait a moment.');
      else reportError(e);
    }
  };

  const send = () => {
    const body = input.trim();
    if (!body || blocked) return;
    setInput('');
    const pending = { client_id: uuidv4(), sender_id: user?.id, body, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, pending]);
    deliver(pending);
  };

  const retry = (m) => {
    setMessages(prev => prev.map(x => (x.client_id === m.client_id && !x.id ? { ...x, failed: false } : x)));
    deliver(m);
  };

  const discard = (m) => setMessages(prev => prev.filter(x => !(x.client_id === m.client_id && !x.id)));

  // "Seen" goes under my latest message once the other person has read it.
  // Newest first, for the inverted list.
  const reversed = [...messages].reverse();
  const lastMine = reversed.find(m => m.sender_id === user?.id);
  const seenId = lastMine?.id && lastMine.id <= otherLastRead ? lastMine.id : null;

  const renderItem = ({ item, index }) => {
    // The list is inverted: index + 1 is the message before this one.
    const prev = reversed[index + 1];
    const mine = item.sender_id === user?.id;
    const showDay = !prev || new Date(prev.created_at).toDateString() !== new Date(item.created_at).toDateString();
    const status = item.failed ? 'failed' : !item.id ? 'sending' : item.id === seenId ? 'seen' : null;
    return (
      <View>
        {showDay ? <Text variant="label" style={styles.day}>{dayLabel(item.created_at)}</Text> : null}
        <View style={[styles.messageRow, mine ? styles.mine : styles.theirs]}>
          <Pressable
            disabled={!item.failed}
            onPress={() => Alert.alert('Message not sent', 'Try sending it again?', [
              { text: 'Delete', style: 'destructive', onPress: () => discard(item) },
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: () => retry(item) },
            ])}
            style={[
              styles.bubble,
              mine
                ? [styles.bubbleMine, { backgroundColor: c.text }]
                : [styles.bubbleTheirs, { backgroundColor: c.surface, borderColor: c.border }],
              !item.id && !item.failed && styles.pending,
            ]}
          >
            <Text variant="body" style={mine && { color: c.bg }}>{item.body}</Text>
          </Pressable>
          <View style={[styles.metaRow, mine && styles.metaMine]}>
            <Text variant="caption" tone="muted">{fmtTime(item.created_at)}</Text>
            {mine && status === 'failed' ? (
              <>
                <Icon name="alert-circle" size={12} tone="danger" />
                <Text variant="caption" tone="danger">Not sent · tap to retry</Text>
              </>
            ) : null}
            {mine && status === 'sending' ? <Text variant="caption" tone="muted">Sending…</Text> : null}
            {mine && status === 'seen' ? <Text variant="caption" tone="muted">Seen</Text> : null}
          </View>
        </View>
      </View>
    );
  };

  let content;
  if (loading && !messages.length) {
    content = <View style={styles.center}><ActivityIndicator color={c.textMuted} /></View>;
  } else if (error && !messages.length) {
    content = <ErrorState onRetry={loadLatest} />;
  } else {
    content = (
      <FlatList
        inverted
        data={reversed}
        keyExtractor={keyOf}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadOlder}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={loadingOlder ? <ActivityIndicator color={c.textMuted} style={styles.older} /> : null}
        ListEmptyComponent={
          // Inverted lists flip their children too.
          <View style={styles.flipped}>
            {other ? <Avatar name={other.name} uri={other.avatar_url} size={64} style={styles.emptyAvatar} /> : null}
            <EmptyState
              icon="chatbubble-outline"
              title={other ? `Say hello to ${other.name.split(' ')[0]}` : 'No messages yet'}
              message={other ? describePerson(other) : undefined}
            />
          </View>
        }
      />
    );
  }

  const canSend = Boolean(input.trim()) && !blocked;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {content}
      {blocked ? (
        <View style={[styles.blocked, { backgroundColor: c.surfaceAlt, borderTopColor: c.border }]}>
          <Icon name="lock-closed-outline" size={14} tone="muted" />
          <Text variant="callout" tone="secondary" style={styles.flex}>
            You can't message this person any more. The conversation stays here to read.
          </Text>
        </View>
      ) : (
        <View style={[styles.inputBar, { borderTopColor: c.border, backgroundColor: c.surface }]}>
          <TextInput
            style={[type.body, styles.input, { backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }]}
            placeholder="Message"
            placeholderTextColor={c.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={4000}
          />
          <Pressable
            style={[styles.send, { backgroundColor: canSend ? c.accent : c.surfaceAlt }]}
            onPress={send}
            disabled={!canSend}
            accessibilityLabel="Send"
          >
            <Icon name="arrow-up" size={18} color={canSend ? c.accentFg : c.textMuted} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerButton: { paddingHorizontal: space.lg },
  list: { paddingHorizontal: space.lg, paddingVertical: space.md, flexGrow: 1 },
  older: { marginVertical: space.md },
  day: { alignSelf: 'center', marginVertical: space.md },
  messageRow: { maxWidth: '82%', marginBottom: space.sm },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.xl, paddingHorizontal: space.md, paddingVertical: space.sm + 2 },
  bubbleMine: { borderBottomRightRadius: radius.sm - 2 },
  bubbleTheirs: { borderBottomLeftRadius: radius.sm - 2, borderWidth: StyleSheet.hairlineWidth },
  pending: { opacity: 0.6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 2 },
  metaMine: { justifyContent: 'flex-end' },
  flipped: { flex: 1, justifyContent: 'center', transform: [{ scaleY: -1 }] },
  emptyAvatar: { alignSelf: 'center' },
  blocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
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
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
  },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

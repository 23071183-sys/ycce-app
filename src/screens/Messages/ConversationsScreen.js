import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUnread } from '../../context/UnreadContext';
import useApi from '../../hooks/useApi';
import usePolling from '../../hooks/usePolling';
import { relativeTime } from '../../utils/format';
import { radius, space } from '../../theme';
import { Avatar, Card, EmptyState, ErrorState, Icon, Screen, Skeleton, Text } from '../../components/ui';
import { describePerson } from './util';

function UnreadDot({ count }) {
  const c = useTheme();
  return (
    <View style={[styles.count, { backgroundColor: c.accent }]}>
      <Text variant="caption" style={[styles.countText, { color: c.accentFg }]}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export default function ConversationsScreen({ navigation }) {
  const c = useTheme();
  const { refresh: refreshUnread } = useUnread();
  const { data, loading, error, refreshing, refresh, revalidate, reload } = useApi('/messages/conversations', { initialData: [] });
  const conversations = data || [];

  const openNew = useCallback(() => navigation.navigate('NewMessage'), [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={openNew} hitSlop={8} style={styles.headerButton} accessibilityLabel="New message">
          <Icon name="create-outline" size={22} tone="default" />
        </Pressable>
      ),
    });
  }, [navigation, openNew]);

  // Coming back from a thread: its unread count has changed. The first focus
  // is covered by the initial load.
  const seen = useRef(false);
  useFocusEffect(useCallback(() => {
    if (seen.current) { revalidate(); refreshUnread(); }
    seen.current = true;
  }, [revalidate, refreshUnread]));

  usePolling(async () => {
    const before = conversations[0]?.last_message_at;
    const fresh = await revalidate();
    return Boolean(fresh) && fresh[0]?.last_message_at !== before;
  }, { interval: 10000, slowInterval: 30000 });

  if (loading) {
    return (
      <Screen>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton width={44} height={44} rounded={22} />
            <View style={styles.skeletonText}>
              <Skeleton width="50%" height={14} />
              <Skeleton width="80%" height={12} />
            </View>
          </View>
        ))}
      </Screen>
    );
  }
  if (error && !conversations.length) return <Screen><ErrorState onRetry={reload} /></Screen>;

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.list}
      data={conversations}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.textMuted} colors={[c.accent]} />}
      ListEmptyComponent={
        <Card padded={false}>
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            message="Start a conversation with your professors or the college office."
            actionTitle="New message"
            onAction={openNew}
          />
        </Card>
      }
      renderItem={({ item, index }) => {
        const unread = item.unread > 0;
        return (
          <Pressable
            onPress={() => navigation.navigate('Conversation', { conversationId: item.id, other: item.other })}
            style={({ pressed }) => [
              styles.row,
              index < conversations.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
              pressed && { backgroundColor: c.surfaceAlt },
            ]}
          >
            <Avatar name={item.other?.name} uri={item.other?.avatar_url} size={44} />
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text variant="body" numberOfLines={1} style={[styles.flex, unread && styles.bold]}>{item.other?.name}</Text>
                <Text variant="caption" tone={unread ? 'accent' : 'muted'}>{relativeTime(item.last_message_at)}</Text>
              </View>
              <Text variant="caption" tone="muted" numberOfLines={1}>{describePerson(item.other)}</Text>
              <View style={styles.titleRow}>
                <Text variant="callout" tone={unread ? 'default' : 'secondary'} numberOfLines={1} style={styles.flex}>
                  {item.last_message_preview || 'No messages yet'}
                </Text>
                {unread ? <UnreadDot count={item.unread} /> : null}
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: space.huge, flexGrow: 1 },
  headerButton: { paddingHorizontal: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bold: { fontWeight: '600' },
  count: { minWidth: 20, height: 20, borderRadius: radius.full, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  countText: { fontWeight: '700', fontSize: 11, lineHeight: 14 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  skeletonText: { flex: 1, gap: space.sm },
});

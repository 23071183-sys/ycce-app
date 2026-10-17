import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { relativeTime } from '../../utils/format';
import { space } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { Card, EmptyState, ErrorState, Icon, Screen, Skeleton, Text } from '../../components/ui';

// What the assistant has been asked to remember. It uses these in every chat;
// deleting one here makes it forget.
export default function MemoriesScreen() {
  const { data, setData, loading, error, refreshing, refresh, reload } = useApi('/chat/memories');
  const c = useTheme();
  const [deleting, setDeleting] = useState(null);
  const memories = data?.memories || [];

  const remove = (m) => {
    Alert.alert('Forget this?', m.content, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Forget',
        style: 'destructive',
        onPress: async () => {
          setDeleting(m.id);
          try {
            await api.delete(`/chat/memories/${m.id}`);
            setData(prev => ({ ...prev, memories: (prev?.memories || []).filter(x => x.id !== m.id) }));
          } catch (e) {
            Alert.alert('Could not delete', e.response?.data?.error || 'Try again in a moment.');
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  let body;
  if (loading) {
    body = <Card style={styles.skeleton}>{[1, 2, 3].map(i => <Skeleton key={i} height={16} />)}</Card>;
  } else if (error) {
    body = <ErrorState onRetry={reload} message={error.response?.data?.error} />;
  } else if (!memories.length) {
    body = (
      <EmptyState
        icon="bookmark-outline"
        title="Nothing saved yet"
        message="Say 'remember …' in the chat to save something."
      />
    );
  } else {
    body = (
      <>
        <Text variant="callout" tone="secondary" style={styles.intro}>
          The assistant uses these in every chat. Delete one and it forgets it.
        </Text>
        <Card padded={false} style={styles.inset}>
          {memories.map((m, i) => (
            <View key={m.id} style={[styles.row, i < memories.length - 1 && [styles.divider, { borderBottomColor: c.border }]]}>
              <Icon name="bookmark" size={14} tone="accent" style={styles.icon} />
              <View style={styles.flex}>
                <Text variant="body">{m.content}</Text>
                <Text variant="caption" tone="muted" style={styles.date}>Saved {relativeTime(m.created_at)}</Text>
              </View>
              <Pressable
                onPress={() => remove(m)}
                disabled={deleting === m.id}
                hitSlop={8}
                accessibilityLabel="Delete memory"
                style={deleting === m.id && styles.busy}
              >
                <Icon name="trash-outline" size={18} tone="danger" />
              </Pressable>
            </View>
          ))}
        </Card>
      </>
    );
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: space.md },
  intro: { marginBottom: space.lg },
  inset: { paddingHorizontal: space.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { marginTop: 3 },
  flex: { flex: 1 },
  date: { marginTop: 2 },
  busy: { opacity: 0.4 },
});

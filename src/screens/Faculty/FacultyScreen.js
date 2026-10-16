import React, { useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useApi from '../../hooks/useApi';
import { space } from '../../theme';
import {
  Avatar, Card, EmptyState, ErrorState, Icon, InfoRow, Screen, Skeleton, Text,
} from '../../components/ui';

function FacultyCard({ item, isOpen, onToggle }) {
  const c = useTheme();
  const details = [
    {
      label: 'Joined',
      value: item.joining_date
        ? new Date(item.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : null,
    },
    { label: 'Teaching exp', value: item.teaching_exp },
    { label: 'Industry exp', value: item.industrial_exp },
    item.research_count && item.research_count !== '—' && { label: 'Research', value: `${item.research_count} Publications` },
  ].filter(Boolean);

  return (
    <Card onPress={onToggle} style={styles.card}>
      <View style={styles.head}>
        <Avatar name={item.name} size={44} />
        <View style={styles.flex}>
          <Text variant="body">{item.name}</Text>
          <Text variant="label" style={styles.designation}>{item.designation || 'Professor'}</Text>
          {item.qualification ? <Text variant="caption" tone="muted">{item.qualification}</Text> : null}
        </View>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} tone="muted" />
      </View>

      {isOpen && (
        <View style={[styles.details, { borderTopColor: c.border }]}>
          {details.map(d => <InfoRow key={d.label} label={d.label} value={d.value} />)}
          <Pressable
            onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)}
            style={[styles.email, { borderBottomColor: c.border }]}
          >
            <Text variant="callout" tone="muted">Email</Text>
            <Text variant="callout" tone="accent" numberOfLines={1} style={styles.emailValue}>{item.email || '—'}</Text>
          </Pressable>
          {item.courses_taught && item.courses_taught !== '—' && (
            <View style={styles.courses}>
              <Text variant="label" style={styles.coursesLabel}>Courses taught</Text>
              <Text variant="callout" tone="secondary">{item.courses_taught}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

export default function FacultyScreen() {
  const c = useTheme();
  const { data, loading, error, refreshing, refresh, reload } = useApi('/users/faculty', { initialData: [] });
  const [expanded, setExpanded] = useState(null);

  if (loading) {
    return (
      <Screen>
        {[1, 2, 3, 4].map(i => (
          <Card key={i} style={[styles.card, styles.head]}>
            <Skeleton width={44} height={44} rounded={22} />
            <View style={[styles.flex, styles.skeletonText]}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="35%" height={10} />
            </View>
          </Card>
        ))}
      </Screen>
    );
  }
  if (error) return <Screen onRefresh={refresh} refreshing={refreshing}><ErrorState onRetry={reload} /></Screen>;

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      data={data || []}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.textMuted} colors={[c.accent]} />}
      ListEmptyComponent={<EmptyState icon="people-outline" title="No faculty found" />}
      renderItem={({ item }) => (
        <FacultyCard
          item={item}
          isOpen={expanded === item.id}
          onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: space.huge },
  card: { marginBottom: space.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  designation: { marginTop: 2, marginBottom: 2 },
  skeletonText: { gap: space.sm },
  details: { marginTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  email: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
    gap: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emailValue: { flexShrink: 1 },
  courses: { marginTop: space.md },
  coursesLabel: { marginBottom: space.xs },
});

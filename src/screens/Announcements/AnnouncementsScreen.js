import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import api, { reportError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fmtDate } from '../../utils/format';
import { space } from '../../theme';
import { Badge, Card, EmptyState, ErrorState, Screen, Skeleton, Text } from '../../components/ui';

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const requests = [api.get('/announcements/general')];
      if (user?.year) requests.push(api.get(`/announcements/year/${user.year}`));
      const results = await Promise.all(requests);
      const all = results.flatMap(r => r.data);
      const unique = Array.from(new Map(all.map(a => [a.id, a])).values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAnnouncements(unique);
      setError(null);
    } catch (e) { reportError(e); setError(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  let body;
  if (loading) {
    body = [1, 2, 3].map(i => (
      <Card key={i} style={[styles.card, styles.skeleton]}>
        <Skeleton width="60%" height={16} />
        <Skeleton height={12} />
        <Skeleton width="40%" height={10} />
      </Card>
    ));
  } else if (error) {
    body = <ErrorState onRetry={() => load()} />;
  } else if (!announcements.length) {
    body = <EmptyState icon="notifications-outline" title="No announcements yet" message="College and class announcements will show here." />;
  } else {
    body = announcements.map(item => (
      <Card key={String(item.id)} style={styles.card}>
        <View style={styles.head}>
          <Text variant="heading" style={styles.title}>{item.title}</Text>
          {item.is_cancelled ? <Badge tone="danger">Cancelled</Badge> : null}
        </View>
        <Text variant="callout" tone="secondary" numberOfLines={3} style={styles.body}>{item.content}</Text>
        <View style={styles.foot}>
          <Text variant="caption" tone="muted" style={styles.title} numberOfLines={1}>By {item.posted_by_name}</Text>
          <Text variant="caption" tone="muted">{fmtDate(item.created_at)}</Text>
        </View>
      </Card>
    ));
  }

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md },
  skeleton: { gap: space.sm },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  title: { flex: 1 },
  body: { marginTop: space.xs },
  foot: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm, marginTop: space.md },
});

import React, { useState } from 'react';
import useApi from '../../hooks/useApi';
import { Card, EmptyState, ErrorState, Screen, SegmentedControl, Text } from '../../components/ui';
import { EventCard, EventListSkeleton, fmtEventDate, styles } from './EventParts';

const TABS = [{ value: 'events', label: 'Events' }, { value: 'announcements', label: 'Updates' }];

export default function FestScreen() {
  const [tab, setTab] = useState('events');
  const events = useApi('/fest/events', { initialData: [] });
  const updates = useApi('/fest/announcements', { initialData: [] });

  const loading = events.loading || updates.loading;
  const error = events.error || updates.error;
  const refreshing = events.refreshing || updates.refreshing;
  const refresh = () => { events.refresh(); updates.refresh(); };
  const reload = () => { events.reload(); updates.reload(); };

  let body;
  if (loading) body = <EventListSkeleton />;
  else if (error) body = <ErrorState onRetry={reload} />;
  else if (tab === 'events') {
    body = events.data?.length
      ? events.data.map(item => <EventCard key={String(item.id)} item={item} />)
      : <EmptyState icon="star-outline" title="No events yet" message="Fest events will show here once they're announced." />;
  } else {
    body = updates.data?.length
      ? updates.data.map(item => (
        <Card key={String(item.id)} style={styles.card}>
          <Text variant="heading">{item.title}</Text>
          <Text variant="callout" tone="secondary" style={styles.body}>{item.content}</Text>
          <Text variant="caption" tone="muted" style={styles.body}>{fmtEventDate(item.created_at)}</Text>
        </Card>
      ))
      : <EmptyState icon="megaphone-outline" title="No announcements yet" />;
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <SegmentedControl options={TABS} value={tab} onChange={setTab} style={styles.tabs} />
      {body}
    </Screen>
  );
}

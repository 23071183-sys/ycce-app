import React, { useState } from 'react';
import useApi from '../../hooks/useApi';
import { Card, EmptyState, ErrorState, Screen, SegmentedControl, Text } from '../../components/ui';
import { EventCard, EventListSkeleton, fmtEventDate, styles } from './EventParts';
import useEventRegistration from './useEventRegistration';
import GradientHeader from '../../components/GradientHeader';
import { YashLogo } from '../../components/brand';
import { useThemeControls } from '../../context/ThemeContext';
import { brandFg } from '../../theme';

const TABS = [{ value: 'events', label: 'Events' }, { value: 'announcements', label: 'Updates' }];

export default function FestScreen({ navigation }) {
  const [tab, setTab] = useState('events');
  const events = useApi('/fest/events', { initialData: [] });
  const updates = useApi('/fest/announcements', { initialData: [] });
  const reg = useEventRegistration('fest', navigation);
  const { scheme } = useThemeControls();

  const loading = events.loading || updates.loading;
  const error = events.error || updates.error;
  const refreshing = events.refreshing || updates.refreshing;
  const refresh = () => { events.refresh(); updates.refresh(); reg.refreshCounts(); };
  const reload = () => { events.reload(); updates.reload(); };

  let body;
  if (loading) body = <EventListSkeleton />;
  else if (error) body = <ErrorState onRetry={reload} />;
  else if (tab === 'events') {
    body = events.data?.length
      ? events.data.map(item => (
        <EventCard
          key={String(item.id)}
          item={item}
          brandKey="yash"
          counts={reg.countsFor(item.id)}
          busy={reg.busyId === item.id}
          onRegister={() => reg.register(item.id)}
          onCancel={() => reg.cancel(item.id, item.title)}
        />
      ))
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
      <GradientHeader
        brandKey="yash"
        logo={<YashLogo size={56} />}
        title="Yash Fest"
        tagline="The cultural fest of YCCE"
        stats={loading ? null : [
          { value: events.data?.length || 0, label: 'Events' },
          { value: reg.totals.registered, label: 'Registered' },
          { value: reg.totals.mine, label: 'Tickets' },
        ]}
      />
      <SegmentedControl
        options={TABS}
        value={tab}
        onChange={setTab}
        activeColor={brandFg('yash', scheme)}
        style={styles.tabs}
      />
      {body}
    </Screen>
  );
}

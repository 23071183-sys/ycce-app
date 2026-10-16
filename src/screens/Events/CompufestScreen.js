import React, { useState } from 'react';
import { Linking, StyleSheet } from 'react-native';
import useApi from '../../hooks/useApi';
import { space } from '../../theme';
import { Avatar, Badge, Card, EmptyState, ErrorState, ListItem, Screen, SegmentedControl } from '../../components/ui';
import { EventCard, EventListSkeleton, styles as eventStyles } from './EventParts';
import useEventRegistration from './useEventRegistration';

const TABS = [{ value: 'committee', label: 'Committee' }, { value: 'events', label: 'Events' }];

export default function CompufestScreen({ navigation }) {
  const [tab, setTab] = useState('committee');
  const events = useApi('/compufest/events', { initialData: [] });
  const committee = useApi('/compufest/committee', { initialData: [] });
  const reg = useEventRegistration('compufest', navigation);

  const loading = events.loading || committee.loading;
  const error = events.error || committee.error;
  const refreshing = events.refreshing || committee.refreshing;
  const refresh = () => { events.refresh(); committee.refresh(); reg.refreshCounts(); };
  const reload = () => { events.reload(); committee.reload(); };

  let body;
  if (loading) body = <EventListSkeleton />;
  else if (error) body = <ErrorState onRetry={reload} />;
  else if (tab === 'events') {
    body = events.data?.length
      ? events.data.map(item => (
        <EventCard
          key={String(item.id)}
          item={item}
          counts={reg.countsFor(item.id)}
          busy={reg.busyId === item.id}
          onRegister={() => reg.register(item.id)}
          onCancel={() => reg.cancel(item.id, item.title)}
          onExternal={item.registration_link ? () => Linking.openURL(item.registration_link) : undefined}
        />
      ))
      : <EmptyState icon="code-slash-outline" title="No events yet" message="Compufest events will show here once they're announced." />;
  } else {
    const members = committee.data || [];
    body = members.length
      ? (
        <Card padded={false} style={styles.inset}>
          {members.map((item, i) => (
            <ListItem
              key={String(item.id)}
              leading={<Avatar name={item.name} size={40} />}
              title={item.name}
              subtitle={[item.position, item.contact].filter(Boolean).join(' · ')}
              trailing={item.is_faculty_coordinator ? <Badge tone="accent">Faculty</Badge> : null}
              last={i === members.length - 1}
            />
          ))}
        </Card>
      )
      : <EmptyState icon="people-outline" title="No committee members yet" />;
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <SegmentedControl options={TABS} value={tab} onChange={setTab} style={eventStyles.tabs} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: space.lg },
});

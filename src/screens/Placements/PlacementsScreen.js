import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useApi from '../../hooks/useApi';
import { fmtDate } from '../../utils/format';
import { space } from '../../theme';
import {
  Badge, Card, EmptyState, ErrorState, Icon, Screen, SegmentedControl, Skeleton, Text,
} from '../../components/ui';
import { driveDates, eligibility, packageLabel } from './placementUtils';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'finished', label: 'Finished' },
];

const EMPTY = {
  upcoming: 'No upcoming drives right now. New ones show here as soon as the placement cell adds them.',
  ongoing: 'No drives are running today.',
  finished: 'No finished drives yet.',
};

export default function PlacementsScreen({ navigation }) {
  const [status, setStatus] = useState('upcoming');
  const { data, loading, error, refreshing, refresh, reload } = useApi('/placements', { params: { status }, initialData: [] });
  const drives = data || [];

  let body;
  if (loading) {
    body = [1, 2, 3].map(i => (
      <Card key={i} style={[styles.card, styles.skeleton]}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="70%" height={12} />
        <Skeleton width="35%" height={12} />
      </Card>
    ));
  } else if (error) {
    body = <ErrorState onRetry={reload} />;
  } else if (!drives.length) {
    body = <EmptyState icon="briefcase-outline" title="No drives" message={EMPTY[status]} />;
  } else {
    body = drives.map(d => {
      const elig = eligibility(d);
      const meta = [packageLabel(d), d.location].filter(Boolean).join(' · ');
      return (
        <Card key={d.id} style={styles.card} onPress={() => navigation.navigate('PlacementDetail', { id: d.id, company: d.company })}>
          <View style={styles.titleRow}>
            <View style={styles.flex}>
              <Text variant="heading">{d.company}</Text>
              <Text variant="callout" tone="secondary">{d.role}</Text>
            </View>
            {elig ? <Badge tone={elig.tone}>{elig.label}</Badge> : null}
          </View>
          {meta ? <Text variant="callout" style={styles.meta}>{meta}</Text> : null}
          <View style={styles.dates}>
            {driveDates(d) ? (
              <View style={styles.date}>
                <Icon name="calendar-outline" size={13} tone="muted" />
                <Text variant="caption" tone="muted">{driveDates(d)}</Text>
              </View>
            ) : null}
            {d.apply_deadline && status !== 'finished' ? (
              <View style={styles.date}>
                <Icon name="time-outline" size={13} tone="muted" />
                <Text variant="caption" tone="muted">Apply by {fmtDate(d.apply_deadline)}</Text>
              </View>
            ) : null}
          </View>
        </Card>
      );
    });
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <SegmentedControl options={TABS} value={status} onChange={setStatus} style={styles.tabs} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { marginBottom: space.lg },
  card: { marginBottom: space.md },
  skeleton: { gap: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  flex: { flex: 1 },
  meta: { marginTop: space.sm },
  dates: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, marginTop: space.sm },
  date: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});

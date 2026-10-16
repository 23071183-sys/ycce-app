import React from 'react';
import { StyleSheet, View } from 'react-native';
import useApi from '../../hooks/useApi';
import { attendanceTone, space } from '../../theme';
import {
  Badge, Button, Card, EmptyState, ErrorState, ListItem, ProgressRing, Screen, SectionLabel, Skeleton, Text,
} from '../../components/ui';

function LoadingSkeleton() {
  return (
    <>
      <Card style={[styles.hero, styles.gap]}>
        <Skeleton width={140} height={140} rounded={70} />
        <Skeleton width={120} height={12} />
      </Card>
      <Card style={styles.gap}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.skeletonRow}>
            <View style={styles.gap}>
              <Skeleton width={140} height={12} />
              <Skeleton width={90} height={10} />
            </View>
            <Skeleton width={48} height={20} />
          </View>
        ))}
      </Card>
    </>
  );
}

export default function AttendanceScreen({ navigation }) {
  const { data, loading, error, refreshing, refresh, reload } = useApi('/attendance/overall', { initialData: [] });
  const records = data || [];

  const overall = records.length
    ? Math.round(records.reduce((sum, r) => sum + parseFloat(r.percentage || 0), 0) / records.length)
    : 0;

  let body;
  if (loading) body = <LoadingSkeleton />;
  else if (error) body = <ErrorState onRetry={reload} />;
  else if (!records.length) {
    body = (
      <EmptyState
        icon="checkmark-circle-outline"
        title="No attendance yet"
        message="Your attendance shows here once classes are marked."
      />
    );
  } else {
    body = (
      <>
        <Card style={[styles.hero, styles.section]}>
          <ProgressRing percent={overall} size={140} stroke={8} />
          <Text variant="label" style={styles.heroLabel}>Overall attendance</Text>
          <Text variant="caption" tone="muted">Across {records.length} subjects</Text>
        </Card>

        <SectionLabel>By subject</SectionLabel>
        <Card padded={false} style={styles.list}>
          {records.map((item, i) => {
            const pct = parseFloat(item.percentage || 0);
            return (
              <ListItem
                key={String(item.subject_id)}
                title={item.subject_name}
                subtitle={`${item.present_count} / ${item.total_count} classes`}
                trailing={<Badge tone={attendanceTone(pct)}>{`${pct}%`}</Badge>}
                onPress={() => navigation.navigate('AttendanceDetail', { subject: item })}
                last={i === records.length - 1}
              />
            );
          })}
        </Card>
      </>
    );
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Button
        title="Scan attendance"
        icon="qr-code-outline"
        variant="secondary"
        onPress={() => navigation.navigate('ScanAttendance')}
        style={styles.section}
      />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: space.xxl },
  heroLabel: { marginTop: space.md, marginBottom: 2 },
  section: { marginBottom: space.xxl },
  gap: { gap: space.sm, marginBottom: space.lg },
  list: { paddingHorizontal: space.lg },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm },
});

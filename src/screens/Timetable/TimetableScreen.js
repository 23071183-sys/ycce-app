import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useApi from '../../hooks/useApi';
import { space } from '../../theme';
import { Card, EmptyState, ErrorState, Screen, SectionLabel, Skeleton, Text } from '../../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableScreen() {
  const { user } = useAuth();
  const c = useTheme();
  // Without a year there is nothing to fetch; a null path skips the request
  // instead of leaving the screen on the spinner.
  const { data, loading, error, refreshing, refresh, reload } =
    useApi(user?.year ? `/timetable/year/${user.year}` : null, { initialData: [] });
  const entries = data || [];

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.day === day);
    return acc;
  }, {});

  const fmt = (t) => t?.slice(0, 5);

  let body;
  if (loading) {
    body = <Card style={styles.skeleton}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={36} />)}</Card>;
  } else if (error) {
    body = <ErrorState onRetry={reload} />;
  } else if (!entries.length) {
    body = (
      <EmptyState
        icon="time-outline"
        title="No timetable"
        message={user?.year ? 'No classes scheduled yet.' : 'Your year isn’t set, so there’s no timetable to show.'}
      />
    );
  } else {
    body = DAYS.filter(day => byDay[day].length > 0).map(day => (
      <View key={day} style={styles.day}>
        <SectionLabel>{day}</SectionLabel>
        <Card padded={false} style={styles.inset}>
          {byDay[day].map((e, i) => (
            <View
              key={e.id}
              style={[styles.row, i < byDay[day].length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}
            >
              <View style={styles.time}>
                <Text variant="callout" style={styles.tabular}>{fmt(e.start_time)}</Text>
                <Text variant="caption" tone="muted" style={styles.tabular}>{fmt(e.end_time)}</Text>
              </View>
              <View style={styles.flex}>
                <Text variant="body">{e.subject_name}</Text>
                <Text variant="caption" tone="muted" style={styles.sub}>
                  {[e.professor_name, e.room].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    ));
  }

  return (
    <Screen onRefresh={user?.year ? refresh : undefined} refreshing={refreshing}>
      {user?.year ? <Text variant="title" style={styles.title}>Year {user.year}</Text> : null}
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: space.lg },
  skeleton: { gap: space.md },
  day: { marginBottom: space.xxl },
  inset: { paddingHorizontal: space.lg },
  row: { flexDirection: 'row', paddingVertical: space.md, gap: space.lg },
  time: { width: 48 },
  tabular: { fontVariant: ['tabular-nums'] },
  flex: { flex: 1 },
  sub: { marginTop: 2 },
});

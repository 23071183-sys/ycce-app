import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import api, { AI_TIMEOUT_MS } from '../../services/api';
import useApi from '../../hooks/useApi';
import { fmtDate } from '../../utils/format';
import { space } from '../../theme';
import {
  Badge, Button, Card, EmptyState, ListItem, Screen, SectionLabel, SegmentedControl, Skeleton, Text,
} from '../../components/ui';
import { StudyErrorState, describeStudyError, studyErrorText } from './studyErrors';
import { orderedDays, planOf, todayISO } from './planUtils';

const HOURS = ['1', '2', '3', '4'].map(h => ({ value: h, label: `${h} h` }));
const WEEKS = ['1', '2', '3', '4'].map(w => ({ value: w, label: `${w} wk` }));

function PlanForm({ onDone, compact }) {
  const [hours, setHours] = useState('2');
  const [weeks, setWeeks] = useState('2');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  const generate = async () => {
    setBusy(true); setFailure(null);
    try {
      const { data } = await api.post('/study/plan', { hours_per_day: Number(hours), weeks: Number(weeks) }, { timeout: AI_TIMEOUT_MS });
      onDone(data);
    } catch (e) {
      if (describeStudyError(e)) setFailure(e);
      else { const [title, msg] = studyErrorText(e); Alert.alert(title, msg); }
    } finally { setBusy(false); }
  };

  return (
    <Card style={styles.block}>
      {!compact ? (
        <Text variant="callout" tone="secondary" style={styles.formIntro}>
          The plan weighs each subject by your attendance, internal marks and how soon its exam is, and puts revision before exams and deadlines.
        </Text>
      ) : null}
      <Text variant="label" style={styles.label}>Study time per day</Text>
      <SegmentedControl options={HOURS} value={hours} onChange={setHours} style={styles.control} />
      <Text variant="label" style={styles.label}>Plan length</Text>
      <SegmentedControl options={WEEKS} value={weeks} onChange={setWeeks} style={styles.control} />
      {failure ? <StudyErrorState error={failure} /> : null}
      <Button title={compact ? 'Make a new plan' : 'Make my plan'} icon="sparkles-outline" onPress={generate} loading={busy} />
      {busy ? <Text variant="caption" tone="muted" style={styles.center}>Planning… this can take up to a minute.</Text> : null}
    </Card>
  );
}

export default function PlanScreen() {
  const { data, setData, loading, error, refreshing, refresh, reload } = useApi('/study/plan');
  const [showForm, setShowForm] = useState(false);
  const plan = planOf(data);
  const today = todayISO();

  if (loading) {
    return (
      <Screen>
        <Card style={styles.skeleton}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={18} />)}</Card>
      </Screen>
    );
  }
  if (error) return <Screen><StudyErrorState error={error} onRetry={reload} /></Screen>;

  if (!plan) {
    return (
      <Screen>
        <EmptyState icon="calendar-outline" title="No study plan yet" message="Choose how much time you have and get a day-by-day plan." />
        <PlanForm onDone={setData} />
      </Screen>
    );
  }

  const days = orderedDays(plan);
  const weights = [...(plan.weights || [])].sort((a, b) => b.weight - a.weight);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {plan.summary ? (
        <Card style={styles.block}>
          <Text variant="callout" tone="secondary">{plan.summary}</Text>
          {data.created_at ? <Text variant="caption" tone="muted" style={styles.meta}>Made {fmtDate(data.created_at)}</Text> : null}
        </Card>
      ) : null}

      {days.map(d => {
        const isToday = d.date === today;
        const past = d.date < today;
        const tasks = d.tasks || [];
        const minutes = tasks.reduce((n, t) => n + (Number(t.minutes) || 0), 0);
        return (
          <View key={d.date} style={[styles.block, past && styles.past]}>
            <SectionLabel>
              {isToday ? 'Today' : fmtDate(d.date, { year: false })}{minutes ? ` · ${minutes} min` : ''}
            </SectionLabel>
            {d.focus && isToday ? <Text variant="caption" tone="muted" style={styles.focus}>Focus: {d.focus}</Text> : null}
            {tasks.length ? (
              <Card padded={false} style={styles.inset}>
                {tasks.map((t, i) => (
                  <ListItem
                    key={i}
                    title={t.task}
                    subtitle={t.subject}
                    numberOfLines={3}
                    trailing={<Badge tone={isToday ? 'accent' : 'neutral'}>{`${t.minutes} min`}</Badge>}
                    last={i === tasks.length - 1}
                  />
                ))}
              </Card>
            ) : (
              <Card><Text variant="callout" tone="muted">Rest day.</Text></Card>
            )}
          </View>
        );
      })}

      {weights.length ? (
        <>
          <SectionLabel>Why this split</SectionLabel>
          <Card padded={false} style={[styles.inset, styles.block]}>
            {weights.map((w, i) => (
              <ListItem
                key={w.subject_id}
                title={w.subject}
                trailing={<Text variant="callout" tone="secondary">{Number(w.weight).toFixed(2)}</Text>}
                last={i === weights.length - 1}
              />
            ))}
          </Card>
          <Text variant="caption" tone="muted" style={styles.weightNote}>Higher weight means more time: weaker marks or attendance, or an exam soon.</Text>
        </>
      ) : null}

      {showForm ? (
        <PlanForm compact onDone={(fresh) => { setData(fresh); setShowForm(false); }} />
      ) : (
        <Button title="Make a new plan" variant="secondary" icon="refresh" onPress={() => setShowForm(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: space.xxl },
  skeleton: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
  center: { textAlign: 'center', marginTop: space.sm },
  formIntro: { marginBottom: space.lg },
  label: { marginBottom: space.xs + 2 },
  control: { marginBottom: space.lg },
  meta: { marginTop: space.sm },
  focus: { marginBottom: space.sm },
  past: { opacity: 0.5 },
  weightNote: { marginTop: -space.xl, marginBottom: space.xxl },
});

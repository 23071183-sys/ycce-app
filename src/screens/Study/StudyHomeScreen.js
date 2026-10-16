import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { fmtDate } from '../../utils/format';
import { space } from '../../theme';
import Monogram from '../../components/Monogram';
import {
  Badge, Button, Card, EmptyState, ErrorState, ListItem, Screen, SectionLabel, Skeleton, StatNumber, Text,
} from '../../components/ui';
import { planOf, todayISO, todaysTasks } from './planUtils';

const EXAM_LABEL = { MSE1: 'MSE 1', MSE2: 'MSE 2', RE_MSE: 'RE-MSE', ESE: 'ESE' };

export default function StudyHomeScreen({ navigation }) {
  const { user } = useAuth();
  const subjectsPath = user?.year ? `/subjects/year/${user.year}${user.semester ? `?semester=${user.semester}` : ''}` : null;
  const subjects = useApi(subjectsPath, { initialData: [] });
  const cards = useApi('/study/flashcards/due');
  const exams = useApi('/study/exams', { initialData: [] });
  const plan = useApi('/study/plan');

  const all = [subjects, cards, exams, plan];
  const refreshing = all.some(x => x.refreshing);
  const refresh = () => all.forEach(x => x.refresh());

  // Reviews and plans change on the other study screens; refresh on return.
  const seen = useRef(false);
  useFocusEffect(useCallback(() => {
    if (seen.current) { cards.revalidate(); plan.revalidate(); }
    seen.current = true;
  }, [cards.revalidate, plan.revalidate]));

  const due = cards.data?.due ?? 0;
  const upcoming = (exams.data || []).slice(0, 3);
  const currentPlan = planOf(plan.data);
  const tasks = todaysTasks(currentPlan);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.tiles}>
        <Card style={styles.flex} onPress={() => navigation.navigate('Flashcards')}>
          {cards.loading ? <Skeleton width={40} height={28} /> : (
            <StatNumber value={due} label="Cards due" tone={due ? 'accent' : undefined} />
          )}
          <Text variant="caption" tone="muted" style={styles.tileSub}>
            {cards.data?.total ? `${cards.data.total} in your decks` : 'Make decks per subject below'}
          </Text>
        </Card>
        <Card style={styles.flex} onPress={() => navigation.navigate('StudyPlan')}>
          {plan.loading ? <Skeleton width={40} height={28} /> : (
            <StatNumber value={tasks.reduce((n, t) => n + (Number(t.minutes) || 0), 0)} label="Minutes today" />
          )}
          <Text variant="caption" tone="muted" style={styles.tileSub}>
            {currentPlan ? 'From your study plan' : 'No plan yet'}
          </Text>
        </Card>
      </View>

      <SectionLabel action={currentPlan ? 'Full plan' : undefined} onAction={() => navigation.navigate('StudyPlan')}>
        Today
      </SectionLabel>
      <View style={styles.block}>
        {plan.loading ? (
          <Card style={styles.skeleton}><Skeleton height={14} /><Skeleton width="60%" height={14} /></Card>
        ) : plan.error ? (
          <ErrorState onRetry={plan.reload} />
        ) : !currentPlan ? (
          <Card padded={false}>
            <EmptyState
              icon="calendar-outline"
              title="No study plan yet"
              message="Get a day-by-day plan built around your exams, attendance and marks."
              actionTitle="Make a plan"
              onAction={() => navigation.navigate('StudyPlan')}
            />
          </Card>
        ) : tasks.length ? (
          <Card padded={false} style={styles.inset}>
            {tasks.map((t, i) => (
              <ListItem
                key={i}
                title={t.task}
                subtitle={`${t.subject} · ${t.minutes} min`}
                numberOfLines={2}
                last={i === tasks.length - 1}
              />
            ))}
          </Card>
        ) : (
          <Card><Text variant="callout" tone="muted">Nothing planned for {fmtDate(todayISO())}. Rest day.</Text></Card>
        )}
      </View>

      <SectionLabel>Next exams</SectionLabel>
      <View style={styles.block}>
        {exams.loading ? (
          <Card style={styles.skeleton}><Skeleton height={14} /><Skeleton width="60%" height={14} /></Card>
        ) : upcoming.length ? (
          <Card padded={false} style={styles.inset}>
            {upcoming.map((e, i) => (
              <ListItem
                key={e.id}
                title={e.subject_name}
                subtitle={[e.room, e.start_time ? e.start_time.slice(0, 5) : null].filter(Boolean).join(' · ') || undefined}
                trailing={
                  <View style={styles.examTrail}>
                    <Badge>{EXAM_LABEL[e.exam_type] || e.exam_type}</Badge>
                    <Text variant="caption" tone="muted">{fmtDate(e.exam_date, { year: false })}</Text>
                  </View>
                }
                last={i === upcoming.length - 1}
              />
            ))}
          </Card>
        ) : (
          <Card><Text variant="callout" tone="muted">No exams scheduled yet.</Text></Card>
        )}
      </View>

      <SectionLabel>Practise a subject</SectionLabel>
      {subjects.loading ? (
        <Card style={styles.skeleton}>{[1, 2, 3].map(i => <Skeleton key={i} height={40} />)}</Card>
      ) : subjects.error ? (
        <ErrorState onRetry={subjects.reload} />
      ) : !(subjects.data || []).length ? (
        <EmptyState icon="book-outline" title="No subjects for your year" />
      ) : (
        (subjects.data || []).map(s => (
          <Card key={s.id} style={styles.subject}>
            <View style={styles.subjectHead}>
              <Monogram name={s.name} />
              <View style={styles.flex}>
                <Text variant="body">{s.name}</Text>
                <Text variant="caption" tone="muted">{s.code}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Button
                title="Quiz"
                icon="help-circle-outline"
                size="sm"
                variant="secondary"
                style={styles.flex}
                onPress={() => navigation.navigate('Quiz', { subjectId: s.id, subjectName: s.name })}
              />
              <Button
                title="Flashcards"
                icon="layers-outline"
                size="sm"
                variant="secondary"
                style={styles.flex}
                onPress={() => navigation.navigate('Flashcards', { subjectId: s.id, subjectName: s.name })}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: space.md, marginBottom: space.xxl },
  flex: { flex: 1 },
  tileSub: { marginTop: space.xs },
  block: { marginBottom: space.xxl },
  skeleton: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
  examTrail: { alignItems: 'flex-end', gap: 2 },
  subject: { marginBottom: space.md },
  subjectHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});

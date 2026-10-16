import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { radius, space } from '../../theme';
import { Badge, Button, Card, Icon, Screen, SectionLabel, Skeleton, StatNumber, Text } from '../../components/ui';
import { StudyErrorState } from './studyErrors';

const LETTERS = ['A', 'B', 'C', 'D'];

function Option({ index, label, state, onPress }) {
  const c = useTheme();
  // state: 'idle' | 'selected' | 'correct' | 'wrong' | 'answer'
  const look = {
    idle: { bg: c.surface, border: c.border, tone: 'default' },
    selected: { bg: c.accentSoft, border: c.accent, tone: 'accent' },
    correct: { bg: c.successSoft, border: c.success, tone: 'success' },
    answer: { bg: c.successSoft, border: c.success, tone: 'success' },
    wrong: { bg: c.dangerSoft, border: c.danger, tone: 'danger' },
  }[state];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityState={{ selected: state === 'selected' }}
      style={[styles.option, { backgroundColor: look.bg, borderColor: look.border }]}
    >
      <Text variant="callout" tone={look.tone} style={styles.letter}>{LETTERS[index]}</Text>
      <Text variant="body" style={styles.flex}>{label}</Text>
      {state === 'correct' || state === 'answer' ? <Icon name="checkmark-circle" size={18} tone="success" /> : null}
      {state === 'wrong' ? <Icon name="close-circle" size={18} tone="danger" /> : null}
    </Pressable>
  );
}

export default function QuizScreen({ route, navigation }) {
  const { subjectId, subjectName } = route.params;
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useLayoutEffect(() => { navigation.setOptions({ title: subjectName ? `${subjectName} quiz` : 'Quiz' }); }, [navigation, subjectName]);

  const load = async (fresh = false) => {
    setLoading(true); setError(null); setResult(null); setIndex(0); setAnswers([]); setSubmitError(null);
    try {
      const { data } = await api.get(`/study/quiz/${subjectId}`, { params: fresh ? { fresh: 1 } : undefined });
      setQuiz(data);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(false); }, [subjectId]);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await api.post(`/study/quiz/${quiz.id}/attempt`, { answers });
      setResult(data);
    } catch (e) { setSubmitError(e); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <Screen>
        <Card style={styles.skeleton}>
          <Skeleton width="30%" height={12} />
          <Skeleton height={18} />
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={44} />)}
        </Card>
        <Text variant="caption" tone="muted" style={styles.center}>Writing questions from past papers can take a few seconds.</Text>
      </Screen>
    );
  }
  if (error) return <Screen><StudyErrorState error={error} onRetry={() => load(false)} /></Screen>;
  if (!quiz?.questions?.length) return <Screen><StudyErrorState error={{ response: { status: 409 } }} /></Screen>;

  const questions = quiz.questions;

  if (result) {
    return (
      <Screen>
        <Card style={[styles.block, styles.centerItems]}>
          <StatNumber size="display" value={`${result.score}/${result.total}`} label="Score" />
        </Card>
        <SectionLabel>Review</SectionLabel>
        {questions.map((q, i) => {
          const r = result.results[i] || {};
          return (
            <Card key={i} style={styles.block}>
              <Text variant="label">Question {i + 1}{q.topic ? ` · ${q.topic}` : ''}</Text>
              <Text variant="heading" style={styles.question}>{q.question}</Text>
              <View style={styles.options}>
                {q.options.map((o, oi) => {
                  let state = 'idle';
                  if (oi === r.answer) state = r.chosen === oi ? 'correct' : 'answer';
                  else if (oi === r.chosen) state = 'wrong';
                  return <Option key={oi} index={oi} label={o} state={state} />;
                })}
              </View>
              {r.chosen == null ? <Text variant="caption" tone="danger" style={styles.explain}>Not answered</Text> : null}
              {r.explanation ? <Text variant="callout" tone="secondary" style={styles.explain}>{r.explanation}</Text> : null}
            </Card>
          );
        })}
        <View style={styles.actions}>
          <Button title="Try a new quiz" icon="refresh" onPress={() => load(true)} />
          <Button title="Retake this quiz" variant="secondary" onPress={() => { setResult(null); setIndex(0); setAnswers([]); }} />
        </View>
      </Screen>
    );
  }

  const q = questions[index];
  const chosen = answers[index];
  const last = index === questions.length - 1;
  const choose = (oi) => setAnswers(prev => { const next = [...prev]; next[index] = oi; return next; });

  return (
    <Screen>
      <View style={styles.progressRow}>
        <Text variant="label">Question {index + 1} of {questions.length}</Text>
        {q.from_past_paper ? <Badge tone="accent">Past paper</Badge> : null}
      </View>
      {quiz.limited ? (
        <Text variant="caption" tone="muted" style={styles.limited}>You've hit today's limit for new quizzes, so this is your previous one.</Text>
      ) : null}
      <Card style={styles.block}>
        {q.topic ? <Text variant="caption" tone="muted">{q.topic}</Text> : null}
        <Text variant="heading" style={styles.question}>{q.question}</Text>
        <View style={styles.options}>
          {q.options.map((o, oi) => (
            <Option key={oi} index={oi} label={o} state={chosen === oi ? 'selected' : 'idle'} onPress={() => choose(oi)} />
          ))}
        </View>
      </Card>
      {submitError ? (
        <Text variant="callout" tone="danger" style={styles.limited}>
          {submitError.response?.data?.error || 'Could not submit. Check your connection and try again.'}
        </Text>
      ) : null}
      <View style={styles.nav}>
        <Button title="Back" variant="secondary" onPress={() => setIndex(i => i - 1)} disabled={index === 0} style={styles.flex} />
        {last ? (
          <Button title="Finish" onPress={submit} loading={submitting} disabled={chosen == null} style={styles.flex} />
        ) : (
          <Button title="Next" onPress={() => setIndex(i => i + 1)} disabled={chosen == null} style={styles.flex} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { marginBottom: space.lg },
  skeleton: { gap: space.md, marginBottom: space.md },
  center: { textAlign: 'center' },
  centerItems: { alignItems: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  limited: { marginBottom: space.md },
  question: { marginTop: space.sm, marginBottom: space.lg },
  options: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  letter: { width: 16, fontWeight: '600' },
  explain: { marginTop: space.md },
  nav: { flexDirection: 'row', gap: space.sm },
  actions: { gap: space.sm },
});

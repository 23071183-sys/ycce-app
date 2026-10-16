import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import api, { reportError } from '../../services/api';
import { radius, space } from '../../theme';
import { Button, Card, EmptyState, Screen, Skeleton, Text } from '../../components/ui';
import { StudyErrorState, describeStudyError } from './studyErrors';

// SM-2 grades: how well the student remembered the back of the card.
const GRADES = [
  { grade: 1, label: 'Again', variant: 'destructive' },
  { grade: 3, label: 'Hard', variant: 'secondary' },
  { grade: 4, label: 'Good', variant: 'secondary' },
  { grade: 5, label: 'Easy', variant: 'primary' },
];

export default function FlashcardsScreen({ route, navigation }) {
  const { subjectId, subjectName } = route.params || {};
  const c = useTheme();
  const [deck, setDeck] = useState(null); // { cards, total, due }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: subjectName ? `${subjectName} cards` : 'Flashcards' });
  }, [navigation, subjectName]);

  const load = async () => {
    setLoading(true); setError(null); setIndex(0); setFlipped(false);
    try {
      const { data } = await api.get('/study/flashcards/due', { params: subjectId ? { subject_id: subjectId } : undefined });
      setDeck(data);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [subjectId]);

  const generate = async () => {
    setGenerating(true); setGenerateError(null);
    try {
      await api.post(`/study/flashcards/${subjectId}/generate`);
      await load();
    } catch (e) { setGenerateError(e); }
    finally { setGenerating(false); }
  };

  const grade = async (g) => {
    const card = deck.cards[index];
    setGrading(true);
    try {
      await api.post(`/study/flashcards/${card.id}/review`, { grade: g });
      setReviewed(n => n + 1);
      setFlipped(false);
      setIndex(i => i + 1);
    } catch (e) {
      reportError(e);
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Card style={styles.skeleton}><Skeleton width="40%" height={12} /><Skeleton height={80} /></Card>
      </Screen>
    );
  }
  if (error) return <Screen><StudyErrorState error={error} onRetry={load} /></Screen>;

  const cards = deck?.cards || [];
  const card = cards[index];

  if (!card) {
    if (!deck?.total) {
      const known = generateError && describeStudyError(generateError);
      return (
        <Screen>
          {known ? (
            <EmptyState {...known} />
          ) : subjectId ? (
            <EmptyState
              icon="layers-outline"
              title="No flashcards yet"
              message={generateError
                ? generateError.response?.data?.error || 'Could not make cards. Try again.'
                : 'Make a deck from this subject’s past papers and notes.'}
              actionTitle={generating ? undefined : 'Make flashcards'}
              onAction={generate}
            />
          ) : (
            <EmptyState
              icon="layers-outline"
              title="No flashcards yet"
              message="Open a subject from Study and choose Flashcards to make its deck."
            />
          )}
          {generating ? <Text variant="caption" tone="muted" style={styles.center}>Making cards… this can take a little while.</Text> : null}
        </Screen>
      );
    }
    return (
      <Screen>
        <EmptyState
          icon="checkmark-done-outline"
          title={reviewed ? `Done — ${reviewed} reviewed` : 'All caught up'}
          message="No cards are due right now. Come back later for the next review."
          actionTitle={reviewed ? 'Check for more' : undefined}
          onAction={load}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.progressRow}>
        <Text variant="label">Card {index + 1} of {cards.length}</Text>
        <Text variant="caption" tone="muted">{card.subject_name}{card.is_new ? ' · new' : ''}</Text>
      </View>
      <Pressable
        onPress={() => setFlipped(f => !f)}
        accessibilityRole="button"
        accessibilityHint="Flips the card"
        style={[styles.card, { backgroundColor: flipped ? c.surfaceAlt : c.surface, borderColor: c.border }]}
      >
        <Text variant="label" style={styles.side}>{flipped ? 'Answer' : 'Question'}</Text>
        <Text variant="title" style={styles.cardText}>{flipped ? card.back : card.front}</Text>
        {card.topic ? <Text variant="caption" tone="muted" style={styles.center}>{card.topic}</Text> : null}
        {!flipped ? <Text variant="caption" tone="muted" style={styles.tap}>Tap to show the answer</Text> : null}
      </Pressable>
      {flipped ? (
        <>
          <Text variant="caption" tone="muted" style={styles.ask}>How well did you remember it?</Text>
          <View style={styles.grades}>
            {GRADES.map(g => (
              <Button
                key={g.grade}
                title={g.label}
                variant={g.variant}
                size="sm"
                onPress={() => grade(g.grade)}
                disabled={grading}
                style={styles.flex}
              />
            ))}
          </View>
        </>
      ) : (
        <Button title="Show answer" variant="secondary" onPress={() => setFlipped(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeleton: { gap: space.md },
  center: { textAlign: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  card: {
    minHeight: 280,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xxl,
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  side: { position: 'absolute', top: space.lg, left: space.lg },
  cardText: { textAlign: 'center', marginBottom: space.md },
  tap: { position: 'absolute', bottom: space.lg, alignSelf: 'center' },
  ask: { textAlign: 'center', marginBottom: space.sm },
  grades: { flexDirection: 'row', gap: space.sm },
});

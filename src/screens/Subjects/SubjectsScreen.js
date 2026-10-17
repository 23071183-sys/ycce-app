import React, { useState, useCallback, useLayoutEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import Monogram from '../../components/Monogram';
import { hueColors, hueFor, radius, space } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import {
  Card, EmptyState, ErrorState, Icon, Screen, SectionLabel, Skeleton, Text,
} from '../../components/ui';

function Chip({ icon, children }) {
  const c = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: c.surfaceAlt }]}>
      {icon ? <Icon name={icon} size={11} tone="muted" /> : null}
      <Text variant="caption" tone="secondary" numberOfLines={1}>{children}</Text>
    </View>
  );
}

export function SubjectCard({ subject, onPress }) {
  const c = useTheme();
  const { fg } = hueColors(c, hueFor(subject.id));
  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      <View style={[styles.strip, { backgroundColor: fg }]} />
      <View style={styles.cardBody}>
        <Monogram name={subject.name} colorKey={subject.id} size={44} />
        <View style={styles.flex}>
          <Text variant="heading" numberOfLines={2}>{subject.name}</Text>
          {subject.code ? <Text variant="caption" style={[styles.code, { color: fg }]}>{subject.code}</Text> : null}
          <View style={styles.chips}>
            <Chip icon="person-outline">{subject.professor_name || 'TBA'}</Chip>
            {subject.year ? <Chip>Year {subject.year}</Chip> : null}
            {subject.semester ? <Chip>Sem {subject.semester}</Chip> : null}
          </View>
        </View>
        <Icon name="chevron-forward" size={16} tone="muted" />
      </View>
    </Card>
  );
}

export default function SubjectsScreen({ navigation }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback((isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const endpoint = user.role === 'professor'
      ? '/subjects/my-subjects'
      : `/subjects/year/${user.year}${user.semester ? `?semester=${user.semester}` : ''}`;
    api.get(endpoint)
      .then(r => { setSubjects(r.data); setError(null); })
      .catch(e => { reportError(e); setError(e); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [user?.role, user?.year, user?.semester]);

  useLayoutEffect(() => {
    if (user?.role !== 'student') return;
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('StudyHome')} hitSlop={8} style={styles.headerButton} accessibilityLabel="Study">
          <Icon name="school-outline" size={22} tone="default" />
        </Pressable>
      ),
    });
  }, [navigation, user?.role]);

  // Reload on focus so subjects added elsewhere show up when returning here.
  useFocusEffect(useCallback(() => { load(false); }, [load]));

  let body;
  if (loading) {
    body = (
      <Card style={styles.skeleton}>
        {[1, 2, 3, 4].map(i => <Skeleton key={i} height={40} />)}
      </Card>
    );
  } else if (error) {
    body = <ErrorState onRetry={() => load(false)} />;
  } else if (!subjects.length) {
    body = <EmptyState icon="book-outline" title="No subjects yet" message="Subjects assigned to you will show here." />;
  } else {
    body = subjects.map(item => (
      <SubjectCard key={String(item.id)} subject={item} onPress={() => navigation.navigate('SubjectDetail', { subject: item })} />
    ));
  }

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <View style={styles.header}>
        <SectionLabel>{user?.role === 'professor' ? 'Classes you teach' : 'My subjects'}</SectionLabel>
        {user?.semester ? <Text variant="caption" tone="muted">Semester {user.semester}</Text> : null}
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space.sm },
  headerButton: { paddingHorizontal: space.lg },
  skeleton: { gap: space.md },
  card: { marginBottom: space.md },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingLeft: space.lg + 4 },
  flex: { flex: 1 },
  code: { fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2, marginTop: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    maxWidth: '100%',
  },
});

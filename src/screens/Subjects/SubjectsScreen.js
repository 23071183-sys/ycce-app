import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import Monogram from '../../components/Monogram';
import { space } from '../../theme';
import {
  Card, EmptyState, ErrorState, ListItem, Screen, SectionLabel, Skeleton, Text,
} from '../../components/ui';

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
    body = (
      <Card padded={false} style={styles.inset}>
        {subjects.map((item, i) => (
          <ListItem
            key={String(item.id)}
            leading={<Monogram name={item.name} />}
            title={item.name}
            subtitle={`${item.code} · ${item.professor_name || 'TBA'} · Year ${item.year} · Sem ${item.semester}`}
            onPress={() => navigation.navigate('SubjectDetail', { subject: item })}
            last={i === subjects.length - 1}
          />
        ))}
      </Card>
    );
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
  skeleton: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
});

import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { fmtDate } from '../../utils/format';
import { space } from '../../theme';
import {
  Button, Card, EmptyState, ErrorState, Screen, SectionLabel, Skeleton, Text,
} from '../../components/ui';

export default function PendingApprovalsScreen() {
  const { data, loading, error, refreshing, refresh, reload } = useApi('/admin/pending', { initialData: [] });
  const users = data || [];

  const approve = async (id, name) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      Alert.alert('Approved', `${name} can now log in.`);
      reload();
    } catch (e) { Alert.alert('Error', 'Could not approve'); }
  };

  const reject = async (id, name) => {
    Alert.alert('Reject', `Reject ${name}'s registration?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/admin/users/${id}/reject`);
          reload();
        } catch (e) { Alert.alert('Error', 'Could not reject'); }
      }}
    ]);
  };

  let body;
  if (loading) {
    body = [1, 2].map(i => (
      <Card key={i} style={[styles.card, styles.skeleton]}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="70%" height={12} />
        <Skeleton height={32} />
      </Card>
    ));
  } else if (error) {
    body = <ErrorState onRetry={reload} />;
  } else if (!users.length) {
    body = <EmptyState icon="checkmark-circle-outline" title="No pending registrations" message="New student sign-ups waiting for approval show here." />;
  } else {
    body = (
      <>
        <SectionLabel>{`Waiting · ${users.length}`}</SectionLabel>
        {users.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.head}>
              <Text variant="heading" style={styles.name}>{item.name}</Text>
              <Text variant="caption" tone="muted">{fmtDate(item.created_at)}</Text>
            </View>
            <Text variant="callout" tone="secondary">{item.email}</Text>
            <Text variant="caption" tone="muted" style={styles.meta}>Roll {item.roll_number} · Year {item.year}</Text>
            <View style={styles.actions}>
              <Button title="Approve" size="sm" onPress={() => approve(item.id, item.name)} style={styles.flex} />
              <Button title="Reject" size="sm" variant="destructive" onPress={() => reject(item.id, item.name)} style={styles.flex} />
            </View>
          </Card>
        ))}
      </>
    );
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md },
  skeleton: { gap: space.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm, marginBottom: space.xs },
  name: { flex: 1 },
  meta: { marginTop: 2 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  flex: { flex: 1 },
});

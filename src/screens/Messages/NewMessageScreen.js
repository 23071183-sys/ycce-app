import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { space } from '../../theme';
import {
  Avatar, Card, EmptyState, ErrorState, ListItem, SegmentedControl, Skeleton, TextField,
} from '../../components/ui';
import { describePerson } from './util';

const YEARS = [{ value: '', label: 'All' }, ...['1', '2', '3', '4'].map(y => ({ value: y, label: `Y${y}` }))];

export default function NewMessageScreen({ navigation }) {
  const c = useTheme();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [opening, setOpening] = useState(null);

  // Search after typing pauses, not on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const params = {};
  if (q) params.q = q;
  if (year) params.year = year;
  const { data, loading, error, refreshing, refresh, reload } = useApi('/messages/contacts', { params, initialData: [] });
  const contacts = data || [];

  const open = async (person) => {
    if (opening) return;
    setOpening(person.id);
    try {
      const { data: conv } = await api.post('/messages/conversations', { recipient_id: person.id });
      navigation.replace('Conversation', { conversationId: conv.id, other: { ...person, ...conv.other } });
    } catch (e) {
      Alert.alert('Could not start conversation', e.response?.data?.error || 'Try again in a moment.');
    } finally {
      setOpening(null);
    }
  };

  const header = (
    <View style={styles.header}>
      <TextField
        placeholder={isStudent ? 'Search professors and admins' : 'Search by name or roll number'}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={styles.search}
      />
      {!isStudent ? <SegmentedControl options={YEARS} value={year} onChange={setYear} /> : null}
    </View>
  );

  let empty;
  if (loading) {
    empty = (
      <Card style={styles.skeleton}>
        {[1, 2, 3].map(i => <Skeleton key={i} height={36} />)}
      </Card>
    );
  } else if (error) {
    empty = <ErrorState onRetry={reload} />;
  } else {
    empty = (
      <Card padded={false}>
        <EmptyState
          icon="people-outline"
          title={q ? 'No one matches' : 'No one to message'}
          message={isStudent
            ? 'You can message the professors who teach your year and the college admins.'
            : 'You can message students in the years you teach.'}
        />
      </Card>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.list}
      data={loading || error ? [] : contacts}
      keyExtractor={item => String(item.id)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.textMuted} colors={[c.accent]} />}
      renderItem={({ item, index }) => {
        const subjects = item.subjects?.length ? item.subjects.join(', ') : null;
        return (
          <ListItem
            leading={<Avatar name={item.name} uri={item.avatar_url} size={40} />}
            title={item.name}
            subtitle={[describePerson(item), subjects].filter(Boolean).join(' · ')}
            onPress={() => open(item)}
            trailing={opening === item.id ? <Skeleton width={16} height={16} rounded={8} /> : null}
            last={index === contacts.length - 1}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: space.huge },
  header: { marginBottom: space.md },
  search: { marginBottom: space.md },
  skeleton: { gap: space.md },
});

import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import { space } from '../../theme';
import { Badge, Card, Icon, Screen, SectionLabel, Skeleton, Text } from '../../components/ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toMinutes(t) { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function UpcomingClass({ user, navigation }) {
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClass = useCallback(() => {
    if (!user?.year) { setLoading(false); return; }
    setLoading(true);
    api.get(`/timetable/year/${user.year}`)
      .then(r => {
        const now = new Date();
        const todayName = DAYS[now.getDay()];
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const today = r.data.filter(c => c.day === todayName).sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
        const current = today.find(c => toMinutes(c.start_time) <= nowMin && toMinutes(c.end_time) > nowMin);
        const next = today.find(c => toMinutes(c.start_time) > nowMin);
        setCls(current ? { ...current, status: 'ongoing' } : next ? { ...next, status: 'upcoming' } : null);
      })
      .catch(reportError)
      .finally(() => setLoading(false));
  }, [user?.year]);

  useFocusEffect(fetchClass);

  if (loading) {
    return (
      <Card style={[styles.block, styles.skeleton]}>
        <Skeleton width={80} height={18} />
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} />
      </Card>
    );
  }
  if (!cls) return null;

  const isOngoing = cls.status === 'ongoing';

  return (
    <Card onPress={() => navigation.navigate('Timetable')} style={styles.block}>
      <View style={styles.classHead}>
        <Badge tone={isOngoing ? 'success' : 'neutral'}>{isOngoing ? 'Ongoing' : 'Up next'}</Badge>
        <Text variant="caption" tone="muted" style={styles.tabular}>
          {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
        </Text>
      </View>
      <Text variant="heading" style={styles.className}>{cls.subject_name}</Text>
      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Icon name="person-outline" size={13} tone="muted" />
          <Text variant="callout" tone="secondary">{cls.professor_name}</Text>
        </View>
        {cls.room ? (
          <View style={styles.meta}>
            <Icon name="location-outline" size={13} tone="muted" />
            <Text variant="callout" tone="secondary">{cls.room}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  const cards = [
    { label: 'Timetable', icon: 'time-outline',                screen: 'Timetable' },
    { label: 'Faculty',   icon: 'people-outline',              screen: 'Faculty' },
    { label: 'Compufest', icon: 'code-slash-outline',          screen: 'Compufest' },
    { label: 'Yash Fest', icon: 'star-outline',                screen: 'Fest' },
    { label: 'Ask AI',    icon: 'chatbubble-ellipses-outline', screen: 'Chat' },
    ...(user?.role === 'student' ? [{ label: 'Results', icon: 'bar-chart-outline', screen: 'Results' }] : []),
  ];

  const details = [
    user?.role?.replace('_', ' '),
    user?.year ? `Year ${user.year}` : null,
    user?.roll_number,
  ].filter(Boolean).join(' · ');

  return (
    <Screen>
      <View style={styles.greeting}>
        <Text variant="label">Welcome back</Text>
        <Text variant="display" style={styles.name}>{user?.name?.split(' ')[0]}</Text>
        {details ? <Text variant="callout" tone="muted" style={styles.capitalize}>{details}</Text> : null}
      </View>

      <UpcomingClass user={user} navigation={navigation} />

      <SectionLabel>Quick access</SectionLabel>
      <View style={styles.grid}>
        {cards.map(card => (
          <Card key={card.label} onPress={() => navigation.navigate(card.screen)} style={styles.tile}>
            <Icon name={card.icon} size={22} tone="default" />
            <Text variant="body" style={styles.tileLabel}>{card.label}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { marginBottom: space.xxl },
  name: { marginTop: space.xs, marginBottom: space.xs },
  capitalize: { textTransform: 'capitalize' },
  block: { marginBottom: space.xxl },
  skeleton: { gap: space.sm },
  classHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  className: { marginTop: space.md, marginBottom: space.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  tile: { width: '48.5%', minHeight: 96, justifyContent: 'space-between' },
  tileLabel: { marginTop: space.md },
});

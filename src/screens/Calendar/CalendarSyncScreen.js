import React, { useState } from 'react';
import { Alert, Linking, Share, StyleSheet } from 'react-native';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { space } from '../../theme';
import { Button, Card, ErrorState, Screen, SectionLabel, Skeleton, Text } from '../../components/ui';

// A private calendar feed of the user's timetable, exams and deadlines that
// calendar apps subscribe to. The link itself is the key, so it can be reset.
export default function CalendarSyncScreen() {
  const { data, setData, loading, error, reload } = useApi('/calendar/link');
  const [resetting, setResetting] = useState(false);

  const open = (url) => Linking.openURL(url).catch(() =>
    Alert.alert('No calendar app found', 'Use "Share link" and paste it into your calendar app instead.'));

  const reset = () => {
    Alert.alert(
      'Reset link?',
      'Calendars subscribed with the old link stop updating. You will need to add the new link again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              const { data: fresh } = await api.post('/calendar/reset');
              setData(fresh);
            } catch (e) {
              Alert.alert('Could not reset', e.response?.data?.error || 'Try again in a moment.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen>
        <Card style={styles.skeleton}>{[1, 2, 3].map(i => <Skeleton key={i} height={44} />)}</Card>
      </Screen>
    );
  }
  if (error || !data) return <Screen><ErrorState onRetry={reload} /></Screen>;

  return (
    <Screen>
      <Text variant="callout" tone="secondary" style={styles.intro}>
        Subscribe once and your classes, exams and assignment deadlines appear in your phone's calendar and keep
        themselves up to date.
      </Text>

      <SectionLabel>Add to calendar</SectionLabel>
      <Card style={[styles.block, styles.buttons]}>
        <Button title="Add to Google Calendar" icon="logo-google" onPress={() => open(data.google)} />
        <Button title="Add to Apple or other calendar" icon="calendar-outline" variant="secondary" onPress={() => open(data.webcal)} />
        <Button
          title="Share link"
          icon="share-outline"
          variant="secondary"
          onPress={() => Share.share({ message: data.url }).catch(() => {})}
        />
      </Card>

      <SectionLabel>Your link</SectionLabel>
      <Card style={styles.block}>
        <Text variant="caption" tone="secondary" selectable numberOfLines={3}>{data.url}</Text>
        <Text variant="caption" tone="muted" style={styles.note}>
          Anyone with this link can see your schedule. Reset it if you shared it by mistake.
        </Text>
      </Card>

      <Button title="Reset link" variant="destructive" onPress={reset} loading={resetting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: space.xxl },
  block: { marginBottom: space.xxl },
  buttons: { gap: space.sm },
  skeleton: { gap: space.md },
  note: { marginTop: space.sm },
});

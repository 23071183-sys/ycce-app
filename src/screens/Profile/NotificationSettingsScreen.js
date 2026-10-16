import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api, { reportError } from '../../services/api';
import { Card, ListItem, Screen, SectionLabel, Text } from '../../components/ui';
import { space } from '../../theme';

const PREFS = [
  { key: 'announcements', title: 'Announcements', subtitle: 'College and class notices' },
  { key: 'lectures', title: 'Lectures', subtitle: 'Cancelled or rescheduled classes' },
  { key: 'deadlines', title: 'Deadlines', subtitle: 'Assignments due soon' },
  { key: 'messages', title: 'Messages', subtitle: 'New direct messages' },
  { key: 'fees', title: 'Fees', subtitle: 'New fees, reminders and receipts' },
  { key: 'placements', title: 'Placements', subtitle: 'Drives and results' },
  { key: 'events', title: 'Events', subtitle: 'Compufest and Yash Fest' },
];

export default function NotificationSettingsScreen() {
  const c = useTheme();
  const { user, refreshUser } = useAuth();
  // The server treats a missing preference as on.
  const [prefs, setPrefs] = useState(user?.notification_prefs || {});

  // The stored user may predate the preferences column; fetch the current set.
  useEffect(() => { refreshUser().catch(reportError); }, []);
  useEffect(() => { if (user?.notification_prefs) setPrefs(user.notification_prefs); }, [user?.notification_prefs]);

  const toggle = async (key, value) => {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    try {
      const { data } = await api.put('/users/notification-prefs', { [key]: value });
      setPrefs(data);
      refreshUser({ notification_prefs: data }).catch(() => {});
    } catch (e) {
      setPrefs(previous);
      Alert.alert('Could not save', e.response?.data?.error || 'Try again in a moment.');
    }
  };

  return (
    <Screen>
      <SectionLabel>Push notifications</SectionLabel>
      <Card padded={false} style={styles.inset}>
        {PREFS.map((p, i) => (
          <ListItem
            key={p.key}
            title={p.title}
            subtitle={p.subtitle}
            trailing={
              <Switch
                value={prefs[p.key] !== false}
                onValueChange={(v) => toggle(p.key, v)}
                trackColor={{ true: c.accent, false: c.borderStrong }}
                thumbColor={c.surface}
                ios_backgroundColor={c.borderStrong}
              />
            }
            last={i === PREFS.length - 1}
          />
        ))}
      </Card>
      <Text variant="caption" tone="muted" style={styles.note}>
        These apply to every phone you're signed in on. Your phone's own settings can still block notifications.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: space.lg },
  note: { marginTop: space.sm },
});

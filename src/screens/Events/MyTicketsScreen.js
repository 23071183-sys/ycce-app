import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../context/ThemeContext';
import useApi from '../../hooks/useApi';
import { palette, space } from '../../theme';
import { Badge, Card, EmptyState, ErrorState, Screen, Skeleton, Text } from '../../components/ui';
import { fmtEventDate } from './EventParts';

const TYPE_LABEL = { fest: 'Yash Fest', compufest: 'Compufest' };

export default function MyTicketsScreen() {
  const c = useTheme();
  const { data, loading, error, refreshing, refresh, reload } = useApi('/events/registrations/my', { initialData: [] });
  const tickets = data || [];

  let body;
  if (loading) {
    body = (
      <Card style={[styles.ticket, styles.center]}>
        <Skeleton width={200} height={200} />
        <Skeleton width="60%" height={16} />
      </Card>
    );
  } else if (error) {
    body = <ErrorState onRetry={reload} />;
  } else if (!tickets.length) {
    body = (
      <EmptyState
        icon="ticket-outline"
        title="No tickets yet"
        message="Register for a Yash Fest or Compufest event and your entry QR shows here."
      />
    );
  } else {
    body = tickets.map(t => {
      const checkedIn = t.status === 'checked_in';
      return (
        <Card key={t.id} style={styles.ticket}>
          <View style={styles.head}>
            <Text variant="label">{TYPE_LABEL[t.event_type] || t.event_type}</Text>
            <Badge tone={checkedIn ? 'success' : 'accent'}>{checkedIn ? 'Checked in' : 'Registered'}</Badge>
          </View>
          <Text variant="heading" style={styles.title}>{t.title}</Text>
          <Text variant="caption" tone="muted">
            {[fmtEventDate(t.event_date), t.venue].filter(Boolean).join(' · ')}
          </Text>
          <View style={[styles.qr, { backgroundColor: palette.light.surface, borderColor: c.border }, checkedIn && styles.used]}>
            {/* Dark modules on a light ground scan most reliably, so the code
                stays black on white even in dark mode. */}
            <QRCode value={t.ticket_code} size={200} color={palette.light.text} backgroundColor={palette.light.surface} quietZone={12} />
          </View>
          <Text variant="caption" tone="secondary" selectable style={styles.code}>{t.ticket_code}</Text>
          <Text variant="caption" tone="muted" style={styles.hint}>
            {checkedIn ? 'Already used at the door.' : 'Show this at the entrance. Brightness up helps.'}
          </Text>
        </Card>
      );
    });
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ticket: { marginBottom: space.lg },
  center: { alignItems: 'center', gap: space.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { marginTop: space.sm },
  qr: { alignSelf: 'center', marginTop: space.lg, padding: space.sm, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  used: { opacity: 0.4 },
  code: { textAlign: 'center', marginTop: space.sm, fontVariant: ['tabular-nums'] },
  hint: { textAlign: 'center', marginTop: space.xs },
});

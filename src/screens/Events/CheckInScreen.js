import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import QRScanner from '../../components/QRScanner';
import { cameraAvailable } from '../../utils/nativeFeatures';
import { radius, space } from '../../theme';
import { Button, Card, Icon, Screen, SectionLabel, Text, TextField } from '../../components/ui';

const TITLES = {
  checked_in: 'Checked in',
  already: 'Already used',
  cancelled: 'Registration cancelled',
  invalid: 'Not a valid ticket',
};

function ResultCard({ result }) {
  const c = useTheme();
  const ok = result.result === 'checked_in';
  const fg = ok ? c.success : c.danger;
  return (
    <View style={[styles.result, { backgroundColor: ok ? c.successSoft : c.dangerSoft, borderColor: fg }]}>
      <Icon name={ok ? 'checkmark-circle' : 'close-circle'} size={64} color={fg} />
      <Text variant="title" style={[styles.center, { color: fg }]}>{TITLES[result.result] || 'Check-in failed'}</Text>
      {result.name ? (
        <Text variant="heading" style={styles.center}>
          {result.name}{result.roll_number ? ` · ${result.roll_number}` : ''}
        </Text>
      ) : null}
      {result.event_title ? <Text variant="callout" tone="secondary" style={styles.center}>{result.event_title}</Text> : null}
      {!ok && result.error ? <Text variant="callout" style={[styles.center, { color: fg }]}>{result.error}</Text> : null}
    </View>
  );
}

// Door staff scan a ticket QR (or type its code) to check a guest in.
export default function CheckInScreen() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const checkIn = async (ticket) => {
    const ticketCode = String(ticket || '').trim();
    if (!ticketCode || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/events/check-in', { ticket_code: ticketCode });
      setResult(data);
    } catch (e) {
      const data = e.response?.data;
      setResult(data?.result ? data : { result: 'error', error: data?.error || 'Could not reach the server. Try again.' });
    } finally {
      setBusy(false);
      setCode('');
    }
  };

  return (
    <Screen>
      {cameraAvailable ? (
        <View style={styles.block}>
          <QRScanner onScan={checkIn} paused={busy || Boolean(result)} />
        </View>
      ) : null}

      {result ? (
        <View style={styles.block}>
          <ResultCard result={result} />
          <Button title="Scan next" icon="scan-outline" onPress={() => setResult(null)} style={styles.next} />
        </View>
      ) : null}

      <SectionLabel>{cameraAvailable ? 'Or type the code' : 'Ticket code'}</SectionLabel>
      <Card>
        {!cameraAvailable ? (
          <Text variant="callout" tone="muted" style={styles.note}>
            This version of the app can't use the camera. Type the code printed under the guest's QR.
          </Text>
        ) : null}
        <TextField
          placeholder="fest.12.xxxxxx.xxxx"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => checkIn(code)}
          returnKeyType="go"
        />
        <Button title="Check in" onPress={() => checkIn(code)} loading={busy} disabled={!code.trim()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: space.xxl },
  result: {
    alignItems: 'center',
    gap: space.sm,
    padding: space.xxl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  center: { textAlign: 'center' },
  next: { marginTop: space.md },
  note: { marginBottom: space.md },
});

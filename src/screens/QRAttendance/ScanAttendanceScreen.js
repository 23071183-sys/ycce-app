import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import QRScanner from '../../components/QRScanner';
import { cameraAvailable, getCurrentLocation } from '../../utils/nativeFeatures';
import { fmtDate } from '../../utils/format';
import { radius, space } from '../../theme';
import { Button, EmptyState, Icon, Screen, Text } from '../../components/ui';

const needsLocation = (e) => e.response?.status === 400 && /location is needed/i.test(e.response?.data?.error || '');

// A student scans the code on the professor's screen to mark themselves present.
export default function ScanAttendanceScreen({ navigation }) {
  const c = useTheme();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const submit = async (qr) => {
    if (busy || outcome) return;
    setBusy(true);
    try {
      let res;
      try {
        res = await api.post('/attendance/sessions/scan', { qr });
      } catch (e) {
        if (!needsLocation(e)) throw e;
        // This class checks you're in the room; ask for location once and retry.
        let loc;
        try { loc = await getCurrentLocation(); }
        catch (locErr) { setOutcome({ ok: false, message: locErr.message }); return; }
        res = await api.post('/attendance/sessions/scan', { qr, ...loc });
      }
      setOutcome({ ok: true, subject: res.data.subject, date: res.data.date });
    } catch (e) {
      setOutcome({ ok: false, message: e.response?.data?.error || 'Could not reach the server. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (!cameraAvailable) {
    return (
      <Screen>
        <EmptyState
          icon="camera-outline"
          title="Update the app to scan"
          message="This version can't use the camera. Install the latest version, or ask your professor to mark you."
        />
      </Screen>
    );
  }

  const fg = outcome?.ok ? c.success : c.danger;

  return (
    <Screen>
      {outcome ? (
        <View style={[styles.result, { backgroundColor: outcome.ok ? c.successSoft : c.dangerSoft, borderColor: fg }]}>
          <Icon name={outcome.ok ? 'checkmark-circle' : 'close-circle'} size={64} color={fg} />
          <Text variant="title" style={[styles.center, { color: fg }]}>
            {outcome.ok ? 'Marked present' : 'Not marked'}
          </Text>
          {outcome.ok ? (
            <Text variant="callout" tone="secondary" style={styles.center}>
              {[outcome.subject, outcome.date ? fmtDate(outcome.date) : null].filter(Boolean).join(' · ')}
            </Text>
          ) : (
            <Text variant="callout" style={[styles.center, { color: fg }]}>{outcome.message}</Text>
          )}
        </View>
      ) : (
        <>
          <QRScanner onScan={submit} paused={busy} height={360} />
          <Text variant="callout" tone="muted" style={styles.hint}>
            {busy ? 'Checking…' : 'Point the camera at the code on your professor’s screen.'}
          </Text>
        </>
      )}
      {outcome ? (
        <View style={styles.actions}>
          {!outcome.ok ? <Button title="Scan again" icon="scan-outline" onPress={() => setOutcome(null)} /> : null}
          <Button title="Done" variant={outcome.ok ? 'primary' : 'secondary'} onPress={() => navigation.goBack()} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  result: { alignItems: 'center', gap: space.sm, padding: space.xxl, borderRadius: radius.lg, borderWidth: 1 },
  center: { textAlign: 'center' },
  hint: { textAlign: 'center', marginTop: space.md },
  actions: { gap: space.sm, marginTop: space.xl },
});

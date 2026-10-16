import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import api, { reportError } from '../../services/api';
import usePolling from '../../hooks/usePolling';
import { fmtTime } from '../../utils/format';
import { palette, radius, space } from '../../theme';
import {
  Button, Card, EmptyState, ListItem, Screen, SectionLabel, Skeleton, StatNumber, Text,
} from '../../components/ui';

// The professor's side of QR attendance: a code that the server rotates every
// 10 seconds, refetched every 2, plus the running list of who has scanned.
export default function AttendanceSessionScreen({ route, navigation }) {
  const { sessionId, subjectName } = route.params;
  const [qr, setQr] = useState(null);
  const [scanned, setScanned] = useState(0);
  const [detail, setDetail] = useState(null);
  const [closed, setClosed] = useState(false);
  const [closing, setClosing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: subjectName || 'QR attendance' });
  }, [navigation, subjectName]);

  const loadDetail = useCallback(async () => {
    try {
      const { data } = await api.get(`/attendance/sessions/${sessionId}`);
      setDetail(data);
      if (!data.open) setClosed(true);
    } catch (e) { reportError(e); }
  }, [sessionId]);

  const loadToken = useCallback(async () => {
    try {
      const { data } = await api.get(`/attendance/sessions/${sessionId}/token`);
      setQr(data.qr);
      if (data.scanned !== scanned) {
        setScanned(data.scanned);
        loadDetail();
        return true;
      }
      return false;
    } catch (e) {
      if (e.response?.status === 409) { setClosed(true); return false; }
      throw e;
    }
  }, [sessionId, scanned, loadDetail]);

  useEffect(() => { loadToken().catch(reportError); loadDetail(); }, []);

  // The code changes every 10s and the server accepts the previous window too,
  // so a 2s refresh keeps what's on screen comfortably valid.
  usePolling(loadToken, { interval: 2000, slowInterval: 2000, enabled: !closed });

  const close = () => {
    Alert.alert('Close attendance?', 'Students who haven’t scanned will be marked absent for today.', [
      { text: 'Keep open', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          setClosing(true);
          try {
            const { data } = await api.post(`/attendance/sessions/${sessionId}/close`);
            setClosed(true);
            loadDetail();
            Alert.alert('Attendance saved', `${data.present} present · ${data.marked_absent} marked absent.`, [
              { text: 'Done', onPress: () => navigation.goBack() },
            ]);
          } catch (e) {
            Alert.alert('Could not close', e.response?.data?.error || 'Try again in a moment.');
          } finally {
            setClosing(false);
          }
        },
      },
    ]);
  };

  const scans = detail?.scans || [];

  return (
    <Screen>
      <Card style={[styles.block, styles.center]}>
        {closed ? (
          <EmptyState icon="lock-closed-outline" title="Session closed" message="Scanning has ended for this class." />
        ) : qr ? (
          <View style={[styles.qr, { backgroundColor: palette.light.surface }]}>
            <QRCode value={qr} size={260} color={palette.light.text} backgroundColor={palette.light.surface} quietZone={12} />
          </View>
        ) : (
          <Skeleton width={284} height={284} />
        )}
        {!closed ? (
          <Text variant="caption" tone="muted" style={styles.hint}>
            Students scan this from Attendance → Scan. The code changes every few seconds.
          </Text>
        ) : null}
      </Card>

      <View style={[styles.stats, styles.block]}>
        <Card style={styles.flex}><StatNumber value={scanned || scans.length} label="Scanned" tone="success" /></Card>
        <Card style={styles.flex}><StatNumber value={detail?.class_size ?? '—'} label="In class" /></Card>
      </View>

      {!closed ? (
        <Button title="Close and save attendance" variant="destructive" onPress={close} loading={closing} style={styles.block} />
      ) : null}

      <SectionLabel>Scanned in</SectionLabel>
      {scans.length ? (
        <Card padded={false} style={styles.inset}>
          {scans.map((s, i) => (
            <ListItem
              key={s.id}
              title={s.name}
              subtitle={s.roll_number}
              trailing={<Text variant="caption" tone="muted">{fmtTime(s.scanned_at)}</Text>}
              last={i === scans.length - 1}
            />
          ))}
        </Card>
      ) : (
        <Text variant="callout" tone="muted">No one yet.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: space.xxl },
  center: { alignItems: 'center' },
  qr: { padding: space.sm, borderRadius: radius.lg },
  hint: { textAlign: 'center', marginTop: space.md },
  stats: { flexDirection: 'row', gap: space.md },
  flex: { flex: 1 },
  inset: { paddingHorizontal: space.lg },
});

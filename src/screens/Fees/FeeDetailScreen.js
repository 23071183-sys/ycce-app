import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import useApi from '../../hooks/useApi';
import { fmtDate, fmtINR } from '../../utils/format';
import { space } from '../../theme';
import {
  Badge, Button, Card, ErrorState, InfoRow, Screen, SectionLabel, Skeleton, StatNumber, Text,
} from '../../components/ui';
import { INVOICE_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, isOpen, isOverdue, outstanding, refreshPendingPayments } from './feeUtils';

export default function FeeDetailScreen({ route, navigation }) {
  const { invoiceId, title } = route.params;
  const { data: inv, loading, error, refreshing, refresh, revalidate, reload } = useApi(`/fees/invoices/${invoiceId}`);
  const c = useTheme();
  const [paying, setPaying] = useState(false);
  const invRef = useRef(inv);
  invRef.current = inv;

  useLayoutEffect(() => {
    navigation.setOptions({ title: inv?.title || title || 'Fee' });
  }, [navigation, inv?.title, title]);

  // Coming back from the payment page: ask the server to check with Razorpay.
  const seen = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!seen.current) { seen.current = true; return; }
    refreshPendingPayments(invRef.current ? [invRef.current] : [])
      .catch(reportError)
      .finally(() => revalidate());
  }, [revalidate]));

  const onRefresh = () => {
    refreshPendingPayments(inv ? [inv] : []).catch(reportError).finally(refresh);
  };

  const pay = async () => {
    setPaying(true);
    try {
      const { data } = await api.post(`/fees/invoices/${invoiceId}/pay`);
      await Linking.openURL(data.short_url);
      revalidate();
    } catch (e) {
      if (e.response?.status === 503) Alert.alert('Not available', "Online payments aren't set up yet. Pay at the accounts office for now.");
      else Alert.alert('Could not start payment', e.response?.data?.error || 'Try again in a moment.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Card style={[styles.block, styles.skeleton]}>
          <Skeleton width={140} height={32} />
          <Skeleton width="50%" height={12} />
        </Card>
        <Card style={styles.skeleton}>{[1, 2, 3].map(i => <Skeleton key={i} height={14} />)}</Card>
      </Screen>
    );
  }
  if (error && !inv) return <Screen><ErrorState onRetry={reload} /></Screen>;
  if (!inv) return null;

  const status = INVOICE_STATUS[inv.status] || { tone: 'neutral', label: inv.status };
  const due = outstanding(inv);
  const overdue = isOverdue(inv);
  const items = inv.items || [];
  const payments = inv.payments || [];
  const openLink = payments.find(p => p.short_url && ['created', 'pending'].includes(p.status));

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Card style={styles.block}>
        <View style={styles.head}>
          <Badge tone={status.tone}>{status.label}</Badge>
          {overdue ? <Badge tone="danger">Overdue</Badge> : null}
        </View>
        <StatNumber
          size="display"
          value={fmtINR(isOpen(inv) ? due : inv.amount_due_paise)}
          label={isOpen(inv) ? 'Outstanding' : 'Amount'}
          style={styles.amount}
        />
        <Text variant="caption" tone={overdue ? 'danger' : 'muted'} style={styles.caption}>
          {[inv.academic_year, inv.semester ? `Semester ${inv.semester}` : null, inv.due_date ? `Due ${fmtDate(inv.due_date)}` : null]
            .filter(Boolean).join(' · ')}
        </Text>
        {isOpen(inv) ? (
          <View style={styles.actions}>
            {openLink ? (
              <Button title="Continue payment" onPress={() => Linking.openURL(openLink.short_url)} />
            ) : (
              <Button title={`Pay ${fmtINR(due)}`} onPress={pay} loading={paying} icon="card-outline" />
            )}
            {openLink ? (
              <Text variant="caption" tone="muted" style={styles.hint}>
                A payment is in progress. If you've paid, pull down to refresh.
              </Text>
            ) : null}
          </View>
        ) : null}
      </Card>

      <SectionLabel>Breakdown</SectionLabel>
      <Card padded={false} style={[styles.inset, styles.block]}>
        {items.map(it => <InfoRow key={it.label} label={it.label} value={fmtINR(it.amount_paise)} />)}
        {inv.late_fee_paise > 0 ? <InfoRow label="Late fee after due date" value={fmtINR(inv.late_fee_paise)} /> : null}
        <InfoRow label="Total" value={fmtINR(inv.amount_due_paise)} />
        <InfoRow label="Paid" value={fmtINR(inv.amount_paid_paise)} valueTone={inv.amount_paid_paise ? 'success' : undefined} last />
      </Card>

      <SectionLabel>Payments</SectionLabel>
      {payments.length ? (
        <Card padded={false} style={styles.inset}>
          {payments.map((p, i) => {
            const ps = PAYMENT_STATUS[p.status] || { tone: 'neutral', label: p.status };
            return (
              <View key={p.id} style={[styles.payment, i < payments.length - 1 && [styles.divider, { borderBottomColor: c.border }]]}>
                <View style={styles.flex}>
                  <Text variant="body">{fmtINR(p.amount_paise)}</Text>
                  <Text variant="caption" tone="muted">
                    {[PAYMENT_METHOD[p.method] || p.method, fmtDate(p.paid_at || p.created_at)].filter(Boolean).join(' · ')}
                  </Text>
                  {p.receipt_no ? <Text variant="caption" tone="secondary">Receipt {p.receipt_no}</Text> : null}
                </View>
                <Badge tone={ps.tone}>{ps.label}</Badge>
              </View>
            );
          })}
        </Card>
      ) : (
        <Text variant="callout" tone="muted">No payments yet.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: space.xxl },
  skeleton: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
  head: { flexDirection: 'row', gap: space.sm },
  amount: { marginTop: space.lg },
  caption: { marginTop: space.sm },
  actions: { marginTop: space.lg },
  hint: { marginTop: space.sm },
  payment: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
});

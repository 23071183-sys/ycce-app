import React, { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useApi from '../../hooks/useApi';
import { reportError } from '../../services/api';
import { fmtDate, fmtINR } from '../../utils/format';
import { space } from '../../theme';
import {
  Badge, Card, EmptyState, ErrorState, ListItem, Screen, SectionLabel, Skeleton, StatNumber, Text,
} from '../../components/ui';
import { INVOICE_STATUS, isOpen, isOverdue, outstanding, refreshPendingPayments } from './feeUtils';

export default function FeesScreen({ navigation }) {
  const { data, loading, error, refreshing, refresh, revalidate, reload } = useApi('/fees/my');
  const invoices = data?.invoices || [];
  const dataRef = useRef(data);
  dataRef.current = data;

  // Returning from the payment page: check pending payments, then reload.
  const seen = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!seen.current) { seen.current = true; return; }
    refreshPendingPayments(dataRef.current?.invoices || [])
      .catch(reportError)
      .finally(() => revalidate());
  }, [revalidate]));

  const onRefresh = () => {
    refreshPendingPayments(invoices).catch(reportError).finally(refresh);
  };

  let body;
  if (loading) {
    body = (
      <>
        <Card style={styles.block}><Skeleton width={140} height={32} /></Card>
        <Card style={styles.skeleton}>{[1, 2, 3].map(i => <Skeleton key={i} height={36} />)}</Card>
      </>
    );
  } else if (error && !data) {
    body = <ErrorState onRetry={reload} />;
  } else if (!invoices.length) {
    body = <EmptyState icon="wallet-outline" title="No fees yet" message="Fees published by the college show here." />;
  } else {
    const open = invoices.filter(isOpen);
    const settled = invoices.filter(inv => !isOpen(inv));
    const nextDue = open.map(inv => inv.due_date).filter(Boolean).sort()[0];
    const renderGroup = (list) => (
      <Card padded={false} style={[styles.inset, styles.block]}>
        {list.map((inv, i) => {
          const status = INVOICE_STATUS[inv.status] || { tone: 'neutral', label: inv.status };
          const overdue = isOverdue(inv);
          return (
            <ListItem
              key={inv.id}
              title={inv.title}
              subtitle={[
                inv.academic_year,
                isOpen(inv) ? `${fmtINR(outstanding(inv))} due ${fmtDate(inv.due_date)}` : fmtINR(inv.amount_due_paise),
                overdue ? 'Overdue' : null,
              ].filter(Boolean).join(' · ')}
              trailing={<Badge tone={status.tone}>{status.label}</Badge>}
              onPress={() => navigation.navigate('FeeDetail', { invoiceId: inv.id, title: inv.title })}
              last={i === list.length - 1}
            />
          );
        })}
      </Card>
    );
    body = (
      <>
        <Card style={styles.block}>
          <StatNumber
            size="display"
            value={fmtINR(data.total_due_paise)}
            label="Total due"
            tone={data.total_due_paise > 0 ? undefined : 'success'}
          />
          <Text variant="caption" tone="muted" style={styles.caption}>
            {data.total_due_paise > 0 && nextDue ? `Next due ${fmtDate(nextDue)}` : 'Nothing to pay right now'}
          </Text>
        </Card>
        {open.length ? <><SectionLabel>To pay</SectionLabel>{renderGroup(open)}</> : null}
        {settled.length ? <><SectionLabel>Settled</SectionLabel>{renderGroup(settled)}</> : null}
      </>
    );
  }

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: space.xxl },
  skeleton: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
  caption: { marginTop: space.sm },
});

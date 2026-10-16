import React, { useLayoutEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { fmtDate } from '../../utils/format';
import { space } from '../../theme';
import {
  Badge, Button, Card, ErrorState, InfoRow, Screen, SectionLabel, Skeleton, Text,
} from '../../components/ui';
import { driveDates, eligibility, packageLabel, roundText } from './placementUtils';

const STATUS_TONE = { upcoming: 'accent', ongoing: 'success', finished: 'neutral' };

export default function PlacementDetailScreen({ route, navigation }) {
  const { id, company } = route.params;
  const { user } = useAuth();
  const { data: d, loading, error, refreshing, refresh, reload } = useApi(`/placements/${id}`);

  useLayoutEffect(() => {
    navigation.setOptions({ title: d?.company || company || 'Placement' });
  }, [navigation, d?.company, company]);

  if (loading) {
    return (
      <Screen>
        <Card style={styles.skeleton}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={14} />
          <Skeleton height={40} />
        </Card>
      </Screen>
    );
  }
  if (error || !d) return <Screen><ErrorState onRetry={reload} /></Screen>;

  const elig = eligibility(d);
  let rounds = d.rounds;
  if (typeof rounds === 'string') { try { rounds = JSON.parse(rounds); } catch { rounds = []; } }
  rounds = Array.isArray(rounds) ? rounds : [];
  const branches = Array.isArray(d.branches) ? d.branches : [];
  const canApply = d.apply_url && d.status !== 'finished';
  const hasOutcome = d.selected_count != null || d.selected_names || d.outcome_notes;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Card style={styles.block}>
        <View style={styles.badges}>
          <Badge tone={STATUS_TONE[d.status] || 'neutral'}>{d.status?.[0].toUpperCase() + d.status?.slice(1)}</Badge>
          {elig ? <Badge tone={elig.tone}>{elig.label}</Badge> : null}
        </View>
        <Text variant="title" style={styles.company}>{d.company}</Text>
        <Text variant="body" tone="secondary">{d.role}</Text>
        {packageLabel(d) ? <Text variant="numeric" style={styles.package}>{packageLabel(d)}</Text> : null}
        {canApply ? (
          <Button title="Apply" icon="open-outline" onPress={() => Linking.openURL(d.apply_url)} style={styles.apply} />
        ) : null}
      </Card>

      <SectionLabel>Details</SectionLabel>
      <Card padded={false} style={[styles.inset, styles.block]}>
        <InfoRow label="Location" value={d.location} />
        <InfoRow label="Drive" value={driveDates(d)} />
        <InfoRow label="Apply by" value={d.apply_deadline ? fmtDate(d.apply_deadline) : null} />
        <InfoRow label="CGPA cut-off" value={d.eligibility_cgpa != null ? Number(d.eligibility_cgpa).toFixed(2) : 'None'} />
        {user?.role === 'student' ? (
          <InfoRow label="Your CGPA" value={d.my_cgpa != null ? Number(d.my_cgpa).toFixed(2) : 'Not available yet'} />
        ) : null}
        <InfoRow label="Branches" value={branches.length ? branches.join(', ') : 'All'} last />
      </Card>

      {d.description ? (
        <>
          <SectionLabel>About</SectionLabel>
          <Card style={styles.block}><Text variant="callout" tone="secondary">{d.description}</Text></Card>
        </>
      ) : null}

      {rounds.length ? (
        <>
          <SectionLabel>Rounds</SectionLabel>
          <Card padded={false} style={[styles.inset, styles.block]}>
            {rounds.map((r, i) => {
              const { title, detail } = roundText(r);
              return (
                <View key={i} style={styles.round}>
                  <Text variant="label" style={styles.roundNo}>{i + 1}</Text>
                  <View style={styles.flex}>
                    <Text variant="body">{title}</Text>
                    {detail ? <Text variant="caption" tone="muted">{detail}</Text> : null}
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      {hasOutcome ? (
        <>
          <SectionLabel>Outcome</SectionLabel>
          <Card style={styles.block}>
            {d.selected_count != null ? <Text variant="heading">{d.selected_count} selected</Text> : null}
            {d.selected_names ? (
              <Text variant="callout" tone="secondary" style={styles.outcome}>
                {Array.isArray(d.selected_names) ? d.selected_names.join(', ') : d.selected_names}
              </Text>
            ) : null}
            {d.outcome_notes ? <Text variant="callout" tone="muted" style={styles.outcome}>{d.outcome_notes}</Text> : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: space.xxl },
  skeleton: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
  badges: { flexDirection: 'row', gap: space.sm },
  company: { marginTop: space.md },
  package: { marginTop: space.md },
  apply: { marginTop: space.lg },
  flex: { flex: 1 },
  round: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  roundNo: { width: 16, marginTop: 3 },
  outcome: { marginTop: space.xs },
});

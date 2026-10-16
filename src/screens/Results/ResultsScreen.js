import React, { useState, useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api, { reportError } from '../../services/api';
import { radius, space } from '../../theme';
import {
  Badge, Card, EmptyState, ErrorState, Icon, InfoRow, Screen, SectionLabel, Skeleton, StatNumber, Text,
} from '../../components/ui';

// The component marks behind a subject's total. When the student sat RE-MSE
// for a missed MSE, that score is shown in the slot it filled.
const markBreakdown = (r) => {
  const num = (v) => (v === null || v === undefined ? null : Number(v));
  const slot = (key, label) => {
    if (r.re_mse_for === key && r.re_mse_marks != null) return `${label} ${num(r.re_mse_marks)} (RE-MSE)`;
    const v = num(r[`${key}_marks`]);
    return v === null ? null : `${label} ${v}`;
  };
  const parts = [
    slot('mse1', 'MSE 1'),
    slot('mse2', 'MSE 2'),
    num(r.ta_marks) === null ? null : `TA ${num(r.ta_marks)}`,
    num(r.ese_marks) === null ? null : `ESE ${num(r.ese_marks)}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
};

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const getSession = (semester, studentYear) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentCalYear = now.getFullYear();
  const academicYearStart = currentMonth < 6 ? currentCalYear - 1 : currentCalYear;
  const joiningYear = academicYearStart - ((studentYear || 3) - 1);
  const semYearOffset = Math.floor((semester - 1) / 2);
  const sessionStart = joiningYear + semYearOffset;
  return `${sessionStart}-${String(sessionStart + 1).slice(-2)}`;
};

// Below 5.5 is a failing GPA; that is the only case worth colouring.
const gpaTone = (val) => (val && Number(val) < 5.5 ? 'danger' : undefined);

const COLUMNS = [['Code', 1.5], ['Subject', 3], ['Int', 1], ['Ext', 1], ['Grade', 1]];

export default function ResultsScreen() {
  const { user } = useAuth();
  const c = useTheme();
  const [semester, setSemester] = useState(user?.semester || 6);
  const [results, setResults] = useState([]);
  const [cgpaData, setCgpaData] = useState({ sgpaList: [], cgpa: null });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => { fetchAll(); }, [semester]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [r, cg] = await Promise.all([
        api.get(`/results/my?semester=${semester}`),
        api.get(`/results/cgpa?upTo=${semester}`),
      ]);
      setResults(r.data);
      setCgpaData(cg.data);
      setError(null);
    } catch (e) { reportError(e); setError(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const currentSGPA = cgpaData.sgpaList?.find(s => s.semester === semester)?.sgpa ?? null;
  const allPassed = results.length > 0 && results.every(r => r.result === 'Pass');
  const hasFail = results.some(r => r.result === 'Fail');
  const divider = { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border };

  let body;
  if (loading) {
    body = (
      <>
        <View style={styles.tiles}>
          <Card style={styles.flex}><Skeleton width={60} height={28} /></Card>
          <Card style={styles.flex}><Skeleton width={60} height={28} /></Card>
        </View>
        <Card style={styles.skeleton}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={14} />)}</Card>
      </>
    );
  } else if (error) {
    body = <ErrorState onRetry={() => fetchAll()} />;
  } else {
    body = (
      <>
        {(currentSGPA !== null || cgpaData.cgpa !== null) && (
          <View style={styles.tiles}>
            <Card style={styles.flex}>
              <StatNumber value={currentSGPA ?? '—'} label="SGPA" tone={gpaTone(currentSGPA)} />
              <Text variant="caption" tone="muted" style={styles.tileSub}>Semester {semester}</Text>
            </Card>
            <Card style={styles.flex}>
              <StatNumber value={cgpaData.cgpa ?? '—'} label="CGPA" tone={gpaTone(cgpaData.cgpa)} />
              <Text variant="caption" tone="muted" style={styles.tileSub}>Avg of {cgpaData.sgpaList?.length || 0} sem(s)</Text>
            </Card>
          </View>
        )}

        <SectionLabel>Student</SectionLabel>
        <Card padded={false} style={[styles.inset, styles.block]}>
          <InfoRow label="Name" value={user?.name} />
          <InfoRow label="Registration no." value={user?.roll_number} />
          <InfoRow label="Department" value="Computer Technology" last />
        </Card>

        <SectionLabel>Grade sheet</SectionLabel>
        {results.length === 0 ? (
          <Card style={styles.block}>
            <EmptyState icon="document-text-outline" title="No results yet" message={`No results declared for Semester ${semester}`} />
          </Card>
        ) : (
          <Card padded={false} style={styles.block}>
            <View style={[styles.tableRow, { backgroundColor: c.surfaceAlt }]}>
              {COLUMNS.map(([label, flex]) => (
                <Text key={label} variant="label" style={{ flex, textAlign: flex === 1 ? 'center' : 'left' }}>{label}</Text>
              ))}
            </View>
            {results.map((r, i) => {
              const breakdown = markBreakdown(r);
              return (
                <View key={r.id} style={[styles.tableRow, i < results.length - 1 && divider]}>
                  <Text variant="caption" tone="muted" style={styles.code}>{r.subject_code}</Text>
                  <View style={styles.subject}>
                    <Text variant="callout">{r.subject_name}</Text>
                    {breakdown ? <Text variant="caption" tone="muted" style={styles.breakdown}>{breakdown}</Text> : null}
                  </View>
                  <Text variant="callout" tone="secondary" style={styles.num}>{r.internal_marks ?? '—'}</Text>
                  <Text variant="callout" tone="secondary" style={styles.num}>{r.external_marks ?? '—'}</Text>
                  <Text variant="callout" tone={r.result === 'Fail' ? 'danger' : 'default'} style={[styles.num, styles.grade]}>
                    {r.grade || '—'}
                  </Text>
                </View>
              );
            })}
            <View style={[styles.result, { borderTopColor: c.border }]}>
              <Badge tone={hasFail ? 'danger' : allPassed ? 'success' : 'warning'}>
                {hasFail ? 'Fail' : allPassed ? 'All clear' : 'Result pending'}
              </Badge>
            </View>
          </Card>
        )}

        {cgpaData.sgpaList?.length > 1 && (
          <>
            <SectionLabel>SGPA history</SectionLabel>
            <Card padded={false} style={styles.inset}>
              {cgpaData.sgpaList.map(s => (
                <View key={s.semester} style={[styles.historyRow, divider]}>
                  <Text variant="callout" style={styles.flex}>Semester {s.semester}</Text>
                  <Text variant="caption" tone="muted" style={styles.flex}>{getSession(s.semester, user?.year)}</Text>
                  <Text variant="heading" tone={gpaTone(s.sgpa)} style={styles.tabular}>{s.sgpa}</Text>
                </View>
              ))}
              <View style={styles.historyRow}>
                <Text variant="label" style={styles.flex}>Cumulative CGPA</Text>
                <Text variant="numeric" tone={gpaTone(cgpaData.cgpa)}>{cgpaData.cgpa}</Text>
              </View>
            </Card>
          </>
        )}
      </>
    );
  }

  return (
    <Screen onRefresh={() => fetchAll(true)} refreshing={refreshing}>
      <Card onPress={() => setDropdownOpen(true)} style={[styles.picker, styles.block]}>
        <View style={styles.flex}>
          <Text variant="heading">Semester {semester}</Text>
          <Text variant="caption" tone="muted" style={styles.tileSub}>Session {getSession(semester, user?.year)}</Text>
        </View>
        <Text variant="caption" tone="accent">Change</Text>
        <Icon name="chevron-down" size={16} tone="accent" />
      </Card>

      {body}

      <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDropdownOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text variant="heading" style={[styles.sheetTitle, divider]}>Select semester</Text>
            <ScrollView>
              {SEMESTERS.map((s, i) => {
                const selected = semester === s;
                return (
                  <Pressable
                    key={s}
                    style={[styles.option, i < SEMESTERS.length - 1 && divider, selected && { backgroundColor: c.accentSoft }]}
                    onPress={() => { setSemester(s); setDropdownOpen(false); }}
                    accessibilityState={{ selected }}
                  >
                    <View style={styles.flex}>
                      <Text variant="body" tone={selected ? 'accent' : 'default'}>Semester {s}</Text>
                      <Text variant="caption" tone="muted">Session {getSession(s, user?.year)}</Text>
                    </View>
                    {selected ? <Icon name="checkmark" tone="accent" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { marginBottom: space.xxl },
  inset: { paddingHorizontal: space.lg },
  picker: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  tiles: { flexDirection: 'row', gap: space.md, marginBottom: space.xxl },
  tileSub: { marginTop: 2 },
  skeleton: { gap: space.md, marginBottom: space.xxl },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: space.md, paddingVertical: space.md },
  code: { flex: 1.5 },
  subject: { flex: 3, paddingRight: space.xs },
  breakdown: { marginTop: 2 },
  num: { flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] },
  grade: { fontWeight: '700' },
  result: { alignItems: 'center', padding: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  tabular: { fontVariant: ['tabular-nums'] },
  // A scrim over either theme; black at partial opacity reads in light and dark.
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { width: '80%', maxHeight: '70%', borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sheetTitle: { padding: space.lg },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xl, paddingVertical: space.md },
});

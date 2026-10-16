import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import api, { reportError } from '../../../services/api';
import { attendanceTone, radius, space } from '../../../theme';
import {
  Button, Card, EmptyState, Icon, InfoRow, ProgressRing, SectionLabel, SegmentedControl, StatNumber, Text, TextField,
} from '../../../components/ui';
import { classesToRecover, fmtLong, styles as shared } from './shared';

function LowAttendanceNote({ children, tone = 'warning' }) {
  const c = useTheme();
  return (
    <View style={[styles.note, { backgroundColor: tone === 'danger' ? c.dangerSoft : c.warningSoft }]}>
      <Icon name="warning-outline" size={16} tone={tone} />
      <Text variant="callout" tone={tone} style={shared.flex}>{children}</Text>
    </View>
  );
}

function StudentAttendance({ attendance }) {
  if (!attendance) return <EmptyState icon="checkmark-circle-outline" title="No attendance yet" />;
  const pct = parseFloat(attendance.percentage || 0);
  return (
    <>
      <Card style={styles.hero}>
        <ProgressRing percent={pct} size={140} label="Attendance" />
      </Card>
      <Card padded={false} style={[styles.inset, styles.block]}>
        <InfoRow label="Present" value={attendance.present_count} />
        <InfoRow label="Total" value={attendance.total_count} />
        <InfoRow label="Absent" value={attendance.total_count - attendance.present_count} last />
      </Card>
      {pct < 75 && attendance.total_count > 0 && (
        <LowAttendanceNote>
          Attendance below 75%. Need {classesToRecover(attendance.present_count, attendance.total_count)} more classes to reach 75%.
        </LowAttendanceNote>
      )}
    </>
  );
}

function SectionReport({ subjectId }) {
  const c = useTheme();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);      // student object
  const [detail, setDetail] = useState(null);           // { summary, records }
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get(`/attendance/subject/${subjectId}/report`)
      .then(r => setReport(r.data))
      .catch(reportError)
      .finally(() => setLoading(false));
  }, [subjectId]);

  const openReport = async (student) => {
    setSelected(student);
    setDetailLoading(true);
    setDetail(null);
    try {
      const r = await api.get(`/attendance/subject/${subjectId}/student/${student.id}`);
      setDetail(r.data);
    } catch (e) { Alert.alert('Error', 'Could not load report'); setSelected(null); }
    finally { setDetailLoading(false); }
  };

  if (loading) return <ActivityIndicator color={c.textMuted} style={styles.spinner} />;

  const total = report.length;
  const below75 = report.filter(s => parseFloat(s.percentage || 0) < 75).length;
  const detailPct = detail ? parseFloat(detail.summary?.percentage || 0) : 0;
  const hasDetailClasses = detail?.summary?.total_count > 0;

  return (
    <View>
      <View style={styles.tiles}>
        <Card style={shared.flex}><StatNumber value={total} label="Students" /></Card>
        <Card style={shared.flex}><StatNumber value={below75} label="Below 75%" tone={below75 ? 'danger' : undefined} /></Card>
      </View>

      {report.length === 0
        ? <EmptyState icon="stats-chart-outline" title="No attendance data yet" />
        : (
          <Card padded={false} style={styles.inset}>
            {report.map((s, i) => {
              const pct = parseFloat(s.percentage || 0);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => openReport(s)}
                  style={({ pressed }) => [
                    styles.row,
                    i < report.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View style={shared.flex}>
                    <Text variant="body">{s.name}</Text>
                    <Text variant="caption" tone="muted">{s.roll_number} · {s.present_count}/{s.total_count} classes</Text>
                  </View>
                  <Text variant="heading" tone={s.total_count > 0 ? attendanceTone(pct) : 'muted'} style={styles.pct}>
                    {s.total_count > 0 ? `${pct}%` : '—'}
                  </Text>
                  <Icon name="bar-chart-outline" size={18} tone="accent" />
                </Pressable>
              );
            })}
          </Card>
        )}

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: c.bg, borderColor: c.border }]}>
            <View style={styles.sheetHead}>
              <View style={shared.flex}>
                <Text variant="heading">{selected?.name}</Text>
                <Text variant="caption" tone="muted">{selected?.roll_number}</Text>
              </View>
              <Pressable onPress={() => setSelected(null)} hitSlop={8} accessibilityLabel="Close">
                <Icon name="close" size={22} tone="muted" />
              </Pressable>
            </View>

            {detailLoading
              ? <ActivityIndicator color={c.textMuted} style={styles.spinner} />
              : detail && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailHero}>
                    {hasDetailClasses
                      ? <ProgressRing percent={detailPct} size={110} label="Attendance" />
                      : <Text variant="numeric" tone="muted">—</Text>}
                  </View>
                  <View style={styles.tiles}>
                    <Card style={shared.flex}><StatNumber value={detail.summary?.present_count ?? 0} label="Present" /></Card>
                    <Card style={shared.flex}>
                      <StatNumber value={(detail.summary?.total_count - detail.summary?.present_count) || 0} label="Absent" />
                    </Card>
                    <Card style={shared.flex}><StatNumber value={detail.summary?.total_count ?? 0} label="Total" /></Card>
                  </View>
                  {detailPct < 75 && hasDetailClasses && (
                    <LowAttendanceNote tone="danger">
                      Below 75% — needs {classesToRecover(detail.summary.present_count, detail.summary.total_count)} more classes to recover.
                    </LowAttendanceNote>
                  )}

                  <SectionLabel style={styles.recordsLabel}>Date-wise record</SectionLabel>
                  {detail.records.length === 0
                    ? <Text variant="callout" tone="muted" style={styles.centerText}>No records found.</Text>
                    : detail.records.map((rec, i) => {
                      const present = rec.status === 'present';
                      return (
                        <View key={i} style={[styles.recRow, { borderBottomColor: c.border }]}>
                          <Text variant="callout" tone="secondary">{fmtLong(rec.date)}</Text>
                          <Text variant="callout" tone={present ? 'success' : 'danger'} style={styles.capitalize}>{rec.status}</Text>
                        </View>
                      );
                    })}
                  <View style={styles.sheetBottom} />
                </ScrollView>
              )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MarkAttendance({ students, setStudents, subjectId }) {
  const c = useTheme();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setStudents(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'present' ? 'absent' : 'present' } : s));
  const markAll = (status) => setStudents(prev => prev.map(s => ({ ...s, status })));

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/attendance/mark-bulk', { subject_id: subjectId, date, records: students.map(s => ({ student_id: s.id, status: s.status })) });
      Alert.alert('Success', 'Attendance saved!');
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const present = students.filter(s => s.status === 'present').length;

  return (
    <View>
      <TextField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <View style={styles.markAll}>
        <Button title="All present" variant="secondary" size="sm" icon="checkmark-done-outline" onPress={() => markAll('present')} style={shared.flex} />
        <Button title="All absent" variant="secondary" size="sm" icon="close-outline" onPress={() => markAll('absent')} style={shared.flex} />
      </View>
      <SectionLabel>{`${present}/${students.length} present · tap to toggle`}</SectionLabel>
      {students.length === 0
        ? <EmptyState icon="people-outline" title="No students found" />
        : (
          <Card padded={false} style={[styles.inset, styles.block]}>
            {students.map((s, i) => {
              const isPresent = s.status === 'present';
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggle(s.id)}
                  style={({ pressed }) => [
                    styles.row,
                    i < students.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View style={shared.flex}>
                    <Text variant="body">{s.name}</Text>
                    <Text variant="caption" tone="muted">{s.roll_number}</Text>
                  </View>
                  <View style={[styles.mark, { backgroundColor: isPresent ? c.successSoft : c.dangerSoft }]}>
                    <Text variant="callout" tone={isPresent ? 'success' : 'danger'} style={styles.markText}>{isPresent ? 'P' : 'A'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        )}
      <Button title="Save attendance" onPress={save} loading={saving} />
    </View>
  );
}

function ProfessorAttendance({ students, setStudents, subjectId }) {
  const [view, setView] = useState('mark');
  return (
    <View>
      <SegmentedControl
        options={[{ value: 'mark', label: 'Mark attendance' }, { value: 'report', label: 'View report' }]}
        value={view}
        onChange={setView}
        style={styles.block}
      />
      {view === 'mark'
        ? <MarkAttendance students={students} setStudents={setStudents} subjectId={subjectId} />
        : <SectionReport subjectId={subjectId} />}
    </View>
  );
}

export default function AttendanceTab({ user, attendance, students, setStudents, subjectId }) {
  if (user?.role === 'student') return <StudentAttendance attendance={attendance} />;
  if (user?.role === 'professor') {
    return <ProfessorAttendance students={students} setStudents={setStudents} subjectId={subjectId} />;
  }
  return <EmptyState icon="checkmark-circle-outline" title="Attendance is managed by the subject's professor" />;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: space.xxl, marginBottom: space.lg },
  inset: { paddingHorizontal: space.lg },
  block: { marginBottom: space.lg },
  note: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md, marginBottom: space.lg },
  spinner: { marginVertical: space.huge },
  tiles: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  pct: { fontVariant: ['tabular-nums'] },
  // A scrim over either theme; black at partial opacity reads in light and dark.
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xl,
    maxHeight: '85%',
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  detailHero: { alignItems: 'center', marginBottom: space.lg },
  recordsLabel: { marginTop: space.sm },
  centerText: { textAlign: 'center', marginTop: space.sm },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  capitalize: { textTransform: 'capitalize' },
  sheetBottom: { height: space.xl },
  markAll: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  mark: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  markText: { fontWeight: '700' },
});

import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import useApi from '../../hooks/useApi';
import { radius, space } from '../../theme';
import {
  Card, EmptyState, ErrorState, Icon, ProgressRing, Screen, SectionLabel, Skeleton, Text,
} from '../../components/ui';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// reloadToken changes on pull-to-refresh so the month reloads with the list.
function MiniCalendar({ subjectId, reloadToken }) {
  const c = useTheme();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [monthMap, setMonthMap] = useState({});
  const [loading, setLoading] = useState(false);

  const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/attendance/subject/${subjectId}/monthly?month=${monthStr}`);
      const map = {};
      r.data.forEach(d => { map[d.date.split('T')[0]] = d.status; });
      setMonthMap(map);
    } catch {}
    setLoading(false);
  }, [subjectId, monthStr]);

  useEffect(() => { load(); }, [load, reloadToken]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = now.toISOString().split('T')[0];
  const presentDays = Object.values(monthMap).filter(s => s === 'present').length;
  const totalDays = Object.keys(monthMap).length;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const statusColors = {
    present: { bg: c.successSoft, fg: c.success },
    absent: { bg: c.dangerSoft, fg: c.danger },
  };

  return (
    <Card style={styles.section}>
      <View style={styles.monthNav}>
        <Pressable onPress={prevMonth} hitSlop={12} accessibilityLabel="Previous month">
          <Icon name="chevron-back" tone="default" />
        </Pressable>
        <View style={styles.center}>
          <Text variant="heading">{MONTHS[calMonth]} {calYear}</Text>
          {loading
            ? <ActivityIndicator size="small" color={c.textMuted} style={styles.monthSub} />
            : (
              <Text variant="caption" tone="muted" style={styles.monthSub}>
                {totalDays > 0 ? `${presentDays}/${totalDays} present this month` : 'No classes this month'}
              </Text>
            )}
        </View>
        <Pressable onPress={nextMonth} hitSlop={12} accessibilityLabel="Next month">
          <Icon name="chevron-forward" tone="default" />
        </Pressable>
      </View>

      <View style={styles.row}>
        {DAYS_SHORT.map(d => (
          <Text key={d} variant="label" style={styles.dayHead}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={styles.cell} />;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = statusColors[monthMap[dateStr]];
          const isToday = dateStr === todayStr;
          return (
            <View key={day} style={styles.cell}>
              <View style={[
                styles.day,
                status && { backgroundColor: status.bg },
                isToday && !status && { borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderStrong },
              ]}>
                <Text
                  variant="callout"
                  style={{ color: status ? status.fg : isToday ? c.text : c.textSecondary, fontWeight: status ? '600' : '400' }}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        {[{ key: 'present', label: 'Present' }, { key: 'absent', label: 'Absent' }].map(({ key, label }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: statusColors[key].fg }]} />
            <Text variant="caption" tone="muted">{label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export default function AttendanceDetailScreen({ route }) {
  const { subject } = route.params;
  const c = useTheme();
  const { data, loading, error, refreshing, refresh, reload } =
    useApi(`/attendance/subject/${subject.subject_id}/detail`, { initialData: [] });
  const records = data || [];
  const [reloadToken, setReloadToken] = useState(0);

  const onRefresh = () => { setReloadToken(t => t + 1); refresh(); };

  const pct = parseFloat(subject.percentage || 0);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  let list;
  if (loading) {
    list = <Card style={styles.gap}>{[1, 2, 3, 4].map(i => <Skeleton key={i} height={14} />)}</Card>;
  } else if (error) {
    list = <ErrorState onRetry={reload} />;
  } else if (!records.length) {
    list = <EmptyState icon="calendar-outline" title="No attendance records yet" />;
  } else {
    list = (
      <Card padded={false} style={styles.inset}>
        {records.map((item, index) => {
          const isPresent = item.status === 'present';
          return (
            <View key={String(index)} style={[styles.recordRow, index < records.length - 1 && [styles.divider, { borderBottomColor: c.border }]]}>
              <Text variant="caption" tone="muted" style={styles.index}>{index + 1}</Text>
              <Text variant="callout" style={styles.flex}>{formatDate(item.date)}</Text>
              <View style={styles.status}>
                <Text variant="callout" tone={isPresent ? 'success' : 'danger'}>{isPresent ? 'Present' : 'Absent'}</Text>
                <Icon name={isPresent ? 'checkmark-circle' : 'close-circle'} size={15} tone={isPresent ? 'success' : 'danger'} />
              </View>
            </View>
          );
        })}
      </Card>
    );
  }

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Card style={[styles.summary, styles.section]}>
        <View style={styles.flex}>
          <Text variant="heading">{subject.subject_name}</Text>
          <Text variant="caption" tone="muted" style={styles.monthSub}>
            {subject.present_count} present · {subject.total_count} total classes
          </Text>
        </View>
        <ProgressRing percent={pct} size={72} stroke={6} />
      </Card>

      <MiniCalendar subjectId={subject.subject_id} reloadToken={reloadToken} />

      <SectionLabel>All classes</SectionLabel>
      {list}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.xxl },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  monthSub: { marginTop: 2 },
  row: { flexDirection: 'row', marginBottom: space.xs },
  dayHead: { width: '14.28%', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, padding: 2 },
  day: { flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: space.lg, marginTop: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 1 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  gap: { gap: space.md },
  inset: { paddingHorizontal: space.lg },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth },
  index: { width: 32 },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 1, width: 90, justifyContent: 'flex-end' },
});

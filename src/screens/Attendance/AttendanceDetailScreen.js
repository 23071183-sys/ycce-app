import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  TouchableOpacity, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import api, { reportError } from '../../services/api';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function MiniCalendar({ subjectId, allRecords, c }) {
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

  useEffect(() => { load(); }, [load]);

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

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 0.5, borderColor: c.border }}>
      {/* Month nav */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <TouchableOpacity onPress={prevMonth} hitSlop={12}>
          <Ionicons name="chevron-back" size={18} color={c.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '400', letterSpacing: 1 }}>
            {MONTHS[calMonth]} {calYear}
          </Text>
          {loading
            ? <ActivityIndicator size="small" color={c.textMuted} style={{ marginTop: 2 }} />
            : totalDays > 0
              ? <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 2 }}>
                  {presentDays}/{totalDays} present this month
                </Text>
              : <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 2 }}>No classes this month</Text>
          }
        </View>
        <TouchableOpacity onPress={nextMonth} hitSlop={12}>
          <Ionicons name="chevron-forward" size={18} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DAYS_SHORT.map(d => (
          <Text key={d} style={{ width: '14.28%', textAlign: 'center', color: c.textMuted, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = monthMap[dateStr];
          const isToday = dateStr === todayStr;
          const bg = status === 'present' ? '#16a34a' : status === 'absent' ? '#dc2626' : 'transparent';
          return (
            <View key={day} style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}>
              <View style={{
                flex: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
                backgroundColor: bg,
                borderWidth: isToday && !status ? 1 : 0,
                borderColor: c.textMuted,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: status ? '#fff' : isToday ? c.text : c.textSec,
                  fontWeight: status ? '500' : '300',
                }}>{day}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 }}>
        {[{ color: '#16a34a', label: 'Present' }, { color: '#dc2626', label: 'Absent' }].map(({ color, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AttendanceDetailScreen({ route }) {
  const { subject } = route.params;
  const c = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/attendance/subject/${subject.subject_id}/detail`)
      .then(r => setRecords(r.data))
      .catch(reportError)
      .finally(() => setLoading(false));
  }, [subject.subject_id]);

  const pct = parseFloat(subject.percentage || 0);
  const pctColor = pct >= 75 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  if (loading) return (
    <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.text} />
  );

  return (
    <FlatList
      data={records}
      keyExtractor={(_, i) => String(i)}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      ListHeaderComponent={
        <View>
          {/* Subject info */}
          <View style={{ backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '400', marginBottom: 4 }}>{subject.subject_name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>
                {subject.present_count} present · {subject.total_count} total classes
              </Text>
              <View style={{ backgroundColor: pctColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{pct}%</Text>
              </View>
            </View>
          </View>

          {/* Calendar */}
          <MiniCalendar subjectId={subject.subject_id} allRecords={records} c={c} />

          {/* List header */}
          {records.length > 0 && (
            <View style={{
              flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 8,
              borderBottomWidth: 0.5, borderBottomColor: c.border, marginBottom: 4,
            }}>
              <Text style={{ width: 32, color: c.textMuted, fontSize: 11, letterSpacing: 1 }}>#</Text>
              <Text style={{ flex: 1, color: c.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Date</Text>
              <Text style={{ width: 80, color: c.textMuted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>Status</Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item, index }) => {
        const isPresent = item.status === 'present';
        return (
          <View style={{
            flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 4,
            borderBottomWidth: 0.5, borderBottomColor: c.border,
          }}>
            <Text style={{ width: 32, color: c.textMuted, fontSize: 12 }}>{index + 1}</Text>
            <Text style={{ flex: 1, color: c.text, fontSize: 13 }}>{formatDate(item.date)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, width: 80, justifyContent: 'flex-end' }}>
              <Text style={{ color: isPresent ? '#16a34a' : '#dc2626', fontSize: 13 }}>
                {isPresent ? 'Present' : 'Absent'}
              </Text>
              <Ionicons
                name={isPresent ? 'checkmark-circle' : 'close-circle'}
                size={15}
                color={isPresent ? '#16a34a' : '#dc2626'}
              />
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 20 }}>
          <Text style={{ color: c.textMuted, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
            No attendance records yet
          </Text>
        </View>
      }
    />
  );
}

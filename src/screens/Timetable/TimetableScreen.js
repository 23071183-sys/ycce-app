import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#BF5AF2', '#5AC8FA'];

export default function TimetableScreen() {
  const { user } = useAuth();
  const c = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.year) return;
    api.get(`/timetable/year/${user.year}`)
      .then(r => setEntries(r.data))
      .catch(reportError)
      .finally(() => setLoading(false));
  }, [user?.year]);

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.day === day);
    return acc;
  }, {});

  const fmt = (t) => t?.slice(0, 5);

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.text} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Year {user?.year} Timetable</Text>
      {DAYS.map((day, di) => (
        byDay[day].length > 0 && (
          <View key={day} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, color: ACCENTS[di % ACCENTS.length] }}>{day}</Text>
            {byDay[day].map((e) => (
              <View key={e.id} style={{ backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: ACCENTS[di % ACCENTS.length], borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ fontSize: 11, color: c.textMuted, marginBottom: 4, letterSpacing: 0.5 }}>{fmt(e.start_time)} – {fmt(e.end_time)}</Text>
                <Text style={{ fontSize: 14, fontWeight: '400', color: c.text }}>{e.subject_name}</Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>{e.professor_name} · {e.room}</Text>
              </View>
            ))}
          </View>
        )
      ))}
    </ScrollView>
  );
}

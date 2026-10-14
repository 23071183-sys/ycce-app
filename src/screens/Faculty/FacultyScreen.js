import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF453A', '#5AC8FA'];

export default function FacultyScreen() {
  const c = useTheme();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/users/faculty')
      .then(r => setFaculty(r.data))
      .catch(reportError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.text} />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      data={faculty}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40 }}>No faculty found.</Text>}
      renderItem={({ item, index }) => {
        const accent = ACCENTS[index % ACCENTS.length];
        const isOpen = expanded === item.id;
        const initials = item.name.split(' ').filter(w => w.match(/^[A-Z]/)).slice(0, 2).map(w => w[0]).join('') || item.name[0];

        const InfoRow = ({ label, value, color, onPress }) => {
          const Row = onPress ? TouchableOpacity : View;
          return (
            <Row style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: c.border }} onPress={onPress}>
              <Text style={{ fontSize: 12, color: c.textMuted, flex: 1 }}>{label}</Text>
              <Text style={{ fontSize: 12, color: color || c.textSec, fontWeight: '300', flex: 2, textAlign: 'right' }} numberOfLines={2}>{value || '—'}</Text>
            </Row>
          );
        };

        return (
          <TouchableOpacity
            style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: accent, borderWidth: 0.5, borderColor: c.border }}
            onPress={() => setExpanded(isOpen ? null : item.id)}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: accent, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '400', color: c.text }}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: c.textMuted, fontWeight: '600', marginTop: 3, letterSpacing: 0.5, textTransform: 'uppercase' }}>{item.designation || 'Professor'}</Text>
                <Text style={{ fontSize: 11, color: c.border, marginTop: 2 }}>{item.qualification}</Text>
              </View>
              <Text style={{ color: accent, fontSize: 14 }}>{isOpen ? '▲' : '▼'}</Text>
            </View>

            {isOpen && (
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <InfoRow label="📅 Joined" value={item.joining_date ? new Date(item.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
                <InfoRow label="✉️ Email" value={item.email} color={accent} onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)} />
                <InfoRow label="🏫 Teaching Exp" value={item.teaching_exp} />
                <InfoRow label="🏭 Industry Exp" value={item.industrial_exp} />
                {item.research_count && item.research_count !== '—' && <InfoRow label="📄 Research" value={`${item.research_count} Publications`} />}
                {item.courses_taught && item.courses_taught !== '—' && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: c.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Courses Taught</Text>
                    <Text style={{ fontSize: 12, color: c.textMuted, lineHeight: 20, fontWeight: '300' }}>{item.courses_taught}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

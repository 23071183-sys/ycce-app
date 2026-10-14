import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function CompufestScreen() {
  const c = useTheme();
  const [events, setEvents] = useState([]);
  const [committee, setCommittee] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('committee');

  useEffect(() => {
    Promise.all([api.get('/compufest/events'), api.get('/compufest/committee')])
      .then(([e, cm]) => { setEvents(e.data); setCommittee(cm.data); })
      .catch(reportError).finally(() => setLoading(false));
  }, []);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.warning} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', backgroundColor: c.card, padding: 4, margin: 16, borderRadius: 10, borderWidth: 0.5, borderColor: c.border }}>
        {['committee', 'events'].map(t => (
          <TouchableOpacity key={t} style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: tab === t ? c.warning : 'transparent' }} onPress={() => setTab(t)}>
            <Text style={{ fontWeight: '600', fontSize: 13, color: tab === t ? '#fff' : c.textMuted }}>{t === 'events' ? 'Events' : 'Committee'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'events' ? (
        <FlatList
          data={events}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, marginBottom: 6 }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, lineHeight: 19, marginBottom: 10, fontWeight: '300' }}>{item.description}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 11, color: c.textMuted }}>📅 {fmt(item.event_date)}</Text>
                <Text style={{ fontSize: 11, color: c.textMuted }}>📍 {item.venue}</Text>
              </View>
              {item.registration_link && (
                <TouchableOpacity style={{ backgroundColor: c.warning, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => Linking.openURL(item.registration_link)}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Register</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={committee}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: c.border }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.warning, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{item.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '400', fontSize: 14, color: c.text }}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>{item.position}</Text>
                {item.contact && <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>📞 {item.contact}</Text>}
              </View>
              {item.is_faculty_coordinator && (
                <View style={{ backgroundColor: c.blue, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Faculty</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

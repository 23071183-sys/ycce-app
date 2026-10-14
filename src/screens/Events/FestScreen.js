import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function FestScreen() {
  const c = useTheme();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('events');

  useEffect(() => {
    Promise.all([api.get('/fest/events'), api.get('/fest/announcements')])
      .then(([e, a]) => { setEvents(e.data); setAnnouncements(a.data); })
      .catch(reportError).finally(() => setLoading(false));
  }, []);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';
  const categoryColors = { Music: '#FF453A', Dance: '#FF9F0A', Drama: '#BF5AF2', Art: '#30D158', Literary: '#0A84FF' };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.purple} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', backgroundColor: c.card, padding: 4, margin: 16, borderRadius: 10, borderWidth: 0.5, borderColor: c.border }}>
        {['events', 'announcements'].map(t => (
          <TouchableOpacity key={t} style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: tab === t ? c.purple : 'transparent' }} onPress={() => setTab(t)}>
            <Text style={{ fontWeight: '600', fontSize: 13, color: tab === t ? '#fff' : c.textMuted }}>{t === 'events' ? 'Events' : 'Updates'}</Text>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, flex: 1, marginRight: 8 }}>{item.title}</Text>
                {item.category && (
                  <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: categoryColors[item.category] || c.textMuted }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{item.category}</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: c.textMuted, lineHeight: 19, marginBottom: 10, fontWeight: '300' }}>{item.description}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Text style={{ fontSize: 11, color: c.textMuted }}>📅 {fmt(item.event_date)}</Text>
                <Text style={{ fontSize: 11, color: c.textMuted }}>📍 {item.venue}</Text>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40 }}>No announcements yet.</Text>}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, marginBottom: 6 }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, lineHeight: 19, marginBottom: 6, fontWeight: '300' }}>{item.content}</Text>
              <Text style={{ fontSize: 11, color: c.textMuted }}>{fmt(item.created_at)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

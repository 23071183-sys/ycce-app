import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AnnouncementsScreen() {
  const c = useTheme();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const requests = [api.get('/announcements/general')];
        if (user?.year) requests.push(api.get(`/announcements/year/${user.year}`));
        const results = await Promise.all(requests);
        const all = results.flatMap(r => r.data);
        const unique = Array.from(new Map(all.map(a => [a.id, a])).values())
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAnnouncements(unique);
      } catch (e) { reportError(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.text} />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      data={announcements}
      keyExtractor={i => String(i.id)}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Announcements</Text>
      }
      ListEmptyComponent={<Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40 }}>No announcements yet.</Text>}
      renderItem={({ item }) => (
        <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: c.text, flex: 1, marginRight: 8 }}>{item.title}</Text>
            {item.is_cancelled && (
              <View style={{ backgroundColor: c.danger, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Cancelled</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: c.textSec, lineHeight: 20, fontWeight: '300' }} numberOfLines={3}>{item.content}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ fontSize: 11, color: c.textMuted }}>By {item.posted_by_name}</Text>
            <Text style={{ fontSize: 11, color: c.textMuted }}>{fmt(item.created_at)}</Text>
          </View>
        </View>
      )}
    />
  );
}

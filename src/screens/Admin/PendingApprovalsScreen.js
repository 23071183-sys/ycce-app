import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function PendingApprovalsScreen() {
  const c = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/pending');
      setUsers(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const approve = async (id, name) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      Alert.alert('Approved', `${name} can now log in.`);
      fetch();
    } catch (e) { Alert.alert('Error', 'Could not approve'); }
  };

  const reject = async (id, name) => {
    Alert.alert('Reject', `Reject ${name}'s registration?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/admin/users/${id}/reject`);
          fetch();
        } catch (e) { Alert.alert('Error', 'Could not reject'); }
      }}
    ]);
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.text} />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      data={users}
      keyExtractor={i => String(i.id)}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
          Pending Approvals ({users.length})
        </Text>
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Ionicons name="checkmark-circle-outline" size={48} color={c.success} />
          <Text style={{ color: c.textMuted, marginTop: 12, fontSize: 14, fontWeight: '300' }}>No pending registrations</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '300', color: c.text, letterSpacing: 0.3 }}>{item.name}</Text>
            <Text style={{ fontSize: 11, color: c.textMuted }}>{fmt(item.created_at)}</Text>
          </View>
          <Text style={{ fontSize: 12, color: c.textMuted, marginBottom: 2 }}>{item.email}</Text>
          <Text style={{ fontSize: 12, color: c.textMuted, marginBottom: 14 }}>Roll {item.roll_number} · Year {item.year}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: c.success, borderRadius: 8, padding: 10, alignItems: 'center' }}
              onPress={() => approve(item.id, item.name)}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, letterSpacing: 0.5 }}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: c.danger + '20', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 0.5, borderColor: c.danger }}
              onPress={() => reject(item.id, item.name)}
            >
              <Text style={{ color: c.danger, fontWeight: '600', fontSize: 13, letterSpacing: 0.5 }}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

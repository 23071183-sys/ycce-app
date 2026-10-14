import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CTLogo from '../../components/CTLogo';
import YCCELogo from '../../components/YCCELogo';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const c = useTheme();

  const rows = [
    { label: 'Full Name', value: user?.name },
    { label: 'Email', value: user?.email },
    { label: 'Role', value: user?.role?.replace('_', ' ').toUpperCase() },
    { label: 'Year', value: user?.year ? `Year ${user.year}` : '—' },
    { label: 'Roll Number', value: user?.roll_number || '—' },
    { label: 'Department', value: user?.department || 'Computer Technology' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <YCCELogo size={40} />
        </TouchableOpacity>
        <CTLogo size={40} />
      </View>
      <Text style={{ fontSize: 11, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '600', marginBottom: 16 }}>{user?.role}</Text>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.card, borderWidth: 2, borderColor: c.text, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: '300' }}>{user?.name?.[0]}</Text>
      </View>
      <Text style={{ fontSize: 22, fontWeight: '300', color: c.text, letterSpacing: 0.5, marginBottom: 28 }}>{user?.name}</Text>

      <View style={{ backgroundColor: c.card, borderRadius: 16, width: '100%', marginBottom: 24, overflow: 'hidden', borderWidth: 0.5, borderColor: c.border }}>
        {rows.map((r, i) => (
          <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: i < rows.length - 1 ? 0.5 : 0, borderBottomColor: c.border }}>
            <Text style={{ fontSize: 12, color: c.textMuted }}>{r.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: '400', color: c.text, textAlign: 'right', maxWidth: '60%' }}>{r.value}</Text>
          </View>
        ))}
      </View>

      {['super_admin', 'professor'].includes(user?.role) && (
        <TouchableOpacity
          style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', marginBottom: 12, borderWidth: 0.5, borderColor: c.border, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          onPress={() => navigation.navigate('PendingApprovals')}
        >
          <Ionicons name="person-add-outline" size={16} color={c.text} />
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '400', letterSpacing: 1, textTransform: 'uppercase' }}>Pending Approvals</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={{ backgroundColor: c.danger, borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' }} onPress={logout}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '300', letterSpacing: 1, textTransform: 'uppercase' }}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

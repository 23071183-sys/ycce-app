import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#BF5AF2', '#5AC8FA', '#FF2D55'];

export default function SubjectsScreen({ navigation }) {
  const { user } = useAuth();
  const c = useTheme();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const endpoint = user.role === 'professor'
      ? '/subjects/my-subjects'
      : `/subjects/year/${user.year}${user.semester ? `?semester=${user.semester}` : ''}`;
    api.get(endpoint)
      .then(r => setSubjects(r.data))
      .catch(reportError)
      .finally(() => setLoading(false));
  }, [user?.role, user?.year, user?.semester]);

  useFocusEffect(fetchSubjects);

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: c.bg }} size="large" color={c.text} />;

  return (
    <FlatList
      data={subjects}
      keyExtractor={i => String(i.id)}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>My Subjects</Text>
          {user?.semester && <Text style={{ fontSize: 12, color: c.border, marginTop: 2 }}>Semester {user.semester}</Text>}
        </View>
      }
      renderItem={({ item, index }) => {
        const accent = ACCENTS[index % ACCENTS.length];
        return (
          <TouchableOpacity
            style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: accent, borderWidth: 0.5, borderColor: c.border }}
            onPress={() => navigation.navigate('SubjectDetail', { subject: item, color: accent })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, flex: 1, marginRight: 8 }}>{item.name}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, color: accent }}>{item.code}</Text>
            </View>
            <Text style={{ fontSize: 11, color: c.textMuted, marginBottom: 2 }}>👨‍🏫 {item.professor_name || 'TBA'}</Text>
            <Text style={{ fontSize: 11, color: c.textMuted }}>📅 Year {item.year} · Semester {item.semester}</Text>
            <View style={{ position: 'absolute', right: 16, top: '50%' }}>
              <Text style={{ fontSize: 24, color: c.border }}>›</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

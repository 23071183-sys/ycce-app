import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import CTLogo from '../../components/CTLogo';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toMinutes(t) { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function UpcomingClass({ user, navigation }) {
  const c = useTheme();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClass = useCallback(() => {
    if (!user?.year) { setLoading(false); return; }
    setLoading(true);
    api.get(`/timetable/year/${user.year}`)
      .then(r => {
        const now = new Date();
        const todayName = DAYS[now.getDay()];
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const today = r.data.filter(c => c.day === todayName).sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
        const current = today.find(c => toMinutes(c.start_time) <= nowMin && toMinutes(c.end_time) > nowMin);
        const next = today.find(c => toMinutes(c.start_time) > nowMin);
        setCls(current ? { ...current, status: 'ongoing' } : next ? { ...next, status: 'upcoming' } : null);
      })
      .catch(reportError)
      .finally(() => setLoading(false));
  }, [user?.year]);

  useFocusEffect(fetchClass);

  if (loading) return <ActivityIndicator style={{ marginBottom: 20 }} color={c.textMuted} />;
  if (!cls) return null;

  const isOngoing = cls.status === 'ongoing';
  const accent = isOngoing ? c.success : c.blue;

  return (
    <TouchableOpacity
      style={{ backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: accent, borderWidth: 0.5, borderColor: c.border }}
      onPress={() => navigation.navigate('Timetable')}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6, backgroundColor: accent + '20' }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accent }} />
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: accent }}>{isOngoing ? 'Ongoing' : 'Up Next'}</Text>
        </View>
        <Text style={{ fontSize: 12, color: c.textMuted, fontWeight: '300', letterSpacing: 0.3 }}>
          {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '400', color: c.text, marginBottom: 10 }}>{cls.subject_name}</Text>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="person-outline" size={13} color={c.textSec} />
          <Text style={{ fontSize: 13, color: c.textSec }}>{cls.professor_name}</Text>
        </View>
        {cls.room ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="location-outline" size={13} color={c.textSec} />
            <Text style={{ fontSize: 13, color: c.textSec }}>{cls.room}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function QuickCard({ card, c, navigation }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  return (
    <TouchableOpacity onPressIn={onPressIn} onPressOut={onPressOut} onPress={() => navigation.navigate(card.screen)} activeOpacity={1} style={{ width: '47%' }}>
      <Animated.View style={{ transform: [{ scale }], backgroundColor: c.card, borderRadius: 12, padding: 20, borderTopWidth: 3, borderTopColor: card.color, borderWidth: 0.5, borderColor: c.border }}>
        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: card.color + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name={card.icon} size={20} color={card.color} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '400', color: c.text, letterSpacing: 0.3 }}>{card.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const c = useTheme();

  const cards = [
    { label: 'Timetable', icon: 'time-outline',               screen: 'Timetable', color: c.blue },
    { label: 'Faculty',   icon: 'person-outline',             screen: 'Faculty',   color: c.success },
    { label: 'Compufest', icon: 'code-slash-outline',         screen: 'Compufest', color: c.warning },
    { label: 'Yash Fest', icon: 'star-outline',               screen: 'Fest',      color: c.purple },
    { label: 'Ask AI',    icon: 'chatbubble-ellipses-outline', screen: 'Chat',      color: c.blue },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: c.textMuted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Welcome back</Text>
          <Text style={{ fontSize: 28, fontWeight: '200', color: c.text, letterSpacing: 1 }}>{user?.name?.split(' ')[0]}</Text>
          <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 5, letterSpacing: 2, textTransform: 'uppercase' }}>{user?.role} · Year {user?.year} · {user?.roll_number}</Text>
        </View>
        <CTLogo size={48} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <View style={{ backgroundColor: c.text, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ color: c.bg, fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>Computer Technology</Text>
        </View>
        <View style={{ height: 0.5, flex: 1, backgroundColor: c.border }} />
      </View>

      <UpcomingClass user={user} navigation={navigation} />

      <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Quick Access</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {cards.map((card) => (
          <QuickCard key={card.label} card={card} c={c} navigation={navigation} />
        ))}
      </View>
    </ScrollView>
  );
}

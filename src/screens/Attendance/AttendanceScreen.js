import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const RADIUS = 54;
const STROKE = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AttendanceRing({ percentage, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 140, height: 140 }}>
      <Svg width={140} height={140} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={70} cy={70} r={RADIUS}
          stroke="#e4e4e7" strokeWidth={STROKE} fill="none"
        />
        <AnimatedCircle
          cx={70} cy={70} r={RADIUS}
          stroke={color} strokeWidth={STROKE} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: 34, fontWeight: '200', color, letterSpacing: -1 }}>{percentage}%</Text>
    </View>
  );
}

function SkeletonBox({ width, height, style }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[{ width, height, borderRadius: 6, backgroundColor: '#3f3f46', opacity: anim }, style]} />
  );
}

export default function AttendanceScreen({ navigation }) {
  const c = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/overall')
      .then(r => setRecords(r.data))
      .catch(reportError)
      .finally(() => setLoading(false));
  }, []);

  const overall = records.length
    ? Math.round(records.reduce((sum, r) => sum + parseFloat(r.percentage || 0), 0) / records.length)
    : 0;

  const pctColor = (p) => p >= 75 ? '#16a34a' : p >= 60 ? '#d97706' : '#dc2626';

  return (
    <FlatList
      data={loading ? [] : records}
      keyExtractor={i => String(i.subject_id)}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ListHeaderComponent={
        <View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            My Attendance
          </Text>
          <View style={{ alignItems: 'center', backgroundColor: c.card, borderRadius: 20, padding: 28, marginBottom: 20, borderWidth: 0.5, borderColor: c.border }}>
            {loading ? (
              <View style={{ alignItems: 'center', gap: 12 }}>
                <SkeletonBox width={140} height={140} style={{ borderRadius: 70 }} />
                <SkeletonBox width={120} height={12} />
              </View>
            ) : (
              <>
                <AttendanceRing percentage={overall} color={pctColor(overall)} />
                <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Overall Attendance</Text>
                <Text style={{ fontSize: 12, color: c.border, marginTop: 2 }}>Across {records.length} subjects</Text>
              </>
            )}
          </View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
            Subject-wise · Tap to view detail
          </Text>
          {loading && [1,2,3].map(i => (
            <View key={i} style={{ backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 8 }}>
                <SkeletonBox width={140} height={12} />
                <SkeletonBox width={90} height={10} />
              </View>
              <SkeletonBox width={56} height={32} style={{ borderRadius: 10 }} />
            </View>
          ))}
        </View>
      }
      renderItem={({ item }) => {
        const pct = parseFloat(item.percentage || 0);
        const color = pctColor(pct);
        return (
          <TouchableOpacity
            onPress={() => navigation.navigate('AttendanceDetail', { subject: item })}
            activeOpacity={0.75}
            style={{
              backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 10,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              borderWidth: 0.5, borderColor: c.border,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, marginBottom: 3 }}>{item.subject_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 11, color: c.textMuted }}>{item.present_count} / {item.total_count} classes</Text>
                <Ionicons name="calendar-outline" size={11} color={c.textMuted} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, minWidth: 60, alignItems: 'center', backgroundColor: color }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{pct}%</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        !loading && <Text style={{ textAlign: 'center', color: c.textMuted, marginTop: 40 }}>No attendance records yet.</Text>
      }
    />
  );
}

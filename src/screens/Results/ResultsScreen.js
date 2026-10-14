import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api, { reportError } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const getSession = (semester, studentYear) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentCalYear = now.getFullYear();
  const academicYearStart = currentMonth < 6 ? currentCalYear - 1 : currentCalYear;
  const joiningYear = academicYearStart - ((studentYear || 3) - 1);
  const semYearOffset = Math.floor((semester - 1) / 2);
  const sessionStart = joiningYear + semYearOffset;
  return `${sessionStart}-${String(sessionStart + 1).slice(-2)}`;
};

export default function ResultsScreen() {
  const { user } = useAuth();
  const c = useTheme();
  const [semester, setSemester] = useState(user?.semester || 6);
  const [results, setResults] = useState([]);
  const [cgpaData, setCgpaData] = useState({ sgpaList: [], cgpa: null });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => { fetchAll(); }, [semester]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, cg] = await Promise.all([
        api.get(`/results/my?semester=${semester}`),
        api.get(`/results/cgpa?upTo=${semester}`),
      ]);
      setResults(r.data);
      setCgpaData(cg.data);
    } catch (e) { reportError(e); }
    finally { setLoading(false); }
  };

  const gpaColor = (val) => {
    if (!val) return c.textMuted;
    if (val >= 8.5) return c.success;
    if (val >= 7) return c.blue;
    if (val >= 5.5) return c.warning;
    return c.danger;
  };

  const gradeColor = (grade) => {
    if (!grade || grade === '—') return c.textMuted;
    if (['O', 'A+', 'S', 'A'].includes(grade)) return c.success;
    if (['B+', 'B'].includes(grade)) return c.blue;
    if (['C', 'C+'].includes(grade)) return c.warning;
    return c.danger;
  };

  const currentSGPA = cgpaData.sgpaList?.find(s => s.semester === semester)?.sgpa ?? null;
  const allPassed = results.length > 0 && results.every(r => r.result === 'Pass');
  const hasFail = results.some(r => r.result === 'Fail');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Dropdown trigger */}
      <TouchableOpacity
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.card, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: c.border }}
        onPress={() => setDropdownOpen(true)}
      >
        <View>
          <Text style={{ fontSize: 15, fontWeight: '300', color: c.text, letterSpacing: 0.3 }}>Semester {semester} — Grade Sheet</Text>
          <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 3, letterSpacing: 0.5 }}>Session {getSession(semester, user?.year)}</Text>
        </View>
        <Text style={{ color: c.textMuted, fontSize: 11, letterSpacing: 1 }}>SEM {semester}</Text>
      </TouchableOpacity>

      {/* Reg bar */}
      <View style={{ flexDirection: 'row', backgroundColor: c.card, borderBottomWidth: 0.5, borderBottomColor: c.border, paddingVertical: 12, paddingHorizontal: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: c.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>Registration No.</Text>
          <Text style={{ fontSize: 13, fontWeight: '400', color: c.text }}>{user?.roll_number || '—'}</Text>
        </View>
        <View style={{ width: 0.5, backgroundColor: c.border, marginHorizontal: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: c.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>Department</Text>
          <Text style={{ fontSize: 13, fontWeight: '400', color: c.text }}>Computer Technology</Text>
        </View>
      </View>

      {/* Semester picker modal */}
      <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setDropdownOpen(false)}>
          <View style={{ backgroundColor: c.card, borderRadius: 16, width: '80%', maxHeight: '70%', overflow: 'hidden', borderWidth: 0.5, borderColor: c.border }}>
            <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, padding: 16, borderBottomWidth: 0.5, borderBottomColor: c.border, letterSpacing: 0.5 }}>Select Semester</Text>
            <ScrollView>
              {SEMESTERS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: c.border, backgroundColor: semester === s ? c.blue + '18' : 'transparent' }}
                  onPress={() => { setSemester(s); setDropdownOpen(false); }}
                >
                  <View>
                    <Text style={{ fontSize: 14, color: semester === s ? c.blue : c.textSec, fontWeight: semester === s ? '600' : '400' }}>Semester {s}</Text>
                    <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Session {getSession(s, user?.year)}</Text>
                  </View>
                  {semester === s && <Text style={{ color: c.blue, fontWeight: '700', fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={c.text} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>

          {/* GPA cards */}
          {(currentSGPA !== null || cgpaData.cgpa !== null) && (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {[{ val: currentSGPA, label: 'SGPA', sub: `Semester ${semester}` }, { val: cgpaData.cgpa, label: 'CGPA', sub: `Avg of ${cgpaData.sgpaList?.length || 0} Sem(s)` }].map(({ val, label, sub }) => (
                <View key={label} style={{ flex: 1, backgroundColor: c.card, borderRadius: 14, padding: 16, alignItems: 'center', borderTopWidth: 3, borderTopColor: gpaColor(val), borderWidth: 0.5, borderColor: c.border }}>
                  <Text style={{ fontSize: 32, fontWeight: '200', letterSpacing: -0.5, color: gpaColor(val) }}>{val ?? '—'}</Text>
                  <Text style={{ fontSize: 10, color: c.textMuted, marginTop: 6, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
                  <Text style={{ fontSize: 10, color: c.border, marginTop: 2 }}>{sub}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Grade sheet */}
          <View style={{ backgroundColor: c.card, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: c.border, marginBottom: 16 }}>
            <View style={{ backgroundColor: c.cardAlt, padding: 20, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: c.border }}>
              <Text style={{ fontSize: 14, fontWeight: '400', color: c.text, letterSpacing: 1 }}>Computer Technology</Text>
              <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 4, textAlign: 'center', letterSpacing: 0.3 }}>Grade Sheet · Semester {semester} · Session {getSession(semester, user?.year)}</Text>
            </View>

            <View style={{ padding: 16, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
              {[['Name', user?.name], ['Roll No', user?.roll_number || '—']].map(([label, val]) => (
                <View key={label} style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, color: c.textMuted, width: 70, fontWeight: '600', letterSpacing: 0.5 }}>{label}</Text>
                  <Text style={{ fontSize: 13, color: c.text, fontWeight: '300', flex: 1 }}>{val}</Text>
                </View>
              ))}
              {currentSGPA && (
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, color: c.textMuted, width: 70, fontWeight: '600', letterSpacing: 0.5 }}>SGPA</Text>
                  <Text style={{ fontSize: 13, color: gpaColor(currentSGPA), fontWeight: '600', flex: 1 }}>{currentSGPA}</Text>
                </View>
              )}
              {cgpaData.cgpa && (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontSize: 11, color: c.textMuted, width: 70, fontWeight: '600', letterSpacing: 0.5 }}>CGPA</Text>
                  <Text style={{ fontSize: 13, color: gpaColor(cgpaData.cgpa), fontWeight: '600', flex: 1 }}>{cgpaData.cgpa}</Text>
                </View>
              )}
            </View>

            {results.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: c.textMuted, textAlign: 'center', fontWeight: '300', letterSpacing: 0.5 }}>No results declared for Semester {semester}</Text>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', backgroundColor: c.cardAlt, paddingHorizontal: 12, paddingVertical: 10 }}>

                  {[['Code', 1.5], ['Subject', 3], ['Int', 1], ['Ext', 1], ['Grade', 1]].map(([label, flex]) => (
                    <Text key={label} style={{ fontSize: 10, fontWeight: '600', color: c.textSec, textTransform: 'uppercase', letterSpacing: 1, flex, textAlign: flex === 1 ? 'center' : 'left' }}>{label}</Text>
                  ))}
                </View>
                {results.map((r, i) => (
                  <View key={r.id} style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.border, backgroundColor: i % 2 === 0 ? c.cardAlt + '80' : 'transparent' }}>
                    <Text style={{ fontSize: 12, color: c.textMuted, flex: 1.5, fontWeight: '300' }}>{r.subject_code}</Text>
                    <Text style={{ fontSize: 12, color: c.text, flex: 3, fontWeight: '300' }}>{r.subject_name}</Text>
                    <Text style={{ fontSize: 12, color: c.textSec, flex: 1, textAlign: 'center', fontWeight: '300' }}>{r.internal_marks ?? '—'}</Text>
                    <Text style={{ fontSize: 12, color: c.textSec, flex: 1, textAlign: 'center', fontWeight: '300' }}>{r.external_marks ?? '—'}</Text>
                    <Text style={{ fontSize: 12, flex: 1, textAlign: 'center', fontWeight: '700', color: gradeColor(r.grade) }}>{r.grade || '—'}</Text>
                  </View>
                ))}
                <View style={{ padding: 16 }}>
                  <View style={{ borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: hasFail ? c.danger + '20' : allPassed ? c.success + '20' : c.warning + '20' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: hasFail ? c.danger : allPassed ? c.success : c.warning, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {hasFail ? 'Fail' : allPassed ? 'All Clear' : 'Result Pending'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* SGPA history */}
          {cgpaData.sgpaList?.length > 1 && (
            <View style={{ backgroundColor: c.card, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: c.border, marginBottom: 16 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: c.textSec, textTransform: 'uppercase', letterSpacing: 1.5, padding: 14, borderBottomWidth: 0.5, borderBottomColor: c.border }}>SGPA History</Text>
              {cgpaData.sgpaList.map(s => (
                <View key={s.semester} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                  <Text style={{ fontSize: 13, color: c.text, fontWeight: '400', flex: 1 }}>Semester {s.semester}</Text>
                  <Text style={{ fontSize: 11, color: c.textMuted, flex: 1, letterSpacing: 0.3 }}>{getSession(s.semester, user?.year)}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '300', color: gpaColor(s.sgpa) }}>{s.sgpa}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: c.cardAlt }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: c.textSec, flex: 1, letterSpacing: 1.5, textTransform: 'uppercase' }}>Cumulative CGPA</Text>
                <Text style={{ fontSize: 22, fontWeight: '200', color: gpaColor(cgpaData.cgpa) }}>{cgpaData.cgpa}</Text>
              </View>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

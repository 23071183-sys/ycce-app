import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import api, { reportError } from '../../../services/api';
import { space } from '../../../theme';
import { Card, ErrorState, Screen, SegmentedControl, Skeleton, Text } from '../../../components/ui';
import NotesTab from './NotesTab';
import AnnouncementsTab from './AnnouncementsTab';
import AssignmentsTab from './AssignmentsTab';
import AttendanceTab from './AttendanceTab';

const TABS = [
  { value: 'Announcements', label: 'Updates' },
  { value: 'Notes', label: 'Notes' },
  { value: 'Assignments', label: 'Assignments' },
  { value: 'Attendance', label: 'Attendance' },
];

export default function SubjectDetailScreen({ route }) {
  const { subject } = route.params;
  const { user } = useAuth();
  const isProfessor = user?.role === 'professor';
  const [tab, setTab] = useState('Announcements');
  const [notes, setNotes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchTab(); }, [tab]);

  const fetchTab = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      if (tab === 'Notes') { const r = await api.get(`/notes/subject/${subject.id}`); setNotes(r.data); }
      else if (tab === 'Announcements') { const r = await api.get(`/announcements/subject/${subject.id}`); setAnnouncements(r.data); }
      else if (tab === 'Assignments') { const r = await api.get(`/assignments/subject/${subject.id}`); setAssignments(r.data); }
      else if (tab === 'Attendance') {
        if (user?.role === 'student') { const r = await api.get(`/attendance/subject/${subject.id}`); setAttendance(r.data); }
        else { const r = await api.get(`/users/students/year/${subject.year}`); setStudents(r.data.map(s => ({ ...s, status: 'present' }))); }
      }
      setError(null);
    } catch (e) { reportError(e); setError(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const reload = () => fetchTab();

  let body;
  if (loading) {
    body = [1, 2, 3].map(i => (
      <Card key={i} style={styles.skeleton}>
        <Skeleton width="60%" height={16} />
        <Skeleton height={12} />
        <Skeleton width="40%" height={10} />
      </Card>
    ));
  } else if (error) {
    body = <ErrorState onRetry={reload} />;
  } else if (tab === 'Notes') {
    body = <NotesTab notes={notes} subjectId={subject.id} isProfessor={isProfessor} onChanged={reload} />;
  } else if (tab === 'Announcements') {
    body = <AnnouncementsTab announcements={announcements} subjectId={subject.id} isProfessor={isProfessor} onChanged={reload} />;
  } else if (tab === 'Assignments') {
    body = <AssignmentsTab assignments={assignments} subjectId={subject.id} user={user} isProfessor={isProfessor} onChanged={reload} />;
  } else {
    body = (
      <AttendanceTab
        user={user}
        attendance={attendance}
        students={students}
        setStudents={setStudents}
        subjectId={subject.id}
      />
    );
  }

  return (
    <Screen onRefresh={() => fetchTab(true)} refreshing={refreshing}>
      <View style={styles.header}>
        <Text variant="title">{subject.name}</Text>
        <Text variant="callout" tone="muted" style={styles.sub}>
          {[subject.code, subject.professor_name].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <SegmentedControl options={TABS} value={tab} onChange={setTab} style={styles.tabs} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space.lg },
  sub: { marginTop: space.xs },
  tabs: { marginBottom: space.lg },
  skeleton: { gap: space.sm, marginBottom: space.md },
});

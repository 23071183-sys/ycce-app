import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { space } from '../../theme';
import { fmtDate, fmtINR } from '../../utils/format';
import { Card, ErrorState, ListItem, Screen, Text } from '../../components/ui';
import Monogram from '../../components/Monogram';
import {
  AttendanceSection, DeadlinesSection, HomeSection, NoticesSection, NowNextSection, QuickLinks, StatTiles,
} from './HomeSections';

const LINKS = {
  timetable: { label: 'Timetable', icon: 'time-outline', screen: 'Timetable' },
  faculty: { label: 'Faculty', icon: 'people-outline', screen: 'Faculty' },
  compufest: { label: 'Compufest', icon: 'code-slash-outline', screen: 'Compufest' },
  fest: { label: 'Yash Fest', icon: 'star-outline', screen: 'Fest' },
  chat: { label: 'Ask AI', icon: 'chatbubble-ellipses-outline', screen: 'Chat' },
  results: { label: 'Results', icon: 'bar-chart-outline', screen: 'Results' },
  fees: { label: 'Fees', icon: 'wallet-outline', screen: 'Fees' },
  approvals: { label: 'Approvals', icon: 'person-add-outline', screen: 'PendingApprovals' },
};

const ADMIN_ROLES = ['admin', 'super_admin'];

function StudentHome({ data, loading, navigation }) {
  const fees = data?.feesDue;
  const openSubjectAttendance = (s) => navigation.navigate('AttendanceDetail', {
    subject: {
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      percentage: s.percentage,
      present_count: s.present,
      total_count: s.total,
    },
  });
  return (
    <>
      <NowNextSection today={data?.today} loading={loading} onPress={() => navigation.navigate('Timetable')} />
      <AttendanceSection
        attendance={data?.attendance}
        loading={loading}
        onOpen={() => navigation.navigate('Attendance')}
        onOpenSubject={openSubjectAttendance}
      />
      <DeadlinesSection
        deadlines={data?.deadlines}
        loading={loading}
        onOpen={(d) => navigation.navigate('SubjectDetail', { subject: { id: d.subject_id, name: d.subject_name } })}
      />
      <NoticesSection notices={data?.notices} loading={loading} onOpen={() => navigation.navigate('Announcements')} />
      <StatTiles
        loading={loading}
        tiles={[
          {
            label: 'Unread messages',
            value: data?.unreadMessages ?? 0,
            tone: data?.unreadMessages ? 'accent' : undefined,
            onPress: () => navigation.navigate('Messages'),
          },
          {
            label: 'Fees due',
            value: fees?.paise ? fmtINR(fees.paise) : 'Nil',
            tone: fees?.paise ? 'warning' : undefined,
            caption: fees?.paise && fees.nextDueDate ? `By ${fmtDate(fees.nextDueDate)}` : null,
            onPress: () => navigation.navigate('Fees'),
          },
        ]}
      />
      <QuickLinks
        links={[LINKS.timetable, LINKS.results, LINKS.fees, LINKS.faculty, LINKS.chat, LINKS.compufest, LINKS.fest]}
        onOpen={(screen) => navigation.navigate(screen)}
      />
    </>
  );
}

function ProfessorHome({ data, loading, navigation }) {
  const subjects = data?.subjects || [];
  return (
    <>
      <NowNextSection today={data?.today} loading={loading} onPress={() => navigation.navigate('Timetable')} />
      <StatTiles
        loading={loading}
        tiles={[
          { label: 'To grade', value: data?.pendingGrading ?? 0, tone: data?.pendingGrading ? 'warning' : undefined },
          {
            label: 'Unread messages',
            value: data?.unreadMessages ?? 0,
            tone: data?.unreadMessages ? 'accent' : undefined,
            onPress: () => navigation.navigate('Messages'),
          },
        ]}
      />
      <HomeSection
        title="My classes"
        loading={loading}
        skeletonRows={3}
        empty={!subjects.length}
        emptyProps={{ icon: 'book-outline', title: 'No classes assigned' }}
      >
        <Card padded={false} style={styles.inset}>
          {subjects.map((s, i) => (
            <ListItem
              key={s.id}
              leading={<Monogram name={s.name} />}
              title={s.name}
              subtitle={`${s.code} · Year ${s.year}`}
              onPress={() => navigation.navigate('SubjectDetail', { subject: s })}
              last={i === subjects.length - 1}
            />
          ))}
        </Card>
      </HomeSection>
      <NoticesSection notices={data?.notices} loading={loading} onOpen={() => navigation.navigate('Announcements')} />
      <QuickLinks
        links={[LINKS.timetable, LINKS.approvals, LINKS.faculty, LINKS.chat, LINKS.compufest, LINKS.fest]}
        onOpen={(screen) => navigation.navigate(screen)}
      />
    </>
  );
}

function AdminHome({ data, loading, navigation, role }) {
  const stats = data?.stats || {};
  const fees = data?.fees || {};
  // Only super admins can approve, so only they get the shortcut.
  const canApprove = role === 'super_admin';
  return (
    <>
      <StatTiles
        loading={loading}
        tiles={[
          { label: 'Students', value: stats.students ?? 0 },
          { label: 'Professors', value: stats.professors ?? 0 },
        ]}
      />
      <StatTiles
        loading={loading}
        tiles={[
          {
            label: 'Pending approvals',
            value: stats.pending_approvals ?? 0,
            tone: stats.pending_approvals ? 'warning' : undefined,
            onPress: canApprove ? () => navigation.navigate('PendingApprovals') : undefined,
          },
          {
            label: 'Unread messages',
            value: data?.unreadMessages ?? 0,
            tone: data?.unreadMessages ? 'accent' : undefined,
            onPress: () => navigation.navigate('Messages'),
          },
        ]}
      />
      <StatTiles
        loading={loading}
        tiles={[
          { label: 'Fees collected', value: fmtINR(fees.collectedPaise), caption: `of ${fmtINR(fees.expectedPaise)} expected` },
        ]}
      />
      <NoticesSection notices={data?.notices} loading={loading} onOpen={() => navigation.navigate('Announcements')} />
      <QuickLinks
        links={[LINKS.timetable, ...(canApprove ? [LINKS.approvals] : []), LINKS.faculty, LINKS.chat, LINKS.compufest, LINKS.fest]}
        onOpen={(screen) => navigation.navigate(screen)}
      />
    </>
  );
}

function OtherHome({ data, loading, navigation }) {
  return (
    <>
      <NoticesSection notices={data?.notices} loading={loading} onOpen={() => navigation.navigate('Announcements')} />
      <QuickLinks
        links={[LINKS.fest, LINKS.compufest, LINKS.timetable, LINKS.faculty, LINKS.chat]}
        onOpen={(screen) => navigation.navigate(screen)}
      />
    </>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { data, loading, error, refreshing, refresh, revalidate, reload } = useApi('/dashboard/me');

  // Refetch quietly when coming back to Home, but not on the first focus,
  // which the initial load already covers.
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    if (focused.current) revalidate();
    focused.current = true;
  }, [revalidate]));

  const role = data?.role || user?.role;
  const name = data?.user?.name || user?.name;
  const details = [
    role?.replace('_', ' '),
    user?.year ? `Year ${user.year}` : null,
    user?.roll_number,
  ].filter(Boolean).join(' · ');

  let body;
  // Keep showing the last dashboard if a background refetch fails.
  if (error && !data) body = <ErrorState onRetry={reload} />;
  else if (role === 'student') body = <StudentHome data={data} loading={loading} navigation={navigation} />;
  else if (role === 'professor') body = <ProfessorHome data={data} loading={loading} navigation={navigation} />;
  else if (ADMIN_ROLES.includes(role)) body = <AdminHome data={data} loading={loading} navigation={navigation} role={role} />;
  else body = <OtherHome data={data} loading={loading} navigation={navigation} />;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.greeting}>
        <Text variant="label">Welcome back</Text>
        <Text variant="display" style={styles.name}>{name?.split(' ')[0]}</Text>
        {details ? <Text variant="callout" tone="muted" style={styles.capitalize}>{details}</Text> : null}
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { marginBottom: space.xxl },
  name: { marginTop: space.xs, marginBottom: space.xs },
  capitalize: { textTransform: 'capitalize' },
  inset: { paddingHorizontal: space.lg },
});

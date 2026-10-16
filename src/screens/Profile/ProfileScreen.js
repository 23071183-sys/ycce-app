import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useThemeControls } from '../../context/ThemeContext';
import { reportError } from '../../services/api';
import { Avatar, Card, Icon, InfoRow, ListItem, Screen, SectionLabel, Text } from '../../components/ui';
import { space } from '../../theme';

const APPEARANCE_LABEL = { system: 'System', light: 'Light', dark: 'Dark' };

function Group({ title, rows }) {
  if (!rows.length) return null;
  return (
    <View style={styles.group}>
      {title ? <SectionLabel>{title}</SectionLabel> : null}
      <Card padded={false} style={styles.inset}>
        {rows.map((r, i) => (
          <ListItem
            key={r.key}
            title={r.title}
            subtitle={r.subtitle}
            leading={<Icon name={r.icon} tone={r.tone} />}
            trailing={r.trailing}
            onPress={r.onPress}
            chevron={r.chevron}
            last={i === rows.length - 1}
          />
        ))}
      </Card>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { preference } = useThemeControls();
  const [refreshing, setRefreshing] = useState(false);
  const role = user?.role?.replace('_', ' ');
  const isStudent = user?.role === 'student';

  // Pick up changes made on the web admin or another device.
  useFocusEffect(useCallback(() => { refreshUser().catch(reportError); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refreshUser(); } catch (e) { reportError(e); }
    finally { setRefreshing(false); }
  };

  const details = [
    { label: 'Email', value: user?.email },
    { label: 'Role', value: role ? role[0].toUpperCase() + role.slice(1) : null },
    isStudent && { label: 'Year', value: user?.year ? `Year ${user.year}` : null },
    isStudent && { label: 'Roll number', value: user?.roll_number },
    user?.phone && { label: 'Phone', value: user.phone },
    { label: 'Department', value: user?.department || 'Computer Technology' },
  ].filter(Boolean);

  const academic = [
    isStudent && { key: 'results', title: 'Results', icon: 'bar-chart-outline', onPress: () => navigation.navigate('Results') },
    isStudent && { key: 'fees', title: 'Fees', icon: 'wallet-outline', onPress: () => navigation.navigate('Fees') },
    ['super_admin', 'professor'].includes(user?.role) && {
      key: 'approvals', title: 'Pending approvals', icon: 'person-add-outline', onPress: () => navigation.navigate('PendingApprovals'),
    },
  ].filter(Boolean);

  const settings = [
    { key: 'edit', title: 'Edit profile', icon: 'create-outline', onPress: () => navigation.navigate('EditProfile') },
    {
      key: 'appearance',
      title: 'Appearance',
      icon: 'contrast-outline',
      trailing: <Text variant="callout" tone="muted">{APPEARANCE_LABEL[preference]}</Text>,
      onPress: () => navigation.navigate('Appearance'),
    },
    { key: 'notifications', title: 'Notifications', icon: 'notifications-outline', onPress: () => navigation.navigate('NotificationSettings') },
  ];

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Avatar name={user?.name} uri={user?.avatar_url} size={80} />
        <Text variant="title" style={styles.name}>{user?.name}</Text>
        {role ? <Text variant="label">{role}</Text> : null}
        {user?.bio ? <Text variant="callout" tone="secondary" style={styles.bio}>{user.bio}</Text> : null}
      </View>

      <View style={styles.group}>
        <SectionLabel>Details</SectionLabel>
        <Card padded={false} style={styles.inset}>
          {details.map((r, i) => (
            <InfoRow key={r.label} label={r.label} value={r.value} last={i === details.length - 1} />
          ))}
        </Card>
      </View>

      <Group rows={academic} />
      <Group title="Settings" rows={settings} />
      <Group
        rows={[{
          key: 'signout',
          title: <Text tone="danger">Sign out</Text>,
          icon: 'log-out-outline',
          tone: 'danger',
          onPress: logout,
          chevron: false,
        }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: space.xxl },
  name: { marginTop: space.md, marginBottom: space.xs, textAlign: 'center' },
  bio: { marginTop: space.sm, textAlign: 'center' },
  group: { marginBottom: space.xxl },
  inset: { paddingHorizontal: space.lg },
});

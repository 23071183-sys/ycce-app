import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Card, Icon, InfoRow, ListItem, Screen, SectionLabel, Text } from '../../components/ui';
import { space } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const role = user?.role?.replace('_', ' ');

  const rows = [
    { label: 'Email', value: user?.email },
    { label: 'Role', value: role ? role[0].toUpperCase() + role.slice(1) : null },
    { label: 'Year', value: user?.year ? `Year ${user.year}` : null },
    { label: 'Roll number', value: user?.roll_number },
    { label: 'Department', value: user?.department || 'Computer Technology' },
  ];

  const actions = [
    user?.role === 'student' && {
      key: 'results', title: 'Results', icon: 'bar-chart-outline', onPress: () => navigation.navigate('Results'),
    },
    ['super_admin', 'professor'].includes(user?.role) && {
      key: 'approvals', title: 'Pending approvals', icon: 'person-add-outline', onPress: () => navigation.navigate('PendingApprovals'),
    },
  ].filter(Boolean);

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={user?.name} size={72} />
        <Text variant="title" style={styles.name}>{user?.name}</Text>
        {role ? <Text variant="label">{role}</Text> : null}
      </View>

      <SectionLabel>Details</SectionLabel>
      <Card style={styles.group} padded={false}>
        <View style={styles.inset}>
          {rows.map((r, i) => (
            <InfoRow key={r.label} label={r.label} value={r.value} last={i === rows.length - 1} />
          ))}
        </View>
      </Card>

      <Card style={styles.group} padded={false}>
        <View style={styles.inset}>
          {actions.map(a => (
            <ListItem key={a.key} title={a.title} leading={<Icon name={a.icon} />} onPress={a.onPress} />
          ))}
          <ListItem
            title={<Text tone="danger">Sign out</Text>}
            leading={<Icon name="log-out-outline" tone="danger" />}
            onPress={logout}
            chevron={false}
            last
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: space.xxl },
  name: { marginTop: space.md, marginBottom: space.xs, textAlign: 'center' },
  group: { marginBottom: space.xxl },
  inset: { paddingHorizontal: space.lg },
});

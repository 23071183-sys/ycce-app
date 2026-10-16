import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Icon, Skeleton, Text } from '../../components/ui';
import { space } from '../../theme';

export const fmtEventDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';

function Meta({ icon, children }) {
  return (
    <View style={styles.meta}>
      <Icon name={icon} size={13} tone="muted" />
      <Text variant="caption" tone="muted">{children}</Text>
    </View>
  );
}

// One fest event: title, optional category tag, description, date and venue,
// and a register button when there is a link.
export function EventCard({ item, onRegister }) {
  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Text variant="heading" style={styles.title}>{item.title}</Text>
        {item.category ? <Badge>{item.category}</Badge> : null}
      </View>
      {item.description ? <Text variant="callout" tone="secondary" style={styles.body}>{item.description}</Text> : null}
      <View style={styles.metaRow}>
        <Meta icon="calendar-outline">{fmtEventDate(item.event_date)}</Meta>
        {item.venue ? <Meta icon="location-outline">{item.venue}</Meta> : null}
      </View>
      {onRegister ? <Button title="Register" size="sm" onPress={onRegister} style={styles.register} /> : null}
    </Card>
  );
}

export function EventListSkeleton() {
  return [1, 2, 3].map(i => (
    <Card key={i} style={[styles.card, styles.skeleton]}>
      <Skeleton width="60%" height={16} />
      <Skeleton height={12} />
      <Skeleton width="40%" height={10} />
    </Card>
  ));
}

export const styles = StyleSheet.create({
  card: { marginBottom: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  title: { flex: 1 },
  body: { marginTop: space.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, marginTop: space.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  register: { marginTop: space.md },
  skeleton: { gap: space.sm },
  tabs: { marginBottom: space.lg },
});

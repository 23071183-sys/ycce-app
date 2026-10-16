import React from 'react';
import { StyleSheet, View } from 'react-native';
import { attendanceTone, space } from '../../theme';
import { fmtDate, fmtTime, relativeTime } from '../../utils/format';
import {
  Badge, Card, EmptyState, Icon, ListItem, ProgressRing, SectionLabel, Skeleton, StatNumber, Text,
} from '../../components/ui';

// A titled block on Home. While the dashboard loads it shows its own skeleton,
// and when it has nothing it shows its own empty state, so one empty section
// never blanks the screen.
export function HomeSection({ title, action, onAction, loading, empty, emptyProps, skeletonRows = 2, children }) {
  let content = children;
  if (loading) {
    content = (
      <Card style={styles.skeleton}>
        {Array.from({ length: skeletonRows }, (_, i) => <Skeleton key={i} height={16} width={i ? '60%' : '85%'} />)}
      </Card>
    );
  } else if (empty) {
    content = <Card padded={false}><EmptyState style={styles.compactEmpty} {...emptyProps} /></Card>;
  }
  return (
    <View style={styles.section}>
      <SectionLabel action={!loading && !empty ? action : undefined} onAction={onAction}>{title}</SectionLabel>
      {content}
    </View>
  );
}

const timeRange = (cls) => `${fmtTime(cls.start_time)} – ${fmtTime(cls.end_time)}`;

// The class on now, or the next one today.
export function NowNextSection({ today, loading, onPress }) {
  const cls = today?.current || today?.next;
  const isNow = Boolean(today?.current);
  return (
    <HomeSection
      title="Now and next"
      loading={loading}
      empty={!cls}
      emptyProps={{ icon: 'cafe-outline', title: 'No more classes today', actionTitle: 'Open timetable', onAction: onPress }}
    >
      {cls ? (
        <Card onPress={onPress}>
          <View style={styles.rowBetween}>
            <Badge tone={isNow ? 'success' : 'neutral'}>{isNow ? 'Now' : 'Next'}</Badge>
            <Text variant="caption" tone="muted" style={styles.tabular}>{timeRange(cls)}</Text>
          </View>
          <Text variant="heading" style={styles.classTitle}>{cls.subject_name}</Text>
          <View style={styles.metaRow}>
            {cls.professor_name ? <Meta icon="person-outline">{cls.professor_name}</Meta> : null}
            {cls.room ? <Meta icon="location-outline">{cls.room}</Meta> : null}
            {cls.year ? <Meta icon="people-outline">Year {cls.year}</Meta> : null}
          </View>
          {isNow && today?.next ? (
            <Text variant="caption" tone="muted" style={styles.after}>
              Then {today.next.subject_name} at {fmtTime(today.next.start_time)}
            </Text>
          ) : null}
        </Card>
      ) : null}
    </HomeSection>
  );
}

function Meta({ icon, children }) {
  return (
    <View style={styles.meta}>
      <Icon name={icon} size={13} tone="muted" />
      <Text variant="callout" tone="secondary">{children}</Text>
    </View>
  );
}

// Overall attendance and the three subjects most at risk.
export function AttendanceSection({ attendance, loading, onOpen, onOpenSubject }) {
  const lowest = attendance?.lowest || [];
  return (
    <HomeSection
      title="Attendance"
      action="See all"
      onAction={onOpen}
      loading={loading}
      skeletonRows={3}
      empty={attendance?.percentage == null}
      emptyProps={{ icon: 'checkmark-circle-outline', title: 'No attendance yet', message: 'It shows here once classes are marked.' }}
    >
      <Card>
        <View style={styles.attendance}>
          <ProgressRing percent={attendance?.percentage} size={88} stroke={7} />
          <View style={styles.flex}>
            <Text variant="callout" tone="secondary">
              {attendance?.present} of {attendance?.total} classes attended
            </Text>
            {lowest.length ? <Text variant="label" style={styles.lowestLabel}>Lowest</Text> : null}
            {lowest.map((s, i) => (
              <ListItem
                key={s.subject_id}
                title={s.subject_name}
                trailing={<Badge tone={attendanceTone(s.percentage)}>{`${Number(s.percentage)}%`}</Badge>}
                onPress={() => onOpenSubject(s)}
                chevron={false}
                last={i === lowest.length - 1}
              />
            ))}
          </View>
        </View>
      </Card>
    </HomeSection>
  );
}

// Assignments due that the student hasn't submitted.
export function DeadlinesSection({ deadlines, loading, onOpen }) {
  const list = deadlines || [];
  return (
    <HomeSection
      title="Deadlines"
      loading={loading}
      empty={!list.length}
      emptyProps={{ icon: 'checkmark-done-outline', title: 'Nothing due', message: 'Pending assignments show here.' }}
    >
      <Card padded={false} style={styles.inset}>
        {list.map((d, i) => {
          const days = Math.ceil((new Date(d.due_date) - new Date()) / 86400000);
          return (
            <ListItem
              key={d.id}
              leading={<Icon name="clipboard-outline" />}
              title={d.title}
              subtitle={d.subject_name}
              trailing={<Badge tone={days <= 1 ? 'danger' : days <= 3 ? 'warning' : 'neutral'}>{fmtDate(d.due_date, { year: false })}</Badge>}
              onPress={() => onOpen(d)}
              last={i === list.length - 1}
            />
          );
        })}
      </Card>
    </HomeSection>
  );
}

export function NoticesSection({ notices, loading, onOpen }) {
  const list = notices || [];
  return (
    <HomeSection
      title="Notices"
      action="See all"
      onAction={onOpen}
      loading={loading}
      skeletonRows={3}
      empty={!list.length}
      emptyProps={{ icon: 'notifications-outline', title: 'No notices yet' }}
    >
      <Card padded={false} style={styles.inset}>
        {list.map((n, i) => (
          <ListItem
            key={n.id}
            title={n.title}
            subtitle={`${n.posted_by_name || 'College'} · ${relativeTime(n.created_at)}`}
            trailing={n.is_cancelled ? <Badge tone="danger">Cancelled</Badge> : null}
            onPress={onOpen}
            chevron={false}
            last={i === list.length - 1}
          />
        ))}
      </Card>
    </HomeSection>
  );
}

// Two side-by-side figures, e.g. unread messages and fees due.
export function StatTiles({ tiles, loading }) {
  return (
    <View style={[styles.tiles, styles.section]}>
      {tiles.map(t => (
        <Card key={t.label} onPress={t.onPress} style={styles.tile}>
          {loading ? <Skeleton width={56} height={28} /> : <StatNumber value={t.value} label={t.label} tone={t.tone} />}
          {!loading && t.caption ? <Text variant="caption" tone="muted" style={styles.caption}>{t.caption}</Text> : null}
        </Card>
      ))}
    </View>
  );
}

export function QuickLinks({ links, onOpen }) {
  return (
    <View style={styles.section}>
      <SectionLabel>Quick access</SectionLabel>
      <View style={styles.grid}>
        {links.map(link => (
          <Card key={link.label} onPress={() => onOpen(link.screen)} style={styles.gridTile}>
            <Icon name={link.icon} size={22} tone="default" />
            <Text variant="body" style={styles.gridLabel}>{link.label}</Text>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.xxl },
  skeleton: { gap: space.md },
  compactEmpty: { paddingVertical: space.xxl },
  flex: { flex: 1 },
  inset: { paddingHorizontal: space.lg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  classTitle: { marginTop: space.md, marginBottom: space.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 1 },
  after: { marginTop: space.md },
  attendance: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-start' },
  lowestLabel: { marginTop: space.md },
  tiles: { flexDirection: 'row', gap: space.md },
  tile: { flex: 1 },
  caption: { marginTop: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  gridTile: { width: '48.5%', minHeight: 96, justifyContent: 'space-between' },
  gridLabel: { marginTop: space.md },
});

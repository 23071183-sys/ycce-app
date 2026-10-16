import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fmtDate } from '../../utils/format';
import { isNewBadge, rememberNewBadges } from '../../utils/newBadges';
import { radius, space } from '../../theme';
import { Badge, Card, Icon, SectionLabel, Skeleton, StatNumber, Text } from '../../components/ui';

const BADGE_ICONS = {
  perfect_week: 'calendar-outline',
  club_75: 'ribbon-outline',
  early_submitter: 'rocket-outline',
  quiz_master: 'school-outline',
  fest_goer: 'sparkles-outline',
};

// The student's own streaks and badges. Private: shown only on their Profile
// (and the streak chip on their Home), never to anyone else.
export default function ProgressSection({ progress, loading }) {
  const c = useTheme();
  if (!loading && !progress?.streaks) return null;
  const s = progress?.streaks || {};
  rememberNewBadges(progress);
  const badges = progress?.badges || [];

  return (
    <View style={styles.section}>
      <SectionLabel>Your progress</SectionLabel>
      <View style={styles.streaks}>
        {[
          { key: 'lectures', label: 'Lecture streak' },
          { key: 'study', label: 'Study days' },
          { key: 'on_time_submissions', label: 'On time' },
        ].map(item => (
          <Card key={item.key} style={styles.flex}>
            {loading ? <Skeleton width={40} height={28} /> : <StatNumber value={s[item.key] ?? 0} label={item.label} />}
          </Card>
        ))}
      </View>
      <View style={styles.grid}>
        {(loading ? [1, 2, 3, 4] : badges).map((b, i) => (
          loading ? (
            <Card key={i} style={styles.badge}><Skeleton width={32} height={32} rounded={16} /></Card>
          ) : (
            <Card key={b.key} style={[styles.badge, !b.earned && styles.locked]}>
              <View style={[styles.icon, { backgroundColor: b.earned ? c.accentSoft : c.surfaceAlt }]}>
                <Icon name={BADGE_ICONS[b.key] || 'medal-outline'} size={20} tone={b.earned ? 'accent' : 'muted'} />
              </View>
              <Text variant="callout" style={styles.badgeTitle} numberOfLines={1}>{b.title}</Text>
              <Text variant="caption" tone="muted" numberOfLines={3}>
                {b.earned && b.earned_at ? `Earned ${fmtDate(b.earned_at)}` : b.description}
              </Text>
              {isNewBadge(b) ? <Badge tone="accent" style={styles.newBadge}>New</Badge> : null}
            </Card>
          )
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.xxl },
  streaks: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  badge: { width: '48.5%' },
  locked: { opacity: 0.5 },
  icon: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  badgeTitle: { fontWeight: '600' },
  newBadge: { marginTop: space.sm },
});

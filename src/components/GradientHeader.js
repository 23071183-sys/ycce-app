import React from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { GradientFill } from './brand';
import { brand, radius, space, type } from '../theme';

// A full-bleed hero banner in a brand gradient: logo, title, tagline and an
// optional row of stats. Text is always white, since the gradient is the same
// in light and dark mode. Place it first inside a padded Screen; it pulls
// itself out to the screen edges.
export default function GradientHeader({ brandKey, logo, title, tagline, stats, bleed = space.lg }) {
  const g = brand[brandKey];
  return (
    <GradientFill
      from={g.from}
      to={g.to}
      radii={{ bl: CORNER, br: CORNER }}
      style={[styles.wrap, { marginHorizontal: -bleed, marginTop: -bleed, paddingHorizontal: bleed + space.xs }]}
    >
      <View style={styles.row}>
        {logo}
        <View style={styles.text}>
          <RNText style={[type.title, styles.title]}>{title}</RNText>
          {tagline ? <RNText style={[type.callout, styles.tagline]}>{tagline}</RNText> : null}
        </View>
      </View>
      {stats?.length ? (
        <View style={styles.stats}>
          {stats.map(s => (
            <View key={s.label} style={styles.stat}>
              <RNText style={[type.numeric, styles.statValue]}>{s.value}</RNText>
              <RNText style={[type.label, styles.statLabel]}>{s.label}</RNText>
            </View>
          ))}
        </View>
      ) : null}
    </GradientFill>
  );
}

const CORNER = radius.xl + 8;

const styles = StyleSheet.create({
  wrap: {
    paddingTop: space.xxl,
    paddingBottom: space.xxl,
    marginBottom: space.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  text: { flex: 1 },
  title: { color: brand.onBrand, fontWeight: '700' },
  tagline: { color: brand.onBrandMuted, marginTop: 2 },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  stat: {
    flex: 1,
    backgroundColor: brand.onBrandFaint,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
  },
  statValue: { color: brand.onBrand, fontSize: 24, lineHeight: 28 },
  statLabel: { color: brand.onBrandMuted, marginTop: 2 },
});

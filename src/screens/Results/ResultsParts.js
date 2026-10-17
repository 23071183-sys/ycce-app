import React, { useRef } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { GradientFill } from '../../components/brand';
import { nextSvgId } from '../../components/brand/svgId';
import Monogram from '../../components/Monogram';
import { Badge, Card, ProgressRing, Text } from '../../components/ui';
import { brand, gradeTone, hueColors, radius, space, type } from '../../theme';

// The gradient hero: this semester's SGPA on the left, CGPA as a ring out of
// 10 on the right. White on the gradient in both themes.
export function CgpaHero({ sgpa, cgpa, semester, semesters }) {
  const g = brand.results;
  const cg = cgpa != null ? Number(cgpa) : null;
  return (
    <GradientFill from={g.from} to={g.to} radius={radius.lg} style={styles.hero}>
      <View style={styles.flex}>
        <RNText style={[type.label, styles.heroLabel]}>Semester {semester} SGPA</RNText>
        <RNText style={[type.display, styles.heroValue]}>{sgpa ?? '—'}</RNText>
        <RNText style={[type.caption, styles.heroCaption]}>
          {cg != null ? `CGPA across ${semesters} semester${semesters === 1 ? '' : 's'}` : 'CGPA appears once results are declared'}
        </RNText>
      </View>
      <ProgressRing
        percent={cg != null ? cg * 10 : 0}
        size={104}
        stroke={8}
        color={brand.onBrand}
        trackColor={brand.onBrandFaint}
        textColor={brand.onBrand}
        valueText={cg != null ? cg.toFixed(2) : '—'}
        label="CGPA"
      />
    </GradientFill>
  );
}

const BAR_HEIGHT = 84;

// SGPA for each semester as a small bar out of 10; the selected one is solid.
export function SgpaBars({ list, selected }) {
  const c = useTheme();
  const id = useRef(nextSvgId('sg')).current;
  const g = brand.results;
  return (
    <Card style={styles.bars}>
      {list.map(s => {
        const v = Math.max(0, Math.min(10, Number(s.sgpa) || 0));
        const h = Math.max(4, (v / 10) * BAR_HEIGHT);
        const active = s.semester === selected;
        return (
          <View key={s.semester} style={styles.barCol}>
            <Text variant="caption" tone={active ? 'default' : 'muted'} style={styles.barValue}>{s.sgpa}</Text>
            <Svg width={22} height={BAR_HEIGHT}>
              <Defs>
                <LinearGradient id={`${id}-${s.semester}`} x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={g.from} />
                  <Stop offset="1" stopColor={g.to} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="22" height={BAR_HEIGHT} rx="6" fill={c.surfaceAlt} />
              <Rect
                x="0"
                y={BAR_HEIGHT - h}
                width="22"
                height={h}
                rx="6"
                fill={`url(#${id}-${s.semester})`}
                opacity={active ? 1 : 0.45}
              />
            </Svg>
            <Text variant="label" style={[styles.barLabel, active && { color: c.text }]}>S{s.semester}</Text>
          </View>
        );
      })}
    </Card>
  );
}

// A grade pill in its gradeTone hue (neutral when the grade is blank or unknown).
export function GradeBadge({ grade, failed }) {
  const c = useTheme();
  const hue = gradeTone(grade) || (failed ? 'rose' : null);
  if (!hue) return <Badge style={styles.grade}>{grade || '—'}</Badge>;
  const { fg, soft } = hueColors(c, hue);
  return (
    <View style={[styles.grade, styles.gradePill, { backgroundColor: soft }]}>
      <Text variant="callout" style={[styles.gradeText, { color: fg }]}>{grade || '—'}</Text>
    </View>
  );
}

// One subject on the grade sheet. breakdown is markBreakdown(r), shown as is.
export function ResultRow({ r, breakdown, last }) {
  const c = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Monogram name={r.subject_name} colorKey={r.subject_id} size={38} />
      <View style={styles.flex}>
        <Text variant="callout" style={styles.subject}>{r.subject_name}</Text>
        <Text variant="caption" tone="muted" style={styles.marks}>
          {[r.subject_code, `Int ${r.internal_marks ?? '—'}`, `Ext ${r.external_marks ?? '—'}`].filter(Boolean).join(' · ')}
        </Text>
        {breakdown ? <Text variant="caption" tone="muted" style={styles.breakdown}>{breakdown}</Text> : null}
      </View>
      <GradeBadge grade={r.grade} failed={r.result === 'Fail'} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.xl, marginBottom: space.xxl },
  heroLabel: { color: brand.onBrandMuted },
  heroValue: { color: brand.onBrand, marginTop: space.xs },
  heroCaption: { color: brand.onBrandMuted, marginTop: space.xs },
  bars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: space.xxl },
  barCol: { alignItems: 'center', gap: space.xs },
  barValue: { fontVariant: ['tabular-nums'], fontWeight: '600' },
  barLabel: { marginTop: 2 },
  grade: { minWidth: 40, alignItems: 'center' },
  gradePill: { borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 3 },
  gradeText: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  subject: { fontWeight: '600' },
  marks: { marginTop: 2, fontVariant: ['tabular-nums'] },
  breakdown: { marginTop: 3 },
});

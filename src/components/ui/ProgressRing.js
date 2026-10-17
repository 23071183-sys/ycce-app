import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Text from './Text';
import { useTheme } from '../../context/ThemeContext';
import { attendanceTone, toneColors } from '../../theme';

// A circular percentage, coloured by the attendance thresholds unless a tone is
// given. The track uses the theme so it works in light and dark mode. On a
// gradient, pass color / trackColor / textColor (e.g. white), and valueText to
// show something other than the percentage (e.g. a CGPA).
export default function ProgressRing({
  percent = 0, size = 96, stroke = 8, tone, label, showValue = true, color, trackColor, textColor, valueText,
}) {
  const c = useTheme();
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const fg = color || toneColors(c, tone || attendanceTone(pct)).fg;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor || c.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fg}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showValue ? (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={{ fontSize: size * 0.24, fontWeight: '300', color: textColor || c.text, fontVariant: ['tabular-nums'] }}>
            {valueText ?? `${Math.round(pct)}%`}
          </Text>
          {label ? <Text variant="label" style={[{ fontSize: 9 }, textColor && { color: textColor, opacity: 0.8 }]}>{label}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});

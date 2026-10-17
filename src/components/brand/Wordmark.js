import React from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// A logo mark with its name beside it.
export default function Wordmark({ mark, text, size, color, sub }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      {mark}
      <View style={{ marginLeft: size * 0.28 }}>
        <RNText style={[styles.text, { fontSize: size * 0.36, color: color || c.text, letterSpacing: size * 0.04 }]}>{text}</RNText>
        {sub ? (
          <RNText style={[styles.sub, { fontSize: size * 0.2, color: color || c.textMuted }]}>{sub}</RNText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '800', includeFontPadding: false },
  sub: { fontWeight: '500', opacity: 0.8, marginTop: 1, letterSpacing: 0.4 },
});

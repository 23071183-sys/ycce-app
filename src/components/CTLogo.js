import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Inverted tile: text-coloured fill, background-coloured lettering, so it reads
// as black-on-white in light mode and white-on-black in dark mode.
export default function CTLogo({ size = 40 }) {
  const c = useTheme();
  return (
    <View style={{
      width: size,
      height: size,
      backgroundColor: c.text,
      borderRadius: size * 0.22,
      borderWidth: size * 0.045,
      borderColor: c.bg,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{
        color: c.bg,
        fontSize: size * 0.36,
        fontWeight: '700',
        letterSpacing: size * 0.03,
        includeFontPadding: false,
      }}>CT</Text>
    </View>
  );
}

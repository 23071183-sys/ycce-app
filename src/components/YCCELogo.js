import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Same inverted tile as CTLogo, wider for the four letters.
export default function YCCELogo({ size = 48 }) {
  const c = useTheme();
  return (
    <View style={{
      width: size * 1.6,
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
        fontSize: size * 0.3,
        fontWeight: '700',
        letterSpacing: size * 0.04,
        includeFontPadding: false,
      }}>YCCE</Text>
    </View>
  );
}

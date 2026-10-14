import React from 'react';
import { View, Text } from 'react-native';

export default function YCCELogo({ size = 48 }) {
  return (
    <View style={{
      width: size * 1.6,
      height: size,
      backgroundColor: '#000',
      borderRadius: size * 0.22,
      borderWidth: size * 0.045,
      borderColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{
        color: '#fff',
        fontSize: size * 0.3,
        fontWeight: '700',
        letterSpacing: size * 0.04,
        includeFontPadding: false,
      }}>YCCE</Text>
    </View>
  );
}

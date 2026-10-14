import React from 'react';
import { View, Text } from 'react-native';

export default function CTLogo({ size = 40 }) {
  return (
    <View style={{
      width: size,
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
        fontSize: size * 0.36,
        fontWeight: '700',
        letterSpacing: size * 0.03,
        includeFontPadding: false,
      }}>CT</Text>
    </View>
  );
}

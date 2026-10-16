import React from 'react';
import { View } from 'react-native';
import Text from './Text';

// A large, light-weight figure with a small label under it, e.g. "82%"
// "ATTENDANCE". size="display" for the hero number on a screen.
export default function StatNumber({ value, label, tone, size = 'numeric', style }) {
  return (
    <View style={style}>
      <Text variant={size} tone={tone}>{value}</Text>
      {label ? <Text variant="label" style={{ marginTop: 4 }}>{label}</Text> : null}
    </View>
  );
}

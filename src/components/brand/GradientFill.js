import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { nextSvgId } from './svgId';

// A view whose background is a linear gradient, drawn with react-native-svg
// (expo-linear-gradient isn't in the shipped APKs). Children sit on top.
// direction: 'diagonal' (top-left to bottom-right), 'horizontal' or 'vertical'.
const VECTORS = {
  diagonal: { x1: '0', y1: '0', x2: '1', y2: '1' },
  horizontal: { x1: '0', y1: '0', x2: '1', y2: '0' },
  vertical: { x1: '0', y1: '0', x2: '0', y2: '1' },
};

export default function GradientFill({ from, to, direction = 'diagonal', radius = 0, style, children, ...rest }) {
  const id = useRef(nextSvgId('gf')).current;
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]} {...rest}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} {...VECTORS[direction]}>
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

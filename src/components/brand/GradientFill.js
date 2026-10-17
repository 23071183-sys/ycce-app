import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { nextSvgId } from './svgId';

// A view whose background is a linear gradient, drawn with react-native-svg
// (expo-linear-gradient isn't in the shipped APKs). Children sit on top.
// direction: 'diagonal' (top-left to bottom-right), 'horizontal' or 'vertical'.
// radius rounds every corner; radii = { tl, tr, br, bl } rounds them one by
// one. The rounded shape is drawn in the SVG itself, because Android doesn't
// always clip an SVG child to a view's rounded corners.
const VECTORS = {
  diagonal: { x1: '0', y1: '0', x2: '1', y2: '1' },
  horizontal: { x1: '0', y1: '0', x2: '1', y2: '0' },
  vertical: { x1: '0', y1: '0', x2: '0', y2: '1' },
};

const roundedRect = (w, h, { tl = 0, tr = 0, br = 0, bl = 0 }) => {
  const k = (r) => Math.max(0, Math.min(r, w / 2, h / 2));
  const [a, b, c, d] = [k(tl), k(tr), k(br), k(bl)];
  return [
    `M${a} 0`, `H${w - b}`, `A${b} ${b} 0 0 1 ${w} ${b}`,
    `V${h - c}`, `A${c} ${c} 0 0 1 ${w - c} ${h}`,
    `H${d}`, `A${d} ${d} 0 0 1 0 ${h - d}`,
    `V${a}`, `A${a} ${a} 0 0 1 ${a} 0`, 'Z',
  ].join(' ');
};

export default function GradientFill({ from, to, direction = 'diagonal', radius = 0, radii, style, children, onLayout, ...rest }) {
  const id = useRef(nextSvgId('gf')).current;
  const [size, setSize] = useState(null);
  const corners = radii || { tl: radius, tr: radius, br: radius, bl: radius };
  return (
    <View
      style={[
        {
          borderTopLeftRadius: corners.tl || 0,
          borderTopRightRadius: corners.tr || 0,
          borderBottomRightRadius: corners.br || 0,
          borderBottomLeftRadius: corners.bl || 0,
          overflow: 'hidden',
        },
        style,
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!size || size.width !== width || size.height !== height) setSize({ width, height });
        onLayout?.(e);
      }}
      {...rest}
    >
      {size ? (
        <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} {...VECTORS[direction]}>
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Path d={roundedRect(size.width, size.height, corners)} fill={`url(#${id})`} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

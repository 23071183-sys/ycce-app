import React, { useRef } from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { brand } from '../../theme';
import { nextSvgId } from './svgId';
import Wordmark from './Wordmark';

// OFFICIAL ARTWORK SWAP POINT
// When the official Yash Fest logo arrives, save it as assets/brand/yash.png
// (square, transparent background, at least 512px) and replace null below with
// require('../../../assets/brand/yash.png'). Metro needs a static require,
// so this is a one-line edit rather than a file-exists check.
const OFFICIAL = null;

// A sunburst: twelve rays, every other one shorter, around the centre of the
// 64-unit box.
const sunburst = (n, outer, inner, cx = 32, cy = 32) => {
  const d = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : i % 4 === 0 ? outer : outer - 5;
    const a = (Math.PI / n) * i - Math.PI / 2;
    d.push(`${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `${d.join(' ')} Z`;
};
const RAYS = sunburst(12, 23, 13);

// Designed mark: a sunset gradient with a white sunburst, a ring of the
// gradient showing through around its core.
export function YashMark({ size = 40 }) {
  const id = useRef(nextSvgId('ya')).current;
  if (OFFICIAL) return <Image source={OFFICIAL} style={{ width: size, height: size, borderRadius: size * 0.24 }} />;
  const g = brand.yash;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={g.from} />
          <Stop offset="1" stopColor={g.to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="64" height="64" rx="15" fill={`url(#${id})`} />
      <Path d={RAYS} fill={brand.onBrand} />
      <Circle cx="32" cy="32" r="9.5" fill={`url(#${id})`} />
      <Circle cx="32" cy="32" r="6" fill={brand.onBrand} />
    </Svg>
  );
}

export default function YashLogo({ size = 40, withText = false, color, sub }) {
  const mark = <YashMark size={size} />;
  return withText ? <Wordmark mark={mark} text="YASH" size={size} color={color} sub={sub} /> : mark;
}

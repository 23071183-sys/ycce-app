import React, { useRef } from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { brand } from '../../theme';
import { nextSvgId } from './svgId';
import Wordmark from './Wordmark';

// OFFICIAL ARTWORK SWAP POINT
// When the official Compufest logo arrives, save it as assets/brand/compufest.png
// (square, transparent background, at least 512px) and replace null below with
// require('../../../assets/brand/compufest.png'). Every screen then shows the
// official art instead of this drawn mark. Metro needs a static require, which
// is why this is a one-line edit rather than a file-exists check.
const OFFICIAL = null;

// Designed mark: the Compufest gradient in a rounded square, a white </> and
// small circuit traces in two corners.
export function CompufestMark({ size = 40 }) {
  const id = useRef(nextSvgId('cf')).current;
  if (OFFICIAL) return <Image source={OFFICIAL} style={{ width: size, height: size, borderRadius: size * 0.24 }} />;
  const g = brand.compufest;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={g.from} />
          <Stop offset="1" stopColor={g.to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="64" height="64" rx="15" fill={`url(#${id})`} />
      {/* circuit traces */}
      <G stroke={brand.onBrand} strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <Path d="M8 15 H16 L20 19" />
        <Path d="M56 49 H48 L44 45" />
        <Path d="M50 8 V14" />
        <Path d="M14 56 V50" />
      </G>
      <G fill={brand.onBrand} fillOpacity="0.7">
        <Circle cx="8" cy="15" r="2" />
        <Circle cx="56" cy="49" r="2" />
        <Circle cx="50" cy="8" r="1.8" />
        <Circle cx="14" cy="56" r="1.8" />
      </G>
      {/* </> */}
      <G stroke={brand.onBrand} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M23 23 L14 32 L23 41" />
        <Path d="M41 23 L50 32 L41 41" />
        <Path d="M35.5 19 L28.5 45" />
      </G>
    </Svg>
  );
}

export default function CompufestLogo({ size = 40, withText = false, color, sub }) {
  const mark = <CompufestMark size={size} />;
  return withText ? <Wordmark mark={mark} text="COMPUFEST" size={size} color={color} sub={sub} /> : mark;
}

import React, { useRef } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { brand } from '../../theme';
import { nextSvgId } from './svgId';

// The CT Assistant's avatar: a gradient circle with a white chat bubble and a
// sparkle inside it.
export default function AssistantLogo({ size = 32 }) {
  const id = useRef(nextSvgId('as')).current;
  const g = brand.assistant;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={g.from} />
          <Stop offset="1" stopColor={g.to} />
        </LinearGradient>
      </Defs>
      <Circle cx="32" cy="32" r="32" fill={`url(#${id})`} />
      {/* bubble with a tail at the bottom left */}
      <Path
        d="M20 16 H44 A8 8 0 0 1 52 24 V38 A8 8 0 0 1 44 46 H28 L19 53 V45.5 A8 8 0 0 1 12 38 V24 A8 8 0 0 1 20 16 Z"
        fill={brand.onBrand}
      />
      {/* four-point sparkle */}
      <Path
        d="M32 21 C33 27 34 29 40 31 C34 33 33 35 32 41 C31 35 30 33 24 31 C30 29 31 27 32 21 Z"
        fill={`url(#${id})`}
      />
      <Circle cx="42.5" cy="22.5" r="2.2" fill={g.to} />
    </Svg>
  );
}

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme';

// A pulsing grey block that holds the shape of content while it loads.
export default function Skeleton({ width = '100%', height = 14, rounded = radius.sm, style }) {
  const c = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: c.surfaceAlt, opacity }, style]}
    />
  );
}

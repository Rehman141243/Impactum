import React, { useEffect } from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Base shimmering block. Pulses opacity to imply a loading state.
 * Uses brand-neutral surface colors so it reads correctly in
 * both light and dark mode via nativewind classes.
 */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: SkeletonBlockProps) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <AnimatedView
      className="bg-gray-200 dark:bg-gray-700"
      style={[
        { width, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}

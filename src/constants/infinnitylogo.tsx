import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);


const LEFT_LOOP = 'M100,50 C100,28 84,12 62,12 C40,12 24,28 24,50 C24,72 40,88 62,88 C84,88 100,72 100,50';
const RIGHT_LOOP = 'M100,50 C100,72 116,88 138,88 C160,88 176,72 176,50 C176,28 160,12 138,12 C116,12 100,28 100,50';


const LOOP_LENGTH = 215;

type Props = {
  size?: number;
  color?: string;

  speed?: 'normal' | 'fast';
} & (
  | {
   
      mode?: 'once';
  
      onDone?: () => void;
    }
  | {
 
      mode: 'loop';
      onDone?: never;
    }
);

export default function AnimatedInfinityLogo({
  size = 96,
  color = '#FFFFFF',
  speed = 'normal',
  mode = 'once',
  onDone,
}: Props) {
  const leftOffset = useRef(new Animated.Value(LOOP_LENGTH)).current;
  const rightOffset = useRef(new Animated.Value(LOOP_LENGTH)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const traceDuration = speed === 'fast' ? 560 : 820;

  useEffect(() => {

    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    if (mode === 'loop') {
 
      const forward = Animated.parallel([
        Animated.timing(leftOffset, {
          toValue: 0,
          duration: traceDuration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(rightOffset, {
          toValue: 0,
          duration: traceDuration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]);

      const backward = Animated.parallel([
        Animated.timing(leftOffset, {
          toValue: LOOP_LENGTH,
          duration: traceDuration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(rightOffset, {
          toValue: LOOP_LENGTH,
          duration: traceDuration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]);

      const cycle = Animated.loop(
        Animated.sequence([
          forward,
          Animated.delay(180),
          backward,
          Animated.delay(180),
        ]),
      );

      cycle.start();
      return () => cycle.stop();
    }

  
    Animated.parallel([
      Animated.timing(leftOffset, {
        toValue: 0,
        duration: traceDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(rightOffset, {
        toValue: 0,
        duration: traceDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: traceDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onDone?.());
  }, [mode]);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Svg width={size} height={size / 2} viewBox="0 0 200 100">
   
        <AnimatedPath
          d={LEFT_LOOP}
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={LOOP_LENGTH}
          strokeDashoffset={leftOffset}
        />
        <AnimatedPath
          d={RIGHT_LOOP}
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={LOOP_LENGTH}
          strokeDashoffset={rightOffset}
        />
      </Svg>
    </Animated.View>
  );
}

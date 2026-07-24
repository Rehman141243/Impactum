import React, { useEffect, useCallback, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { ToastType } from '../../context/ToastContext';
import { useResponsive } from '../../utils/responsive';

const TOAST_THEME: Record<
  ToastType,
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: '#EAF9F0',
    border: '#34C759',
    text: '#1F8A42',
    icon: '#34C759',
  },
  warning: {
    bg: '#FFF6E8',
    border: '#FF9F0A',
    text: '#C76A00',
    icon: '#FF9F0A',
  },
  error: {
    bg: '#FFEFEF',
    border: '#FF3B30',
    text: '#C62828',
    icon: '#FF3B30',
  },
  info: {
    bg: '#EEF4FF',
    border: '#007AFF',
    text: '#0056C7',
    icon: '#007AFF',
  },
};

interface IconProps {
  color: string;
  size: number;
  glyphSize: number;
}

function SuccessIcon({ color, size, glyphSize }: IconProps) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.iconGlyph, { fontSize: glyphSize }]}>✓</Text>
    </View>
  );
}

function ErrorIcon({ color, size, glyphSize }: IconProps) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.iconGlyph, { fontSize: glyphSize }]}>✕</Text>
    </View>
  );
}

function WarningIcon({ color, size, glyphSize }: IconProps) {
  const svgW = size + 4;
  const svgH = size + 2;
  return (
    <View style={{ width: svgW, height: svgH, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={svgW} height={svgH} viewBox="0 0 30 28">
        <Path
          d="M15 2.5L28.5 25.5H1.5L15 2.5Z"
          fill={color}
          stroke={color}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={[styles.warningMark, { fontSize: glyphSize, marginTop: size * 0.12 }]}>!</Text>
    </View>
  );
}

function InfoIcon({ color, size, glyphSize }: IconProps) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.iconGlyph, { fontSize: glyphSize }]}>i</Text>
    </View>
  );
}

interface Props {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
  duration?: number;
}

export default function SwipeableToast({
  id,
  message,
  type,
  onDismiss,
  duration = 3500,
}: Props) {
  const r = useResponsive();
  const theme = TOAST_THEME[type];

  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const dismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 180 });
    scale.value = withTiming(0.9, { duration: 200 }, finished => {
      if (finished) {
        runOnJS(onDismiss)(id);
      }
    });
  }, [id, onDismiss, opacity, scale]);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 260, mass: 0.85 });
    opacity.value = withTiming(1, { duration: 220 });

    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, [dismiss, duration, opacity, scale]);

  const pan = Gesture.Pan()
    .onUpdate(event => {
      dragX.value = event.translationX;
      dragY.value = event.translationY;
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      opacity.value = Math.max(0.35, 1 - distance / 140);
      scale.value = Math.max(0.92, 1 - distance / 400);
    })
    .onEnd(event => {
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      const velocity = Math.sqrt(event.velocityX ** 2 + event.velocityY ** 2);

      if (distance > 48 || velocity > 500) {
        runOnJS(dismiss)();
      } else {
        dragX.value = withSpring(0, { damping: 16, stiffness: 220 });
        dragY.value = withSpring(0, { damping: 16, stiffness: 220 });
        scale.value = withSpring(1, { damping: 16, stiffness: 220 });
        opacity.value = withTiming(1, { duration: 150 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value },
      { translateY: dragY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const iconProps = useMemo(
    () => ({ color: theme.icon, size: r.iconSize, glyphSize: r.iconGlyphSize }),
    [theme.icon, r.iconSize, r.iconGlyphSize],
  );

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon {...iconProps} />;
      case 'warning':
        return <WarningIcon {...iconProps} />;
      case 'error':
        return <ErrorIcon {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        pointerEvents="box-none"
        style={[{ width: r.toastWidth, maxWidth: '100%' }, animatedStyle]}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: theme.bg,
              borderColor: theme.border,
              paddingVertical: r.toastPaddingV,
              paddingHorizontal: r.toastPaddingH,
              minHeight: r.toastMinHeight,
              gap: Math.round(10 * r.scale),
            },
          ]}>
          {renderIcon()}
          <Text
            style={[
              styles.message,
              {
                color: theme.text,
                fontSize: r.toastFontSize,
                lineHeight: r.toastLineHeight,
              },
            ]}
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            {message}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',

    borderWidth: 1,
    borderRadius: 9,
  },
  message: {
    flex: 1,
    flexShrink: 1,
    fontFamily: 'DMSans-Medium',
    paddingTop:3,
    letterSpacing: 0.1,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconGlyph: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: Platform.OS === 'ios' ? -1 : 0,
  },
  warningMark: {
    position: 'absolute',
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

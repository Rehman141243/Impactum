import React, { useEffect } from "react";
import { View, Image, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

const AnimatedView = Animated.createAnimatedComponent(View);

const GLOW_COLOR = "#00E5FF";

function GlowHalo({ size }: { size: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.1 }],
  }));

  if (Platform.OS === "android") {
  
    const glowSize = size * 1.7;
    const offset = -(glowSize - size) / 2;

    return (
      <AnimatedView
        pointerEvents="none"
        style={[
          { position: "absolute", width: glowSize, height: glowSize, top: offset, left: offset },
          animatedStyle,
        ]}>
        <Svg width={glowSize} height={glowSize}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={GLOW_COLOR} stopOpacity={0.55} />
              <Stop offset="30%" stopColor={GLOW_COLOR} stopOpacity={0.4} />
              <Stop offset="55%" stopColor={GLOW_COLOR} stopOpacity={0.2} />
              <Stop offset="80%" stopColor={GLOW_COLOR} stopOpacity={0.05} />
              <Stop offset="100%" stopColor={GLOW_COLOR} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={glowSize}
            height={glowSize}
            rx={size * 0.22}
            ry={size * 0.22}
            fill="url(#glow)"
          />
        </Svg>
      </AnimatedView>
    );
  }

  const haloSize = size * (32 / 42);

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize * 0.22,
          top: -(haloSize - size) / 2,
          left: -(haloSize - size) / 2,
        },
        animatedStyle,
      ]}>
      <View
        style={{
          position: "absolute",
          width: haloSize * 1.35,
          height: haloSize * 1.35,
          borderRadius: haloSize * 1.35 * 0.22,
          top: -(haloSize * 0.35) / 2,
          left: -(haloSize * 0.35) / 2,
          backgroundColor: GLOW_COLOR,
          opacity: 0.1,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize * 0.22,
          backgroundColor: GLOW_COLOR,
          opacity: 0.16,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: haloSize * 0.65,
          height: haloSize * 0.65,
          borderRadius: haloSize * 0.65 * 0.22,
          top: (haloSize - haloSize * 0.75) / 2,
          left: (haloSize - haloSize * 0.75) / 2,
          backgroundColor: GLOW_COLOR,
          opacity: 0.22,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: haloSize * 0.25,
          height: haloSize * 0.25,
          borderRadius: haloSize * 0.25 * 0.22,
          top: (haloSize - haloSize * 0.55) / 2,
          left: (haloSize - haloSize * 0.55) / 2,
          backgroundColor: GLOW_COLOR,
          opacity: 0.2,
        }}
      />
    </AnimatedView>
  );
}

export default function BrandIcon({ size = 42 }: { size?: number }) {
  return (
    <View style={[styles.glowWrap, { width: size, height: size }]}>
      <GlowHalo size={size} />
      <Image
        source={require("../../../assets/logo1.png")}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.11,
        }}
        resizeMode="contain"
        accessibilityLabel="IMPACTUM logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: GLOW_COLOR,
        shadowOpacity: 0.7,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 12,
        shadowColor: GLOW_COLOR,
      },
    }),
  },
});
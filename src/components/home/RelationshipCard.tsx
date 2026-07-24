
import React, { useEffect } from 'react';
import { Text, View, Pressable, TouchableOpacity, Platform } from 'react-native';
import { Star, MessageCircle } from 'lucide-react-native';
import AppText from '../common/AppText';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  cancelAnimation,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { useToast } from '../../context/ToastContext';

export interface RelationshipItem {
  id: string;
  initial: string;
  name: string;
  ringColor: string;
  statusColor: string;
  harmony: number;
  rating: number;
  leftTag: string;
  rightTag: string;
  leftTagBg: string;
  rightTagBg: string;
  relationshipType?: string;
  status?: string;
  unreadCount?: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          color="#C9A84C"
          fill={i < rating ? '#C9A84C' : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);


function OrbitingDot({
  size,
  color,
  dotSize = 6,
  duration = 7000,
}: {
  size: number;
  color: string;
  dotSize?: number;
  duration?: number;
}) {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(angle);
  }, [duration]);

  const orbitRadius = size / 2;

  const animatedStyle = useAnimatedStyle(() => {
    const rad = (angle.value * Math.PI) / 180;
    const x = orbitRadius * Math.cos(rad);
    const y = orbitRadius * Math.sin(rad);
    return {
      transform: [
        { translateX: x - dotSize / 2 },
        { translateY: y - dotSize / 2 },
      ],
    };
  });

  return (
    <AnimatedView
      pointerEvents="none"
      className="absolute top-1/2 left-1/2 z-10 border-[1.5px] border-brand-bgCardMain"
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          elevation: 10,
        },
        animatedStyle,
      ]}
    />
  );
}

function AvatarBubble({
  initial,
  ringColor,
  statusColor,
  delay = 0,
}: {
  initial: string;
  ringColor: string;
  statusColor: string;
  delay?: number;
}) {
  const size = 52;

  const haloSize = Platform.OS === 'android' ? size * 2.6 : size * 2;

  const scale = useSharedValue(0.85);
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 120 }));
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(pulse);
  }, []);

  const avatarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.4,
    transform: [{ scale: 0.96 + pulse.value * 0.08 }],
  }));

  return (
    <AnimatedView
      className="mr-3 items-center justify-center"
      style={[{ width: size, height: size }, avatarAnimStyle]}>
      {/* Glow halo — mirrors AvatarCircle on the detail screen */}
      <AnimatedView
        pointerEvents="none"
        className="absolute"
        style={[{ width: haloSize, height: haloSize }, haloStyle]}>
        <Svg width={haloSize} height={haloSize}>
          <Defs>
            <RadialGradient id="cardAvatarGlow">
              <Stop
                offset="0%"
                stopColor={statusColor}
                stopOpacity={Platform.OS === 'android' ? 0.55 : 0.4}
              />
              <Stop
                offset="45%"
                stopColor={statusColor}
                stopOpacity={Platform.OS === 'android' ? 0.22 : 0.14}
              />
              <Stop offset="100%" stopColor={statusColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={haloSize / 2} cy={haloSize / 2} r={haloSize / 2} fill="url(#cardAvatarGlow)" />
        </Svg>
      </AnimatedView>

      {/* Outer faint ring */}
      <View
        className="absolute rounded-full border"
        style={{
          width: size + 6,
          height: size + 6,
          borderColor: ringColor + '35',
        }}
      />

      {/* Inner ring + face */}
      <View
        className="items-center justify-center rounded-full border-2 dark:bg-[#18243D]"
        style={{
          width: size,
          height: size,
          borderColor: ringColor,
          ...Platform.select({
            ios: {
              shadowColor: statusColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 8,
            },
            android: {
       
              elevation: 0,
            },
          }),
        }}>
        <Text className="font-sansSemiBold text-body-lg text-brand-textPrimary">
          {initial}
        </Text>
      </View>

      {/* Status dot, kept for a crisp readable indicator alongside the orbit */}
      <View
        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-brand-bgCardMain"
        style={{ backgroundColor: statusColor }}
      />
    </AnimatedView>
  );
}

function ChatIconButton({
  isAccepted,
  unreadCount = 0,
  onPress,
}: {
  isAccepted: boolean;
  unreadCount?: number;
  onPress: () => void;
}) {
  const hasUnread = isAccepted && unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`ml-2 h-9 w-9 items-center justify-center rounded-full ${
        isAccepted ? 'bg-brand-iconStroke opacity-100' : 'bg-brand-border opacity-60'
      }`}>
      <MessageCircle size={17} color={isAccepted ? '#FFFFFF' : '#64748B'} strokeWidth={2} />

      {hasUnread && (
        <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 border-2 border-brand-bgCardMain bg-red-500">
          <Text className="font-sansSemiBold text-[10px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
} 

export default function RelationshipCard({
  item,
  onPress,
  onChatPress,
  index = 0,
}: {
  item: RelationshipItem;
  onPress?: () => void;
  onChatPress?: () => void;
  index?: number;
}) {
  const isAccepted = item.status === 'accepted';

  const pressScale = useSharedValue(1);

  const pressAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.96, { duration: 80 });
  };
  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const { showWarning } = useToast();

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(450)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
 
        className="bg-brand-bgCardMain border border-brand-borderSoft rounded-2xl p-4 mb-3">

        <View className="flex-row items-start"
         style={[
          pressAnimStyle,
          {
            shadowColor: item.statusColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 1,
          },
        ]}>
          <AvatarBubble
            initial={item.initial}
            ringColor={item.ringColor}
            statusColor={item.statusColor}
            delay={index * 80}
          />

          <Animated.View
            entering={FadeIn.delay(index * 80 + 150).duration(350)}
            className="flex-1 flex-row items-start">
            <View className="flex-1">
              <AppText className="font-sansSemiBold text-body-lg text-brand-textPrimary">
                {item.name}
              </AppText>
              <View className="flex-row items-center mt-1 gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.statusColor }} />
                <AppText className="font-sansMedium text-caption text-brand-textMuted uppercase tracking-widest">
                  {item.relationshipType ?? 'Connection'}
                </AppText>
              </View>
            </View>

            <View className="items-end flex-row">
              {item.harmony > 0 && (
                <View className="items-end mr-1">
                  <Text className="font-heading text-display-lg text-brand-gold leading-tight">
                    {item.harmony}
                  </Text>
                  <AppText className="font-sansMedium text-[10px] text-brand-textMuted uppercase tracking-widest mt-0.5">
                    Harmony
                  </AppText>
                </View>
              )}

              <ChatIconButton
                isAccepted={isAccepted}
                unreadCount={item.unreadCount}
                onPress={() => {
                  if (!isAccepted) {
                    showWarning('Chat will be unavailable until your Partner accept your invite');
                    return;
                  }
                  onChatPress?.();
                }}
              />
            </View>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeIn.delay(index * 80 + 150).duration(350)}
          className="flex-row items-center justify-between mt-4">
          <StarRating rating={item.rating} />
          <View className="flex-row gap-2">
            <View className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700" >
              <AppText className="font-sansMedium text-[11px]  dark:text-white">{item.leftTag}</AppText>
            </View>
            <View className={`px-3 py-1 rounded-full  ${
                  isAccepted ? ' bg-green-200 dark:bg-green-100' : ' bg-yellow-100 dark:bg-yellow-50'
            }`} >
              <AppText
                className={`font-sansMedium text-[11px] ${
                  isAccepted ? 'text-green-500' : 'text-brand-gold'
                }`}>
                {item.rightTag}
              </AppText>
            </View>
          </View>
        </Animated.View>

      </AnimatedPressable>
    </Animated.View>
  );
}
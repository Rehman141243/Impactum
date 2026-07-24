


import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  Pressable,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ArrowLeft, Send, Trash2, Sparkle, Crown, MessageCircleHeart, Calendar } from 'lucide-react-native';
import AppText from '../../components/common/AppText';
import { apiClient } from '../../utils/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from './homennavigator';
import { MainTabParamList } from '../../navigation/MainTabNavigator'; // ⚠️ path apne project ke mutabiq check karlena
import Svg, { Defs, LinearGradient, Stop, Circle, RadialGradient, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,

  withDelay,
  withSpring,
  Easing,
  
  FadeInDown,
  FadeInUp,
 
  cancelAnimation,
} from 'react-native-reanimated';
import { DrHarmonyModal } from '../../components/home/drharmoneymodal';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';
import DeleteRelationshipSheet from '../../components/home/deleterelationshipsheet';
import { useDeleteRelationship } from '../../context/deleterelationship';


interface Relationship {
  id: string;
  creator_id: string;
  creator_name: string;
  other_person_name: string;
  other_person_email: string;
  other_user_id: string | null;
  relationship_type: string;
  meaning_text: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  harmony_score?: number;
  // NEW: birthdate fields shown under each person's name in the person cards.
  // Rename these to whatever your API actually returns.
  creator_birthday?: string;
  other_person_birthday?: string;
}

type RelationshipDetailNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'RelationshipDetail'>,
  BottomTabNavigationProp<MainTabParamList>
>;

function cleanName(raw?: string | null): string {
  if (!raw) return '';
  if (!raw.includes('@')) return raw;
  return raw
    .split('@')[0]
    .split(/[._-]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// NEW: formats an ISO date string (or anything Date can parse) into the
// "Apr 6, 2002" style shown under each person card. Returns undefined for
// missing/invalid input so the calendar row simply doesn't render.
function formatDateLabel(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Top-level, outside AvatarCircle — defined once, not recreated every render.
// Sweeps through 3 explicit 60° steps (180° total) starting from `startAngle`,
// so different avatars can begin their orbit at different clock positions.
// Angle convention: 0 = right, 90 = bottom, 180 = left, -90 (or 270) = top.
function OrbitingDot({
  size,
  color,
  dotSize = 12,
  duration = 10000,
  delay = 0,
  startAngle = 0,
}: {
  size: number;
  color: string;
  dotSize?: number;
  duration?: number;
  delay?: number;
  startAngle?: number;
}) {
  const angle = useSharedValue(startAngle);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    angle.value = startAngle;
    const stepDuration = duration / 6;
    angle.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startAngle + 60, { duration: stepDuration, easing: Easing.linear }),
          withTiming(startAngle + 120, { duration: stepDuration, easing: Easing.linear }),
          withTiming(startAngle + 180, { duration: stepDuration, easing: Easing.linear }),
          withTiming(startAngle + 240, { duration: stepDuration, easing: Easing.linear }),
          withTiming(startAngle + 300, { duration: stepDuration, easing: Easing.linear }),
          withTiming(startAngle + 360, { duration: stepDuration, easing: Easing.linear }),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(angle);
  }, [duration, delay, startAngle]);

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
      className="absolute top-1/2 left-1/2"
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          // borderWidth: 2,
          // borderColor: isDark ? '#0C1422' : '#FFFFFF',
          zIndex: 10,
          elevation: 10, // Android needs this or the halo/face can paint over it
        },
        animatedStyle,
      ]}
    />
  );
}

function AvatarCircle({
  initial,
  size = 120,
  ringColor,
  statusColor,
  glow = 'blue',
  label,
  sublabel,
  dimmed = false,
  onPress,
  delay = 0,
  orbitDelay,
  orbitStartAngle = 0,
}: {
  initial: string;
  size?: number;
  ringColor: string;
  statusColor: string;
  glow?: 'blue' | 'gold' | 'green';
  label: string;
  sublabel: string;
  dimmed?: boolean;
  onPress?: () => void;
  delay?: number;
  orbitDelay?: number;
  orbitStartAngle?: number;
}) {
  const scale = useSharedValue(0.85);
  const pressScale = useSharedValue(1);
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 130,
      }),
    );

    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, []);

  const animatedContainer = useAnimatedStyle(() => ({
    transform: [
      {
        scale: scale.value * pressScale.value,
      },
    ],
    opacity: dimmed ? 0.45 : 1,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.45,
    transform: [
      {
        scale: 0.96 + pulse.value * 0.08,
      },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.94);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1);
  };

  const haloSize = size * 2.15;
  return (
    <Pressable
      className="items-center"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
  
      <AnimatedView
        style={[
          {
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
          },
          animatedContainer,
        ]}>
  
        {/* Glow */}
        <AnimatedView
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: haloSize,
              height: haloSize,
            },
            haloStyle,
          ]}>
          <Svg width={haloSize} height={haloSize}>
            <Defs>
              <RadialGradient id="avatarGlow">
                <Stop
                  offset="0%"
                  stopColor={statusColor}
                  stopOpacity={0.42}
                />
                <Stop
                  offset="60%"
                  stopColor={statusColor}
                  stopOpacity={0.16}
                />
                <Stop
                  offset="100%"
                  stopColor={statusColor}
                  stopOpacity={0}
                />
              </RadialGradient>
            </Defs>
  
            <Circle
              cx={haloSize / 2}
              cy={haloSize / 2}
              r={haloSize / 2}
              fill="url(#avatarGlow)"
            />
          </Svg>
        </AnimatedView>
  
        {/* OUTER RING */}
  
        {/* <View
          className="absolute rounded-full border"
          style={{
            width: size + 10,
            height: size + 10,
            borderColor: ringColor,
          }}
        /> */}
  
        {/* INNER RING */}
  
        <View
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            borderWidth: 2.2,
            borderColor: ringColor,
            shadowColor: statusColor,
            shadowOpacity: 0.13,
            shadowRadius: 16,
            shadowOffset: {
              width: 0,
              height: 0,
            },
            elevation:4,          }}
        />
  
        {/* Avatar */}
  
        <View
          className="rounded-full bg-brand-bgElevated border border-brand-borderLight items-center justify-center"
          style={{
            width: size - 16,
            height: size - 16,
          }}>
  
          <AppText
            style={{
              fontSize: size * 0.36,
              fontFamily: "serif",
              fontWeight: '300',
              color: 'rgba(243,237,229,0.5)',
            }}>
            {initial}
          </AppText>
  
        </View>
  
        {/* <OrbitingDot
          size={size + 1}
          color={statusColor}
          dotSize={10}
          duration={15000}
          delay={orbitDelay ?? delay}
          startAngle={orbitStartAngle}
        /> */}
  
      </AnimatedView>
  
      <Animated.View
        entering={FadeInDown.delay(delay + 200).duration(400)}>
  
        <AppText className="font-sansMedium text-body-md text-brand-textPrimary mt-3 text-center">
          {label}
        </AppText>
  
        <AppText className="font-sans text-caption italic text-brand-textMuted">
          {sublabel}
        </AppText>
  
      </Animated.View>
  
    </Pressable>
  );
}

function HarmonyBar({ score }: { score: number }) {
  const width = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    width.value = withDelay(400, withTiming(score, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    shimmer.value = withDelay(1600, withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    ));
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + shimmer.value * 0.5,
    left: `${width.value}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(500)}
      className="bg-[rgba(74,130,216,0.07)] border border-[rgba(74,130,216,0.18)] rounded-card p-card">

      <View className="flex-row items-center justify-between mb-4">
        <AppText className="font-sansMedium text-[10px] text-brand-blueSoft uppercase tracking-[2px]">
          Harmony
        </AppText>
        <View className="flex-row items-baseline">
          <AppText className="font-heading text-[28px] text-brand-textPrimary">
            {score}
          </AppText>
          <AppText className="font-sans text-body-sm text-brand-textMuted ml-1">
            / 100
          </AppText>
        </View>
      </View>

      {/* Progress track */}
      <View
        className="h-2.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        <Animated.View
          style={[
            {
              height: '100%',
              borderRadius: 999,
              shadowColor: '#7AB0F5',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 6,
              overflow: 'hidden',
            },
            barStyle,
          ]}>
          {trackWidth > 0 && (
            <Svg width={trackWidth} height="100%">
              <Defs>
                <LinearGradient id="harmonyFill" x1="1" y1="1" x2="1" y2="1">
                  <Stop offset="1%" stopColor="rgb(74,130,216)" stopOpacity={1} />
                  <Stop offset="100%" stopColor="rgb(122,176,245)" stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x={1} y={1} width={trackWidth} height="100%" fill="url(#harmonyFill)" rx={999} />
            </Svg>
          )}
        </Animated.View>

  
        {/* <Animated.View
          style={[
            {
              position: 'absolute',
              top: -1.5,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#7AB0F5',
              shadowColor: '#7AB0F5',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 4,
              marginLeft: -3,
            },
            dotStyle,
          ]}
        /> */}
      </View>

      <View className="flex-row justify-between mt-2">
        {['25', '50', '75', '100'].map(v => (
          <AppText key={v} className="font-sans text-[9px] text-[rgba(243,237,229,0.2)]">
            {v}
          </AppText>
        ))}
      </View>

      <AppText className="font-sans text-[11px] text-[rgba(243,237,229,0.4)] mt-4 leading-5">
        Reflects your bond's health. Rises when you interact and resolve conflicts.
      </AppText>
    </Animated.View>
  );
}

function PersonCard({
  initial,
  name,
  date,
  onPress,
  delay = 0,
}: {
  initial: string;
  name: string;
  date?: string;
  onPress?: () => void;
  delay?: number;
}) {
  const pressScale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(450)}
      style={[{ flex: 1 }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { pressScale.value = withTiming(0.96, { duration: 80 }); }}
        onPressOut={() => { pressScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        disabled={!onPress}
        className="bg-[#1A2840] border border-[rgba(243,237,229,0.07)] rounded-2xl p-4 flex-row items-center gap-3"
        style={{ minHeight: 72 }}>
        <View
          className="w-10 h-10 rounded-full bg-[#152035] border border-[rgba(74,130,216,0.22)] items-center justify-center"
          style={{
            shadowColor: '#4A82D8',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}>
          <AppText className="font-sansMedium text-body-md text-brand-textMuted">
            {initial.toLowerCase()}
          </AppText>
        </View>

        <View className="flex-1">
          <AppText
            className="font-sansMedium text-body-md text-brand-textPrimary"
            numberOfLines={1}>
            {name}
          </AppText>

          {!!date && (
            <View className="flex-row items-center gap-1.5 mt-1">
              <Calendar size={12} color="rgba(243,237,229,0.5)" />
              <AppText
                className="font-sans text-caption text-brand-textMuted"
                numberOfLines={1}>
                {date}
              </AppText>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}


function DrHarmonyButton({ onPress, locked = false }: { onPress: () => void; locked?: boolean }) {
  const glow = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(glow);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.35 + glow.value * 0.45,
    shadowRadius: 10 + glow.value * 14,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const accentColor = locked ? '#D4A84B' : '#3868B5'; // #3868B5 ≈ midpoint of the reference's #4A82D8→#1E4FA0 gradient

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(500)}
      className="px-5 mb-8">
      <AnimatedView style={glowStyle}>
        <AnimatedPressable
          className="flex-row items-center justify-center gap-2.5 py-4 rounded-2xl"
          onPress={onPress}
          onPressIn={() => { scale.value = withTiming(0.97, { duration: 80 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
          style={[
            {
              backgroundColor: accentColor,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            },
            scaleStyle,
          ]}>
          {locked ? (
            <Crown size={20} color="#F3EDE5" />
          ) : (
            <MessageCircleHeart size={20} color="#F3EDE5" />
          )}
          <AppText className="font-sansSemiBold text-body-md text-[#F3EDE5]">
            {locked ? 'Buy Premium for Dr. Harmony' : 'Talk to Dr. Harmony'}
          </AppText>
        </AnimatedPressable>
      </AnimatedView>
    </Animated.View>
  );
}

function InfinityConnector() {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(glow);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + glow.value * 0.3,
    transform: [{ scale: 1 + glow.value * 0.12 }],
    textShadowRadius: 8 + glow.value * 12,
  }));

  return (
    <View className="mx-2 items-center justify-center" style={{ marginTop: -24 }}>
      <View className="w-px h-16 bg-[rgba(212,168,75,0.3)]" />
      <AnimatedView style={glowStyle}>
        <AppText style={{ fontSize: 26, color: '#D4A84B', marginVertical: 4 }}>∞</AppText>
      </AnimatedView>
    </View>
  );
}

type RouteParams = {
  RelationshipDetail: { relationshipId: string };
};



export default function RelationshipDetailScreen() {
  const navigation = useNavigation<RelationshipDetailNavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'RelationshipDetail'>>();
  const { user, isTrialActive, trialDaysLeft, isSubscribed, canTalkToDrHarmony } = useAuth();
  const isDark = useColorScheme() === 'dark';

  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);

  const relationshipId = route.params?.relationshipId;

  const fetchRelationship = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/relationships');
      if (data.success) {
        const found = data.relationships.find(
          (r: Relationship) => r.id === relationshipId,
        );
        setRelationship(found ?? null);
      }
    } catch (err) {
      console.error('[RelationshipDetail] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [relationshipId]);

  useEffect(() => {
    fetchRelationship();
  }, [fetchRelationship]);

  const isCreator     = relationship?.creator_id === user?.id;
  const myName        = cleanName(isCreator ? relationship?.creator_name      : relationship?.other_person_name);
  const partnerName   = cleanName(isCreator ? relationship?.other_person_name : relationship?.creator_name);
  const myInitial     = myName?.charAt(0)?.toUpperCase()      ?? '?';
  const partnerInitial = partnerName?.charAt(0)?.toUpperCase() ?? '?';
  const isPending     = relationship?.status === 'pending';
  const harmonyScore  = relationship?.harmony_score ?? 60;

  // NEW: resolve each person's birthdate from the relationship record,
  // respecting who is "me" vs "partner" the same way names/initials do.
  const myBirthdate = formatDateLabel(
    isCreator ? relationship?.creator_birthday : relationship?.other_person_birthday,
  );
  const partnerBirthdate = formatDateLabel(
    isCreator ? relationship?.other_person_birthday : relationship?.creator_birthday,
  );

  const goToMyProfile = useCallback(() => {
    if (!relationshipId) return;
    navigation.navigate('PersonProfile', { relationshipId, who: 'me' });
  }, [navigation, relationshipId]);

  const goToPartnerProfile = useCallback(() => {
    if (!relationshipId) return;
    navigation.navigate('PersonProfile', { relationshipId, who: 'partner' });
  }, [navigation, relationshipId]);

  const handleResend = async () => {
    setResending(true);
    try {
      await apiClient.post(`/relationships/${relationshipId}/resend-invite`);
      Alert.alert('Invite Sent', 'Invitation has been resent successfully.');
    } catch {
      Alert.alert('Error', 'Failed to resend invite. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const { openSheet } = useDeleteRelationship();

  const handleDelete = () => {
    openSheet({
      partnerName,
      onConfirm: async () => {
        const response = await apiClient.delete(`/relationships/${relationshipId}`);
        if (response.data?.success) {
          setTimeout(() => navigation.goBack(), 200);
        }
      },
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      const response = await apiClient.delete(`/relationships/${relationshipId}`);
      if (response.data?.success) {
        setDeleteSheetVisible(false);
       
        setTimeout(() => {
          navigation.goBack();
        }, 200);
      }
    } catch {
      setDeleteSheetVisible(false);
      Alert.alert('Error', 'Failed to delete relationship. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (deleting) return;
    setDeleteSheetVisible(false);
  };

  const handleTalkToDrHarmony = useCallback(() => {
    if (!canTalkToDrHarmony) {
      navigation.navigate('SettingsTab', { screen: 'SubscriptionPayment' });
      return;
    }
    setChatVisible(true);
  }, [canTalkToDrHarmony, navigation]);

  if (loading) {
    return (
      <View className="flex-1 bg-brand-bgMain items-center justify-center">
        <AnimatedInfinityLogo size={48} mode="loop" />
      </View>
    );
  }

  if (!relationship) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bgMain items-center justify-center px-6" edges={['top']}>
        <AppText className="font-sansMedium text-body-md text-brand-textMuted text-center">
          Relationship not found.
        </AppText>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <AppText className="font-sansMedium text-body-md text-brand-tabActive">Go Back</AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
      {/* StatusBar needs a real color/style string — className can't target it */}
      <StatusBar backgroundColor={isDark ? '#0C1422' : '#FFFFFF'} barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}>

        {/* Caps the content at phone width and centers it on tablet/web/desktop
            viewports, so the screen stays boxed like the design instead of
            stretching edge-to-edge on larger screens. On an actual phone
            (width < 480) this is a no-op — full width either way. */}
        <View className="w-full max-w-[480px]">

        {/* Drag Handle */}
        <View className="items-center pt-3 pb-1">
          <View className="w-9 h-1 rounded-full bg-brand-borderLight" />
        </View>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-row items-center justify-between px-5 pt-4 pb-6">
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 rounded-full bg-[rgba(26,40,64,0.85)] border border-[rgba(243,237,229,0.1)] items-center justify-center">
            <ArrowLeft size={18} color="#F3EDE5" />
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Sparkle color={'rgba(243,237,229,0.5)'} size={14} />
            <AppText className="font-sansMedium text-[11px] text-brand-textMuted uppercase tracking-[2.4px]">
              {relationship.relationship_type}
            </AppText>
          </View>

          <View
            className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
            style={{
              backgroundColor: isPending ? 'rgba(212,168,75,0.09)' : 'rgba(94,201,126,0.09)',
              borderWidth: 1,
              borderColor: isPending ? 'rgba(212,168,75,0.2)' : 'rgba(94,201,126,0.2)',
            }}>
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isPending ? '#D4A84B' : '#5EC97E' }}
            />
            <AppText
              className="font-sansMedium text-caption"
              style={{ color: isPending ? '#D4A84B' : '#5EC97E' }}>
              {isPending ? 'Pending' : 'Good'}
            </AppText>
          </View>
        </Animated.View>

        {/* Pending Banner */}
        {isPending && (
          <Animated.View
            entering={FadeInDown.delay(50).duration(400)}
            className="mx-5 mb-6 bg-[rgba(212,168,75,0.07)] border border-[rgba(212,168,75,0.2)] rounded-2xl px-4 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-9 h-9 rounded-full bg-[rgba(212,168,75,0.1)] items-center justify-center">
                <Send size={14} color="#D4A84B" />
              </View>
              <View className="flex-1">
                <AppText className="font-sansMedium text-body-sm text-brand-textPrimary">
                  Pending invitation
                </AppText>
                <AppText className="font-sans text-sm text-brand-textMuted mt-0.5">
                  {relationship.relationship_type} hasn't accepted yet
                </AppText>
              </View>
            </View>
            <Pressable
              onPress={handleResend}
              disabled={resending}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
              style={{ borderColor: 'rgba(212,168,75,0.3)', backgroundColor: 'rgba(212,168,75,0.1)' }}>
              <Send size={13} color="#D4A84B" />
              <AppText className="font-sansMedium text-caption" style={{ color: '#D4A84B' }}>
                {resending ? 'Sending...' : 'Resend'}
              </AppText>
            </Pressable>
          </Animated.View>
        )}

        {/* Talk to Dr. Harmony — becomes a premium upsell once the trial's over */}
        <DrHarmonyButton onPress={handleTalkToDrHarmony} locked={!canTalkToDrHarmony} />
        {isTrialActive && !isSubscribed && (
          <AppText className="font-sans text-caption text-brand-textMuted text-center -mt-6 mb-4">
            {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left in your free trial
          </AppText>
        )}
        {/* Avatars */}
        <View className="flex-row items-center justify-center px-5 mb-10 gap-0 rounded-full">
          <AvatarCircle
            initial={myInitial}
            size={120}
            ringColor="rgba(74,130,216,0.60)"
            statusColor="#7AB0F5"
            label={myName}
            sublabel="You"
            dimmed={false}
            onPress={goToMyProfile}
            delay={200}
            orbitDelay={0}
            orbitStartAngle={-90 /* top */}
          />

          <InfinityConnector />

          <AvatarCircle
            initial={partnerInitial}
            size={120}
            ringColor={isPending ? 'rgba(255, 234, 0, 1)' : 'rgba(94,201,126,0.20)'}
            statusColor={isPending ? '#D4A84B' : '#5EC97E'}
            label={partnerName}
            sublabel="Partner"
            dimmed={isPending}
            onPress={goToPartnerProfile}
            delay={100}
            orbitDelay={0}
            orbitStartAngle={180 /* left side — flip to 0 for right side */}
          />
        </View>

        {/* Harmony Score */}
        <View className="px-5 mb-4">
          <HarmonyBar score={harmonyScore} />
        </View>

        {/* Person Cards */}
        <View className="flex-row gap-3 px-5 mb-6">
          <PersonCard
            initial={myInitial}
            name={myName}
            date={myBirthdate}
            onPress={goToMyProfile}
            delay={200}
          />
          <PersonCard
            initial={partnerInitial}
            name={partnerName}
            date={partnerBirthdate}
            onPress={goToPartnerProfile}
            delay={300}
          />
        </View>

        {/* Delete */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} className="px-5">
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl border border-red-900/60  bg-red-800/5">
            <Trash2 size={18} color="#EF444490" />
            <AppText className="font-sansMedium text-body-md text-red-500/80">
              {deleting ? 'Deleting...' : 'Delete relationship'}
            </AppText>
          </Pressable>
        </Animated.View>

        </View>
      </ScrollView>

      {/* Dr. Harmony Modal */}
      <DrHarmonyModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        relationship={relationship}
        myName={myName}
        partnerName={partnerName}
      />

      {/* Animated Delete Confirmation Sheet */}
      <DeleteRelationshipSheet
        visible={deleteSheetVisible}
        partnerName={partnerName}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </SafeAreaView>
  );
}
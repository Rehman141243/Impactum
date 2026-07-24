

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Heart,
  ThumbsUp,
  XCircle,
  Sparkles,
  Shield,
  Star,
  ChevronRight,
  Calendar,
} from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import AppText from '../../components/common/AppText';
import { apiClient } from '../../utils/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { getZodiacSign, formatDob } from '../../constants/zodiac';
import {
  Relationship,
  resolvePersonProfile,
  PersonProfile,
} from '../../types/relationship';
import { HomeStackParamList } from './homennavigator';
import { GlowIconBadge } from './PersonProfileScreens/profilepersoncomponents';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';


type RouteParams = {
  PersonProfile: { relationshipId: string; who: 'me' | 'partner' };
};

interface ProfileRow {
  key: keyof PersonProfile;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
  title: string;
  value: string | number | null | undefined;
  emptyLabel: string;
  kind: 'text' | 'rating';
  editable: boolean;
}

function resolveDob(
  relationship: Relationship | null,
  who: 'me' | 'partner',
  isCreator: boolean,
): string | null {
  if (!relationship) return null;
  const wantsCreatorSide = who === 'me' ? isCreator : !isCreator;
  if (wantsCreatorSide) {
    return (
      (relationship as any).creator_dob ??
      (relationship as any).creator_birthday ??
      (relationship as any).your_birthday ??
      null
    );
  } else {
    return (
      (relationship as any).other_person_dob ??
      (relationship as any).other_person_birthday ??
      null
    );
  }
}

function buildRows(
  profile: PersonProfile | any,
  partnerName: string | null,
  isMe: boolean,
  givenRating: number,
  receivedRating: number,
): ProfileRow[] {
  return [
    {
      key: 'meaning_text',
      icon: <Heart size={18} color="#4F7BF7" />,
      accentColor: '#4F7BF7',
      iconBg: '#1A2D4A',
      title: isMe
        ? 'What This Relationship Means To Me'
        : `What This Relationship Means To ${partnerName ?? 'Them'}`,
      value: profile?.meaning_text ?? null,
      emptyLabel: 'Not set yet',
      kind: 'text',
      editable: true,
    },
    {
      key: 'likes',
      icon: <ThumbsUp size={18} color="#F472B6" />,
      accentColor: '#F472B6',
      iconBg: '#3D1F33',
      title: isMe
        ? (partnerName ? `What I Like About ${partnerName}` : 'What I Like')
        : `What ${partnerName ?? 'They'} Like About You`,
      value: profile?.likes ?? null,
      emptyLabel: 'Not set yet',
      kind: 'text',
      editable: true,
    },
    {
      key: 'dislikes',
      icon: <XCircle size={18} color="#F87171" />,
      accentColor: '#F87171',
      iconBg: '#3D2020',
      title:  "Just Don't...",
      value: profile?.dislikes ?? null,
      emptyLabel: 'Not set yet',
      kind: 'text',
      editable: true,
    },
    {
      key: 'best_moments',
      icon: <Sparkles size={18} color="#2DD4BF" />,
      accentColor: '#2DD4BF',
      iconBg: '#0F2E2A',
      title: 'Best Moments Together',
      value: profile?.best_moments ?? null,
      emptyLabel: 'Not set yet',
      kind: 'text',
      editable: true,
    },
    {
      key: 'personality',
      icon: <Shield size={18} color="#A78BFA" />,
      accentColor: '#A78BFA',
      iconBg: '#2D1B4E',
      title: isMe ? 'Personality' : `${partnerName ?? 'Their'} Personality`,
      value: profile?.personality ?? null,
      emptyLabel: 'Not set yet',
      kind: 'text',
      editable: true,
    },
    {
      key: 'rating',
      icon: <Star size={18} color="#C9A84C" />,
      accentColor: '#C9A84C',
      iconBg: '#3D3420',
      title: isMe ? 'Rating They Gave You' : `Rate ${partnerName ?? 'Them'}`,
      value: isMe ? receivedRating : givenRating,
      emptyLabel: isMe ? "They haven't rated you yet" : 'Not rated yet',
      kind: 'rating',
      editable: true,
    },
    {
      key: 'boundaries',
      icon: <Shield size={18} color="#4ADE80" />,
      accentColor: '#4ADE80',
      iconBg: '#14241C',
      title: 'Boundaries',
      value: profile?.boundaries ?? null,
      emptyLabel: 'No agreements yet',
      kind: 'text',
      editable: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Avatar — SVG radial-gradient pulse halo + glass ring                */
/* ------------------------------------------------------------------ */

function AnimatedAvatar({ initial }: { initial: string }) {
  const pulse = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    ringScale.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 100 }));
    ringOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    pulse.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
    };
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.4,
    transform: [{ scale: 0.94 + pulse.value * 0.14 }],
  }));

  return (
    <Animated.View className="items-center justify-center">
      {/* SVG radial-gradient glow halo — bleeds past the avatar's own bounds.
          SVG Stop colors are a native prop, not a className target, so they
          stay literal; blue reads fine on both light and dark backgrounds. */}
      <Animated.View
        pointerEvents="none"
        style={[
          glowStyle,
          { position: 'absolute', width: 176, height: 176, borderRadius: 88 },
        ]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#4F7BF7" stopOpacity={0.55} />
              <Stop offset="100%" stopColor="#4F7BF7" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#avatarGlow)" />
        </Svg>
      </Animated.View>

      {/* Glass ring */}
      <Animated.View
        pointerEvents="none"
        style={outerRingStyle}
        className="absolute w-[122px] h-[122px] rounded-full border border-[#4F7BF755]"
      />

      <View className="w-28 h-28 rounded-full bg-brand-bgElevated border-[1.5px] border-brand-borderSoft items-center justify-center overflow-hidden">
        {/* tinted glass wash */}
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject} className="bg-[#4F7BF712]" />
        {/* diagonal sheen */}
        <View
          pointerEvents="none"
          className="absolute w-3/4 bg-white/5"
          style={{ top: -50, left: -40, height: '220%', transform: [{ rotate: '20deg' }] }}
        />
        <AppText style={{ fontFamily: 'serif' }} className="text-[46px] text-brand-textSecondary">
          {initial}
        </AppText>
      </View>
    </Animated.View>
  );
}


function StarRating({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <View className="flex-row gap-0.5 mt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Animated.View
          key={i}
          entering={ZoomIn.delay(i * 60).duration(250)}>
          <Star
            size={13}
            color="#C9A84C"
            fill={i < rounded ? '#C9A84C' : 'transparent'}
          />
        </Animated.View>
      ))}
    </View>
  );
}


/* ------------------------------------------------------------------ */
/* Row — glassy card with a glowing icon badge                         */
/* ------------------------------------------------------------------ */

function ProfileRowItem({
  row,
  onPress,
  index,
}: {
  row: ProfileRow;
  onPress: () => void;
  index: number;
}) {
  const pressScale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const isEmpty =
    row.kind === 'rating'
      ? row.value === null || row.value === undefined
      : row.value === null || row.value === undefined || row.value === '';

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 70).duration(380).springify().damping(18)}
      style={pressStyle}
      className="m-4">
      <Pressable
        onPress={row.editable ? onPress : undefined}
        disabled={!row.editable && row.key !== 'rating'}
        onPressIn={() => {
          if (row.editable || row.key === 'rating') {
            pressScale.value = withTiming(0.97, { duration: 80 });
          }
        }}
        onPressOut={() => {
          pressScale.value = withSpring(1, { damping: 10, stiffness: 200 });
        }}
        style={({ pressed }) => ({
          opacity: pressed && row.editable ? 0.82 : 1,
        })}>
        <View
          className="bg-brand-bgCardSoft rounded-2xl flex-row items-center px-3 py-3 overflow-hidden"
          style={{
            borderLeftColor: row.accentColor,
            borderLeftWidth: 3,
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: row.accentColor + '2E',
            borderRightColor: row.accentColor + '2E',
            borderBottomColor: row.accentColor + '2E',
          }}>
          {/* subtle accent wash */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { backgroundColor: row.accentColor + '0A' }]}
          />
          {/* faint diagonal sheen */}
          <View
            pointerEvents="none"
            className="absolute w-3/5"
            style={{ top: -50, left: -30, height: '260%', backgroundColor: row.accentColor + '08', transform: [{ rotate: '20deg' }] }}
          />

          {/* Glowing icon badge */}
          <View className="mr-3.5">
            <GlowIconBadge
              icon={row.icon}
              accentColor={row.accentColor}
              iconBg={row.iconBg}
              size={30}
            />
          </View>

          {/* Text */}
          <View className="flex-1">
            <AppText
              className="text-xs font-medium text-brand-textPrimary mt-1"
              numberOfLines={1}>
              {row.title}
            </AppText>

            {isEmpty ? (
              <AppText className="text-xs text-brand-textMuted mt-0.5">
                {/* empty */}
              </AppText>
            ) : row.kind === 'rating' ? (
              <StarRating value={row.value as number} />
            ) : (
              <AppText
                className="text-xs text-brand-textSecondary mt-0.5"
                numberOfLines={2}>
                {row.value as string}
              </AppText>
            )}
          </View>

          {/* Chevron */}
          {row.editable && (
            <View className="w-[30px] h-[30px] rounded-full bg-brand-bgElevated items-center justify-center ml-2">
              <ChevronRight size={15} color="#64748B" />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}



export default function PersonProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'PersonProfile'>>();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';

  const { relationshipId, who } = route.params;

  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [givenRating, setGivenRating] = useState<number>(0);
  const [receivedRating, setReceivedRating] = useState<number>(0);


  
  const fetchRatings = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/ratings/${relationshipId}/current`);
      if (data.success) {
        setGivenRating(data.data.given?.rating ?? 0);
        setReceivedRating(data.data.received?.rating ?? 0);
      }
    } catch (err) {
      console.error('[PersonProfile] ratings fetch error:', err);
    }
  }, [relationshipId]);

  const fetchRelationship = useCallback(async () => {
    setFetchError(null);
    try {
      const { data } = await apiClient.get('/relationships');
      if (data.success) {
        const found: Relationship | undefined = data.relationships.find(
          (r: Relationship) => r.id === relationshipId,
        );
        setRelationship(found ?? null);
      } else {
        setFetchError('Could not load profile data.');
      }
    } catch (err) {
      console.error('[PersonProfile] fetch error:', err);
      setFetchError('Network error. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [relationshipId]);

  
const [myProfileData, setMyProfileData] = useState<any>(null);
const [partnerProfileData, setPartnerProfileData] = useState<any>(null);



const fetchProfileData = useCallback(async () => {
  try {
    const [meRes, partnerRes] = await Promise.all([
      apiClient.get(`/person-profile/${relationshipId}/me`),
      apiClient.get(`/person-profile/${relationshipId}/partner`),
    ]);
    if (meRes.data.success) setMyProfileData(meRes.data.data);
    if (partnerRes.data.success) setPartnerProfileData(partnerRes.data.data);
  } catch (err) {
    console.error('[PersonProfile] profile data fetch error:', err);
  }
}, [relationshipId]);


useEffect(() => {
  fetchRelationship();
  fetchRatings();
  fetchProfileData();
}, [fetchRelationship, fetchRatings, fetchProfileData]);

useFocusEffect(
  useCallback(() => {
    fetchRelationship();
    fetchRatings();
    fetchProfileData();
  }, [fetchRelationship, fetchRatings, fetchProfileData]),
);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRelationship();
  }, [fetchRelationship]);



  const isCreator = relationship?.creator_id === user?.id;
  const isMe = who === 'me';
  const profile = resolvePersonProfile(relationship, user?.id, who);
  const dob = resolveDob(relationship, who, isCreator);
  const zodiac = getZodiacSign(dob);
  const dobLabel = formatDob(dob);
  const initial = profile.name?.charAt(0)?.toUpperCase() ?? '?';
  const partnerName = isCreator
    ? relationship?.other_person_name ?? null
    : relationship?.creator_name ?? null;
    const displayProfile = isMe ? myProfileData : partnerProfileData;

    const rows = buildRows(
      displayProfile ?? profile, 
      partnerName,
      isMe,
      givenRating,
      receivedRating,
    );
    const handleRowPress = (row: ProfileRow) => {
      if (!row.editable && row.key !== 'rating') return; 
      navigation.navigate('ProfileFieldEdit', {
        relationshipId,
        who: row.key === 'rating' ? (isMe ? 'me' : 'partner') : who,
        field: row.key,
      });
    };


  if (loading) {
    return (
      <View className="flex-1 bg-brand-bgMain items-center justify-center">
        {/* StatusBar needs a real color/style string — className can't target it */}
        <StatusBar backgroundColor={isDark ? '#0A0E17' : '#FFFFFF'} barStyle={isDark ? 'light-content' : 'dark-content'} />
        <AnimatedInfinityLogo size={48} mode="loop" />
      </View>
    );
  }
 



  if (fetchError || !relationship) {
    return (
      <SafeAreaView
        className="flex-1 bg-brand-bgMain items-center justify-center px-6"
        edges={['top']}>
        <StatusBar backgroundColor={isDark ? '#0A0E17' : '#FFFFFF'} barStyle={isDark ? 'light-content' : 'dark-content'} />
        <AppText className="text-brand-textMuted text-[15px] text-center">
          {fetchError ?? 'Profile not found.'}
        </AppText>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <AppText className="text-brand-tabActive text-[15px]">Go Back</AppText>
        </Pressable>
        {fetchError && (
          <Pressable onPress={fetchRelationship} className="mt-2">
            <AppText className="text-[#2DD4BF] text-[15px]">Retry</AppText>
          </Pressable>
        )}
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
      <StatusBar backgroundColor={isDark ? '#0A0E17' : '#FFFFFF'} barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Back button */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="px-5 pt-4 pb-1">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="w-10 h-10 rounded-full bg-brand-bgCardSoft border border-brand-borderSoft items-center justify-center">
          <ArrowLeft size={18} color="#94A3B8" />
        </Pressable>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F7BF7"
          />
        }>

        {/* ── Avatar + name + pills ── */}
        <View className="items-center pt-4 pb-9">

          {/* Avatar with pulse glow */}
          <AnimatedAvatar initial={initial} />

          {/* Name */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <AppText
              style={{ fontFamily: 'serif' }}
              className="text-[30px] text-brand-textPrimary mt-5 tracking-wide text-center">
              {profile.name ?? 'Unknown'}
            </AppText>
          </Animated.View>

          {/* Relationship type badge */}
          {relationship.relationship_type ? (
            <Animated.View
              entering={FadeInDown.delay(320).duration(400)}
              className="mt-3 px-4 py-1.5 rounded-full bg-brand-bgCardSoft border border-brand-borderSoft">
              <AppText className="text-[13px] text-brand-textSecondary capitalize">
                {relationship.relationship_type}
              </AppText>
            </Animated.View>
          ) : null}

          {/* Zodiac + DOB pills */}
          {(zodiac || dobLabel) ? (
            <Animated.View
              entering={FadeInDown.delay(390).duration(400)}
              className="flex-row items-center mt-3 gap-2 flex-wrap justify-center px-6">

              {zodiac && (
                <View className="px-4 py-1.5 rounded-full bg-brand-purpleSoft/20">
                  <AppText className="text-[13px] font-medium text-brand-purpleSoft">
                    {zodiac.sign}
                  </AppText>
                </View>
              )}

              {dobLabel && (
                <View className="flex-row items-center px-3 py-1.5 rounded-full bg-brand-bgCardSoft border border-brand-borderSoft gap-1.5">
                  <Calendar size={13} color="#64748B" />
                  <AppText className="text-[13px] text-brand-textSecondary">
                    {dobLabel}
                  </AppText>
                </View>
              )}
            </Animated.View>
          ) : null}
        </View>

        {/* ── Section label ── */}
        <Animated.View
          entering={FadeIn.delay(300).duration(400)}
          className="px-5 mb-3">
          <AppText className="text-[11px] font-medium text-brand-textMuted uppercase tracking-widest">
            {isMe ? 'My Profile' : `${profile.name ?? "Their"}'s Profile`}
          </AppText>
        </Animated.View>

        {/* ── Profile rows ── */}
        <View className="px-5">
          {rows.map((row, index) => (
            <ProfileRowItem
              key={row.key}
              row={row}
              index={index}
              onPress={() => handleRowPress(row)}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
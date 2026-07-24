
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  Animated as RNAnimated,
  BackHandler,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft, Heart, ThumbsUp, XCircle, Sparkles,
  Shield, Star, Check, Plus, X, Trash2,
  CheckCircle2, Clock, Pencil,
} from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import AppText from '../../../components/common/AppText';

import { PersonProfile } from '../../../types/relationship';

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
  FadeOut,
  ZoomIn,
  SlideInRight,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

export type RouteParams = {
  ProfileFieldEdit: {
    relationshipId: string;
    who: 'me' | 'partner';
    field: keyof PersonProfile;
  };
};

export interface FieldMeta {
  title: string;
  subtitle: string;
  placeholder: string;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
  multiline: boolean;
  kind: 'text' | 'rating' | 'boundaries' | 'moments';
}

export interface RatingRow {
  id: string;
  relationship_id: string;
  rated_by: string;
  rated_user_id: string | null;
  rating: number;
  reason: string | null;
  created_at: string;
}

export interface CurrentRatingsResponse {
  given: RatingRow | null;
  received: RatingRow | null;
}

export interface BoundaryRow {
  id: string;
  relationship_id?: string;
  boundary_id?: string;
  proposed_by: string;
  title: string;
  description: string | null;
  created_at?: string;
  [key: string]: any;
}

export function getFieldMeta(
  field: keyof PersonProfile,
  partnerName?: string,
  who?: 'me' | 'partner',
): FieldMeta {
  const defaults: Record<keyof PersonProfile, FieldMeta> = {
    meaning_text: {
      title: 'What This Relationship Means To Me',
      subtitle: 'Describe why this bond matters to you. Be as honest as you want.',
      placeholder: 'Write what you feel about this relationship...',
      icon: <Heart size={20} color="#4F7BF7" />,
      accentColor: '#4F7BF7', iconBg: '#1A2D4A',
      multiline: true, kind: 'text',
    },
    likes: {
      title: partnerName ? `What I Like About ${partnerName}` : 'What I Like',
      subtitle: 'The things that make them special to you.',
      placeholder: 'Their laugh, the way they listen...',
      icon: <ThumbsUp size={20} color="#F472B6" />,
      accentColor: '#F472B6', iconBg: '#3D1F33',
      multiline: true, kind: 'text',
    },
    dislikes: {
      title: "Just Don't...",
      subtitle: 'Boundaries and friction points — honest helps.',
      placeholder: 'Things that create tension between you...',
      icon: <XCircle size={20} color="#F87171" />,
      accentColor: '#F87171', iconBg: '#3D2020',
      multiline: true, kind: 'text',
    },
    best_moments: {
      title: 'Best Moments Together',
      subtitle: 'Add a memory worth keeping. Tap a moment below to edit or delete it.',
      placeholder: '',
      icon: <Star size={20} color="#2DD4BF" />,
      accentColor: '#2DD4BF', iconBg: '#0F2E2A',
      multiline: false, kind: 'moments',
    },
    personality: {
      title: 'Personality',
      subtitle: 'How would you describe them in a few words?',
      placeholder: 'Curious, warm, a little chaotic...',
      icon: <Shield size={20} color="#A78BFA" />,
      accentColor: '#A78BFA', iconBg: '#2D1B4E',
      multiline: true, kind: 'text',
    },
    rating: who === 'me'
      ? {
          title: 'Their Rating Of You',
          subtitle: partnerName
            ? `What ${partnerName} thinks of your bond right now.`
            : 'What they think of your bond right now.',
          placeholder: '',
          icon: <Sparkles size={20} color="#C9A84C" />,
          accentColor: '#C9A84C', iconBg: '#3D3420',
          multiline: false, kind: 'rating',
        }
      : {
          title: partnerName ? `Rate ${partnerName}` : 'Rating',
          subtitle: 'How healthy is this bond right now, from your side?',
          placeholder: '',
          icon: <Sparkles size={20} color="#C9A84C" />,
          accentColor: '#C9A84C', iconBg: '#3D3420',
          multiline: false, kind: 'rating',
        },
    boundaries: {
      title: 'Boundaries',
      subtitle: 'Add an agreement or ground rule. Tap a pending boundary below to edit it.',
      placeholder: '',
      icon: <Shield size={20} color="#4ADE80" />,
      accentColor: '#4ADE80', iconBg: '#14241C',
      multiline: false, kind: 'boundaries',
    },
    name: {
      title: 'Name', subtitle: '', placeholder: '',
      icon: <Heart size={20} color="#4F7BF7" />,
      accentColor: '#4F7BF7', iconBg: '#1A2D4A',
      multiline: false, kind: 'text',
    },
    dob: {
      title: 'Date of Birth', subtitle: '', placeholder: '',
      icon: <Heart size={20} color="#4F7BF7" />,
      accentColor: '#4F7BF7', iconBg: '#1A2D4A',
      multiline: false, kind: 'text',
    },
    rating_reason: {
      title: 'Rating Reason',
      subtitle: 'Why did you give this rating?',
      placeholder: "We've been distant lately...",
      icon: <Star size={20} color="#2DD4BF" />,
      accentColor: '#2DD4BF', iconBg: '#0F2E2A',
      multiline: true, kind: 'text',
    },
  };
  return defaults[field];
}

function GlowHalo({
  color,
  spread = 18,
}: {
  color: string;
  spread?: number;
}) {
  const pulse = useSharedValue(0);
  const gradientId = useRef(`glow-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.35,
    transform: [{ scale: 0.96 + pulse.value * 0.08 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -spread, left: -spread, right: -spread, bottom: -spread,
        },
        glowStyle,
      ]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
}

/** Icon badge with the same glass + glow finish as the payment card, for headers. */
export function GlowIconBadge({
  icon,
  accentColor,
  iconBg,
  size = 36,
}: {
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <GlowHalo color={accentColor} spread={size * 0.35} />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconBg,
          borderWidth: 1,
          borderColor: accentColor + '55',
          overflow: 'hidden',
        }}>
        {/* accent wash */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: accentColor + '14' }]}
        />
        {/* diagonal sheen */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -size * 0.6,
            left: -size * 0.5,
            width: size * 1.6,
            height: size * 2.4,
            backgroundColor: '#FFFFFF12',
            transform: [{ rotate: '20deg' }],
          }}
        />
        {icon}
      </View>
    </View>
  );
}

export function StarPicker({ value, onChange, accentColor }: {
  value: number; onChange: (n: number) => void; accentColor: string;
}) {
  return (
    <View className="flex-row gap-4 justify-center py-8">
      {[1, 2, 3, 4, 5].map((n, i) => (
        <Animated.View
          key={n}
          entering={ZoomIn.delay(i * 80).duration(300)}>
          <Pressable onPress={() => onChange(n)} hitSlop={8}>
            <Star
              size={44}
              color={n <= value ? accentColor : '#334155'}
              fill={n <= value ? accentColor : 'transparent'}
            />
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

export function StarDisplay({ value, accentColor }: { value: number; accentColor: string }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <View className="flex-row gap-3 justify-center py-8">
      {[1, 2, 3, 4, 5].map((n, i) => (
        <Animated.View
          key={n}
          entering={ZoomIn.delay(i * 70).duration(280)}>
          <Star
            size={36}
            color={n <= rounded ? accentColor : '#334155'}
            fill={n <= rounded ? accentColor : 'transparent'}
          />
        </Animated.View>
      ))}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <AppText className="font-sansMedium text-[11px] text-brand-textMuted uppercase tracking-[1.5px] mb-2">
      {children}
    </AppText>
  );
}

/* ------------------------------------------------------------------ */
/* FormCard — now glassy + glowing by default                         */
/* ------------------------------------------------------------------ */

export function FormCard({
  children,
  accentColor,
  glow = true,
}: {
  children: React.ReactNode;
  accentColor: string;
  glow?: boolean;
}) {
  return (
    <View style={{ position: 'relative' }}>
      {glow && <GlowHalo color={accentColor} spread={16} />}
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: accentColor + '4D',
          backgroundColor: '#111B2DE6',
          padding: 8,
          overflow: 'hidden',
        }}>
        {/* tinted glass wash */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: accentColor + '12' }]}
        />
        {/* diagonal sheen */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -60,
            left: -40,
            width: '70%',
            height: '220%',
            backgroundColor: '#FFFFFF0D',
            transform: [{ rotate: '20deg' }],
          }}
        />
        {/* inner hairline highlight */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF14' },
          ]}
        />
        {children}
      </View>
    </View>
  );
}

export function PlainInput({
  value, onChangeText, placeholder, accentColor,
  multiline = false, keyboardType, editable = true,
}: {
  value: string; onChangeText: (v: string) => void;
  placeholder: string; accentColor: string;
  multiline?: boolean; keyboardType?: 'default' | 'numeric'; editable?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#4A5568"
      multiline={multiline}
      editable={editable}
      textAlignVertical={multiline ? 'top' : 'center'}
      keyboardType={keyboardType}
      style={{
        minHeight: multiline ? 90 : 36,
        color: '#F1F5F9', fontSize: 15,
        lineHeight: 22, fontFamily: 'sans',
        opacity: editable ? 1 : 0.7,
      }}
      selectionColor={accentColor}
    />
  );
}

export function ListEmptyHint({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <AppText className="font-sans text-body-sm text-brand-textMuted mt-2 mb-1">
        {text}
      </AppText>
    </Animated.View>
  );
}

export function SaveButton({
  onPress, saving, label, icon, accentColor,
}: {
  onPress: () => void; saving: boolean;
  label: string; icon: React.ReactNode; accentColor: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(400)} style={animStyle}>
      <Pressable
        onPress={onPress}
        disabled={saving}
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 80 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        className="mt-8 py-4 rounded-2xl items-center justify-center flex-row gap-2"
        style={{ backgroundColor: saving ? '#1A2535' : accentColor }}>
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {icon}
            <AppText className="font-sansSemiBold text-body-md text-white">{label}</AppText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* EditSheet — shared bottom-sheet used for: edit/delete boundary,     */
/* edit/delete moment, and the deleted-boundaries list.                */
/*                                                                     */
/* IMPORTANT: This intentionally does NOT use React Native's <Modal>.  */
/* RN's <Modal> on Android has well-known reliability issues when      */
/* several <Modal> instances exist in the same screen (as we had with  */
/* edit-boundary + deleted-boundaries + edit-moment all mounted at     */
/* once) — it can silently fail to show. Instead this uses the exact   */
/* same pattern as the app's other confirmed-working overlays (e.g.    */
/* MediationRequestModal in App.tsx): a plain absolutely-positioned    */
/* View animated with RN's Animated API, no native Modal/Dialog        */
/* involved. This is far more reliable across Android OEM skins.       */
/*                                                                     */
/* NOTE: Because this has no native "portal" the way <Modal> does, the */
/* caller MUST render <EditSheet> at the top level of the screen (a    */
/* direct sibling near the end of the JSX tree), NOT nested inside a   */
/* ScrollView — otherwise Android may clip it since ScrollView clips   */
/* overflowing content by default.                                    */
/* ------------------------------------------------------------------ */
export function EditSheet({ visible, onClose, title, icon, children }: {
  visible: boolean; onClose: () => void;
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  const [rendered, setRendered] = useState(false);
  const backdropAnim = useRef(new RNAnimated.Value(0)).current;
  const sheetAnim = useRef(new RNAnimated.Value(420)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(420);
      RNAnimated.parallel([
        RNAnimated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        RNAnimated.spring(sheetAnim, { toValue: 0, damping: 18, stiffness: 180, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      RNAnimated.parallel([
        RNAnimated.timing(backdropAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        RNAnimated.timing(sheetAnim, { toValue: 420, duration: 150, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  useEffect(() => {
    if (!rendered || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [rendered]);

  if (!rendered) return null;

  const backdropOpacity = backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.75] });

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 999, elevation: 999 }]}
      pointerEvents="box-none"
      collapsable={false}>
      <RNAnimated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: backdropOpacity }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </RNAnimated.View>

      <KeyboardAvoidingView
        style={StyleSheet.absoluteFillObject}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none">
        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <RNAnimated.View
            style={{
              transform: [{ translateY: sheetAnim }],
              backgroundColor: '#0A0E17',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              borderWidth: 1, borderColor: '#1A2535',
              padding: 24, maxHeight: '85%',
            }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 20,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {icon}
                <AppText className="font-sansMedium" style={{ fontSize: 16, color: '#E2E8F0' }}>
                  {title}
                </AppText>
              </View>
              <Pressable
                onPress={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: '#1A2535',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                <X size={16} color="#64748B" />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </RNAnimated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export function BoundaryCard({
  b, index, partnerName, boundaryAction,
  onPress, onAccept, onReject, onDelete,
}: {
  b: BoundaryRow; index: number; partnerName?: string;
  boundaryAction: { id: string; type: 'accept' | 'reject' | 'delete' } | null;
  onPress: () => void;
  onAccept: () => void; onReject: () => void; onDelete: () => void;
}) {
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const rowId = b.boundary_id ?? b.id;
  const iProposed = b.i_proposed;
  const myAccepted = b.my_agreement === true;
  const myPending = b.my_agreement === false && !b.my_agreed_at;
  const myRejected = b.my_agreement === false && !!b.my_agreed_at;
  const partnerAccepted = b.partner_agreement === true;
  const partnerRejected = b.partner_agreement === false && !!b.partner_agreed_at;
  const canAct = !iProposed && myPending;

  const isAccepting = boundaryAction?.id === rowId && boundaryAction?.type === 'accept';
  const isRejecting = boundaryAction?.id === rowId && boundaryAction?.type === 'reject';
  const isDeleting  = boundaryAction?.id === rowId && boundaryAction?.type === 'delete';
  const isAnyLoading = isAccepting || isRejecting || isDeleting;

  const borderColor =
    (myAccepted && partnerAccepted) ? '#4ADE8033' :
    (myRejected || partnerRejected) ? '#F8717133' :
    '#4F7BF733';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(350).springify().damping(18)}
      style={pressStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { pressScale.value = withTiming(0.98, { duration: 80 }); }}
        onPressOut={() => { pressScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        style={{
          backgroundColor: '#0F1923', borderWidth: 1,
          borderColor, borderRadius: 16, padding: 16, gap: 12,
        }}>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <AppText
            className="font-sansMedium text-body-md text-brand-textPrimary"
            style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>
            {b.title}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Pencil size={12} color="#4F7BF7" />
          </View>
          <View style={{
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
            backgroundColor: iProposed ? '#1A2D4A' : '#2D1B4E',
          }}>
            <AppText style={{ fontSize: 10, color: iProposed ? '#4F7BF7' : '#A78BFA', fontFamily: 'sans' }}>
              {iProposed ? 'You' : partnerName ?? 'Partner'}
            </AppText>
          </View>
        </View>

        {b.description ? (
          <AppText style={{ fontSize: 13, color: '#64748B', lineHeight: 20, fontFamily: 'sans' }}>
            {b.description}
          </AppText>
        ) : null}

        <View style={{ height: 1, backgroundColor: '#1A2535' }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
              backgroundColor: myAccepted ? '#14241C' : myRejected ? '#2D1212' : '#1A2535',
            }}>
              {myAccepted ? <CheckCircle2 size={11} color="#4ADE80" />
                : myRejected ? <XCircle size={11} color="#F87171" />
                : <Clock size={11} color="#64748B" />}
              <AppText style={{
                fontSize: 11, fontFamily: 'sans',
                color: myAccepted ? '#4ADE80' : myRejected ? '#F87171' : '#64748B',
              }}>
                {myAccepted ? 'You accepted' : myRejected ? 'You rejected' : 'Your response'}
              </AppText>
            </View>

            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
              backgroundColor: partnerAccepted ? '#14241C' : partnerRejected ? '#2D1212' : '#1A2535',
            }}>
              {partnerAccepted ? <CheckCircle2 size={11} color="#4ADE80" />
                : partnerRejected ? <XCircle size={11} color="#F87171" />
                : <Clock size={11} color="#64748B" />}
              <AppText style={{
                fontSize: 11, fontFamily: 'sans',
                color: partnerAccepted ? '#4ADE80' : partnerRejected ? '#F87171' : '#64748B',
              }}>
                {partnerAccepted ? `${partnerName ?? 'Partner'} accepted`
                  : partnerRejected ? `${partnerName ?? 'Partner'} rejected`
                  : `${partnerName ?? 'Partner'} pending`}
              </AppText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {canAct && (
              <>
                <Pressable
                  onPress={onAccept}
                  disabled={isAnyLoading}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: '#14241C', borderWidth: 1, borderColor: '#22C55E55',
                    opacity: isAnyLoading ? 0.6 : 1,
                  }}>
                  {isAccepting
                    ? <ActivityIndicator size="small" color="#22C55E" />
                    : <><CheckCircle2 size={13} color="#22C55E" />
                        <AppText style={{ fontSize: 12, color: '#22C55E', fontFamily: 'sansMedium' }}>Accept</AppText></>}
                </Pressable>
                <Pressable
                  onPress={onReject}
                  disabled={isAnyLoading}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: '#2D1212', borderWidth: 1, borderColor: '#F8717155',
                    opacity: isAnyLoading ? 0.6 : 1,
                  }}>
                  {isRejecting
                    ? <ActivityIndicator size="small" color="#F87171" />
                    : <><XCircle size={13} color="#F87171" />
                        <AppText style={{ fontSize: 12, color: '#F87171', fontFamily: 'sansMedium' }}>Reject</AppText></>}
                </Pressable>
              </>
            )}
            {(iProposed || !myPending) && (
              <Pressable
                onPress={onDelete}
                disabled={isAnyLoading}
                style={{
                  alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: '#1A2535', borderWidth: 1, borderColor: '#2D3748',
                  opacity: isAnyLoading ? 0.6 : 1,
                }}>
                {isDeleting
                  ? <ActivityIndicator size="small" color="#F87171" />
                  : <Trash2 size={14} color="#F87171" />}
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SavedTextPreview({
  savedText, justSaved, accentColor, saving,
  onEdit, onDelete,
}: {
  savedText: string; justSaved: boolean; accentColor: string;
  saving: boolean; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      className="mt-6">
      <View className="flex-row items-center gap-2 mb-2">
        <Animated.View entering={justSaved ? ZoomIn.duration(300) : FadeIn.duration(200)}>
          <CheckCircle2 size={14} color={justSaved ? '#4ADE80' : '#64748B'} />
        </Animated.View>
        <AppText
          className="font-sansMedium text-[11px] uppercase tracking-[1.5px]"
          style={{ color: justSaved ? '#4ADE80' : '#64748B' }}>
          {justSaved ? 'Saved ✓' : 'Currently Saved'}
        </AppText>
      </View>
      <FormCard accentColor={accentColor}>
        <AppText className="font-sans text-body-md text-brand-textPrimary leading-6">
          {savedText}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Pressable
            onPress={onEdit}
            disabled={saving}
            style={{
              flex: 1, flexDirection: 'row', gap: 6,
              alignItems: 'center', justifyContent: 'center',
              paddingVertical: 10, borderRadius: 12,
              backgroundColor: '#1A2535', borderWidth: 1, borderColor: '#2D3748',
              opacity: saving ? 0.6 : 1,
            }}>
            <Pencil size={14} color="#94A3B8" />
            <AppText style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'sansMedium' }}>Edit</AppText>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={saving}
            style={{
              flex: 1, flexDirection: 'row', gap: 6,
              alignItems: 'center', justifyContent: 'center',
              paddingVertical: 10, borderRadius: 12,
              backgroundColor: '#2D1212', borderWidth: 1, borderColor: '#F8717155',
              opacity: saving ? 0.6 : 1,
            }}>
            <Trash2 size={14} color="#F87171" />
            <AppText style={{ fontSize: 13, color: '#F87171', fontFamily: 'sansMedium' }}>Delete</AppText>
          </Pressable>
        </View>
      </FormCard>
    </Animated.View>
  );
}
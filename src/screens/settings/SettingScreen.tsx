
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Crown,
  CreditCard,
  LogOut,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import EditProfileScreen from './EditProfileScreen';
import { apiClient } from '../../utils/axiosClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AppText from '../../components/common/AppText';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';
import { SettingStackParamList } from './Settingnnavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';

function getDisplayName(email?: string) {
  if (!email) return 'User';
  const local = email.split('@')[0] ?? 'User';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function getInitial(email?: string) {
  if (!email) return 'U';
  return (email.charAt(0) || 'U').toUpperCase();
}

function addCacheBuster(url: string): string {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

interface AccountScreenProps {
  onBack?: () => void;
}

export default function AccountScreen({ onBack }: AccountScreenProps) {
  const { user, signOut, isSubscribed, isTrialActive, trialDaysLeft } = useAuth();
  const email = user?.email ?? '';
  const navigation = useNavigation<NativeStackNavigationProp<SettingStackParamList>>();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  const [displayName, setDisplayName] = useState(getDisplayName(email));
  const [loading, setLoading] = useState(true);
  const headerAnim   = useRef(new Animated.Value(0)).current;
  const profileAnim  = useRef(new Animated.Value(0)).current;
  const planAnim     = useRef(new Animated.Value(0)).current;
  const settingsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim  = useRef(new Animated.Value(0)).current;
  const {colors}= useTheme();
  const runEntranceAnimations = useCallback(() => {
    [headerAnim, profileAnim, planAnim, settingsAnim, actionsAnim].forEach(a =>
      a.setValue(0),
    );
    Animated.stagger(65, [
      Animated.spring(headerAnim,   { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }),
      Animated.spring(profileAnim,  { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }),
      Animated.spring(planAnim,     { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }),
      Animated.spring(settingsAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }),
      Animated.spring(actionsAnim,  { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }),
    ]).start();
  }, [headerAnim, profileAnim, planAnim, settingsAnim, actionsAnim]);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
    }],
  });

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/auth/profile');
      setProfilePicture(addCacheBuster(data.profile.profile_picture ?? ''));
      setDisplayName(data.profile.display_name ?? getDisplayName(email));
    } catch {}
    finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!loading) runEntranceAnimations();
  }, [loading, runEntranceAnimations]);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const handleBack = async () => {
    setShowEditProfile(false);
    await fetchProfile();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); }
    finally { setLoggingOut(false); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bgMain items-center justify-center">
        <AnimatedInfinityLogo mode="loop" size={64}  />
      </SafeAreaView>
    );
  }
  if (showEditProfile) {
    return <EditProfileScreen onBack={handleBack} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
            <StatusBar
        translucent={false}
        backgroundColor="#0C1422"
        barStyle="light-content"
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 36, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Animated.View style={animStyle(headerAnim)} className="mt-3 mb-5">
          <TouchableOpacity
            onPress={() => {
              setShowEditProfile(false);
              // navigation.navigate('SettingTab');
              navigation.goBack();
            }}
            className="w-9 h-9 rounded-full bg-brand-bgCardMain border-[0.5px] border-brand-borderSoft items-center justify-center">
            <ArrowLeft size={18} color="#94A3B8" />
          </TouchableOpacity>
          <AppText className="font-heading text-[30px] text-brand-textPrimary tracking-tight mt-3 mb-0.5">
            Your Account
          </AppText>
          <AppText className="font-sans text-[13px] text-brand-textMuted">
            Manage your profile and preferences
          </AppText>
        </Animated.View>

        {/* ── Profile Card ── */}
        <Animated.View style={animStyle(profileAnim)}>
          <Pressable
            onPress={() => setShowEditProfile(true)}
            className="bg-brand-bgCardMain rounded-[20px] border-[0.5px] border-brand-borderSoft p-4 flex-row items-center mb-3"
            android_ripple={{ color: '#1E2A40' }}>

            {/* Avatar */}
            <View className="w-[52px] h-[52px] rounded-full bg-brand-bgCardSoft items-center justify-center mr-3 overflow-hidden border-[1.5px] border-brand-primary">
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={{ width: 52, height: 52, borderRadius: 26 }}
                  resizeMode="cover"
                />
              ) : (
                <AppText className="font-heading text-[22px] text-brand-accent">
                  {getInitial(email)}
                </AppText>
              )}
            </View>

            {/* Name & Email */}
            <View className="flex-1">
              <AppText className="font-heading text-[19px] text-brand-textPrimary leading-[22px]">
                {displayName}
              </AppText>
              <View className="flex-row items-center gap-1 mt-0.5">
                <AppText className="font-sans text-[12px] text-brand-textMuted">
                  {email}
                </AppText>
                <Pencil size={10} color="#64748B" strokeWidth={1.8} />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View style={animStyle(planAnim)}>
          <AppText
            className="font-sansSemiBold text-[11px] text-brand-textMuted tracking-widest mb-2"
            style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Plan
          </AppText>

          {isSubscribed ? (
 
            <View
              className="rounded-[20px] p-3.5 mb-3"
              style={{
                backgroundColor: '#7C3AED40',
                shadowColor: '#7C3AED',
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
             
              }}>
              <View className="flex-row items-center mb-2.5">
                <View className="w-8 h-8 rounded-[10px] bg-white/15 items-center justify-center mr-2.5">
                  <Sparkles size={16} color="#FFFFFF" />
                </View>
                <AppText className="font-sansMedium text-[13px] text-white flex-1">
                  Subscription
                </AppText>
                <View className="bg-white/20 rounded-full px-2.5 py-1 flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <AppText className="font-sansBold text-[10px] text-white" style={{ letterSpacing: 1.2 }}>
                    ACTIVE
                  </AppText>
                </View>
              </View>

              <View className="bg-white/[0.03] rounded-xl px-3.5 py-2.5 flex-row items-center">
                <View className="flex-1">
                  <AppText className="font-sansSemiBold text-[14px] text-white">
                    Premium Plan
                  </AppText>
                  <AppText className="font-sans text-[12px] text-white/70 mt-0.5">
                    $20/month · Unlimited Dr. Harmony access
                  </AppText>
                </View>
              </View>
            </View>
          ) : isTrialActive ? (
            <View className="bg-brand-bgCardMain rounded-[20px] border-[0.5px] border-brand-borderSoft p-3.5 mb-3">
              <View className="flex-row items-center mb-2.5">
                <CreditCard size={15} color="var(--color-tab-active, #4F7BF7)" strokeWidth={1.8} />
                <AppText className="font-sansMedium text-[13px] text-brand-textSecondary ml-1.5">
                  Subscription
                </AppText>
                <View className="ml-auto bg-brand-bgMain border-[0.5px] border-brand-borderLight rounded-full px-2.5 py-1">
                  <AppText
                    className="font-sansBold text-[10px] text-brand-tabActive"
                    style={{ letterSpacing: 1.2 }}>
                    TRIAL
                  </AppText>
                </View>
              </View>

              <Pressable
                onPress={() => navigation.navigate('SubscriptionPayment')}
                className="bg-brand-bgCardSoft rounded-xl px-3.5 py-2.5 flex-row items-center">
                <View className="w-[3px] h-8 rounded-sm bg-brand-tabActive mr-3" />
                <View className="flex-1">
                  <AppText className="font-sansSemiBold text-[14px] text-brand-textPrimary">
                    Free Trial
                  </AppText>
                  <AppText className="font-sans text-[12px] text-brand-textMuted mt-0.5">
                    {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
                  </AppText>
                </View>
                <AppText className="font-sansMedium text-[12px] text-brand-tabActive">
                  Upgrade →
                </AppText>
              </Pressable>
            </View>
          ) : (
            // Gold upsell — intentionally consistent across themes (brand accent, not surface color)
            <Pressable
              onPress={() => navigation.navigate('SubscriptionPayment')}
              className="rounded-[20px] p-3.5 mb-3"
              style={{
                backgroundColor: '#C9A84C',
                shadowColor: '#C9A84C',
                shadowOpacity: 0.45,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}>
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-black/[0.15] items-center justify-center mr-3">
                  <Crown size={20} color="#0A0E17" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <AppText className="font-sansBold text-[14px]" style={{ color: '#0A0E17' }}>
                    Unlock Premium
                  </AppText>
                  <AppText className="font-sans text-[12px] mt-0.5" style={{ color: '#3D2F10' }}>
                    Unlimited Dr. Harmony · $20/month
                  </AppText>
                </View>
                <View className="bg-black/[0.15] rounded-full px-3 py-1.5">
                  <AppText className="font-sansBold text-[12px]" style={{ color: '#0A0E17' }}>
                    Upgrade
                  </AppText>
                </View>
              </View>
            </Pressable>
          )}
        </Animated.View>

        {/* ── Settings Section ── */}
        <Animated.View style={animStyle(settingsAnim)}>
          <AppText
            className="font-sansSemiBold text-[11px] text-brand-textMuted mb-2"
            style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Settings
          </AppText>
          <View className="bg-brand-bgCardMain rounded-[20px] border-[0.5px] border-brand-borderSoft px-4 mb-3 overflow-hidden">
            <View className="h-[0.5px] bg-brand-borderSoft" />
          </View>
        </Animated.View>

        <Animated.View style={[animStyle(actionsAnim), { flexDirection: 'row', gap: 8 }]}>
          {/* Log Out */}
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            className="flex-1 bg-red-500/[0.12] border-[0.5px] border-red-400/20 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
            style={{ opacity: loggingOut ? 0.5 : 1 }}>
            <LogOut size={16} color="#F87171" strokeWidth={1.8} />
            <AppText className="font-sansMedium text-[14px] text-red-400">
              {loggingOut ? 'Signing out…' : 'Log Out'}
            </AppText>
          </Pressable>

          {/* Delete Account */}
          <Pressable
            onPress={handleDeleteAccount}
            className="flex-1 bg-brand-bgCardMain border-[0.5px] border-brand-borderSoft rounded-2xl py-3.5 flex-row items-center justify-center gap-2">
            <Trash2 size={15} color="var(--color-text-muted, #64748B)" strokeWidth={1.8} />
            <AppText className="font-sans text-[14px] text-brand-textMuted">
              Delete Account
            </AppText>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
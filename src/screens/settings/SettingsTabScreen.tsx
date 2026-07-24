

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  CreditCard,
  Crown,
  FileText,
  Globe,
  Key,
  Moon,
  Shield,
  Sparkles,
} from 'lucide-react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import AppText from '../../components/common/AppText';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SettingsRow, { ProfileRow } from '../../components/settings/SettingsRow';
import { SettingsDivider, SettingsSection } from '../../components/settings/SettingsSection';
import SwitchToggle from '../../components/settings/SwitchToggle';
import AccountScreen from './SettingScreen';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { apiClient } from '../../utils/axiosClient';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';
import messaging from '@react-native-firebase/messaging';
import { getNotificationPref, saveNotificationPref } from '../../hooks/usePushNotifications';
import { getSubscriptionStatus, listPaymentMethods } from '../../utils/subscription';

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


function PremiumCardGlow() {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] });

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute -top-3 -left-3 -right-3 -bottom-3"
      style={{ opacity, transform: [{ scale }] }}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="premiumGlow" cx="50%" cy="50%" r="65%">
            <Stop offset="0%" stopColor="#A855F7" stopOpacity={0.5} />
            <Stop offset="55%" stopColor="#7C3AED" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#premiumGlow)" />
      </Svg>
    </Animated.View>
  );
}

export default function SettingsTabScreen() {
  const { user, signOut, refreshSubscriptionStatus, setOptimisticSubscribed, isSubscribed, isTrialActive, trialDaysLeft } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const email = user?.email ?? 'yourmail@gmail.com';
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [profilePicture, setProfilePicture] = useState('');
  const [displayName, setDisplayName] = useState(getDisplayName(email));
  const [profileLoading, setProfileLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');

  const [defaultCard, setDefaultCard] = useState<{
    card_brand: string;
    card_last4: string;
  } | null>(null);

  const pendingConfirmRef = useRef(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/auth/profile');
      setProfilePicture(addCacheBuster(data.profile.profile_picture ?? ''));
      setDisplayName(data.profile.display_name ?? getDisplayName(email));

      const enabled = await getNotificationPref();
      setNotifications(enabled);

      try {
        const { status } = await getSubscriptionStatus();
        setSubscriptionStatus((prev) =>
          pendingConfirmRef.current && status !== 'active' ? prev : status
        );
        if (status === 'active') {
          pendingConfirmRef.current = false;
        } else if (pendingConfirmRef.current) {
          // waiting on webhook confirmation, keep optimistic state
        } else {
          setOptimisticSubscribed(status === 'active');
        }
      } catch (err) {
        console.warn('[subscription] status fetch failed:', err);
      }

      try {
        const cards = await listPaymentMethods();
        const card = cards.find((c: any) => c.is_default) ?? cards[0] ?? null;
        setDefaultCard(card ? { card_brand: card.card_brand, card_last4: card.card_last4 } : null);
      } catch (err) {
        console.warn('[cards] fetch failed:', err);
      }
    } catch {

    } finally {
      setProfileLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.justSubscribed) {
        setSubscriptionStatus('active');
        setOptimisticSubscribed(true);
        pendingConfirmRef.current = true;
        navigation.setParams({ justSubscribed: undefined });

        const t1 = setTimeout(() => fetchProfile(), 1500);
        const t2 = setTimeout(() => fetchProfile(), 4000);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }

      fetchProfile();
    }, [route.params?.justSubscribed, fetchProfile, navigation])
  );

  if (showAccount) {
    return (
      <AccountScreen
        onBack={() => {
          setShowAccount(false);
          fetchProfile();
        }}
      />
    );
  }

  async function handleNotificationToggle(
    enabled: boolean,
    setNotifications: (val: boolean) => void
  ) {
    try {
      if (enabled) {
        const status = await messaging().requestPermission();
        const granted =
          status === messaging.AuthorizationStatus.AUTHORIZED ||
          status === messaging.AuthorizationStatus.PROVISIONAL;

        if (!granted) {
          setNotifications(false);
          await saveNotificationPref(false);
          return;
        }

        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          await apiClient.patch('/auth/profile', { fcm_token: fcmToken });
        }
        await saveNotificationPref(true);
      } else {
        await apiClient.patch('/auth/profile', { fcm_token: null });
        await saveNotificationPref(false);
      }
    } catch (err: any) {
      console.warn('[push] toggle failed:', err.message);
    }
  }

  if (profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bgMain items-center justify-center" edges={['top']}>
        <AnimatedInfinityLogo size={56} mode="loop" />
      </SafeAreaView>
    );
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
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}>
        <View className="mt-4 mb-6">
          <AppText className="font-heading text-display-lg text-brand-textPrimary mb-1">
            Settings
          </AppText>
          <Text className="font-sans text-body-md text-brand-textSecondary">{email}</Text>
        </View>

        <SettingsSection title="Profile">
          <ProfileRow
            initial={getInitial(email)}
            name={displayName}
            email={email}
            profilePicture={profilePicture}
            onPress={() => navigation.navigate('SettingScreen')}
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsRow
            icon={Globe}
            title="Language / Idioma"
            showChevron={false}
            rightElement={<LanguageSwitcher />}
          />
          <SettingsDivider />
          <SettingsRow
            icon={Bell}
            title="Notifications"
            subtitle="Dr. Harmony messages, relationship updates"
            showChevron={false}
            rightElement={
              <SwitchToggle
                value={notifications}
                onChange={async (val) => {
                  setNotifications(val);
                  await handleNotificationToggle(val, setNotifications);
                }}
              />
            }
          />
          {/* <SettingsDivider /> */}
          {/* <SettingsRow
            icon={Moon}
            title="Dark Mode"
            subtitle={isDark ? 'On — easier on the eyes at night' : 'Off — bright and clear in daylight'}
            showChevron={false}
            rightElement={<SwitchToggle value={isDark} onChange={toggleTheme} />}
          /> */}
        </SettingsSection>

        <SettingsSection title="Plan">
        {isSubscribed ? (
  <View className="w-full rounded-9xl p-4 flex-row items-center bg-violet-600/90 dark:bg-violet-700/20 border border-white/15">
    <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3">
      <Sparkles size={18} color="#FFFFFF" />
    </View>

    <View className="flex-1 pr-2">
      <AppText className="font-sansMedium text-body-md text-white">
        Premium Plan
      </AppText>
      <AppText className="font-sans text-body-xs text-white/70 mt-0.5">
        $20/month
      </AppText>
    </View>

    <View className="px-2.5 py-1 rounded-full bg-white/25 flex-row items-center shrink-0">
      <View className="w-1.5 h-1.5 rounded-full bg-green-400" />
      <AppText className="font-sansMedium text-body-xs text-white ml-1.5">
        Active
      </AppText>
    </View>
  </View>
) : isTrialActive ? ( 
            <SettingsRow
              icon={CreditCard}
              title="Free Trial"
              subtitle={`${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'} left`}
              showChevron={false}
              rightElement={
                <Pressable
                  onPress={() => navigation.navigate('SubscriptionPayment')}
                  className="px-4 py-2 rounded-full bg-brand-tabActive">
                  <AppText className="font-sansMedium text-body-sm text-white">
                    Upgrade $20/mo
                  </AppText>
                </Pressable>
              }
            />
          ) : (
            <Pressable
              onPress={() => navigation.navigate('SubscriptionPayment')}
              className="rounded-card p-4 flex-row items-center  bg-yellow-300/80"
              style={styles.upsellCardShadow}>
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-black/15 dark:bg-black/25">
                <Crown size={18} color={isDark ? '#F5D98B' : '#0A0E17'} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <AppText className="font-sansBold text-body-md text-slate-900 dark:text-amber-100">
                  Unlock Premium
                </AppText>
                <AppText className="font-sans text-xs mt-0.5 text-amber-900 ">
                  Unlimited Dr. Harmony · $20/month
                </AppText>
              </View>
              <View className="px-3 py-1.5 rounded-full bg-black/15 dark:bg-black/25">
                <AppText className="font-sansBold text-body-xs text-slate-900 dark:text-amber-100">
                  Upgrade
                </AppText>
              </View>
            </Pressable>
          )}
        </SettingsSection>

        {(isSubscribed || isTrialActive) && (
          <SettingsSection title="Payment Method">
            <SettingsRow
              icon={CreditCard}
              title={
                defaultCard
                  ? `${defaultCard.card_brand.charAt(0).toUpperCase() + defaultCard.card_brand.slice(1)} •••• ${defaultCard.card_last4}`
                  : 'No card saved'
              }
              subtitle={defaultCard ? 'Tap to add or remove cards' : 'Add a card for faster checkout'}
              onPress={() => navigation.navigate('SubscriptionPayment')}
            />
          </SettingsSection>
        )}

        <SettingsSection title="Account">
        <SettingsRow
            icon={Key}
            title="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsDivider />
          <SettingsRow icon={Shield} title="Privacy Policy" />
          <SettingsDivider />
          <SettingsRow icon={FileText} title="Terms of Service" />
        </SettingsSection>

        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          className="mt-2 py-4 items-center rounded-card border border-brand-borderSoft active:bg-black/5 dark:active:bg-white/5">
          <AppText className="font-sansMedium text-body-md text-red-500 dark:text-red-400">
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  premiumCardShadow: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  upsellCardShadow: {

  },
});
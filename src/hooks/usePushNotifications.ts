

import { useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/axiosClient';

const NOTIF_KEY = 'notifications_enabled';

export async function saveNotificationPref(enabled: boolean) {
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(enabled));
}

export async function getNotificationPref(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_KEY);
  if (val === null) return true; // default on
  return JSON.parse(val);
}

export function usePushNotifications(isAuthenticated: boolean) {
  const unsubRefresh = useRef<(() => void) | undefined>(undefined);
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
      register().then((unsub) => {
        unsubRefresh.current = unsub;
      });
    } else if (wasAuthenticated.current) {
      unsubRefresh.current?.();
      unsubRefresh.current = undefined;
      unregister();
      wasAuthenticated.current = false;
    }

    return () => {
      unsubRefresh.current?.();
      unsubRefresh.current = undefined;
    };
  }, [isAuthenticated]);
}

async function register() {
  try {

    const enabled = await getNotificationPref();
    if (!enabled) {
      console.log('[push] notifications disabled by user, skipping');
      return;
    }

    const status = await messaging().requestPermission();
    const granted =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;

    if (!granted) {
      console.log('[push] permission denied');
      return;
    }

    const fcmToken = await messaging().getToken();
    if (!fcmToken) return;

    await postToken(fcmToken);

    const unsub = messaging().onTokenRefresh(async (newToken) => {
      const stillEnabled = await getNotificationPref();
      if (stillEnabled) await postToken(newToken);
    });

    return unsub;
  } catch (err: any) {
    console.error('[push] register failed:', err.message);
  }
}

async function unregister() {
  try {
    await apiClient.patch('/auth/profile', { fcm_token: null });
    console.log('[push] token unregistered');
  } catch (err: any) {
    console.warn('[push] unregister failed:', err.message);
  }
}

async function postToken(fcmToken: string) {
  try {
    const res = await apiClient.patch('/auth/profile', { fcm_token: fcmToken });
    console.log('[push] token registered:', res.data);
  } catch (err: any) {
    console.error('[push] failed to post token:', err.response?.status, err.response?.data);
  }
}

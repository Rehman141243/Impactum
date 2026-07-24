

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import {
  forgotPassword as forgotPasswordApi,
  getGoogleOAuthUrl,
  login as loginApi,
  logout as logoutApi,
  resetPassword as resetPasswordApi,
  signUp as signUpApi,
  type AuthUser,
} from '../utils/authSerrvice';
import { eventEmitter } from '../utils/axiosClient';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from './ToastContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { refreshAccessToken, RefreshNetworkError } from '../utils/refreshauth';
import { getSubscriptionStatus } from '../utils/subscription';
import {
  saveTokens,
  getTokens,
  clearTokens,
  saveBiometricCredentials,
  getBiometricCredentials,
  isBiometricAvailable,
  hasBiometricCredentials,
  clearBiometricCredentials,
  getBiometryTypeLabel,
} from '../utils/KeyChainServices';
import { NetworkStatus, useNetworkStatus } from '../utils/UseNetworkStatus';

const USER_KEY = 'authUser';
const TRIAL_START_KEY = 'trialStartedAt';
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (accessToken: string, newPassword: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;

  isTrialActive: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  trialSecondsLeft: number;

  isSubscribed: boolean;
  subscriptionStatus: string;
  subscriptionLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  setOptimisticSubscribed: (active: boolean) => void;
  canTalkToDrHarmony: boolean;

  // ── Biometric login ──────────────────────────────────────────────────
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometryLabel: string;
  enableBiometricLogin: (email: string, password: string) => Promise<boolean>;
  disableBiometricLogin: () => Promise<void>;
  signInWithBiometrics: () => Promise<boolean>;

  // ── Logout tracking (prevents auto biometric re-login right after
  // an explicit sign-out) ────────────────────────────────────────────
  justLoggedOut: boolean;
  acknowledgeLogout: () => void;


  networkStatus: NetworkStatus;
  isOffline: boolean;
  retryNetwork: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(accessToken: string, refreshToken: string, user: AuthUser) {
  await saveTokens(accessToken, refreshToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
  await clearTokens();
  await AsyncStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess, showError, showWarning } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialStartedAt, setTrialStartedAt] = useState<number | null>(null);

  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // ── Network status ──────────────────────────────────────────────────────
  const { status: networkStatus, retry: retryNetwork } = useNetworkStatus();
  const isOffline = networkStatus === 'offline';

  // ── Biometric state ────────────────────────────────────────────────────
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState('Biometrics');

  // ── Logout tracking ─────────────────────────────────────────────────────
  // Set to true right when signOut() finishes. LoginScreen checks this on
  // mount to skip the auto biometric prompt for the screen that appears
  // immediately after an explicit logout — otherwise Face/Touch ID fires
  // instantly and logs the user right back in, making logout look broken.
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const acknowledgeLogout = useCallback(() => setJustLoggedOut(false), []);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) setBiometryLabel(await getBiometryTypeLabel());
      setBiometricEnabled(await hasBiometricCredentials());
    })();
  }, []);

  const enableBiometricLogin = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const available = await isBiometricAvailable();
      if (!available) {
        showWarning('Biometric authentication is not available on this device.');
        return false;
      }
      try {
        await saveBiometricCredentials(email, password);
        setBiometricEnabled(true);
        showSuccess(`${await getBiometryTypeLabel()} login enabled.`);
        return true;
      } catch (err) {
        showError('Could not enable biometric login.');
        return false;
      }
    },
    [showSuccess, showWarning, showError],
  );

  const disableBiometricLogin = useCallback(async () => {
    await clearBiometricCredentials();
    setBiometricEnabled(false);
  }, []);

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user?.id) {
      setSubscriptionStatus('none');
      setSubscriptionLoading(false);
      return;
    }
    // No point hitting the API if we already know we're offline —
    // leave whatever status we last had cached in state.
    if (isOffline) {
      setSubscriptionLoading(false);
      return;
    }
    try {
      const { status } = await getSubscriptionStatus();
      setSubscriptionStatus(status ?? 'none');
    } catch (err) {
      console.warn('[AuthContext] subscription status fetch failed:', err);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user?.id, isOffline]);

  useEffect(() => {
    if (user?.id && !isOffline) {
      setSubscriptionLoading(true);
      refreshSubscriptionStatus();
    } else if (!user?.id) {
      setSubscriptionStatus('none');
      setSubscriptionLoading(false);
    }
  }, [user?.id, isOffline, refreshSubscriptionStatus]);

  const isSubscribed = subscriptionStatus === 'active';
  const setOptimisticSubscribed = useCallback((active: boolean) => {
    setSubscriptionStatus(active ? 'active' : 'none');
  }, []);

  const ensureTrialStarted = useCallback(async () => {
    const existing = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (existing) {
      setTrialStartedAt(Number(existing));
      return;
    }
    const now = Date.now();
    await AsyncStorage.setItem(TRIAL_START_KEY, String(now));
    setTrialStartedAt(now);
  }, []);

  usePushNotifications(!!user?.id);

  const restoreSession = useCallback(async () => {
    try {
      const tokens = await getTokens();
      const userJson = await AsyncStorage.getItem(USER_KEY);

      if (!tokens || !userJson) return;
      const { accessToken } = tokens;

      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const isExpired = Date.now() > expiresAt - 60_000;

      if (isExpired) {
        // No signal at all — don't even attempt the refresh call, and
        // don't clear the session. Restore the cached user optimistically;
        // the axios interceptor / next authenticated call will sort out
        // a real refresh once connectivity returns.
        if (networkStatus === 'offline') {
          await ensureTrialStarted();
          setUser(JSON.parse(userJson));
          return;
        }

        try {
          if (!(await refreshAccessToken())) {
            await clearSession();
            setUser(null);
            return;
          }
        } catch (e) {
          if (e instanceof RefreshNetworkError) {
            if (__DEV__) console.warn('[restoreSession] network error, keeping token');
          } else {
            await clearSession();
            setUser(null);
            return;
          }
        }
      }
      await ensureTrialStarted();
      setUser(JSON.parse(userJson));
    } catch {
      await clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [ensureTrialStarted, networkStatus]);

  // Wait for the first NetInfo reading before deciding anything about the
  // session — this avoids treating "haven't checked connectivity yet" the
  // same as "definitely offline" during the very first frame of app boot.
  useEffect(() => {
    if (networkStatus === 'checking') return;
    restoreSession();
    // Intentionally NOT re-running on every networkStatus flip after the
    // first resolution — reconnecting shouldn't re-run the whole restore
    // flow (that's handled by the axios refresh interceptor instead).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkStatus === 'checking']);

  useEffect(() => {
    const handleTokenExpired = (payload: { message?: string }) => {
      setUser(null);
      showWarning(payload.message ?? 'Kindly Login 1st');
    };
    eventEmitter.on('tokenExpired', handleTokenExpired);
    return () => {
      eventEmitter.off('tokenExpired', handleTokenExpired);
    };
  }, [showWarning]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (isOffline) {
        showWarning('No internet connection. Please try again once you\'re back online.');
        return false;
      }
      try {
        const res = await loginApi(email, password);
        await persistSession(res.session.access_token, res.session.refresh_token, res.user);
        await ensureTrialStarted();
        setUser(res.user);
        showSuccess(res.message ?? 'Login successful.');
        return true;
      } catch (err) {
        showError(getApiErrorMessage(err, 'Login failed. Please try again.'));
        return false;
      }
    },
    [showSuccess, showError, showWarning, ensureTrialStarted, isOffline],
  );

  // ── Biometric sign-in: fingerprint/Face ID se stored credentials nikal
  // kar wahi normal signIn() call karta hai ──
  const signInWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (isOffline) {
      showWarning('No internet connection. Please try again once you\'re back online.');
      return false;
    }
    const label = biometryLabel || 'Biometrics';
    const creds = await getBiometricCredentials(`Log in with ${label}`);
    if (!creds) {
      return false; // cancel hua ya match nahi hua
    }
    return signIn(creds.email, creds.password);
  }, [signIn, biometryLabel, isOffline, showWarning]);

  const trialSecondsLeft = useMemo(() => {
    if (!trialStartedAt) return Math.floor(TRIAL_DURATION_MS / 1000);
    const msLeft = TRIAL_DURATION_MS - (Date.now() - trialStartedAt);
    return Math.max(0, Math.ceil(msLeft / 1000));
  }, [trialStartedAt]);

  const signUp = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (isOffline) {
        showWarning('No internet connection. Please try again once you\'re back online.');
        return false;
      }
      try {
        const res = await signUpApi(email, password);
        await ensureTrialStarted();
        showSuccess(res.message ?? 'Account created. Please check your email to confirm.');
        return true;
      } catch (err) {
        showError(getApiErrorMessage(err, 'Sign up failed. Please try again.'));
        return false;
      }
    },
    [showSuccess, showError, showWarning, ensureTrialStarted, isOffline],
  );

  const signOut = useCallback(async () => {
    try {
      if (!isOffline) {
        await logoutApi();
      }
      showSuccess('Logged out successfully.');
    } catch (err) {
      showWarning(getApiErrorMessage(err, 'Logged out locally.'));
    } finally {
      await clearSession();
      setUser(null);
      setSubscriptionStatus('none');
      setJustLoggedOut(true); // ← tells LoginScreen to skip the auto biometric prompt once
    }
  }, [showSuccess, showWarning, isOffline]);

  const forgotPassword = useCallback(
    async (email: string): Promise<boolean> => {
      if (isOffline) {
        showWarning('No internet connection. Please try again once you\'re back online.');
        return false;
      }
      try {
        const res = await forgotPasswordApi(email);
        showSuccess(res.message ?? 'If that email exists, a reset link has been sent.');
        return true;
      } catch (err) {
        showError(getApiErrorMessage(err, 'Could not send reset link. Please try again.'));
        return false;
      }
    },
    [showSuccess, showError, showWarning, isOffline],
  );

  const resetPassword = useCallback(
    async (accessToken: string, newPassword: string): Promise<boolean> => {
      if (isOffline) {
        showWarning('No internet connection. Please try again once you\'re back online.');
        return false;
      }
      try {
        const res = await resetPasswordApi(accessToken, newPassword);
        showSuccess(res.message ?? 'Password updated successfully.');
        return true;
      } catch (err) {
        showError(getApiErrorMessage(err, 'Reset failed. Please try again.'));
        return false;
      }
    },
    [showSuccess, showError, showWarning, isOffline],
  );

  const signInWithGoogle = useCallback(async () => {
    if (isOffline) {
      showWarning('No internet connection. Please try again once you\'re back online.');
      return;
    }
    try {
      const { url } = await getGoogleOAuthUrl();
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showError('Unable to open Google sign-in.');
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Google sign-in is unavailable right now.'));
    }
  }, [showError, showWarning, isOffline]);

  const isTrialActive = useMemo(() => {
    if (!trialStartedAt) return true;
    return Date.now() - trialStartedAt < TRIAL_DURATION_MS;
  }, [trialStartedAt]);

  const trialDaysLeft = useMemo(() => {
    if (!trialStartedAt) return 7;
    const msLeft = TRIAL_DURATION_MS - (Date.now() - trialStartedAt);
    return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  }, [trialStartedAt]);

  const trialExpired = !isTrialActive;
  const canTalkToDrHarmony = isTrialActive || isSubscribed;

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      resetPassword,
      signInWithGoogle,
      isTrialActive,
      trialDaysLeft,
      trialExpired,
      trialSecondsLeft,
      isSubscribed,
      subscriptionStatus,
      subscriptionLoading,
      refreshSubscriptionStatus,
      canTalkToDrHarmony,
      setOptimisticSubscribed,
      biometricEnabled,
      biometricAvailable,
      biometryLabel,
      enableBiometricLogin,
      disableBiometricLogin,
      signInWithBiometrics,
      justLoggedOut,
      acknowledgeLogout,
      networkStatus,
      isOffline,
      retryNetwork,
    }),
    [
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      resetPassword,
      signInWithGoogle,
      isTrialActive,
      trialDaysLeft,
      trialExpired,
      trialSecondsLeft,
      isSubscribed,
      subscriptionStatus,
      subscriptionLoading,
      refreshSubscriptionStatus,
      canTalkToDrHarmony,
      setOptimisticSubscribed,
      biometricEnabled,
      biometricAvailable,
      biometryLabel,
      enableBiometricLogin,
      disableBiometricLogin,
      signInWithBiometrics,
      justLoggedOut,
      acknowledgeLogout,
      networkStatus,
      isOffline,
      retryNetwork,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
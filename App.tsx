
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SignInScreen from './src/screens/authentication/LoginScreen/LoginScreen';
import SignUpScreen from './src/screens/authentication/SignUpScreen/SignUpScreen';
import ForgotPasswordScreen from './src/screens/authentication/ForgetPasswordScreen/ForgetPasswordScreen';
import ResetPasswordScreen from './src/screens/authentication/ResetPasswordScreen/ResetPasswordScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ToastProvider } from './src/context/ToastContext';
import { parseAccessTokenFromUrl } from './src/utils/deepLink';
import { navigationRef, navigate } from './src/hooks/notificationsRef';
import { setupNotificationListeners } from './src/hooks/useNotificationHandler';
import AddRelationshipModal from './src/components/home/Addrelationshipmodal';
import { AddRelationshipProvider, useAddRelationship } from './src/context/Addrelationshipcontext';
import { DrHarmonyProvider, useDrHarmony } from './src/context/Drharmony';
import { DrHarmonyModal } from './src/components/home/drharmoneymodal';
import AnimatedInfinityLogo from './src/constants/infinnitylogo';
import DeleteRelationshipSheet from './src/components/home/deleterelationshipsheet';
import { DeleteRelationshipProvider, useDeleteRelationship } from './src/context/deleterelationship';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import {   MediationSessionProvider, useMediationSession } from './src/context/mediationsessioncontext';
import { MediationRequestModal } from './src/components/home/mediationsrequestmodal';
import { MediationSessionModal } from './src/components/home/mediationssession';
import { MediationRequestProvider, useMediationRequest } from './src/context/mediationsrequestcontext';
import { ThemeProvider } from './src/context/ThemeContext';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { access_token?: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const BG = '#0C1422';

const linking = {
  prefixes: ['impactum://'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password',
        parse: {
          access_token: (token: string) => token,
        },
      },
    },
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="SignIn"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: { backgroundColor: BG },
      }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return <MainTabNavigator />;
}

function SplashOverlay({
  onDone,
  speed = 'normal',
}: {
  onDone: () => void;
  speed?: 'normal' | 'fast';
}) {
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  const [traceDone, setTraceDone] = useState(false);

  useEffect(() => {
    if (!traceDone) return;

    Animated.sequence([
      Animated.delay(speed === 'fast' ? 180 : 320),
      Animated.parallel([
        Animated.timing(exitScale, {
          toValue: 1.08,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 380,
          delay: 60,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone());
  }, [traceDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: BG,
        opacity: bgOpacity,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}
    >
      <Animated.View style={{ transform: [{ scale: exitScale }] }}>
        <AnimatedInfinityLogo
          size={110}
          color="#FFFFFF"
          speed={speed}
          onDone={() => setTraceDone(true)}
        />
      </Animated.View>
    </Animated.View>
  );
}

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const prevAuth = useRef(isAuthenticated);

  const [showColdOpenSplash, setShowColdOpenSplash] = useState(true);
  const [showLoginSplash, setShowLoginSplash] = useState(false);

  useEffect(() => {
    if (!prevAuth.current && isAuthenticated && !showColdOpenSplash) {
      setShowLoginSplash(true);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url || isAuthenticated) return;
      const accessToken = parseAccessTokenFromUrl(url);
      if (!accessToken) return;
      navigate('ResetPassword', { access_token: accessToken });
    };

    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) =>
      handleDeepLink(url),
    );
    return () => subscription.remove();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        linking={isAuthenticated ? undefined : linking}
        onReady={() => {
          setupNotificationListeners();
        }}
      >
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>

      {showColdOpenSplash && (
        <SplashOverlay speed="normal" onDone={() => setShowColdOpenSplash(false)} />
      )}

      {!showColdOpenSplash && showLoginSplash && (
        <SplashOverlay speed="fast" onDone={() => setShowLoginSplash(false)} />
      )}
    </View>
  );
}

function RootModalLayer() {
  const { visible, currentUserName, closeModal, onSuccessCallback } =
    useAddRelationship();
  return (
    <AddRelationshipModal
      visible={visible}
      onClose={closeModal}
      onSuccess={() => {
        onSuccessCallback.current?.();
        closeModal();
      }}
      currentUserName={currentUserName}
    />
  );
}

function DrHarmonyModalLayer() {
  const { visible, relationship, myName, partnerName, closeModal } =
    useDrHarmony();
  return (
    <DrHarmonyModal
      visible={visible}
      onClose={closeModal}
      relationship={relationship}
      myName={myName}
      partnerName={partnerName}
    />
  );
}

function DeleteRelationshipModalLayer() {
  const { visible, partnerName, deleting, confirmDelete, closeSheet } = useDeleteRelationship();
  return (
    <DeleteRelationshipSheet
      visible={visible}
      partnerName={partnerName}
      deleting={deleting}
      onConfirm={confirmDelete}
      onCancel={closeSheet}
    />
  );
}

function MediationRequestModalLayer() {
  const { mediationId, visible, topic, requesterName, responding, respond } =
    useMediationRequest();

  if (!mediationId) return null;

  return (
    <MediationRequestModal
      key={mediationId} 
      visible={visible}
      topic={topic}
      requesterName={requesterName}
      responding={responding}
      onAccept={() => respond(true)}
      onDecline={() => respond(false)}
    />
  );
}

function MediationSessionModalLayer() {
  const { mediationId } = useMediationSession();
  const { closeModal: closeDrHarmony } = useDrHarmony();
  const { visible: requestVisible, dismiss: dismissMediationRequest } = useMediationRequest();

  useEffect(() => {
    if (mediationId) {
      closeDrHarmony();
      if (requestVisible) dismissMediationRequest();
    }
  }, [mediationId]);

  if (!mediationId) return null;
  return <MediationSessionModal />;
}

export default function App() {
 
  return (
    <GestureHandlerRootView style={{ flex: 1, }}>
      <SafeAreaProvider className='flex-1'>
        <ThemeProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <ToastProvider>
            <LanguageProvider>
              <AuthProvider>
                <AddRelationshipProvider>
                  <DrHarmonyProvider>
                    <DeleteRelationshipProvider>
                      <MediationRequestProvider>
                        <MediationSessionProvider>

                          <RootNavigation />
                          <RootModalLayer />
                          <DrHarmonyModalLayer />
                          <DeleteRelationshipModalLayer />
                          <MediationRequestModalLayer />
                          <MediationSessionModalLayer />

                        </MediationSessionProvider>
                      </MediationRequestProvider>
                    </DeleteRelationshipProvider>
                  </DrHarmonyProvider>
                </AddRelationshipProvider>
              </AuthProvider>
            </LanguageProvider>
          </ToastProvider>
        </StripeProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, Animated, Alert } from "react-native";
import AppText from "../../../components/common/AppText";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../../App";
import AuthCard      from "../AuthCard";
import BrandIcon     from "../../../components/common/brandicon";
import AuthTitle     from "../../../components/common/authtitle";
import AuthSubtitle  from "../../../components/common/authsubtitle";
import { AuthLink, AuthFooterText } from "../../../components/common/authlink";
import InputField    from "../../../components/common/inputfeild";
import FieldLabel    from "../../../components/common/inputlabel";
import PrimaryButton from "../../../components/common/primarybutton";
import { useAuth } from "../../../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

interface Errors {
  email?:    string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


function ErrorMessage({ message }: { message?: string }) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0, damping: 16, stiffness: 200, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0, duration: 140, useNativeDriver: true,
      }).start(() => translateY.setValue(-6));
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.Text
      style={{
        opacity,
        transform:  [{ translateY }],
        color:      "#EF4444",
        fontSize:   12,
        marginTop:  4,
        marginBottom: 2,
      }}
    >
      {message}
    </Animated.Text>
  );
}

function GoogleButton({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97, damping: 10, stiffness: 300, useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1, damping: 10, stiffness: 300, useNativeDriver: true,
    }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={{ transform: [{ scale }] }}
        className="flex-row items-center justify-center bg-brand-google border border-brand-btnBorder rounded-btn h-[52px] gap-x-2.5"
      >
        <View className="w-[22px] h-[22px] rounded-full bg-white items-center justify-center">
          <FontAwesome name="google" size={14} color="#4285F4" />
        </View>
        <AppText className="font-sansMedium text-body-lg text-brand-textPrimary">
          Continue with Google
        </AppText>
      </Animated.View>
    </TouchableOpacity>
  );
}


function FadeInField({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 340, delay, useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, damping: 20, stiffness: 160, delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}


export default function SignInScreen({ navigation }: Props) {
  const {
    signIn,
    signInWithGoogle,
    signInWithBiometrics,
    enableBiometricLogin,
    biometricEnabled,
    biometricAvailable,
    biometryLabel,
    justLoggedOut,
    acknowledgeLogout,
  } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Errors>({});

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};

    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const ok = await signIn(email.trim(), password);

      if (ok && biometricAvailable && !biometricEnabled) {
        Alert.alert(
          `Enable ${biometryLabel}?`,
          `Log in faster next time using ${biometryLabel} instead of typing your password.`,
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Enable",
              onPress: () => enableBiometricLogin(email.trim(), password),
            },
          ],
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const hasAutoPromptedRef = useRef(false);

  useEffect(() => {

    if (justLoggedOut) {
      acknowledgeLogout();
      hasAutoPromptedRef.current = true;
      return;
    }

    if (
      biometricEnabled &&
      biometricAvailable &&
      !hasAutoPromptedRef.current
    ) {
      hasAutoPromptedRef.current = true;

      const t = setTimeout(() => {
        signInWithBiometrics();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [biometricEnabled, biometricAvailable, justLoggedOut, acknowledgeLogout]);

  return (
    <AuthCard>
      {/* Brand icon — instant */}
      <View className="items-center mb-5">
        <BrandIcon size={72} />
      </View>

      <AuthTitle>Welcome to IMPACTUM</AuthTitle>
      <AuthSubtitle>Sign in to continue</AuthSubtitle>

      {/* Google button fades in first */}
      <FadeInField delay={80}>
        <GoogleButton onPress={signInWithGoogle} />
      </FadeInField>

      {/* Divider */}
      <FadeInField delay={140}>
        <View className="flex-row items-center my-4 gap-x-2.5">
          <View className="flex-1 h-px bg-brand-divider" />
          <AppText className="font-sansMedium text-caption text-brand-textMuted uppercase">OR</AppText>
          <View className="flex-1 h-px bg-brand-divider" />
        </View>
      </FadeInField>

      {/* Email field */}
      <FadeInField delay={200}>
        <FieldLabel>Email</FieldLabel>
        <InputField
          icon="email"
          placeholder="you@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={handleEmailChange}
          textContentType="emailAddress"
          returnKeyType="next"
          error={errors.email}
        />
        <ErrorMessage message={errors.email} />
      </FadeInField>

      {/* Password field */}
      <FadeInField delay={260}>
        <FieldLabel>Password</FieldLabel>
        <InputField
          icon="password"
          placeholder="••••••••"
          isPassword
          value={password}
          onChangeText={handlePasswordChange}
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
          error={errors.password}
        />
        <ErrorMessage message={errors.password} />
      </FadeInField>

      {/* Sign-in button */}
      <FadeInField delay={320}>
        <PrimaryButton label="Sign In" loading={loading} onPress={handleSignIn} />
      </FadeInField>

      {/* Footer links */}
      <FadeInField delay={360}>
        <View className="flex-row justify-between items-center mt-4">
          <AuthLink
            label="Forgot password?"
            onPress={() => navigation.navigate("ForgotPassword")}
          />
          <View className="flex-row items-center">
            <AuthFooterText>Need an account? </AuthFooterText>
            <AuthLink
              label="Sign up"
              onPress={() => navigation.navigate("SignUp")}
            />
          </View>
        </View>
      </FadeInField>
    </AuthCard>
  );
}
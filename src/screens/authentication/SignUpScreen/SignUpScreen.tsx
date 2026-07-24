import React, { useState } from "react";
import { View } from "react-native";
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

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

interface Errors {
  email?:    string;
  password?: string;
  confirm?:  string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Errors>({});

  const clearError = (field: keyof Errors) =>
    setErrors(prev => ({ ...prev, [field]: undefined }));

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

    if (!confirm) {
      next.confirm = "Please confirm your password.";
    } else if (confirm !== password) {
      next.confirm = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const success = await signUp(email.trim(), password);
      if (success) {
        navigation.navigate("SignIn");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <View className="items-center mb-5">
        <BrandIcon size={72} />
      </View>

      <AuthTitle>Create an Account</AuthTitle>
      <AuthSubtitle>Sign up to get started</AuthSubtitle>

      <FieldLabel>Email</FieldLabel>
      <InputField
        icon="email"
        placeholder="you@example.com"
        keyboardType="email-address"
        value={email}
        onChangeText={v => { setEmail(v); clearError("email"); }}
        textContentType="emailAddress"
        returnKeyType="next"
        error={errors.email}
      />

      <FieldLabel>Password</FieldLabel>
      <InputField
        icon="password"
        placeholder="••••••••"
        isPassword
        value={password}
        onChangeText={v => { setPassword(v); clearError("password"); }}
        textContentType="newPassword"
        returnKeyType="next"
        error={errors.password}
      />

      <FieldLabel>Confirm Password</FieldLabel>
      <InputField
        icon="password"
        placeholder="••••••••"
        isPassword
        value={confirm}
        onChangeText={v => { setConfirm(v); clearError("confirm"); }}
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleCreate}
        error={errors.confirm}
      />

      <PrimaryButton label="Create Account" loading={loading} onPress={handleCreate} />

      <View className="flex-row justify-center items-center mt-4">
        <AuthFooterText>Already have an account? </AuthFooterText>
        <AuthLink label="Sign in" onPress={() => navigation.navigate("SignIn")} />
      </View>
    </AuthCard>
  );
}

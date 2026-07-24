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

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { forgotPassword } = useAuth();
  const [email,      setEmail]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return false;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const success = await forgotPassword(email.trim());
      if (success) {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSent(false);
    setEmail("");
  };

  return (
    <AuthCard>
      <View className="items-center mb-5">
        <BrandIcon size={72} />
      </View>

      <AuthTitle>Forgot Password?</AuthTitle>
      <AuthSubtitle>
        {sent
          ? "Check your inbox — a reset link is on its way."
          : "Enter your email and we'll send you a reset link"}
      </AuthSubtitle>

      {!sent && (
        <>
          <FieldLabel>Email</FieldLabel>
          <InputField
            icon="email"
            placeholder="you@example.com"
            keyboardType="email-address"
            value={email}
            onChangeText={v => { setEmail(v); setEmailError(undefined); }}
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={handleSend}
            error={emailError}
          />
        </>
      )}

      <PrimaryButton
        label={sent ? "Resend Link" : "Send Reset Link"}
        loading={loading}
        onPress={sent ? handleResend : handleSend}
      />

      <View className="flex-row justify-center items-center mt-4">
        <AuthFooterText>Remember your password? </AuthFooterText>
        <AuthLink label="Sign in" onPress={() => navigation.navigate("SignIn")} />
      </View>
    </AuthCard>
  );
}

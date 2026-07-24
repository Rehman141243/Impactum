import React, { useState } from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../../App";
import AuthCard      from "../AuthCard";
import BrandIcon     from "../../../components/common/brandicon";
import AuthTitle     from "../../../components/common/authtitle";
import AuthSubtitle  from "../../../components/common/authsubtitle";
import InputField    from "../../../components/common/inputfeild";
import FieldLabel    from "../../../components/common/inputlabel";
import PrimaryButton from "../../../components/common/primarybutton";
import { useAuth } from "../../../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

interface Errors {
  newPass?:  string;
  confirm?:  string;
}

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { resetPassword } = useAuth();
  const accessToken = route.params?.access_token ?? "";
  const [tokenError, setTokenError] = useState<string | undefined>();

  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Errors>({});

  const clearError = (field: keyof Errors) =>
    setErrors(prev => ({ ...prev, [field]: undefined }));

  const validate = (): boolean => {
    const next: Errors = {};

    if (!newPass) {
      next.newPass = "New password is required.";
    } else if (newPass.length < 6) {
      next.newPass = "Password must be at least 6 characters.";
    }

    if (!confirm) {
      next.confirm = "Please confirm your password.";
    } else if (confirm !== newPass) {
      next.confirm = "Passwords do not match.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;

    if (!accessToken) {
      setTokenError("Reset token is missing. Please use the link from your email.");
      return;
    }
    setTokenError(undefined);

    setLoading(true);
    try {
      const success = await resetPassword(accessToken, newPass);
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

      <AuthTitle>Reset Password</AuthTitle>
      <AuthSubtitle>Enter your new password below</AuthSubtitle>

      {tokenError ? (
        <Text className="font-sansMedium text-body-sm text-red-400 mb-3">{tokenError}</Text>
      ) : null}

      <FieldLabel>New Password</FieldLabel>
      <InputField
        icon="password"
        placeholder="••••••••"
        isPassword
        value={newPass}
        onChangeText={v => { setNewPass(v); clearError("newPass"); }}
        textContentType="newPassword"
        returnKeyType="next"
        error={errors.newPass}
      />

      <FieldLabel>Confirm New Password</FieldLabel>
      <InputField
        icon="password"
        placeholder="••••••••"
        isPassword
        value={confirm}
        onChangeText={v => { setConfirm(v); clearError("confirm"); }}
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleReset}
        error={errors.confirm}
      />

      <PrimaryButton label="Reset Password" loading={loading} onPress={handleReset} />
    </AuthCard>
  );
}

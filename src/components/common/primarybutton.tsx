import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";
import AppText from "./AppText";

interface PrimaryButtonProps extends TouchableOpacityProps {
  label:    string;
  loading?: boolean;
}

export default function PrimaryButton({
  label,
  loading = false,
  ...rest
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={loading}
      className="bg-brand-btnBg border border-brand-btnBorder rounded-btn h-[52px] items-center justify-center mt-5"
      {...rest}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <AppText className="font-sansSemiBold text-body-lg text-brand-textPrimary">
            {label}
          </AppText>
      }
    </TouchableOpacity>
  );
}
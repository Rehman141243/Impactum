import React from "react";
import { TouchableOpacity } from "react-native";
import AppText from "./AppText";

interface AuthLinkProps {
  label:    string;
  onPress:  () => void;
}

export function AuthLink({ label, onPress }: AuthLinkProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <AppText className="font-sansSemiBold text-body-sm text-brand-accent">
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

export function AuthFooterText({ children }: { children: string }) {
  return (
    <AppText className="font-sans text-body-sm text-brand-textSecondary">
      {children}
    </AppText>
  );
}

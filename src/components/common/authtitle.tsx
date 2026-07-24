import React from "react";
import AppText from "./AppText";

export default function AuthTitle({ children }: { children: string }) {
  return (
    <AppText className="font-heading text-display-lg text-brand-textPrimary text-center mb-1.5">
      {children}
    </AppText>
  );
}

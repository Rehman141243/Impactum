import React from "react";
import AppText from "./AppText";

export default function AuthSubtitle({ children }: { children: string }) {
  return (
    <AppText className="font-sans text-body-md text-brand-textSecondary text-center mb-5">
      {children}
    </AppText>
  );
}

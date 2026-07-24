import React from "react";
import AppText from "./AppText";

export default function FieldLabel({ children }: { children: string }) {
  return (
    <AppText className="font-label text-label text-brand-textLabel mb-1.5 mt-3.5">
      {children}
    </AppText>
  );
}
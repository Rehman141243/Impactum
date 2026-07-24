import React from 'react';
import { View } from 'react-native';
import AppText from '../common/AppText';

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <AppText className="font-sansMedium text-caption text-brand-textMuted uppercase tracking-[2px] mb-2.5 px-1">
        {title}
      </AppText>
      <View className="bg-brand-bgCardMain border border-brand-borderSoft rounded-card overflow-hidden">
        {children}
      </View>
    </View>
  );
}

export function SettingsDivider() {
  return <View className="h-px bg-brand-borderSoft mx-4" />;
}

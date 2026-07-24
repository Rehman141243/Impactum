import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import AppText from '../common/AppText';

export interface GuideItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  labelColor: string;
  borderColor: string;
  iconBg: string;
  icon: React.ReactNode;
}

export default function GuideCard({ item }: { item: GuideItem }) {
  return (
    <Pressable
      className="bg-brand-bgCardMain border rounded-card p-4 mb-3 flex-row items-center"
      style={{ borderColor: item.borderColor }}>
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3.5"
        style={{ backgroundColor: item.iconBg }}>
        {item.icon}
      </View>
      <View className="flex-1 pr-2">
        <AppText
          className="font-sansMedium text-[10px] uppercase tracking-[1.5px] mb-1"
          style={{ color: item.labelColor }}>
          {item.label}
        </AppText>
        <AppText className="font-sansSemiBold text-body-lg text-brand-textPrimary mb-0.5">
          {item.title}
        </AppText>
        <AppText className="font-sans text-body-sm text-brand-textMuted leading-5">
          {item.subtitle}
        </AppText>
      </View>
      <ChevronRight size={18} color="#64748B" />
    </Pressable>
  );
}

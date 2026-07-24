
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import AppText from '../common/AppText';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

export default function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}: Props) {
  const { isDark } = useTheme();
  const iconColor = isDark ? '#94A3B8' : '#64748B';
  const chevronColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center px-4 py-4">
      <View className="w-9 h-9 rounded-full bg-brand-bgCardSoft items-center justify-center mr-3">
        <Icon size={17} color={iconColor} strokeWidth={1.8} />
      </View>
      <View className="flex-1">
        <AppText className="font-sansMedium text-body-md text-brand-textPrimary">{title}</AppText>
        {subtitle ? (
          <AppText className="font-sans text-body-sm text-brand-textMuted mt-0.5 leading-5">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {rightElement}
      {showChevron && !rightElement ? (
        <ChevronRight size={18} color={chevronColor} />
      ) : null}
    </Pressable>
  );
}

export function ProfileRow({
  initial,
  name,
  email,
  profilePicture,
  onPress,
}: {
  initial: string;
  name: string;
  email: string;
  profilePicture?: string;
  onPress?: () => void;
}) {
  const { isDark } = useTheme();
  const chevronColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-4">
      <View className="w-11 h-11 rounded-full bg-brand-tabActive items-center justify-center mr-3 overflow-hidden">
        {profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
            resizeMode="cover"
          />
        ) : (
          <AppText className="font-sansMedium text-2xl text-brand-textSecondary">
            <AnimatedInfinityLogo size={28} mode="loop" />
          </AppText>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-sansSemiBold text-body-md text-brand-textPrimary">{name}</Text>
        <Text className="font-sans text-body-sm text-brand-textMuted mt-0.5">{email}</Text>
      </View>
      <ChevronRight size={18} color={chevronColor} />
    </Pressable>
  );
}
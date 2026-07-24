import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppText from '../common/AppText';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Settings } from 'lucide-react-native';

function InfinityIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Text style={{ color, fontSize: size, fontWeight: '600', lineHeight: size + 2 }}>
      ∞
    </Text>
  );
}

const TAB_CONFIG = {
  HomeTab: { label: 'Home', Icon: Home },
  GuideTab: { label: 'Guide', Icon: InfinityIcon, isInfinity: true },
  SettingsTab: { label: 'Settings', Icon: Settings },
} as const;

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-brand-bgMain border-t border-brand-borderSoft"
      style={{ paddingBottom: Math.max(insets.bottom, 10), paddingTop: 10 }}>
      <View className="flex-row items-end justify-around px-4">
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const color = isFocused ? '#4F7BF7' : '#64748B';
          const { Icon, label } = config;
          const isInfinity = 'isInfinity' in config && config.isInfinity;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="items-center min-w-[72px]"
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}>
              <View
                className={`items-center justify-center mb-1.5 ${
                  isFocused ? 'bg-brand-tabActive/20 rounded-xl w-11 h-11' : 'w-11 h-11'
                }`}
                style={
                  isFocused
                    ? {
                        shadowColor: '#4F7BF7',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.35,
                        shadowRadius: 8,
                      }
                    : undefined
                }>
                {isInfinity ? (
                  <InfinityIcon color={color} size={22} />
                ) : (
                  <Icon size={22} color={color} strokeWidth={isFocused ? 2.2 : 1.8} />
                )}
              </View>
              <AppText
                className={`font-sansMedium text-body-sm ${
                  isFocused ? 'text-brand-tabActive' : 'text-brand-tabInactive'
                }`}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AppText from '../components/common/AppText';

interface NoInternetOverlayProps {
  onRetry: () => void;
  retrying?: boolean;
}


export default function NoInternetOverlay({ onRetry, retrying = false }: NoInternetOverlayProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      className="flex-1 items-center justify-center px-8 bg-brand-bgCardMain">
      <View className="h-16 w-16 rounded-full items-center justify-center bg-brand-border mb-4">
        <WifiOff size={28} color="#64748B" strokeWidth={2} />
      </View>

      <AppText className="font-sansSemiBold text-body-lg text-brand-textPrimary text-center">
        No internet connection
      </AppText>
      <AppText className="font-sansMedium text-caption text-brand-textMuted text-center mt-1">
        Check your connection and try again.
      </AppText>

      <TouchableOpacity
        onPress={onRetry}
        disabled={retrying}
        activeOpacity={0.85}
        className="mt-5 px-5 py-2.5 rounded-full bg-brand-iconStroke"
        style={{ opacity: retrying ? 0.6 : 1 }}>
        <AppText className="font-sansSemiBold text-[13px] text-white">
          {retrying ? 'Retrying…' : 'Retry'}
        </AppText>
      </TouchableOpacity>
    </Animated.View>
  );
}
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SkeletonBlock } from './Skeleton';

export default function RelationshipCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(300)}>
      <View className="bg-brand-bgCardMain border border-brand-borderSoft rounded-2xl p-4 mb-3">
        <View className="flex-row items-start">
          {/* Avatar */}
          <SkeletonBlock width={52} height={52} radius={26} style={{ marginRight: 12 }} />

          <View className="flex-1 flex-row items-start">
            <View className="flex-1">
              <SkeletonBlock width="60%" height={16} radius={4} />
              <View className="flex-row items-center mt-2 gap-1.5">
                <SkeletonBlock width={6} height={6} radius={3} />
                <SkeletonBlock width={80} height={10} radius={4} />
              </View>
            </View>

          

            <SkeletonBlock width={36} height={36} radius={18} style={{ marginLeft: 8 }} />
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} width={13} height={13} radius={2} />
            ))}
          </View>
          <View className="flex-row gap-2">
            <SkeletonBlock width={56} height={22} radius={11} />
            <SkeletonBlock width={64} height={22} radius={11} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
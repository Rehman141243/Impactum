import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { faqContent } from '../data';

interface FAQItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
  isLast?: boolean;
}

function FAQItem({
  question,
  answer,
  defaultOpen = false,
  isLast = false,
}: FAQItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const progress = useSharedValue(defaultOpen ? 1 : 0);
  const rotation = useSharedValue(defaultOpen ? 180 : 0);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    progress.value = withTiming(next ? 1 : 0, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    rotation.value = withTiming(next ? 180 : 0, {
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  };


  const contentStyle = useAnimatedStyle(() => {
    if (contentHeight === null) {
      return { height: 0, opacity: 0 };
    }
    return {
      height: progress.value * contentHeight,
      opacity: progress.value,
    };
  });

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#1E2D42',
      }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggle}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingVertical: 18,
          paddingHorizontal: 20,
        }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'DMSans-Bold',
            fontSize: 14,
            lineHeight: 20,
            flex: 1,
            paddingRight: 12,
          }}>
          {question}
        </Text>

        <Animated.Text
          style={[
            {
              color: '#64748B',
              fontSize: 13,
              marginTop: 2,
            },
            chevronStyle,
          ]}>
          ⌃
        </Animated.Text>
      </TouchableOpacity>

      <Animated.View style={[{ overflow: 'hidden' }, contentStyle]}>
        <Text
          style={{
            color: '#94A3B8',
            fontFamily: 'DMSans-Regular',
            fontSize: 13,
            lineHeight: 24,
            paddingHorizontal: 20,
            paddingBottom: 18,
          }}>
          {answer}
        </Text>
      </Animated.View>

      {contentHeight === null && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            opacity: 0,
          }}
          pointerEvents="none"
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) {
              setContentHeight(h);
   
              if (defaultOpen) {
                progress.value = 1;
              }
            }
          }}>
          <Text
            style={{
              color: '#94A3B8',
              fontFamily: 'DMSans-Regular',
              fontSize: 13,
              lineHeight: 24,
              paddingHorizontal: 20,
              paddingBottom: 18,
            }}>
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function FAQScreen() {
  const navigation = useNavigation();

  const fade = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-brand-bg pt-14">
      <StatusBar
        translucent={false}
        backgroundColor="#0C1422"
        barStyle="light-content"
      />

      {/* Background */}
      <View className="absolute inset-0 bg-brand-bg" />

      {/* Top Glow */}
      <View
        style={{
          position: 'absolute',
          top: -220,
          alignSelf: 'center',
          width: 520,
          height: 520,
          borderRadius: 260,
          backgroundColor: '#4F7BF7',
          opacity: 0.08,
        }}
      />

      {/* Bottom Glow */}
      <View
        style={{
          position: 'absolute',
          bottom: -250,
          alignSelf: 'center',
          width: 450,
          height: 450,
          borderRadius: 225,
          backgroundColor: '#6B21A8',
          opacity: 0.05,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 60,
        }}>
        {/* Back */}
        <View className="px-4 pt-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-8 h-8 rounded-full border border-brand-border items-center justify-center">
            <Text className="text-white text-lg">‹</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View className="items-center mt-2 px-6">
          <Text
            className="text-brand-textMuted uppercase"
            style={{
              fontFamily: 'DMSans-Bold',
              fontSize: 10,
              letterSpacing: 2,
            }}>
            {faqContent.title}
          </Text>
        </View>

        {/* Main Card */}
        <Animated.View
          style={[
            {
              alignSelf: 'center',
              marginTop: 24,
              width: '84%',
              maxWidth: 460,
              borderRadius: 20,
              backgroundColor: '#121A2B',
              borderWidth: 1,
              borderColor: '#1E2A40',
              paddingVertical: 8,
            },
            cardStyle,
          ]}>
          {faqContent.items.map((item: any, index: any) => (
            <FAQItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              defaultOpen={true}
              isLast={index === faqContent.items.length - 1}
            />
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
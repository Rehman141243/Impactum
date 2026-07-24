import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useAddRelationship } from '../../../context/Addrelationshipcontext';
import { relationshipsGuideContent } from '../data';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function RelationshipsGuideScreen() {
  const navigation = useNavigation();
  const { openModal } = useAddRelationship();

  const headerFade = useSharedValue(0);
  const headerY = useSharedValue(14);
  const cardFade = useSharedValue(0);
  const cardY = useSharedValue(18);
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    headerFade.value = withTiming(1, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
    headerY.value = withTiming(0, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
    cardFade.value = withDelay(
      120,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    cardY.value = withDelay(
      120,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerFade.value,
    transform: [{ translateY: headerY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardFade.value,
    transform: [{ translateY: cardY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleCtaPressIn = () => {
    ctaScale.value = withSpring(0.96, { damping: 14, stiffness: 220 });
  };

  const handleCtaPressOut = () => {
    ctaScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg pt-12">
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
        {/* Back Button */}
        <View className="px-4 pt-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-8 h-8 rounded-full border border-brand-border items-center justify-center">
            <Text className="text-white text-lg">‹</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <Animated.View className="items-center mt-2 px-6" style={headerStyle}>
          <Text
            className="text-white text-center"
            style={{
              fontFamily: 'CormorantGaramond-Regular',
              fontSize: 34,
              letterSpacing: 1,
            }}>
            IMPACTUM
          </Text>

          <Text
            className="text-brand-textSecondary text-center mt-2"
            style={{
              fontFamily: 'DMSans-Regular',
              fontSize: 10,
            }}>
            The sacred place for your most important connections.
          </Text>
        </Animated.View>

        {/* Main Reading Card */}
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
              paddingHorizontal: 16,
              paddingVertical: 24,
            },
            cardStyle,
          ]}>
          {relationshipsGuideContent.sections.map((section: any) => (
            <View key={section.title}>
              <Text
                style={{
                  fontFamily: 'DMSans-Bold',
                  color: '#C9A84C',
                  fontSize: 9,
                  letterSpacing: 2.5,
                  marginTop: 24,
                  marginBottom: 18,
                  textTransform: 'uppercase',
                }}>
                {section.title}
              </Text>

              {section.paragraphs.map(
                (paragraph: string, index: number) => {
                  const highlightLines = [
                    'Manyyy timesss!',
                    'Simple yet amazing.',
                    'Without order we have chaos.',
                    "That's right.",
                    'You say, ohhhhh. Okay. I understand.',
                  ];

                  if (highlightLines.includes(paragraph)) {
                    return (
                      <Text
                        key={index}
                        style={{
                          fontFamily: 'CormorantGaramond-Italic',
                          color: '#E8D5A3',
                          fontSize: 22,
                          textAlign: 'center',
                          marginVertical: 16,
                        }}>
                        {paragraph}
                      </Text>
                    );
                  }

                  return (
                    <Text
                      key={index}
                      style={{
                        fontFamily: 'DMSans-Regular',
                        color: '#CBD5E1',
                        fontSize: 13,
                        lineHeight: 26,
                        marginBottom: 14,
                      }}>
                      {paragraph}
                    </Text>
                  );
                },
              )}

              <View className="h-[1px] bg-brand-border mt-3" />
            </View>
          ))}

          {/* Ending */}
          <View className="mt-10">
            <Text
              style={{
                fontFamily: 'CormorantGaramond-Italic',
                color: '#CBD5E1',
                textAlign: 'center',
                fontSize: 16,
                lineHeight: 30,
              }}>
              {relationshipsGuideContent.ending}
            </Text>
          </View>

          {/* Signature */}
          <View className="items-center mt-10">
            <Text
              style={{
                fontFamily: 'CormorantGaramond-Italic',
                color: '#E8D5A3',
                fontSize: 20,
              }}>
              Much Love.
            </Text>

            <Text
              className="mt-2"
              style={{
                fontFamily: 'CormorantGaramond-Regular',
                color: '#FFFFFF',
                fontSize: 18,
              }}>
              Abraham
            </Text>
          </View>

          {/* CTA */}
          <AnimatedTouchable
            activeOpacity={0.9}
            onPress={() => openModal()}
            onPressIn={handleCtaPressIn}
            onPressOut={handleCtaPressOut}
            className="mt-10 self-center"
            style={[
              {
                backgroundColor: '#C9A84C',
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 12,
                minWidth: 210,
              },
              ctaStyle,
            ]}>
            <Text
              style={{
                fontFamily: 'DMSans-Bold',
                color: '#0C1422',
                textAlign: 'center',
                fontSize: 13,
              }}>
              Start your first connection
            </Text>
          </AnimatedTouchable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
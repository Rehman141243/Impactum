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
  Easing,
} from 'react-native-reanimated';
import { drHarmonyGuideContent as c } from '../data';

function useEntrance(delay = 0) {
  const fade = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    fade.value = withDelay(
      delay,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  return useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: translateY.value }],
  }));
}

export default function DrHarmonyGuideScreen() {
  const navigation = useNavigation();

  const heroStyle = useEntrance(0);
  const storyStyle = useEntrance(80);
  const mediatorStyle = useEntrance(140);
  const stepsStyle = useEntrance(200);
  const privacyStyle = useEntrance(260);
  const closingStyle = useEntrance(320);

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
            {c.title}
          </Text>
        </View>

        {/* Main Card */}
        <View
          className="self-center mt-6 rounded-card bg-brand-bgCardMain border border-brand-borderSoft"
          style={{
            width: '84%',
            maxWidth: 460,
            paddingHorizontal: 16,
            paddingVertical: 24,
          }}>
          {/* Hero Card */}
          <Animated.View
            style={[
              {
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: '#1E2A40',
                backgroundColor: '#14233A',
              },
              heroStyle,
            ]}>
            <View className="flex-row items-center">
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#4F7BF7',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    color: 'white',
                    fontFamily: 'DMSans-Bold',
                  }}>
                  H
                </Text>
              </View>

              <View className="ml-3">
                <Text
                  style={{
                    color: '#fff',
                    fontFamily: 'DMSans-Bold',
                    fontSize: 15,
                  }}>
                  {c.title}
                </Text>

                <Text
                  style={{
                    color: '#94A3B8',
                    fontFamily: 'DMSans-Regular',
                    fontSize: 11,
                  }}>
                  {c.subtitle}
                </Text>
              </View>
            </View>

            {c.intro.map((para, i) => (
              <Text
                key={`intro-${i}`}
                style={{
                  color: '#CBD5E1',
                  fontFamily: 'DMSans-Regular',
                  fontSize: 13,
                  lineHeight: 24,
                  marginTop: i === 0 ? 18 : 12,
                }}>
                {para}
              </Text>
            ))}
          </Animated.View>

          {/* THE STORY */}
          <SectionLabel text={c.storyTitle} />

          <Animated.View
            style={[
              {
                borderRadius: 20,
                padding: 20,
                backgroundColor: '#121A2B',
                borderLeftWidth: 3,
                borderLeftColor: '#4F7BF7',
              },
              storyStyle,
            ]}>
            {c.story.map((para, i) => (
              <Text
                key={`story-${i}`}
                style={{
                  color: '#CBD5E1',
                  fontFamily: 'DMSans-Regular',
                  fontSize: 13,
                  lineHeight: 26,
                  marginTop: i === 0 ? 0 : 12,
                }}>
                {para}
              </Text>
            ))}

            {/* Ego quote */}
            <View
              className="rounded-card p-4 mt-5"
              style={{
                backgroundColor: '#172337',
              }}>
              <Text
                style={{
                  color: '#E8D5A3',
                  fontFamily: 'CormorantGaramond-Italic',
                  fontSize: 18,
                  lineHeight: 28,
                }}>
                "{c.egoQuote}"
              </Text>
            </View>

            {c.storyContinued.map((para, i) => (
              <Text
                key={`story-cont-${i}`}
                style={{
                  color: '#CBD5E1',
                  fontFamily: 'DMSans-Regular',
                  fontSize: 13,
                  lineHeight: 26,
                  marginTop: i === 0 ? 18 : 12,
                }}>
                {para}
              </Text>
            ))}

            {/* Mother quote */}
            <View
              className="rounded-card p-4 mt-5"
              style={{
                backgroundColor: '#172337',
              }}>
              <Text
                style={{
                  color: '#E8D5A3',
                  fontFamily: 'CormorantGaramond-Italic',
                  fontSize: 18,
                  lineHeight: 28,
                }}>
                "{c.motherQuote}"
              </Text>
            </View>

            {c.storyAfterMotherQuote.map((para, i) => (
              <Text
                key={`story-after-${i}`}
                style={{
                  color: '#CBD5E1',
                  fontFamily: 'DMSans-Regular',
                  fontSize: 13,
                  lineHeight: 26,
                  marginTop: i === 0 ? 18 : 12,
                }}>
                {para}
              </Text>
            ))}

            {/* THE CONVERSATION (nested inside the story card, per design) */}
            <Text
              style={{
                fontFamily: 'DMSans-Bold',
                color: '#64748B',
                fontSize: 9,
                letterSpacing: 2,
                marginTop: 24,
                marginBottom: 14,
                textTransform: 'uppercase',
              }}>
              {c.conversationTitle}
            </Text>

            {c.conversation.map((line, i) => (
              <View key={`line-${i}`} style={{ marginTop: i === 0 ? 0 : 14 }}>
                <Text
                  style={{
                    color: line.speaker === 'Abraham' ? '#7EB8FF' : '#A78BFA',
                    fontFamily: 'DMSans-Bold',
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>
                  {line.speaker}
                </Text>
                <Text
                  style={{
                    color: '#CBD5E1',
                    fontFamily: 'DMSans-Regular',
                    fontSize: 13,
                    lineHeight: 24,
                  }}>
                  {line.text}
                </Text>
              </View>
            ))}

            <Text
              style={{
                color: '#94A3B8',
                fontFamily: 'CormorantGaramond-Italic',
                fontSize: 15,
                lineHeight: 24,
                marginTop: 18,
              }}>
              {c.conversationClosing}
            </Text>
          </Animated.View>

          {/* THE MEDIATOR */}
          <SectionLabel text={c.mediatorTitle} />

          <Animated.View
            style={[
              {
                borderRadius: 20,
                padding: 20,
                backgroundColor: '#13253F',
                borderLeftWidth: 3,
                borderLeftColor: '#4F7BF7',
              },
              mediatorStyle,
            ]}>
            {c.mediatorText.map((para, i) => (
              <Text
                key={`mediator-${i}`}
                style={{
                  color: '#CBD5E1',
                  fontFamily: 'DMSans-Regular',
                  fontSize: 13,
                  lineHeight: 26,
                  marginTop: i === 0 ? 0 : 12,
                }}>
                {para}
              </Text>
            ))}
          </Animated.View>

          {/* HOW IT WORKS */}
          <SectionLabel text={c.howItWorksTitle} />

          <Animated.View style={stepsStyle}>
            {c.steps.map(step => (
              <View
                key={step.number}
                className="rounded-card p-5 mb-4"
                style={{
                  backgroundColor: '#121A2B',
                  borderWidth: 1,
                  borderColor: '#1E2A40',
                }}>
                <Text
                  style={{
                    color: '#4F7BF7',
                    fontFamily: 'DMSans-Bold',
                    fontSize: 18,
                  }}>
                  {step.number}
                </Text>

                <Text
                  style={{
                    color: '#fff',
                    fontFamily: 'DMSans-Bold',
                    fontSize: 15,
                    marginTop: 8,
                  }}>
                  {step.title}
                </Text>

                <Text
                  style={{
                    color: '#CBD5E1',
                    fontFamily: 'DMSans-Regular',
                    fontSize: 13,
                    lineHeight: 24,
                    marginTop: 10,
                  }}>
                  {step.description}
                </Text>
              </View>
            ))}
          </Animated.View>

          {/* Privacy */}
          <Animated.View
            style={[
              {
                borderRadius: 20,
                padding: 20,
                marginTop: 16,
                backgroundColor: '#121A2B',
              },
              privacyStyle,
            ]}>
            <Text
              style={{
                fontSize: 20,
                marginBottom: 12,
              }}>
              🔒
            </Text>

            <Text
              style={{
                color: '#CBD5E1',
                fontFamily: 'DMSans-Regular',
                fontSize: 13,
                lineHeight: 24,
              }}>
              {c.privacy}
            </Text>
          </Animated.View>

          {/* Pre-final reflection + Final Quote */}
          <Animated.View
            style={[
              {
                borderRadius: 20,
                padding: 20,
                marginTop: 24,
                backgroundColor: '#121A2B',
              },
              closingStyle,
            ]}>
            {c.preFinalQuote.map((para, i) => (
              <Text
                key={`prefinal-${i}`}
                style={{
                  color:
                    i === c.preFinalQuote.length - 1 ? '#E8D5A3' : '#CBD5E1',
                  fontFamily:
                    i === c.preFinalQuote.length - 1
                      ? 'CormorantGaramond-Italic'
                      : 'DMSans-Regular',
                  fontSize: i === c.preFinalQuote.length - 1 ? 22 : 13,
                  lineHeight: i === c.preFinalQuote.length - 1 ? 32 : 24,
                  marginTop: i === 0 ? 0 : 16,
                }}>
                {para}
              </Text>
            ))}

            <Text
              style={{
                color: '#E8D5A3',
                fontFamily: 'CormorantGaramond-Italic',
                fontSize: 18,
                lineHeight: 30,
                marginTop: 10,
              }}>
              {c.finalQuote}
            </Text>
          </Animated.View>

          {/* Signature */}
          <View className="items-center mt-12">
            {c.ending.map((line, i) => (
              <Text
                key={`ending-${i}`}
                style={{
                  color: '#CBD5E1',
                  textAlign: 'center',
                  fontFamily: 'CormorantGaramond-Italic',
                  fontSize: 16,
                  lineHeight: 28,
                }}>
                {line}
              </Text>
            ))}

            <Text
              style={{
                marginTop: 24,
                color: '#FFFFFF',
                fontFamily: 'CormorantGaramond-Regular',
                fontSize: 22,
              }}>
              {c.author}
            </Text>

            <Text
              style={{
                color: '#94A3B8',
                fontFamily: 'DMSans-Regular',
                fontSize: 11,
                marginTop: 4,
              }}>
              {c.role}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontFamily: 'DMSans-Bold',
        color: '#C9A84C',
        fontSize: 9,
        letterSpacing: 2.5,
        marginTop: 28,
        marginBottom: 18,
        textTransform: 'uppercase',
      }}>
      {text}
    </Text>
  );
}
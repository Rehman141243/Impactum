
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { impactumContent } from '../data';
import { useNavigation } from '@react-navigation/native';
import AddRelationshipModal from '../../../components/home/Addrelationshipmodal';
import { useAuth } from '../../../context/AuthContext';
import { useAddRelationship } from '../../../context/Addrelationshipcontext';
import AppText from '../../../components/common/AppText';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HowImpactumWasBornScreen() {
  const navigation = useNavigation();
  const { openModal } = useAddRelationship();
  const [imageVisible, setImageVisible] = useState(false);

  const logoScale = useSharedValue(0.8);
  const logoFade = useSharedValue(0);
  const quoteFade = useSharedValue(0);
  const quoteY = useSharedValue(16);
  const mainFade = useSharedValue(0);
  const mainY = useSharedValue(20);
  const founderFade = useSharedValue(0);
  const founderScale = useSharedValue(0.92);
  const photoScale = useSharedValue(1);
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    logoFade.value = withTiming(1, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 140 });

    quoteFade.value = withDelay(
      140,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
    quoteY.value = withDelay(
      140,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );

    mainFade.value = withDelay(
      240,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    mainY.value = withDelay(
      240,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );

    founderFade.value = withDelay(
      420,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
    founderScale.value = withDelay(
      420,
      withSpring(1, { damping: 12, stiffness: 140 }),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoFade.value,
    transform: [{ scale: logoScale.value }],
  }));

  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteFade.value,
    transform: [{ translateY: quoteY.value }],
  }));

  const mainStyle = useAnimatedStyle(() => ({
    opacity: mainFade.value,
    transform: [{ translateY: mainY.value }],
  }));

  const founderStyle = useAnimatedStyle(() => ({
    opacity: founderFade.value,
    transform: [{ scale: founderScale.value }],
  }));

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-brand-bg pt-10">
      <StatusBar
        translucent={false}
        backgroundColor="#0C1422"
        barStyle="light-content"
      />

      {/* BACKGROUND */}

      <View className="absolute inset-0 bg-brand-bg" />

      {/* TOP GLOW */}

      <View
        className="absolute top-[-150] self-center"
        style={{
          width: 450,
          height: 450,
          borderRadius: 225,
          backgroundColor: '#4F7BF7',
          opacity: 0.08,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 50,
        }}>
        {/* HEADER */}

        <View className="px-5 pt-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-full border border-brand-border items-center justify-center">
            <AppText className="text-white text-xl">‹</AppText>
          </TouchableOpacity>
        </View>

        {/* LOGO */}

        <Animated.View className="items-center mt-2" style={logoStyle}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#4F7BF750',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#4F7BF7',
              shadowOpacity: 0.5,
              shadowRadius: 20,
            }}>
            <Image
              source={require('../../../../assets/logo1.png')}
              className="w-9 h-9"
              resizeMode="contain"
            />
          </View>

          <AppText
            className="text-white mt-5"
            style={{
              fontFamily: 'CormorantGaramond-Regular',
              fontSize: 24,
            }}>
            {impactumContent.title}
          </AppText>

          <AppText
            className="text-brand-textSecondary text-xs mt-2"
            style={{
              fontFamily: 'DMSans-Bold',
            }}>
            {impactumContent.subtitle}
          </AppText>
        </Animated.View>

        {/* QUOTE CARD */}

        <Animated.View
          className="mx-5 mt-10 rounded-card bg-brand-bgCardMain border border-brand-borderSoft p-6"
          style={quoteStyle}>
          <AppText
            className="text-center text-white leading-8"
            style={{
              fontFamily: 'CormorantGaramond-Italic',
              fontSize: 18,
            }}>
            "{impactumContent.quote}"
          </AppText>

          <AppText className="text-center text-brand-textMuted text-[10px] mt-4">
            — IMPACTUM
          </AppText>
        </Animated.View>

        {/* MAIN CARD */}

        <Animated.View
          className="mx-5 mt-5 rounded-card bg-brand-bgCardMain border border-brand-borderSoft p-5"
          style={mainStyle}>
          <View className="flex-row items-center">
            <Image
              source={require('../../../../assets/logo1.png')}
              className="w-8 h-8"
            />

            <View className="ml-3">
              <AppText className="text-white text-lg font-sansSemiBold">
                IMPACTUM
              </AppText>

              <AppText className="text-brand-textSecondary text-[11px]">
                Nurture your connections.
              </AppText>
            </View>
          </View>

          {impactumContent.sections.map((section: any) => (
            <View key={section.title}>
              <AppText className="text-brand-gold text-[10px] tracking-[2px] mt-10 mb-5 font-sansSemiBold uppercase">
                {section.title}
              </AppText>

              {section.paragraphs.map((paragraph: any, index: any) => {
                const isMediator =
                  section.title === 'The Mediator' && index === 0;

                if (isMediator) {
                  return (
                    <AppText
                      key={index}
                      className="text-brand-blueSoft mb-5"
                      style={{
                        fontFamily: 'CormorantGaramond-Italic',
                        fontSize: 22,
                      }}>
                      {paragraph}
                    </AppText>
                  );
                }

                return (
                  <AppText
                    key={index}
                    className="text-brand-textSecondary text-[13px] leading-7 mb-4 font-sans">
                    {paragraph}
                  </AppText>
                );
              })}

              <View className="h-[1px] bg-brand-border mt-5" />
            </View>
          ))}

          {/* FOUNDER QUOTE */}

          <View className="bg-brand-bgCardSoft rounded-card p-5 mt-8">
            <AppText
              className="text-center text-brand-textSecondary leading-6"
              style={{
                fontFamily: 'CormorantGaramond-Italic',
                fontSize: 13,
              }}>
              {impactumContent.founderQuote}
            </AppText>
          </View>

          {/* FOUNDER */}

          <Animated.View className="items-center mt-8" style={founderStyle}>
            <AnimatedTouchable
              onPress={() => setImageVisible(true)}
              onPressIn={() => {
                photoScale.value = withSpring(0.94, {
                  damping: 14,
                  stiffness: 220,
                });
              }}
              onPressOut={() => {
                photoScale.value = withSpring(1, {
                  damping: 14,
                  stiffness: 220,
                });
              }}
              className="border-[3px] border-brand-gold rounded-full p-1"
              style={photoStyle}>
              <Image
                source={require('../../../../assets/abrahum.jpeg')}
                className="w-24 h-24 rounded-full"
              />
            </AnimatedTouchable>

            <AppText
              className="text-brand-goldLight mt-5"
              style={{
                fontFamily: 'CormorantGaramond-Italic',
                fontSize: 20,
              }}>
              A warm embrace.
            </AppText>

            <AppText className="text-white text-lg mt-2">Abraham Vilalta</AppText>

            <AppText className="text-brand-textMuted text-[10px] tracking-[2px] mt-1 uppercase">
              Founder
            </AppText>

            <AnimatedTouchable
              onPress={() => openModal()}
              onPressIn={() => {
                ctaScale.value = withSpring(0.96, {
                  damping: 14,
                  stiffness: 220,
                });
              }}
              onPressOut={() => {
                ctaScale.value = withSpring(1, {
                  damping: 14,
                  stiffness: 220,
                });
              }}
              className="bg-brand-gold mt-8 px-8 py-4 rounded-btn"
              style={ctaStyle}>
              <AppText className="text-black font-sansSemiBold">
                Create your relationship
              </AppText>
            </AnimatedTouchable>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={imageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setImageVisible(false)}
          className="flex-1 bg-black/95 justify-center items-center">
          <Animated.View entering={FadeIn.duration(220)}>
            <Image
              source={require('../../../../assets/abrahum.jpeg')}
              resizeMode="contain"
              style={{
                width: 300,
                height: 600,
              }}
            />

            <AppText className="text-white mt-4 text-base text-center">
              Abraham Vilalta
            </AppText>

            <AppText className="text-brand-textMuted mt-2 text-center">
              Tap anywhere to close
            </AppText>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
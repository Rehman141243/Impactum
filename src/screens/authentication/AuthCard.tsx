

import React, { useEffect, useRef } from "react";
import {
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthCard({ children }: { children: React.ReactNode }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const { width } = useWindowDimensions();


  const isTablet = width >= 768;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        420,
        delay:           60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue:         0,
        damping:         18,
        stiffness:       140,
        mass:            0.9,
        delay:           60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" style={{}}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center items-center px-5 py-8 md:px-10 lg:px-16"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={{
              opacity:   fadeAnim,
              transform: [{ translateY: slideAnim }],
              width:     "100%",
              maxWidth:  isTablet ? 480 : "100%",
            }}
          >
            <View
              className="bg-brand-bgCard rounded-card border border-brand-border px-6 py-8 md:px-9 md:py-10 lg:px-10 lg:py-12 w-full"
              style={{
                shadowColor:   "#000",
                shadowOffset:  { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius:  24,
                elevation:     12,
              }}
            >
              {children}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
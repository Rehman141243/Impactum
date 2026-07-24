import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, BackHandler, Platform } from 'react-native';
import { Sparkles, Check, X } from 'lucide-react-native';
import AppText from '../common/AppText';

interface Props {
  visible: boolean;
  topic: string;
  requesterName: string;
  responding: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function MediationRequestModal({
  visible,
  topic,
  requesterName,
  responding,
  onAccept,
  onDecline,
}: Props) {
  const [rendered, setRendered] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      backdropAnim.setValue(0);
      cardAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(cardAnim, { toValue: 1, damping: 16, stiffness: 180, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(cardAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  useEffect(() => {
    if (!rendered || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [rendered]);

  if (!rendered) return null;

  const backdropOpacity = backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.75] });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none" collapsable={false}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: backdropOpacity }]}
      />
      <View style={styles.backdrop} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, { opacity: backdropAnim, transform: [{ scale: cardAnim }] }]}>
          <View style={styles.iconWrap}>
            <Sparkles size={20} color="#4F7BF7" />
          </View>

          <AppText className="text-brand-textPrimary text-[16px] font-sansSemiBold text-center mt-3">
            Dr. Harmony Mediation Request
          </AppText>

          <AppText className="text-brand-textMuted text-[13px] text-center mt-2 leading-5">
            {requesterName} asked Dr. Harmony to help talk through something and wants you to join.
          </AppText>

          {!!topic && (
            <View style={styles.topicBox}>
              <AppText className="text-brand-textSecondary text-[12px]" numberOfLines={3}>
                "{topic}"
              </AppText>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onDecline}
              disabled={responding}
              style={[styles.button, styles.declineButton]}>
              <X size={15} color="#94A3B8" />
              <AppText className="text-brand-textMuted text-[13px] font-sansMedium ml-1.5">
                Not now
              </AppText>
            </Pressable>

            <Pressable
              onPress={onAccept}
              disabled={responding}
              style={[styles.button, styles.acceptButton]}>
              <Check size={15} color="#FFFFFF" />
              <AppText className="text-white text-[13px] font-sansSemiBold ml-1.5">
                {responding ? 'Joining…' : 'Join session'}
              </AppText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F1626',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E2D45',
    padding: 22,
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D4A7A',
  },
  topicBox: {
    marginTop: 14,
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1A2535',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  declineButton: {
    backgroundColor: '#141C2E',
    borderWidth: 1,
    borderColor: '#1E2D45',
  },
  acceptButton: {
    backgroundColor: '#4F7BF7',
  },
});
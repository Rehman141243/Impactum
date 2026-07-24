import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
  BackHandler,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import AppText from '../common/AppText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DeleteRelationshipSheetProps {
  visible: boolean;
  partnerName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteRelationshipSheet({
  visible,
  partnerName,
  deleting,
  onConfirm,
  onCancel,
}: DeleteRelationshipSheetProps) {

  const [rendered, setRendered] = useState(false);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconGlow = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;
  const cancelScale = useRef(new Animated.Value(1)).current;

  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = () => {
    if (deleting) return;
    onCancel();
  };


  useEffect(() => {
    if (visible) {
      setRendered(true);

      backdropAnim.setValue(0);
      sheetAnim.setValue(SCREEN_HEIGHT);
      iconScale.setValue(0.8);
      shake.setValue(0);
      iconGlow.setValue(0);

      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      Animated.spring(sheetAnim, {
        toValue: 0,
        damping: 16,
        stiffness: 140,
        mass: 1,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.delay(120),
        Animated.spring(iconScale, {
          toValue: 1,
          damping: 9,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.delay(120),
        Animated.timing(shake, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();


      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(iconGlow, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconGlow, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      glowTimerRef.current = setTimeout(() => {
        glowLoopRef.current?.start();
      }, 400);

      return () => {
        if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
      };
    } else if (rendered) {
      glowLoopRef.current?.stop();
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 230,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRendered(false);
      });
    }
 
  }, [visible]);


  useEffect(() => {
    if (!rendered || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();

  }, [rendered, deleting]);

  if (!rendered) return null;

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.75],
  });

  const wobble = shake.interpolate({
    inputRange: [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
    outputRange: ['0deg', '6deg', '-5deg', '4deg', '-3deg', '2deg', '0deg'],
  });

  const iconGlowOpacity = iconGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  const iconGlowScale = iconGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 9999 }]}
      pointerEvents="box-none">

 
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: backdropOpacity }]}
      />
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPress={handleClose}
      />

      <Animated.View
        collapsable={false}
        style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>

        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <Pressable
          onPress={handleClose}
          disabled={deleting}
          hitSlop={10}
          style={styles.closeBtn}>
          <X size={15} color="#94A3B8" />
        </Pressable>

        <View style={styles.iconRow}>
          <View style={styles.iconGlowWrap}>
            {/* Soft pulsing halo — opacity/scale only (Android-safe) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.iconGlow,
                {
                  opacity: iconGlowOpacity,
                  transform: [{ scale: iconGlowScale }],
                },
              ]}
            />
            <Animated.View
              collapsable={false}
              style={[
                styles.iconCircle,
                { transform: [{ scale: iconScale }, { rotate: wobble }] },
              ]}>
              <AlertTriangle size={32} color="#EF4444" />
            </Animated.View>
          </View>
        </View>

        <AppText style={styles.title}>Delete this relationship?</AppText>
        <AppText style={styles.body}>
          Your bond with{' '}
          <AppText style={styles.bodyStrong}>{partnerName}</AppText> will be
          permanently removed, along with your harmony history. This can't
          be undone.
        </AppText>

        <View style={styles.actions}>
          <Animated.View style={{ transform: [{ scale: confirmScale }] }}>
            <Pressable
              onPress={onConfirm}
              disabled={deleting}
              onPressIn={() => {
                Animated.timing(confirmScale, {
                  toValue: 0.97,
                  duration: 90,
                  useNativeDriver: true,
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(confirmScale, {
                  toValue: 1,
                  damping: 10,
                  stiffness: 200,
                  useNativeDriver: true,
                }).start();
              }}
              style={[styles.confirmBtn, { opacity: deleting ? 0.7 : 1 }]}>
              <Trash2 size={18} color="#fff" />
              <AppText style={styles.confirmText}>
                {deleting ? 'Deleting…' : 'Yes, delete it'}
              </AppText>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: cancelScale }] }}>
            <Pressable
              onPress={handleClose}
              disabled={deleting}
              onPressIn={() => {
                Animated.timing(cancelScale, {
                  toValue: 0.97,
                  duration: 90,
                  useNativeDriver: true,
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(cancelScale, {
                  toValue: 1,
                  damping: 10,
                  stiffness: 200,
                  useNativeDriver: true,
                }).start();
              }}
              style={styles.cancelBtn}>
              <AppText style={styles.cancelText}>Keep relationship</AppText>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0E1626',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    zIndex: 9999,
    ...(Platform.OS === 'android'
      ? { elevation: 24 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148,163,184,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconRow: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  iconGlowWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EF444430',
    opacity: 0.35,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,

    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.35)',
  },
  title: {
    fontFamily: 'sansSemiBold',
    fontSize: 18,
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontFamily: 'sans',
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  bodyStrong: {
    fontFamily: 'sansMedium',
    color: '#F1F5F9',
  },
  actions: {
    gap: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    ...(Platform.OS === 'android'
      ? { elevation: 6 }
      : {
          shadowColor: '#EF4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }),
  },
  confirmText: {
    fontFamily: 'sansSemiBold',
    fontSize: 15,
    color: '#fff',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
  },
  cancelText: {
    fontFamily: 'sansMedium',
    fontSize: 15,
    color: '#94A3B8',
  },
});
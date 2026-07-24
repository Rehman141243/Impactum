import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  TouchableOpacity,
  Animated,
  BackHandler,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import AppText from './common/AppText';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetOverlayProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Disable close (backdrop tap / back button / X) while a save/delete is in flight */
  closeDisabled?: boolean;
  maxHeightPct?: number; // 0-1, default 0.85
  scroll?: boolean; // wrap children in a ScrollView, default true
}

/**
 * Manual bottom-sheet overlay -- deliberately does NOT use React Native's
 * <Modal>. RN's <Modal> has proven unreliable on Android in this app
 * (collapses to fit content instead of filling the screen). This
 * absolute-position + Animated technique is the pattern already proven
 * to work identically on iOS and Android via DeleteRelationshipSheet.
 */
export default function BottomSheetOverlay({
  visible,
  onClose,
  title,
  icon,
  children,
  closeDisabled = false,
  maxHeightPct = 0.85,
  scroll = true,
}: BottomSheetOverlayProps) {
  const [rendered, setRendered] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const handleClose = () => {
    if (closeDisabled) return;
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setRendered(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(SCREEN_HEIGHT);

      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      Animated.spring(sheetAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 150,
        mass: 1,
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  useEffect(() => {
    if (!rendered || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [rendered, closeDisabled]);

  if (!rendered) return null;

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.75],
  });

  const Content = (
    <View style={{ paddingHorizontal: 24, paddingBottom: 36, paddingTop: 4 }}>
      {children}
    </View>
  );

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
        style={[
          styles.sheet,
          { maxHeight: SCREEN_HEIGHT * maxHeightPct, transform: [{ translateY: sheetAnim }] },
        ]}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon}
            <AppText style={styles.title} numberOfLines={1}>{title}</AppText>
          </View>
          <Pressable
            onPress={handleClose}
            disabled={closeDisabled}
            hitSlop={10}
            style={[styles.closeBtn, { opacity: closeDisabled ? 0.5 : 1 }]}>
            <X size={16} color="#64748B" />
          </Pressable>
        </View>

        {scroll ? (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {Content}
          </ScrollView>
        ) : (
          Content
        )}
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
    backgroundColor: '#0A0E17',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#1A2535',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: 'sansMedium',
    fontSize: 16,
    color: '#94A3B8',
    flexShrink: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A2535',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
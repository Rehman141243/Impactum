import { ActivityIndicator, Image, Pressable, View, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AppText from '../common/AppText';
import { Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../../utils/axiosClient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

export interface PendingImage {
  uri: string;
  name: string;
  type: string;
}

export interface MomentRow {
  id: string;
  relationship_id: string;
  created_by: string;
  title: string;
  description: string | null;
  moment_date: string | null;
  created_at: string;
  best_moment_images?: any[];
}

function GlowHalo({ color, spread = 16 }: { color: string; spread?: number }) {
  const pulse = useSharedValue(0);
  const gradientId = useRef(`moment-glow-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.35,
    transform: [{ scale: 0.96 + pulse.value * 0.08 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: -spread, left: -spread, right: -spread, bottom: -spread },
        glowStyle,
      ]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
}

export function MomentImagePicker({
  accentColor,
  pendingImage,
  onPick,
  onClear,
}: {
  accentColor: string;
  pendingImage: PendingImage | null;
  onPick: (img: PendingImage) => void;
  onClear: () => void;
}) {
  const pick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel || !result.assets || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    const ext = asset.fileName?.split('.').pop() ?? asset.uri.split('.').pop() ?? 'jpg';

    onPick({
      uri: asset.uri,
      name: asset.fileName ?? `moment.${ext}`,
      type: asset.type ?? `image/${ext}`,
    });
  };

  if (pendingImage) {
    return (
      <View style={{ position: 'relative' }}>
        <GlowHalo color={accentColor} spread={12} />
        <View style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
          <Image
            source={{ uri: pendingImage.uri }}
            style={{ width: '100%', height: 180, borderRadius: 16 }}
            resizeMode="cover"
          />
          {/* glass border + faint sheen over the photo edge */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: 16, borderWidth: 1, borderColor: accentColor + '55' },
            ]}
          />
          <Pressable
            onPress={onClear}
            style={{
              position: 'absolute', top: 8, right: 8,
              backgroundColor: '#00000088', borderRadius: 20,
              padding: 6,
            }}>
            <X size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <GlowHalo color={accentColor} spread={14} />
      <Pressable
        onPress={pick}
        style={{
          height: 100, borderRadius: 16, borderWidth: 1.5,
          borderColor: accentColor + '55', borderStyle: 'dashed',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#0F1923E6', gap: 8, flexDirection: 'row',
          overflow: 'hidden',
        }}>
        {/* tinted glass wash */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: accentColor + '10' }]}
        />
        {/* diagonal sheen */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -50, left: -30,
            width: '60%', height: '260%',
            backgroundColor: '#FFFFFF0D',
            transform: [{ rotate: '20deg' }],
          }}
        />
        <Plus size={18} color={accentColor} />
        <AppText style={{ color: accentColor, fontSize: 14, fontFamily: 'sansMedium' }}>
          Add Photo
        </AppText>
      </Pressable>
    </View>
  );
}

export function MomentCard({
  moment,
  accentColor,
  onImageDeleted,
  onPress,
}: {
  moment: MomentRow;
  accentColor: string;
  relationshipId?: string;
  onImageDeleted: () => void;
  onPress?: (moment: MomentRow) => void;
}) {
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    try {
      await apiClient.delete(`/moments/images/${imageId}`);
      onImageDeleted();
    } catch (err) {
      console.error('[MomentCard] delete image error:', err);
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <View style={{ position: 'relative' }}>
      <GlowHalo color={accentColor} spread={12} />
      <Pressable
        onPress={onPress ? () => onPress(moment) : undefined}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: accentColor + '45',
          backgroundColor: '#111B2DE6',
        }}>
        {/* tinted glass wash */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: accentColor + '0C' }]}
        />
        {/* diagonal sheen */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -60, left: -40,
            width: '70%', height: '220%',
            backgroundColor: '#FFFFFF0A',
            transform: [{ rotate: '20deg' }],
          }}
        />
        {/* inner hairline highlight */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF12' },
          ]}
        />

        {/* Images */}
        {moment.best_moment_images && moment.best_moment_images.length > 0 && (
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: moment.best_moment_images[0].image_url }}
              style={{ width: '100%', height: 160 }}
              resizeMode="cover"
            />
            <Pressable
              onPress={() => handleDeleteImage(moment.best_moment_images![0].id)}
              disabled={deletingImageId === moment.best_moment_images[0].id}
              style={{
                position: 'absolute', top: 8, right: 8,
                backgroundColor: '#000000', borderRadius: 20, padding: 6,
              }}>
              {deletingImageId === moment.best_moment_images[0].id
                ? <ActivityIndicator size="small" color="#F87171" />
                : <Trash2 size={14} color="#FFFFFF" />
              }
            </Pressable>
          </View>
        )}

        {/* Text content */}
        {moment.description && (
          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <AppText className="font-sans text-body-sm text-brand-textSecondary" style={{ flex: 1 }}>
              {moment.description}
            </AppText>
            {onPress ? <Pencil size={14} color="#64748B" style={{ marginTop: 2 }} /> : null}
          </View>
        )}

        {/* Edit affordance when there's no description (image-only moment) */}
        {!moment.description && onPress ? (
          <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <Pencil size={12} color="#64748B" />
            <AppText style={{ fontSize: 11, color: '#64748B', fontFamily: 'sans' }}>
              Tap to edit
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
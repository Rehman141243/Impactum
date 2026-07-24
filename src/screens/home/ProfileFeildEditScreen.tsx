

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft, Shield, Star, Check, Plus, X, Trash2, Pencil,
} from 'lucide-react-native';
import AppText from '../../components/common/AppText';
import { apiClient } from '../../utils/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from './homennavigator';
import {
  MomentImagePicker, MomentCard, PendingImage, MomentRow,
} from '../../components/home/Momentimagepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import {
  BoundaryCard, BoundaryRow, CurrentRatingsResponse, EditSheet, FormCard,
  getFieldMeta, GlowIconBadge, ListEmptyHint, PlainInput, RatingRow, RouteParams,
  SaveButton, SectionLabel, StarDisplay, StarPicker,
} from './PersonProfileScreens/profilepersoncomponents';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';

export default function ProfileFieldEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'ProfileFieldEdit'>>();
  const { user } = useAuth();
  const { relationshipId, who, field } = route.params;
  const [relationship, setRelationship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [textValue, setTextValue] = useState('');
  const [savedText, setSavedText] = useState<string | null>(null);
  const [partnerSavedText, setPartnerSavedText] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [givenRating, setGivenRating] = useState<RatingRow | null>(null);
  const [receivedRating, setReceivedRating] = useState<RatingRow | null>(null);
  const [boundaryTitle, setBoundaryTitle] = useState('');
  const [boundaryDescription, setBoundaryDescription] = useState('');
  const [boundaries, setBoundaries] = useState<BoundaryRow[]>([]);
  const [boundariesLoading, setBoundariesLoading] = useState(false);
  const [boundaryAction, setBoundaryAction] = useState<{ id: string; type: 'accept' | 'reject' | 'delete' } | null>(null);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [editingBoundary, setEditingBoundary] = useState<BoundaryRow | null>(null);
  const [editBoundaryTitle, setEditBoundaryTitle] = useState('');
  const [editBoundaryDescription, setEditBoundaryDescription] = useState('');
  const [editBoundarySaving, setEditBoundarySaving] = useState(false);
  const [editBoundaryError, setEditBoundaryError] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [momentDescription, setMomentDescription] = useState('');
  const [moments, setMoments] = useState<MomentRow[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);


  const [editingMoment, setEditingMoment] = useState<MomentRow | null>(null);
  const [editMomentDescription, setEditMomentDescription] = useState('');
  const [editMomentPendingImage, setEditMomentPendingImage] = useState<PendingImage | null>(null);
  const [editMomentSaving, setEditMomentSaving] = useState(false);
  const [editMomentError, setEditMomentError] = useState('');

  const fetchRelationship = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/relationships');
      if (data.success) {
        setRelationship(data.relationships.find((r: any) => r.id === relationshipId) ?? null);
      }
    } catch (err) {
      console.error('[ProfileFieldEdit] fetch relationship error:', err);
    } finally {
      setLoading(false);
    }
  }, [relationshipId]);

  const fetchProfileField = useCallback(async () => {
    try {
      const { data: myData } = await apiClient.get(`/person-profile/${relationshipId}/me`);
      if (myData.success) {
        const value = (myData.data?.[field] as string) ?? '';
        setTextValue(value);
        setSavedText(value || null);
      }
      const { data: partnerData } = await apiClient.get(`/person-profile/${relationshipId}/partner`);
      if (partnerData.success) {
        setPartnerSavedText((partnerData.data?.[field] as string) || null);
      }
    } catch (err) {
      console.error('[ProfileFieldEdit] fetch profile field error:', err);
    }
  }, [relationshipId, field]);

  const fetchCurrentRating = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/ratings/${relationshipId}/current`);
      if (data.success) {
        const result: CurrentRatingsResponse = data.data;
        setGivenRating(result.given);
        setReceivedRating(result.received);
        if (who === 'partner' && result.given) {
          setRatingValue(result.given.rating ?? 0);
          setTextValue(result.given.reason ?? '');
        }
      }
    } catch (err) {
      console.error('[ProfileFieldEdit] fetch rating error:', err);
    }
  }, [relationshipId, who]);

  const fetchBoundaries = useCallback(async () => {
    setBoundariesLoading(true);
    try {
      const { data } = await apiClient.get(`/boundaries/${relationshipId}`);
      if (data.success && Array.isArray(data.data)) setBoundaries(data.data);
    } catch (err) {
      console.error('[ProfileFieldEdit] fetch boundaries error:', err);
    } finally {
      setBoundariesLoading(false);
    }
  }, [relationshipId]);

  const fetchMoments = useCallback(async () => {
    setMomentsLoading(true);
    try {
      const { data } = await apiClient.get(`/moments/${relationshipId}`);
      if (data.success && Array.isArray(data.data)) setMoments(data.data);
    } catch (err) {
      console.error('[ProfileFieldEdit] fetch moments error:', err);
    } finally {
      setMomentsLoading(false);
    }
  }, [relationshipId]);

  useEffect(() => { fetchRelationship(); }, [fetchRelationship]);

  useEffect(() => {
    if (field === 'rating') fetchCurrentRating();
    else if (field === 'boundaries') fetchBoundaries();
    else if (field === 'best_moments') fetchMoments();
    else fetchProfileField();
  }, [field, fetchCurrentRating, fetchBoundaries, fetchMoments, fetchProfileField]);

  const isCreator = relationship?.creator_id === user?.id;
  const partnerName = isCreator ? relationship?.other_person_name : relationship?.creator_name;
  const myName = isCreator ? relationship?.creator_name : relationship?.other_person_name;
  const meta = getFieldMeta(field, partnerName, who);
  const ratingIsEditable = who === 'partner';
  const showSaveButton = meta.kind === 'rating' ? ratingIsEditable : who === 'me';

  const saveGenericText = async () => {
    if (!textValue.trim()) { setError('Please write something before saving.'); return; }
    setError(''); setSaving(true);
    try {
      const trimmed = textValue.trim();
      await apiClient.patch(`/person-profile/${relationshipId}/me/field`, { field, value: trimmed });
      setSavedText(trimmed);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteGenericText = async () => {
    setError(''); setSaving(true);
    try {
      await apiClient.delete(`/person-profile/${relationshipId}/me/field`, { data: { field } });
      setSavedText(null);
      setTextValue('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not delete. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveRating = async () => {
    if (ratingValue < 1) { setError('Tap a star to rate before saving.'); return; }
    setError(''); setSaving(true);
    try {
      await apiClient.post(`/ratings/${relationshipId}`, { rating: ratingValue, reason: textValue.trim() || null });
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save your rating. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveBoundary = async () => {
    if (!boundaryTitle.trim()) { setError('Give this boundary a short title.'); return; }
    if (saving) return;
    setError(''); setSaving(true);
    try {
      await apiClient.post(`/boundaries/${relationshipId}`, {
        title: boundaryTitle.trim(),
        description: boundaryDescription.trim() || null,
      });
      setBoundaryTitle('');
      setBoundaryDescription('');
      fetchBoundaries();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not add this boundary. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveMoment = async () => {
    if (!momentDescription.trim() && !pendingImage) {
      setError('Add a description or a photo before saving.');
      return;
    }
    setError(''); setSaving(true);
    try {
      const { data } = await apiClient.post(`/moments/${relationshipId}`, {
        description: momentDescription.trim() || null,
      });
      if (data?.success && data.data && pendingImage) {
        const formData = new FormData();
        formData.append('image', { uri: pendingImage.uri, name: pendingImage.name, type: pendingImage.type } as any);
        await apiClient.post(`/moments/${data.data.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setMomentDescription('');
      setPendingImage(null);
      fetchMoments();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not add this moment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (meta.kind === 'rating') return ratingIsEditable ? saveRating() : undefined;
    if (meta.kind === 'boundaries') return saveBoundary();
    if (meta.kind === 'moments') return saveMoment();
    return saveGenericText();
  };

  const handleBoundaryAgreement = async (rowId: string, agree: boolean) => {
    setBoundaryAction({ id: rowId, type: agree ? 'accept' : 'reject' });
    try {
      await apiClient.patch(agree ? `/boundaries/agree/${rowId}` : `/boundaries/reject/${rowId}`);
      fetchBoundaries();
    } catch {
      setError('Could not update agreement status. Please try again.');
    } finally {
      setBoundaryAction(null);
    }
  };

  const handleDeleteBoundary = async (rowId: string) => {
    setBoundaryAction({ id: rowId, type: 'delete' });
    try {
      await apiClient.delete(`/boundaries/${rowId}`);
      fetchBoundaries();
    } catch {
      setError('Could not delete boundary. Please try again.');
    } finally {
      setBoundaryAction(null);
    }
  };

  const openEditBoundary = (b: BoundaryRow) => {
    setEditingBoundary(b);
    setEditBoundaryTitle(b.title ?? '');
    setEditBoundaryDescription(b.description ?? '');
    setEditBoundaryError('');
  };

  const saveEditedBoundary = async () => {
    if (!editingBoundary) return;
    if (!editBoundaryTitle.trim()) { setEditBoundaryError('Give this boundary a short title.'); return; }
    setEditBoundaryError(''); setEditBoundarySaving(true);
    try {
      const rowId = editingBoundary.boundary_id ?? editingBoundary.id;
      await apiClient.patch(`/boundaries/${rowId}`, {
        title: editBoundaryTitle.trim(),
        description: editBoundaryDescription.trim() || null,
      });
      setEditingBoundary(null);
      fetchBoundaries();
    } catch (err: any) {
      setEditBoundaryError(err?.response?.data?.message ?? 'Could not update. Please try again.');
    } finally {
      setEditBoundarySaving(false);
    }
  };

  const deleteEditedBoundary = async () => {
    if (!editingBoundary) return;
    setEditBoundarySaving(true);
    try {
      await apiClient.delete(`/boundaries/${editingBoundary.boundary_id ?? editingBoundary.id}`);
      setEditingBoundary(null);
      fetchBoundaries();
    } catch {
      setEditBoundaryError('Could not delete this boundary. Please try again.');
    } finally {
      setEditBoundarySaving(false);
    }
  };

  // --- Moment edit/delete handlers ---
  const openEditMoment = (m: MomentRow) => {
    setEditingMoment(m);
    setEditMomentDescription(m.description ?? '');
    setEditMomentPendingImage(null);
    setEditMomentError('');
  };

  const saveEditedMoment = async () => {
    if (!editingMoment) return;
    if (!editMomentDescription.trim() && !editMomentPendingImage
        && (!editingMoment.best_moment_images || editingMoment.best_moment_images.length === 0)) {
      setEditMomentError('Add a description or a photo before saving.');
      return;
    }
    setEditMomentError(''); setEditMomentSaving(true);
    try {
      await apiClient.patch(`/moments/${editingMoment.id}`, {
        description: editMomentDescription.trim() || null,
      });
      if (editMomentPendingImage) {
        const formData = new FormData();
        formData.append('image', {
          uri: editMomentPendingImage.uri,
          name: editMomentPendingImage.name,
          type: editMomentPendingImage.type,
        } as any);
        await apiClient.post(`/moments/${editingMoment.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setEditingMoment(null);
      fetchMoments();
    } catch (err: any) {
      setEditMomentError(err?.response?.data?.message ?? 'Could not update this moment. Please try again.');
    } finally {
      setEditMomentSaving(false);
    }
  };

  const deleteEditedMoment = async () => {
    if (!editingMoment) return;
    setEditMomentSaving(true);
    try {
      await apiClient.delete(`/moments/${editingMoment.id}`);
      setEditingMoment(null);
      fetchMoments();
    } catch (err: any) {
      setEditMomentError(err?.response?.data?.message ?? 'Could not delete this moment. Please try again.');
    } finally {
      setEditMomentSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0C1422', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar backgroundColor="#0A0E17" barStyle="light-content" />
        <AnimatedInfinityLogo size={48} mode="loop" />
      </View>
    );
  }

  const saveLabel =
    meta.kind === 'boundaries' ? 'Add Boundary' :
    meta.kind === 'moments' ? 'Add Moment' :
    meta.kind === 'rating' ? 'Submit Rating' : 'Save';

  const saveIcon =
    meta.kind === 'boundaries' || meta.kind === 'moments'
      ? <Plus size={18} color="#fff" />
      : <Check size={18} color="#fff" />;

  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
      <StatusBar backgroundColor="#0A0E17" barStyle="light-content" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <Animated.View
          entering={FadeInDown.duration(350)}
          className="flex-row items-center justify-between px-5 pt-4 pb-4"
          style={{ borderBottomWidth: 1, borderBottomColor: '#1A2535' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 rounded-full bg-brand-bgCardSoft border border-brand-borderSoft items-center justify-center">
            <ArrowLeft size={18} color="#94A3B8" />
          </Pressable>

          <View className="flex-row items-center gap-2">
            <GlowIconBadge
              icon={meta.icon}
              accentColor={meta.accentColor}
              iconBg={meta.iconBg}
              size={32}
            />
            <AppText
              className="font-sansMedium text-caption text-brand-textMuted uppercase tracking-[2px]"
              numberOfLines={1}
              style={{ maxWidth: 180 }}>
              {meta.title}
            </AppText>
          </View>

          {showSaveButton ? (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: saving ? '#1A2535' : meta.accentColor + '22',
                borderWidth: 1, borderColor: meta.accentColor + '66',
              }}>
              {saving
                ? <ActivityIndicator size="small" color={meta.accentColor} />
                : <Check size={18} color={meta.accentColor} />}
            </Pressable>
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(80).duration(400)} className="mb-6">
            <View className='flex-row items-center'>
            <Animated.View
              entering={ZoomIn.delay(50).duration(350)}
              className="mb-4">
              <GlowIconBadge
                icon={meta.icon}
                accentColor={meta.accentColor}
                iconBg={meta.iconBg}
                size={50}
              />
            </Animated.View>
            <View className='flex-col items-start ml-4 flex-wrap text-wrap'>
            <AppText className="font-heading text-xl text-white mb-2" style={{ fontSize: 18, lineHeight: 32 }}>
              {meta.title}
            </AppText>
            {meta.subtitle ? (
              <AppText className="font-sans text-wrap text-xs text-brand-textSecondary w-80 mb-4">
                {meta.subtitle}
              </AppText>
            ) : null}
          </View>
          </View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(150).duration(500)}
            className="mb-6 rounded-full"
            style={{ height: 2, backgroundColor: meta.accentColor + '33' }}
          />

          {meta.kind === 'rating' && !ratingIsEditable && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              {receivedRating ? (
                <>
                  <StarDisplay value={receivedRating.rating} accentColor={meta.accentColor} />
                  {receivedRating.reason ? (
                    <View className="mt-2">
                      <SectionLabel>WHAT THEY SAID</SectionLabel>
                      <FormCard accentColor={meta.accentColor}>
                        <AppText className="font-sans text-body-md text-brand-textPrimary leading-6">
                          {receivedRating.reason}
                        </AppText>
                      </FormCard>
                    </View>
                  ) : null}
                </>
              ) : (
                <View className="items-center py-10">
                  <Animated.View entering={ZoomIn.delay(200).duration(350)}>
                    <Star size={40} color="#334155" />
                  </Animated.View>
                  <AppText className="font-sans text-body-md text-brand-textMuted text-center mt-4">
                    {partnerName ? `${partnerName} hasn't rated you yet.` : "They haven't rated you yet."}
                  </AppText>
                </View>
              )}
            </Animated.View>
          )}

          {meta.kind === 'rating' && ratingIsEditable && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              {givenRating ? (
                <AppText className="font-sans text-body-sm text-brand-textMuted text-center mb-1">
                  Saving will add a new rating.
                </AppText>
              ) : null}
              <AppText className="font-sansMedium text-body-md text-brand-textSecondary text-center mb-2">
                {ratingValue === 0 ? 'Tap a star to rate'
                  : ratingValue <= 2 ? 'Needs work'
                  : ratingValue === 3 ? 'Getting there'
                  : ratingValue === 4 ? 'Doing well'
                  : 'Thriving ✨'}
              </AppText>
              <StarPicker value={ratingValue} onChange={setRatingValue} accentColor={meta.accentColor} />
              <View className="mt-2">
                <SectionLabel>WHY THIS RATING? (Optional)</SectionLabel>
                <FormCard accentColor={meta.accentColor}>
                  <View style={{ minHeight: 100 }}>
                    <PlainInput
                      value={textValue}
                      onChangeText={setTextValue}
                      placeholder="A sentence or two about where things stand..."
                      accentColor={meta.accentColor}
                      multiline
                    />
                  </View>
                </FormCard>
              </View>
            </Animated.View>
          )}

          {meta.kind === 'boundaries' && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              {who === 'me' && (
                <>
                  <SectionLabel>TITLE</SectionLabel>
                  <FormCard accentColor={meta.accentColor}>
                    <PlainInput
                      value={boundaryTitle}
                      onChangeText={v => { setBoundaryTitle(v); setError(''); }}
                      placeholder="e.g. No work talk after 8pm"
                      accentColor={meta.accentColor}
                    />
                  </FormCard>

                  <View className="mt-4">
                    <SectionLabel>DETAILS (Optional)</SectionLabel>
                    <FormCard accentColor={meta.accentColor}>
                      <View style={{ minHeight: 90 }}>
                        <PlainInput
                          value={boundaryDescription}
                          onChangeText={setBoundaryDescription}
                          placeholder="Add any context or specifics..."
                          accentColor={meta.accentColor}
                          multiline
                        />
                      </View>
                    </FormCard>
                  </View>

                  {error ? (
                    <Animated.View entering={FadeInDown.duration(250)}>
                      <AppText className="text-red-500 text-xs font-sans mt-2 ml-1">{error}</AppText>
                    </Animated.View>
                  ) : null}

                  <SaveButton onPress={handleSave} saving={saving} label={saveLabel} icon={saveIcon} accentColor={meta.accentColor} />
                </>
              )}

              <View className="mt-8">
                <View className="flex-row items-center justify-between mb-3">
                  <SectionLabel>EXISTING BOUNDARIES</SectionLabel>
                  {who === 'me' && boundaries.some(b => b.deleted_at) && (
                    <Pressable
                      onPress={() => setShowDeletedModal(true)}
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: '#1A2535', borderWidth: 1, borderColor: '#2D3748' }}>
                      <Trash2 size={12} color="#64748B" />
                      <AppText className="font-sansMedium text-[11px]" style={{ color: '#64748B' }}>Deleted</AppText>
                    </Pressable>
                  )}
                </View>

                {boundariesLoading ? (
                  <ActivityIndicator color={meta.accentColor} style={{ marginTop: 8 }} />
                ) : boundaries.filter(b => !b.deleted_at).length === 0 ? (
                  <ListEmptyHint text="No boundaries set yet." />
                ) : (
                  <View className="gap-3">
                    {boundaries.filter(b => !b.deleted_at).map((b, i) => (
                      <BoundaryCard
                        key={b.boundary_id ?? b.id}
                        b={b}
                        index={i}
                        partnerName={partnerName}
                        boundaryAction={boundaryAction}
                        readOnly={who === 'partner'}
                        onPress={() => { if (who === 'me') openEditBoundary(b); }}
                        onAccept={() => handleBoundaryAgreement(b.boundary_id ?? b.id, true)}
                        onReject={() => handleBoundaryAgreement(b.boundary_id ?? b.id, false)}
                        onDelete={() => handleDeleteBoundary(b.boundary_id ?? b.id)}
                      />
                    ))}
                  </View>
                )}
              </View>

            </Animated.View>
          )}

          {meta.kind === 'moments' && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              {who === 'me' && (
                <>
                  <SectionLabel>DESCRIPTION</SectionLabel>
                  <FormCard accentColor={meta.accentColor}>
                    <View style={{ minHeight: 90 }}>
                      <PlainInput
                        value={momentDescription}
                        onChangeText={v => { setMomentDescription(v); setError(''); }}
                        placeholder="What made it memorable..."
                        accentColor={meta.accentColor}
                        multiline
                      />
                    </View>
                  </FormCard>
                  <View className="mt-4">
                    <SectionLabel>PHOTO (Optional)</SectionLabel>
                    <MomentImagePicker
                      accentColor={meta.accentColor}
                      pendingImage={pendingImage}
                      onPick={setPendingImage}
                      onClear={() => setPendingImage(null)}
                    />
                  </View>

                  {error ? (
                    <Animated.View entering={FadeInDown.duration(250)}>
                      <AppText className="text-red-500 text-xs font-sans mt-2 ml-1">{error}</AppText>
                    </Animated.View>
                  ) : null}

                  <SaveButton onPress={handleSave} saving={saving} label={saveLabel} icon={saveIcon} accentColor={meta.accentColor} />
                </>
              )}

              <View className="mt-8">
                <SectionLabel>PAST MOMENTS</SectionLabel>
                {momentsLoading ? (
                  <ActivityIndicator color={meta.accentColor} style={{ marginTop: 8 }} />
                ) : moments.length === 0 ? (
                  <ListEmptyHint text="No moments logged yet." />
                ) : (
                  <View className="gap-3 mt-1">
                    {moments.map((m, i) => (
                      <Animated.View key={m.id} entering={FadeInDown.delay(i * 60).duration(350).springify().damping(18)}>
                        <MomentCard
                          moment={m}
                          accentColor={meta.accentColor}
                          relationshipId={relationshipId}
                          onImageDeleted={fetchMoments}
                          onPress={who === 'me' ? openEditMoment : undefined}
                        />
                      </Animated.View>
                    ))}
                  </View>
                )}
              </View>

            </Animated.View>
          )}

          {meta.kind === 'text' && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              {who === 'me' ? (
                <>
                  <FormCard accentColor={error ? '#EF4444' : meta.accentColor}>
                    <View style={{ minHeight: meta.multiline ? 180 : 36 }}>
                      <PlainInput
                        value={textValue}
                        onChangeText={v => { setTextValue(v); setError(''); }}
                        placeholder={meta.placeholder}
                        accentColor={meta.accentColor}
                        multiline={meta.multiline}
                      />
                    </View>
                  </FormCard>

                  {error ? (
                    <Animated.View entering={FadeInDown.duration(250)}>
                      <AppText className="text-red-500 text-xs font-sans mt-2 ml-1">{error}</AppText>
                    </Animated.View>
                  ) : null}

                  <SaveButton onPress={handleSave} saving={saving} label={saveLabel} icon={saveIcon} accentColor={meta.accentColor} />

                  {savedText ? (
                    <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mt-4">
                      <FormCard accentColor={meta.accentColor}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' }}>
                            <AppText style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'sansMedium' }}>
                              {myName?.charAt(0)?.toUpperCase()}
                            </AppText>
                          </View>
                          <AppText style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'sansMedium' }}>{myName} (You)</AppText>
                          {justSaved && (
                            <AppText style={{ fontSize: 11, color: meta.accentColor, fontFamily: 'sansMedium', marginLeft: 'auto' }}>✓ Saved</AppText>
                          )}
                        </View>
                        <AppText className="font-sans text-body-md text-brand-textPrimary leading-6">{savedText}</AppText>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                          <Pressable
                            onPress={() => { setTextValue(savedText); textInputRef.current?.focus(); }}
                            style={{
                              flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
                              paddingVertical: 8, borderRadius: 10, backgroundColor: meta.accentColor + '22',
                              borderWidth: 1, borderColor: meta.accentColor + '44',
                            }}>
                            <Pencil size={13} color={meta.accentColor} />
                            <AppText style={{ fontSize: 13, color: meta.accentColor, fontFamily: 'sansMedium' }}>Edit</AppText>
                          </Pressable>
                          <Pressable
                            onPress={deleteGenericText}
                            disabled={saving}
                            style={{
                              width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                              backgroundColor: '#2D1212', borderWidth: 1, borderColor: '#F8717155',
                            }}>
                            {saving ? <ActivityIndicator size="small" color="#F87171" /> : <Trash2 size={14} color="#F87171" />}
                          </Pressable>
                        </View>
                      </FormCard>
                    </Animated.View>
                  ) : null}

                  <Animated.View
                    entering={FadeIn.delay(300).duration(400)}
                    className="my-6 rounded-full"
                    style={{ height: 1, backgroundColor: '#1A2535' }}
                  />
                </>
              ) : (
                <>
                  <SectionLabel>{partnerName ? `WHAT ${partnerName.toUpperCase()} WROTE` : 'WHAT THEY WROTE'}</SectionLabel>

                  {partnerSavedText ? (
                    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                      <FormCard accentColor={meta.accentColor}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: meta.accentColor + '22', alignItems: 'center', justifyContent: 'center' }}>
                            <AppText style={{ fontSize: 12, color: meta.accentColor, fontFamily: 'sansMedium' }}>
                              {partnerName?.charAt(0)?.toUpperCase()}
                            </AppText>
                          </View>
                          <AppText style={{ fontSize: 12, color: meta.accentColor, fontFamily: 'sansMedium' }}>{partnerName}</AppText>
                        </View>
                        <AppText className="font-sans text-body-md text-brand-textPrimary leading-6">{partnerSavedText}</AppText>
                      </FormCard>
                    </Animated.View>
                  ) : (
                    <Animated.View entering={FadeInDown.delay(100).duration(400)} className="items-center py-16">
                      <Animated.View entering={ZoomIn.delay(200).duration(350)}>{meta.icon}</Animated.View>
                      <AppText className="font-sans text-body-md text-brand-textMuted text-center mt-4">
                        {partnerName ? `${partnerName} hasn't written anything yet.` : "They haven't written anything yet."}
                      </AppText>
                    </Animated.View>
                  )}
                </>
              )}
            </Animated.View>
          )}

        </ScrollView>

        {/* These render as top-level absolutely-positioned overlays (not RN <Modal>,
            not nested in the ScrollView) so Android shows them reliably. */}
        <EditSheet
          visible={showDeletedModal}
          onClose={() => setShowDeletedModal(false)}
          title="Deleted Boundaries"
          icon={<Trash2 size={18} color="#64748B" />}>
          {boundaries.filter(b => b.deleted_at).length === 0 ? (
            <AppText style={{ color: '#4A5568', textAlign: 'center', paddingVertical: 32, fontFamily: 'sans' }}>
              No deleted boundaries yet.
            </AppText>
          ) : (
            <View style={{ gap: 12 }}>
              {boundaries.filter(b => b.deleted_at).map((b, i) => (
                <Animated.View
                  key={b.id}
                  entering={FadeInDown.delay(i * 50).duration(300)}
                  style={{ backgroundColor: '#0F1923', borderWidth: 1, borderColor: '#1A2535', borderRadius: 12, padding: 14, opacity: 0.7 }}>
                  <AppText style={{ fontSize: 14, color: '#94A3B8', fontFamily: 'sansMedium' }}>{b.title}</AppText>
                  {b.description ? (
                    <AppText style={{ fontSize: 12, color: '#4A5568', marginTop: 4, fontFamily: 'sans' }}>{b.description}</AppText>
                  ) : null}
                  <AppText style={{ fontSize: 11, color: '#334155', marginTop: 6, fontFamily: 'sans' }}>
                    Deleted · {b.i_proposed ? 'You set this' : `${partnerName ?? 'Partner'} set this`}
                  </AppText>
                </Animated.View>
              ))}
            </View>
          )}
        </EditSheet>

        <EditSheet
          visible={!!editingBoundary}
          onClose={() => { if (!editBoundarySaving) setEditingBoundary(null); }}
          title="Edit Boundary"
          icon={<Shield size={18} color="#4ADE80" />}>
          <SectionLabel>TITLE</SectionLabel>
          <FormCard accentColor={meta.accentColor}>
            <PlainInput
              value={editBoundaryTitle}
              onChangeText={v => { setEditBoundaryTitle(v); setEditBoundaryError(''); }}
              placeholder="e.g. No work talk after 8pm"
              accentColor={meta.accentColor}
              editable={!editBoundarySaving}
            />
          </FormCard>
          <View className="mt-4">
            <SectionLabel>DETAILS (Optional)</SectionLabel>
            <FormCard accentColor={meta.accentColor}>
              <View style={{ minHeight: 90 }}>
                <PlainInput
                  value={editBoundaryDescription}
                  onChangeText={setEditBoundaryDescription}
                  placeholder="Add any context or specifics..."
                  accentColor={meta.accentColor}
                  multiline
                  editable={!editBoundarySaving}
                />
              </View>
            </FormCard>
          </View>
          {editBoundaryError ? (
            <AppText className="text-red-500 text-xs font-sans mt-2 ml-1">{editBoundaryError}</AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            <Pressable
              onPress={deleteEditedBoundary}
              disabled={editBoundarySaving}
              style={{
                width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#2D1212', borderWidth: 1, borderColor: '#F8717155',
                opacity: editBoundarySaving ? 0.6 : 1,
              }}>
              {editBoundarySaving ? <ActivityIndicator size="small" color="#F87171" /> : <Trash2 size={18} color="#F87171" />}
            </Pressable>
            <Pressable
              onPress={saveEditedBoundary}
              disabled={editBoundarySaving}
              style={{
                flex: 1, flexDirection: 'row', gap: 8, borderRadius: 16, padding: 10,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: editBoundarySaving ? '#1A2535' : meta.accentColor,
              }}>
              {editBoundarySaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Check size={18} color="#fff" /><AppText className="font-sansSemiBold text-body-md text-white">Save Changes</AppText></>}
            </Pressable>
          </View>
        </EditSheet>

        <EditSheet
          visible={!!editingMoment}
          onClose={() => { if (!editMomentSaving) setEditingMoment(null); }}
          title="Edit Moment"
          icon={<Pencil size={18} color={meta.accentColor} />}>
          <SectionLabel>DESCRIPTION</SectionLabel>
          <FormCard accentColor={meta.accentColor}>
            <View style={{ minHeight: 90 }}>
              <PlainInput
                value={editMomentDescription}
                onChangeText={v => { setEditMomentDescription(v); setEditMomentError(''); }}
                placeholder="What made it memorable..."
                accentColor={meta.accentColor}
                multiline
                editable={!editMomentSaving}
              />
            </View>
          </FormCard>

          <View className="mt-4">
            <SectionLabel>
              {editingMoment?.best_moment_images && editingMoment.best_moment_images.length > 0
                ? 'ADD ANOTHER PHOTO (Optional)'
                : 'ADD A PHOTO (Optional)'}
            </SectionLabel>
            <MomentImagePicker
              accentColor={meta.accentColor}
              pendingImage={editMomentPendingImage}
              onPick={setEditMomentPendingImage}
              onClear={() => setEditMomentPendingImage(null)}
            />
          </View>

          {editMomentError ? (
            <AppText className="text-red-500 text-xs font-sans mt-2 ml-1">{editMomentError}</AppText>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            <Pressable
              onPress={deleteEditedMoment}
              disabled={editMomentSaving}
              style={{
                width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#2D1212', borderWidth: 1, borderColor: '#F8717155',
                opacity: editMomentSaving ? 0.6 : 1,
              }}>
              {editMomentSaving ? <ActivityIndicator size="small" color="#F87171" /> : <Trash2 size={18} color="#F87171" />}
            </Pressable>
            <Pressable
              onPress={saveEditedMoment}
              disabled={editMomentSaving}
              style={{
                flex: 1, flexDirection: 'row', gap: 8, borderRadius: 16, padding: 10,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: editMomentSaving ? '#1A2535' : meta.accentColor,
              }}>
              {editMomentSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Check size={18} color="#fff" /><AppText className="font-sansSemiBold text-body-md text-white">Save Changes</AppText></>}
            </Pressable>
          </View>
        </EditSheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


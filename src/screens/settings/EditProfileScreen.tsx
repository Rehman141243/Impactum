import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';

import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/axiosClient';
import AppText from '../../components/common/AppText';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';
import { useTheme } from '../../context/ThemeContext';


interface Profile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  profile_picture: string;
}

interface Props {
  onBack?: () => void;
}


function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <AppText className="font-sansMedium text-xs text-brand-textMuted uppercase tracking-widest mb-1.5 px-1">
        {label}
      </AppText>
      <View className="bg-brand-bgCard rounded-xl overflow-hidden border border-brand-borderSoft">
        {children}
      </View>
      {hint ? (
        <AppText className="font-sans text-xs text-brand-textMuted mt-1.5 px-1">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}


export default function EditProfileScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [profile, setProfile]                 = useState<Profile | null>(null);
  const [username, setUsername]               = useState('');
  const [displayName, setDisplayName]         = useState('');
  const [profilePicture, setProfilePicture]   = useState('');
  const {colors} =useTheme();

  useEffect(() => {
    if (!user?.id) return;
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data } = await apiClient.get('/auth/profile');
      const p: Profile = data.profile;
      setProfile(p);
      setUsername(p.username ?? '');
      setDisplayName(p.display_name ?? '');
      setProfilePicture(addCacheBuster(p.profile_picture ?? ''));
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };


  const addCacheBuster = (url: string): string => {
    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  };

 
  const handlePickImage = () => {
    setUploadError(null);

    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: false,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) return;

      if (response.errorCode) {
        setUploadError(`Picker error: ${response.errorMessage ?? response.errorCode}`);
        return;
      }

      const asset = response.assets?.[0];
      if (!asset?.uri) {
        setUploadError('No image was selected.');
        return;
      }


      setProfilePicture(asset.uri);
      setUploading(true);

      try {

        const formData = new FormData();
        formData.append('avatar', {

          uri: asset.uri,
          type: asset.type ?? 'image/jpeg',
          name: asset.fileName ?? `avatar_${Date.now()}.jpg`,
        } as any);

        console.log('[EditProfile] uploading avatar, uri:', asset.uri);

        const { data } = await apiClient.post('/auth/profile/avatar', formData, {
          headers: {

            'Content-Type': undefined as any,
          },
  
          transformRequest: [
            (data: any, headers: any) => {
            
              if (headers) {
                delete headers['Content-Type'];
                delete headers.post?.['Content-Type'];
              }
              return data;
            },
          ],
          timeout: 60_000,
        });

        console.log('[EditProfile] upload response:', data);

        if (data?.url) {
         
          setProfilePicture(addCacheBuster(data.url));
        } else {
          console.warn('[EditProfile] no url in response:', data);
          setUploadError('Upload succeeded but no URL was returned.');
        }
      } catch (err: any) {
        const serverMsg =
          err?.response?.data?.error ??
          err?.response?.data?.message ??
          err?.message ??
          'Upload failed. Please try again.';

        console.error('[EditProfile] upload error status:', err?.response?.status);
        console.error('[EditProfile] upload error body:', err?.response?.data);

        setUploadError(serverMsg);
    
        setProfilePicture(addCacheBuster(profile?.profile_picture ?? ''));
      } finally {
        setUploading(false);
      }
    });
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Validation', 'Username cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.put('/auth/profile', {
        username:        username.trim(),
        display_name:    displayName.trim(),
     
        profile_picture: profilePicture.split('?t=')[0].split('&t=')[0],
      });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? 'Could not save profile.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile?.email?.charAt(0) ?? 'U').toUpperCase();


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-bgMain items-center justify-center">
        <AnimatedInfinityLogo mode="loop" size={64} color={colors.textPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Top bar ───────────────────────────────────────────────── */}
          <View className="flex-row items-center justify-between mt-4 mb-8">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-brand-bgCard items-center justify-center active:opacity-70">
              <ArrowLeft size={18} color="#94A3B8" strokeWidth={1.8} />
            </Pressable>

            <AppText className="font-heading text-lg text-brand-textPrimary">
              Edit Profile
            </AppText>

            <Pressable
              onPress={handleSave}
              disabled={saving || uploading}
              className="w-10 h-10 rounded-full bg-brand-tabActive items-center justify-center active:opacity-70 disabled:opacity-50">
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Check size={18} color="#fff" strokeWidth={2.2} />}
            </Pressable>
          </View>

          {/* ── Avatar ────────────────────────────────────────────────── */}
          <View className="items-center mb-8">
            <Pressable
              onPress={handlePickImage}
              disabled={uploading}
              activeOpacity={0.85}>
              <View className="relative">

                {/* Avatar circle */}
                <View className="w-24 h-24 rounded-full bg-brand-bgCardSoft items-center justify-center overflow-hidden">
                  {profilePicture ? (
                    <Image
                      source={{ uri: profilePicture }}
                      style={{ width: 96, height: 96, borderRadius: 48 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <AppText className="font-heading text-[40px] text-brand-textSecondary">
                      {initial}
                    </AppText>
                  )}

                  {/* Upload overlay */}
                  {uploading && (
                    <View
                      className="absolute inset-0 bg-black/50 items-center justify-center"
                      style={{ borderRadius: 48 }}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </View>

                {/* Camera badge */}
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-tabActive items-center justify-center border-2 border-brand-bgMain">
                  {uploading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Camera size={14} color="#fff" strokeWidth={2} />}
                </View>
              </View>
            </Pressable>

            <AppText className="font-sans text-xs text-brand-textMuted mt-2">
              {uploading ? 'Uploading...' : 'Tap to change photo'}
            </AppText>

            {uploadError ? (
              <AppText className="font-sans text-xs text-red-400 mt-1.5 text-center px-6">
                {uploadError}
              </AppText>
            ) : null}
          </View>

          {/* ── Form fields ───────────────────────────────────────────── */}
          <View className="gap-3">

            <FieldBlock
              label="Email"
              hint="Linked to your account — cannot be changed">
              <TextInput
                value={profile?.email ?? ''}
                editable={false}
                className="font-sans text-[15px] text-brand-textMuted py-3.5 px-4"
              />
            </FieldBlock>

            <FieldBlock label="Username">
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. yourhandle"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                className="font-sans text-[15px] text-brand-textPrimary py-3.5 px-4"
              />
            </FieldBlock>

            <FieldBlock label="Display Name">
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Your Name"
                placeholderTextColor="#475569"
                autoCapitalize="words"
                className="font-sans text-[15px] text-brand-textPrimary py-3.5 px-4"
              />
            </FieldBlock>

          </View>

          {/* ── Save button ───────────────────────────────────────────── */}
          <Pressable
            onPress={handleSave}
            disabled={saving || uploading}
            className="mt-8 rounded-2xl py-[18px] bg-brand-tabActive items-center active:opacity-80 disabled:opacity-50">
            {saving
              ? <ActivityIndicator color="#fff" />
              : <AppText className="font-sansSemiBold text-[15px] text-white">
                  Save Changes
                </AppText>}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
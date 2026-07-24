import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Lock,
} from 'lucide-react-native';
import AppText from '../../components/common/AppText';
import { apiClient } from '../../utils/axiosClient';
import { useNavigation } from '@react-navigation/native';

const ACCENT = '#7C3AED';
const ACCENT_SOFT = 'rgba(124,58,237,0.15)';
const BORDER_IDLE = 'rgba(255,255,255,0.08)';
const BORDER_FOCUS = ACCENT;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  const [focusedField, setFocusedField] = useState<
    'current' | 'new' | 'confirm' | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const requirements = useMemo(() => {
    return {
      length: newPassword.length >= 6,
      different: newPassword.length > 0 && newPassword !== currentPassword,
      match: confirmPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword, currentPassword]);

  const canSubmit =
    !!currentPassword &&
    requirements.length &&
    requirements.different &&
    requirements.match &&
    !loading;

  const handleSubmit = async () => {
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!requirements.length) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (!requirements.match) {
      setError('New passwords do not match.');
      return;
    }
    if (!requirements.different) {
      setError('New password must be different from the current password.');
      return;
    }

    setLoading(true);
    try {
    
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="w-9 h-9 rounded-full items-center justify-center bg-white/5 active:bg-white/10">
          <ArrowLeft size={19} color="#F5F7FA" />
        </Pressable>
        <AppText className="font-sansMedium text-body-lg text-brand-textPrimary ml-3">
          Change Password
        </AppText>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Icon + intro */}
          <View className="items-center mt-2 mb-8">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: ACCENT_SOFT }}>
              <Key size={26} color={ACCENT} strokeWidth={2} />
            </View>
            <AppText className="font-sans text-body-sm text-brand-textSecondary text-center px-4">
              Keep your account secure with a strong, unique password.
            </AppText>
          </View>

          {/* Fields — each its own card so focus state is unambiguous */}
          <View style={{ gap: 12 }}>
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              show={showCurrent}
              onToggleShow={() => setShowCurrent((v) => !v)}
              autoFocus
              focused={focusedField === 'current'}
              onFocus={() => setFocusedField('current')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              show={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
              focused={focusedField === 'new'}
              onFocus={() => setFocusedField('new')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              show={showConfirm}
              onToggleShow={() => setShowConfirm((v) => !v)}
              onSubmitEditing={handleSubmit}
              focused={focusedField === 'confirm'}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="done"
            />
          </View>

          {/* Requirements checklist */}
          {(newPassword.length > 0 || confirmPassword.length > 0) && (
            <View className="mt-5 px-4 py-3.5 rounded-card bg-white/[0.03] border border-brand-borderSoft">
              <RequirementRow met={requirements.length} label="At least 6 characters" />
              <RequirementRow met={requirements.different} label="Different from current password" />
              <RequirementRow met={requirements.match} label="Passwords match" last />
            </View>
          )}

          {/* Status banners */}
          {!!error && (
            <View className="flex-row items-center mt-5 px-4 py-3 rounded-card bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} color="#F87171" />
              <AppText className="font-sans text-body-xs text-red-400 ml-2 flex-1">
                {error}
              </AppText>
            </View>
          )}
          {success && (
            <View className="flex-row items-center mt-5 px-4 py-3 rounded-card bg-green-500/10 border border-green-500/20">
              <CheckCircle2 size={16} color="#4ADE80" />
              <AppText className="font-sans text-body-xs text-green-400 ml-2 flex-1">
                Password updated successfully.
              </AppText>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            className="mt-6 py-4 items-center justify-center rounded-card flex-row"
            style={{
              backgroundColor: canSubmit ? ACCENT : 'rgba(124,58,237,0.35)',
            }}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <AppText className="font-sansMedium text-body-md text-white">
                Update Password
              </AppText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  show,
  onToggleShow,
  autoFocus,
  onSubmitEditing,
  focused,
  onFocus,
  onBlur,
  returnKeyType,
}: {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  returnKeyType?: 'next' | 'done';
}) {
  const hasValue = value.length > 0;

  return (
    <View
      className="flex-row items-center px-4 rounded-2xl bg-white/[0.04]"
      style={{
        borderWidth: 1.5,
        borderColor: focused ? BORDER_FOCUS : BORDER_IDLE,
        paddingVertical: 12,
      }}>
      <Lock size={16} color={focused ? ACCENT : '#8A93A6'} />
      <View className="flex-1 ml-3">
        <AppText
          className="font-sans text-body-xs mb-1"
          style={{ color: focused ? ACCENT : '#8A93A6' }}>
          {label}
        </AppText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="••••••••"
          placeholderTextColor="#5A6478"
          className="font-sans text-body-md text-brand-textPrimary p-0"
          style={{ lineHeight: 20 }}
        />
      </View>
      {hasValue && (
        <Pressable
          onPress={onToggleShow}
          hitSlop={10}
          className="p-1.5 ml-1 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          {show ? <EyeOff size={16} color="#8A93A6" /> : <Eye size={16} color="#8A93A6" />}
        </Pressable>
      )}
    </View>
  );
}

function RequirementRow({
  met,
  label,
  last,
}: {
  met: boolean;
  label: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center ${last ? '' : 'mb-2'}`}>
      <View
        className="w-4 h-4 rounded-full items-center justify-center mr-2"
        style={{ backgroundColor: met ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)' }}>
        {met && <Check size={10} color="#4ADE80" strokeWidth={3} />}
      </View>
      <AppText
        className="font-sans text-body-xs"
        style={{ color: met ? '#4ADE80' : '#8A93A6' }}>
        {label}
      </AppText>
    </View>
  );
}
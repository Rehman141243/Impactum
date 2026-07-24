
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Send, Sparkles, X, AlertCircle } from 'lucide-react-native';
import AppText from '../common/AppText';
import { useAuth } from '../../context/AuthContext';
import { useMediationSession } from '../../context/mediationsessioncontext';

function Bubble({
  content,
  who,
  label,
}: {
  content: string;
  who: 'me' | 'ai';
  label: string;
}) {
  const isMe = who === 'me';
  const isAi = who === 'ai';

  return (
    <View className={`max-w-[80%] mb-3 mx-4 ${isMe ? 'self-end' : 'self-start'}`}>
      <AppText
        className="text-[11px] mb-1"
        style={{ color: isAi ? '#4F7BF7' : '#64748B', textAlign: isMe ? 'right' : 'left' }}>
        {label}
      </AppText>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 18,
          backgroundColor: isMe ? '#4F7BF7' : '#141C2E',
          borderWidth: isMe ? 0 : 1,
          borderColor: '#1E2D45',
          borderBottomRightRadius: isMe ? 4 : 18,
          borderBottomLeftRadius: isMe ? 18 : 4,
        }}>
        <AppText style={{ color: isMe ? '#FFFFFF' : '#CBD5E1', fontSize: 14, lineHeight: 20 }}>
          {content}
        </AppText>
      </View>
    </View>
  );
}

export function MediationSessionModal() {
  const { user } = useAuth();
  const {
    visible,
    topic,
    partnerName,
    myName,
    messages,
    sending,
    loadingHistory,
    sendError,          
    sendMessage,
    closeSession,
    dismissSendError,  
  } = useMediationSession();

  const [rendered, setRendered] = useState(false);
  const [input, setInput] = useState('');
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(0.92);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(sheetAnim, { toValue: 1, damping: 18, stiffness: 160, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 0.92, duration: 180, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  if (!rendered) return null;

  const backdropOpacity = backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    Keyboard.dismiss();
    await sendMessage(text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const labelFor = (msg: { sender_id: string | null; role: string }) => {
    if (msg.role === 'assistant') return 'Dr. Harmony';
    return myName || 'You';
  };

  const whoFor = (msg: { sender_id: string | null; role: string }): 'me' | 'ai' => {
    return msg.role === 'assistant' ? 'ai' : 'me';
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none" collapsable={false}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', opacity: backdropOpacity }]}
      />
      <Animated.View
        style={[styles.sheet, { opacity: backdropAnim, transform: [{ scale: sheetAnim }] }]}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3.5">
            <View className="flex-row items-center gap-2.5 flex-1">
              <View className="w-[38px] h-[38px] rounded-full bg-[#1E3A5F] items-center justify-center border border-[#2D4A7A]">
                <Sparkles size={18} color="#4F7BF7" />
              </View>
              <View className="flex-1">
                <AppText className="text-brand-textPrimary text-[15px] font-sansSemiBold" numberOfLines={1}>
                  {myName || 'You'} & Dr. Harmony
                </AppText>
                <AppText className="text-brand-textMuted text-[11px] mt-0.5">
                  Private session about {partnerName || 'your partner'}
                </AppText>
              </View>
            </View>

            <Pressable
              onPress={closeSession}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-[34px] h-[34px] rounded-full bg-[#141C2E] border border-[#1E2D45] items-center justify-center">
              <X size={16} color="#94A3B8" />
            </Pressable>
          </View>

          {!!topic && (
            <View className="mx-5 mb-3 px-3.5 py-2.5 bg-[#111827] rounded-xl border border-[#1A2535]">
              <AppText className="text-brand-textMuted text-[12px]" numberOfLines={2}>
                Topic: {topic}
              </AppText>
            </View>
          )}

          {/* ⬅️ NAYA — send/AI error banner */}
          {!!sendError && (
            <Pressable
              onPress={dismissSendError}
              className="mx-5 mb-3 px-3.5 py-2.5 bg-[#2A1418] rounded-xl border border-[#4A1F26] flex-row items-center gap-2">
              <AlertCircle size={14} color="#F87171" />
              <AppText className="text-[#F87171] text-[12px] flex-1">{sendError}</AppText>
            </Pressable>
          )}

          <View className="h-px bg-[#1A2535]" />

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Bubble content={item.content} who={whoFor(item)} label={labelFor(item)} />
            )}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-8 pt-12">
                <AppText className="text-brand-textMuted text-[13px] text-center">
                  {loadingHistory ? 'Loading conversation…' : `Tell Dr. Harmony what's going on with ${partnerName || 'your partner'}.`}
                </AppText>
              </View>
            }
          />

          <View className="h-px bg-[#1A2535]" />

          {/* Input bar */}
          <View className="flex-row items-end px-4 py-3 gap-2.5">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message Dr. Harmony privately…"
              placeholderTextColor="#334155"
              multiline
              maxLength={500}
              style={styles.input}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || sending}
              className={`w-[42px] h-[42px] rounded-full items-center justify-center ${
                input.trim() && !sending ? 'bg-brand-tabActive' : 'bg-[#1A2535]'
              }`}>
              <Send size={17} color={input.trim() && !sending ? '#FFFFFF' : '#334155'} />
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0A0E17',
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E2D45',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F1F5F9',
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
  },
});
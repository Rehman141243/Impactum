
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  BackHandler,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';

import { Send, MessageCircle, X, Sparkles, Check, History, MessagesSquare } from 'lucide-react-native';
import AppText from '../../components/common/AppText';
import { apiClient } from '../../utils/axiosClient';

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing as REasing,
  FadeIn,
  FadeInDown,
  SlideInRight,
  cancelAnimation,
  default as Reanimated,
} from 'react-native-reanimated';
import { useMediationRequest } from '../../context/mediationsrequestcontext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Relationship {
  id: string;
  creator_id: string;
  creator_name: string;
  other_person_name: string;
  other_person_email: string;
  other_user_id: string | null;
  relationship_type: string;
  meaning_text: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  harmony_score?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'harmony' | 'mediation';
  topic?: string | null;
}

interface ChatApiResponse {
  reply: string;
  execute_reach_out: boolean;
  reach_out_topic?: string;
  user_message_count: number;
  flooded: boolean;
}

interface PersonPayload {
  name: string | null;
  zodiac: string | null;
  birthday: string | null;
  personality: string | null;
  values_in_other: string | null;
  bothered_by: string | null;
  best_moments: string | null;
  rating: number | null;
  rating_reason: string | null;
  relationship_type: string | null;
  harmony_score: number | null;
  boundaries: string | null;
}

interface HistoryDay {
  date: string; 
  count: number;
}

const RNAnimatedView = Reanimated.createAnimatedComponent(View);

function formatDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function dateKeyOf(d: Date): string {
  return d.toISOString().split('T')[0];
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isMediation = message.source === 'mediation';

  return (
    <Reanimated.View
      entering={isUser ? SlideInRight.duration(300) : FadeInDown.duration(350)}
      className={`max-w-[80%] mb-3 mx-4 ${isUser ? 'self-end' : 'self-start'}`}>

      {!isUser && (
        <View className="flex-row items-center mb-1 gap-1.5">
          <View className="w-5 h-5 rounded-full bg-[#1E3A5F] items-center justify-center">
            <Sparkles size={11} color="#4F7BF7" />
          </View>
          <AppText className="text-[11px] text-brand-tabActive font-sans tracking-wide">
            Dr. Harmony
          </AppText>
          {isMediation && (
            <View className="px-1.5 py-0.5 rounded-full bg-[#2D1B4E] border border-[#7C3AED]/30">
              <AppText className="text-[9px] text-[#C4B5FD]">Mediation</AppText>
            </View>
          )}
        </View>
      )}

      <View
        className={`px-3.5 py-2.5 ${
          isUser
            ? 'bg-brand-tabActive rounded-[18px] rounded-br-[4px]'
            : 'bg-[#141C2E] rounded-[18px] rounded-bl-[4px] border border-[#1E2D45]'
        }`}>
        <AppText
          className={`text-[14px] leading-5 font-sans ${
            isUser ? 'text-white' : 'text-[#CBD5E1]'
          }`}>
          {message.content}
        </AppText>
      </View>
    </Reanimated.View>
  );
}

function TypingIndicator() {
  const dots = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  useEffect(() => {
    dots.forEach((dot, i) => {
      dot.value = withDelay(
        i * 200,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: REasing.inOut(REasing.ease) }),
            withTiming(0, { duration: 400, easing: REasing.inOut(REasing.ease) }),
          ),
          -1,
          false,
        ),
      );
    });
    return () => dots.forEach(d => cancelAnimation(d));
  }, []);

  return (
    <Reanimated.View entering={FadeIn.duration(300)} className="mx-4 mb-3 self-start">
      <View className="flex-row items-center mb-1 gap-1.5">
        <View className="w-5 h-5 rounded-full bg-[#1E3A5F] items-center justify-center">
          <Sparkles size={11} color="#4F7BF7" />
        </View>
        <AppText className="text-[11px] text-brand-tabActive tracking-wide">
          Dr. Harmony
        </AppText>
      </View>

      <View className="bg-[#141C2E] rounded-[18px] rounded-bl-[4px] px-4 py-3.5 border border-[#1E2D45] flex-row gap-1.5 items-center">
        {dots.map((dot, i) => {
          const dotStyle = useAnimatedStyle(() => ({
            opacity: 0.3 + dot.value * 0.7,
            transform: [{ translateY: -dot.value * 4 }],
          }));
          return (
            <RNAnimatedView
              key={i}
              style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4F7BF7' }, dotStyle]}
            />
          );
        })}
      </View>
    </Reanimated.View>
  );
}


function HistoryDropdown({
  days,
  selectedDate,
  onSelect,
  loading,
}: {
  days: HistoryDay[];
  selectedDate: string | null; 
  onSelect: (date: string | null) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ zIndex: 30 }}>
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12, }}
        className="w-[34px] h-[34px] rounded-full bg-[#141C2E] border border-[#1E2D45] items-center justify-center m-2">
        <History size={16} color={selectedDate ? '#4F7BF7' : '#94A3B8'} />
      </TouchableOpacity>

      {open && (
        <>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setOpen(false)}
          />
          <Reanimated.View
            entering={FadeInDown.duration(180)}
            style={{
              position: 'absolute',
              top: 42,
              right: 0,
              width: 220,
              backgroundColor: '#121929',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#1E293B',
              paddingVertical: 6,
              zIndex: 20,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              maxHeight: 280,
              overflow: 'hidden',
            }}>
            <View className="px-3 py-2 border-b border-[#1E293B]">
              <AppText className="text-[11px] text-brand-textMuted uppercase tracking-[1.5px]">
                Chat History
              </AppText>
            </View>

            <TouchableOpacity
              onPress={() => { onSelect(null); setOpen(false); }}
              className="flex-row items-center justify-between px-3.5 py-2.5 overflow-hidden">
              <View className="flex-row items-center gap-2">
                <MessagesSquare size={14} color={!selectedDate ? '#4F7BF7' : '#64748B'} />
                <AppText
                  className="text-[13px]"
                  style={{ color: !selectedDate ? '#4F7BF7' : '#CBD5E1' }}>
                  Most recent chat
                </AppText>
              </View>
              {!selectedDate && <Check size={14} color="#4F7BF7" />}
            </TouchableOpacity>
<ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="px-3.5 py-3">
                <AppText className="text-[12px] text-brand-textMuted">Loading history…</AppText>
              </View>
            ) : days.length === 0 ? (
              <View className="px-3.5 py-3">
                <AppText className="text-[12px] text-brand-textMuted">No past conversations yet</AppText>
              </View>
            ) : (
              days.map(d => {
                const selected = d.date === selectedDate;
                return (
                  <TouchableOpacity
                    key={d.date}
                    onPress={() => { onSelect(d.date); setOpen(false); }}
                    className="flex-row items-center justify-between px-3.5 py-2.5 overflow-hidden">
                    <View className="flex-1">
                      <AppText
                        className="text-[13px]"
                        style={{ color: selected ? '#4F7BF7' : '#CBD5E1' }}>
                        {formatDayLabel(d.date)}
                      </AppText>
                      <AppText className="text-[11px] text-brand-textMuted mt-0.5">
                        {d.count} {d.count === 1 ? 'message' : 'messages'}
                      </AppText>
                    </View>
                    {selected && <Check size={14} color="#4F7BF7" />}
                  </TouchableOpacity>
                );
              })
            )}
            </ScrollView>
          </Reanimated.View>
        </>
      )}
    </View>
  );
}

export function DrHarmonyModal({
  visible,
  onClose,
  relationship,
  myName,
  partnerName,
}: {
  visible: boolean;
  onClose: () => void;
  relationship: Relationship | null;
  myName: string;
  partnerName: string;
}) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [historyDays, setHistoryDays] = useState<HistoryDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isFlooded, setIsFlooded] = useState(false);
  const [rendered, setRendered] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { sendRequest } = useMediationRequest();
  const hasAutoInvitedRef = useRef(false);
  const [autoInviteBanner, setAutoInviteBanner] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      backdropAnim.setValue(0);
      sheetAnim.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1, duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0, damping: 20, mass: 1, stiffness: 150, useNativeDriver: true,
        }),
      ]).start();

      fetchHistory();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0, duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: SCREEN_HEIGHT, duration: 230,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRendered(false);
        resetState();
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
  }, [rendered]);

  function resetState() {
    setAllMessages([]);
    setHistoryDays([]);
    setSelectedDate(null);
    setInputText('');
    setUserMessageCount(0);
    setIsTyping(false);
    setIsFlooded(false);
    setAutoInviteBanner(false);
    hasAutoInvitedRef.current = false;
  }

  async function fetchHistory() {
    if (!relationship?.id) return;
    setLoadingHistory(true);
    try {
      const { data } = await apiClient.get('/chat/history', {
        params: { relationshipId: relationship.id },
      });

      if (data?.success) {
        const mapped: ChatMessage[] = (data.data ?? []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
          source: m.source,
          topic: m.topic ?? null,
        }));
        setAllMessages(mapped);
        setHistoryDays(data.days ?? []);
        scrollToBottom();
      }
    } catch (err) {
      console.error('[DrHarmonyModal] fetchHistory error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const buildPersonPayload = (name: string): PersonPayload => ({
    name,
    zodiac: null,
    birthday: null,
    personality: null,
    values_in_other: null,
    bothered_by: null,
    best_moments: null,
    rating: null,
    rating_reason: null,
    relationship_type: relationship?.relationship_type ?? null,
    harmony_score: relationship?.harmony_score ?? null,
    boundaries: null,
  });

  const triggerAutoInvite = async (topic: string) => {
    if (!relationship?.id || hasAutoInvitedRef.current) return;
    hasAutoInvitedRef.current = true;

    const result = await sendRequest(relationship?.id, topic);

    if (!result.ok) {
      if (result.reason === 'partner_not_joined') {
        Alert.alert(
          "Partner hasn't joined yet",
          result.message,
          [
            { text: 'OK', style: 'cancel' },
            {
              text: 'Resend Invite',
              onPress: () => apiClient.post(`/relationships/${relationship?.id}/resend-invite`)
                .then(() => Alert.alert('Invite Sent', 'Invitation resent successfully.'))
                .catch(() => Alert.alert('Error', 'Failed to resend invite.')),
            },
          ],
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to send mediation request.');
      }
    } else {
      setAutoInviteBanner(true);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isTyping || selectedDate) return; 

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      source: 'harmony',
    };

    setAllMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss();
    scrollToBottom();

    const history = allMessages
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const { data } = await apiClient.post('/chat/chat', {
        relationshipId: relationship?.id,
        person_a: buildPersonPayload(myName),
        person_b: buildPersonPayload(partnerName),
        message: text,
        history,
        user_message_count: userMessageCount,
      });

      const result: ChatApiResponse = data.data;
      const reply = result?.reply ?? "I'm here with you. Could you tell me a bit more?";

      if (typeof result?.user_message_count === 'number') {
        setUserMessageCount(result.user_message_count);
      }
      setIsFlooded(!!result?.flooded);

      setAllMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        source: 'harmony',
      }]);

      if (result?.execute_reach_out) {
        const topic = result?.reach_out_topic?.trim() || text;
        triggerAutoInvite(topic);
      }
    } catch {
      setAllMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        source: 'harmony',
      }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0, duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: SCREEN_HEIGHT, duration: 230,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRendered(false);
      resetState();
      onClose();
    });
  };

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.75],
  });

  const mostRecentDate = useMemo(() => {
    if (allMessages.length > 0) {
      return dateKeyOf(allMessages[allMessages.length - 1].timestamp);
    }
    if (historyDays.length > 0) {
      return historyDays[0].date; // already sorted desc from backend
    }
    return dateKeyOf(new Date());
  }, [allMessages, historyDays]);

  const effectiveDate = selectedDate ?? mostRecentDate;

  const visibleMessages = useMemo(() => {
    return allMessages.filter(m => dateKeyOf(m.timestamp) === effectiveDate);
  }, [allMessages, effectiveDate]);

  const isBrowsingHistory = !!selectedDate && selectedDate !== mostRecentDate;

  if (!rendered) return null;

  const canSend = !!inputText.trim() && !isTyping && !isFlooded && !isBrowsingHistory;

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
        style={[
          styles.sheet,
          { transform: [{ translateY: sheetAnim }] },
        ]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>


          <View className="flex-row items-center justify-between px-5 pt-5 pb-3.5">
            <View className="flex-row items-center gap-2.5" style={{ zIndex: 30, flex: 1 }}>
           

              <View className="w-[38px] h-[38px] rounded-full bg-[#1E3A5F] items-center justify-center border border-[#2D4A7A]">
                <Sparkles size={18} color="#4F7BF7" />
              </View>
              <View>
                <AppText className="text-brand-textPrimary text-[15px] font-sansSemiBold">
                  Dr. Harmony
                </AppText>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <AppText className="text-brand-textMuted text-[11px]">
                    Relationship AI
                  </AppText>
                </View>
              </View>
            </View>
            <HistoryDropdown
                days={historyDays}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                loading={loadingHistory}
              />
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12,  }}
              className="w-[34px] h-[34px] rounded-full bg-[#141C2E] border border-[#1E2D45] items-center justify-center">
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View className="mx-5 mb-3 px-3 py-1.5 bg-[#111827] rounded-xl border border-[#1A2535] flex-row items-center gap-2">
            <View className="w-1 h-1 rounded-full bg-brand-tabActive" />
            <AppText className="text-brand-textMuted text-[12px] flex-1" numberOfLines={1}>
              <AppText className="text-brand-textSecondary">{myName}</AppText>
              {'  ∞  '}
              <AppText className="text-brand-textSecondary">{partnerName}</AppText>
              {'  ·  '}
              {relationship?.relationship_type}
            </AppText>
          </View>

          {isBrowsingHistory && (
            <Reanimated.View
              entering={FadeInDown.duration(200)}
              className="mx-5 mb-3 px-3.5 py-2.5 bg-[#111827] rounded-xl border border-[#1E293B] flex-row items-center justify-between">
              <AppText className="text-[12px] text-brand-textMuted">
                Viewing {formatDayLabel(effectiveDate)}
              </AppText>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <AppText className="text-[12px] text-brand-tabActive font-sansMedium">
                  Back to recent
                </AppText>
              </TouchableOpacity>
            </Reanimated.View>
          )}

          {autoInviteBanner && !isBrowsingHistory && (
            <Reanimated.View
              entering={FadeInDown.duration(250)}
              className="mx-5 mb-3 px-3.5 py-3 bg-[#132A45] rounded-2xl border border-[#4F7BF7]/25 flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-full bg-[#1E3A5F] items-center justify-center">
                <Check size={14} color="#4F7BF7" />
              </View>
              <View className="flex-1">
                <AppText className="text-[13px] font-sansMedium" style={{ color: '#93C5FD' }}>
                  Dr. Harmony reached out
                </AppText>
                <AppText className="text-[12px] mt-0.5" style={{ color: '#60A5FA' }}>
                  {partnerName} has been invited to talk this through together.
                </AppText>
              </View>
              <Pressable onPress={() => setAutoInviteBanner(false)} hitSlop={8}>
                <X size={14} color="#60A5FA" />
              </Pressable>
            </Reanimated.View>
          )}

          <View className="h-px bg-[#1A2535]" />

          <FlatList
            ref={flatListRef}
            data={visibleMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => { if (!isBrowsingHistory) scrollToBottom(); }}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={isTyping && !isBrowsingHistory ? <TypingIndicator /> : null}
            style={{ flex: 1 }}
            ListEmptyComponent={
              loadingHistory ? (
                <View className="flex-1 items-center justify-center pt-12">
                  <AppText className="text-brand-textMuted text-[13px]">Loading conversation…</AppText>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center px-8 pt-12">
                  <View className="w-12 h-12 rounded-full bg-[#1E3A5F] items-center justify-center mb-3">
                    <Sparkles size={22} color="#4F7BF7" />
                  </View>
                  <AppText className="text-brand-textPrimary font-sansMedium text-[15px] text-center mb-1">
                    Hi, I'm Dr. Harmony
                  </AppText>
                  <AppText className="text-brand-textMuted text-[13px] text-center leading-5">
                    Ask me anything about your relationship with {partnerName}.
                  </AppText>
                </View>
              )
            }
          />

          {isFlooded && !isBrowsingHistory && (
            <Reanimated.View
              entering={FadeInDown.duration(300)}
              className="mx-4 mb-2 px-3.5 py-3 bg-[#2D1B4E] rounded-2xl border border-[#7C3AED]/25">
              <AppText className="text-[#C4B5FD] text-[13px] font-sansMedium mb-0.5">
                Take a breath 🌬️
              </AppText>
              <AppText className="text-[#A78BFA] text-[12px] leading-[18px]">
                It seems like emotions are running high. Pause for a moment before responding.
              </AppText>
            </Reanimated.View>
          )}

          <View className="h-px bg-[#1A2535]" />

          <View className="flex-row items-end px-4 py-3 gap-2.5">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                isBrowsingHistory
                  ? 'Go back to recent chat to reply…'
                  : isFlooded
                  ? 'Take a moment before continuing…'
                  : 'Ask Dr. Harmony anything…'
              }
              placeholderTextColor={isFlooded ? '#4C1D95' : '#334155'}
              multiline
              maxLength={500}
              editable={!isFlooded && !isBrowsingHistory}
              style={[
                styles.input,
                (isFlooded || isBrowsingHistory) && styles.inputFlooded,
              ]}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              className={`w-[42px] h-[42px] rounded-full items-center justify-center ${
                canSend ? 'bg-brand-tabActive' : 'bg-[#1A2535]'
              }`}>
              <Send size={17} color={canSend ? '#FFFFFF' : '#334155'} />
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
    bottom: 0,
    height: '92%',
    backgroundColor: '#0A0E17',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 9999,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
  inputFlooded: {
    backgroundColor: '#1A1030',
    borderColor: '#4C1D95',
    opacity: 0.5,
  },
});
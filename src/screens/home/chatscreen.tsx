import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Check, CheckCheck, MoreVertical, Trash2, Users } from 'lucide-react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppText from '../../components/common/AppText';
import AnimatedInfinityLogo from '../../constants/infinnitylogo';
import { apiClient } from '../../utils/axiosClient';
import { connectSocket, getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from './homennavigator';

type ChatRouteProp = RouteProp<HomeStackParamList, 'Chat'>;
type ChatNavProp = NativeStackNavigationProp<HomeStackParamList, 'Chat'>;

interface Message {
  id: string;
  relationship_id: string;
  sender_id: string;
  content: string | null;
  status: 'sent' | 'delivered' | 'read';
  is_deleted_for_everyone?: boolean;
  created_at: string;
}

interface PartnerProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string | null;
  profile_picture?: string | null;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageTicks({ status }: { status: Message['status'] }) {
  if (status === 'sent') return <Check size={14} color="#0047AB" />;
  if (status === 'delivered') return <CheckCheck size={14} color="#0047AB" />;
  return <CheckCheck size={14} color="#ffffff" />;  
}

function MiniAvatar({ profilePicture }: { profilePicture?: string | null }) {
  return (
    <View className="w-7 h-7 rounded-full bg-brand-bgElevated border border-brand-borderSoft items-center justify-center overflow-hidden">
      {profilePicture ? (
        <Image source={{ uri: profilePicture }} style={{ width: 28, height: 28 }} resizeMode="cover" />
      ) : (
        <AnimatedInfinityLogo size={16} mode="loop" />
      )}
    </View>
  );
}

export default function ChatScreen() {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavProp>();
  const { relationshipId, partnerName } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const listRef = useRef<FlatList>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/messages/${relationshipId}`);
      if (data.success) setMessages(data.data);
    } catch (err) {
      console.error('[ChatScreen] fetch history error:', err);
    } finally {
      setLoading(false);
    }
  }, [relationshipId]);

  const fetchPartnerProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/messages/partner/${relationshipId}`);
      if (data.success) setPartner(data.data);
    } catch (err) {
      console.error('[ChatScreen] fetch partner profile error:', err);
    }
  }, [relationshipId]);

  useEffect(() => {
    Promise.all([fetchHistory(), fetchPartnerProfile()]);
  }, [fetchHistory, fetchPartnerProfile]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let currentSocket: Awaited<ReturnType<typeof connectSocket>> = null;

      (async () => {
        currentSocket = await connectSocket();
        if (!currentSocket || !active) return;

        currentSocket.emit('join_room', { relationshipId }, (res: any) => {
          if (!res?.success) console.warn('[ChatScreen] join_room failed:', res?.message);
          else setPartnerOnline(!!res.partnerOnline);
        });

        currentSocket.on('new_message', (msg: Message) => {
          if (!active || msg.relationship_id !== relationshipId) return;
          setMessages((prev) => [...prev, msg]);
        });

        currentSocket.on('messages_delivered', ({ messageIds }: { messageIds: string[] }) => {
          if (!active) return;
          setMessages((prev) =>
            prev.map((m) => (messageIds.includes(m.id) && m.status === 'sent' ? { ...m, status: 'delivered' } : m))
          );
        });

        currentSocket.on('messages_read', ({ messageIds }: { messageIds: string[] }) => {
          if (!active) return;
          setMessages((prev) =>
            prev.map((m) => (messageIds.includes(m.id) ? { ...m, status: 'read' } : m))
          );
        });

        currentSocket.on('partner_online', ({ userId: changedUserId, online }: any) => {
          if (!active) return;
          if (changedUserId === partner?.id) setPartnerOnline(online);
        });

        currentSocket.on('message_deleted', ({ messageId, forEveryone }: any) => {
          if (!active) return;
          if (forEveryone) {
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId ? { ...m, content: null, is_deleted_for_everyone: true } : m))
            );
          } else {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
        });
      })();

      return () => {
        active = false;
        const socket = getSocket();
        socket?.emit('leave_room', { relationshipId });
        socket?.off('new_message');
        socket?.off('messages_delivered');
        socket?.off('messages_read');
        socket?.off('partner_online');
        socket?.off('message_deleted');
      };
    }, [relationshipId, partner?.id])
  );

  const sendMessage = () => {
    const content = text.trim();
    if (!content || sending) return;

    const socket = getSocket();
    if (!socket) return;

    setSending(true);
    socket.emit('send_message', { relationshipId, content }, (res: any) => {
      setSending(false);
      if (!res?.success) {
        console.warn('[ChatScreen] send failed:', res?.message);
        return;
      }
      setText('');
    });
  };

  const deleteForMe = (msg: Message) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('delete_message', { messageId: msg.id, relationshipId, forEveryone: false }, (res: any) => {
      if (res?.success) {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      } else {
        console.warn('[ChatScreen] delete failed:', res?.message);
      }
    });
    setMenuFor(null);
  };

  const deleteForEveryone = (msg: Message) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('delete_message', { messageId: msg.id, relationshipId, forEveryone: true }, (res: any) => {
      if (!res?.success) console.warn('[ChatScreen] delete failed:', res?.message);
    });
    setMenuFor(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bgMain" edges={['top']}>
      {/* ── Header ── */}
      <View className="flex-row items-center px-4 py-3 border-b border-brand-borderSoft bg-brand-bgCardMain">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="mr-3">
          <ChevronLeft size={24} color="#94A3B8" />
        </Pressable>

        <View className="w-10 h-10 rounded-full bg-brand-bgElevated border border-brand-borderSoft items-center justify-center mr-3 overflow-hidden">
          {partner?.profile_picture ? (
            <Image source={{ uri: partner.profile_picture }} style={{ width: 40, height: 40 }} resizeMode="cover" />
          ) : (
            <AnimatedInfinityLogo size={22} mode="loop" />
          )}
        </View>

        <View className="flex-1">
          <AppText className="font-sansSemiBold text-body-lg text-brand-textPrimary">
            {partner?.display_name ?? partner?.username ?? partnerName}
          </AppText>
          <View className="flex-row items-center mt-0.5 gap-1.5">
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: partnerOnline ? '#22C55E' : '#64748B' }}
            />
            <AppText className="font-sans text-body-sm text-brand-textMuted">
              {partnerOnline ? 'Online' : 'Offline'}
            </AppText>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#A855F7" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 py-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isMine = item.sender_id === user?.id;
              const isDeleted = item.is_deleted_for_everyone;

              return (
                <View
                  className={`flex-row items-end mb-3 max-w-[85%] ${
                    isMine ? 'self-end' : 'self-start'
                  }`}>
                  {!isMine && (
                    <View className="mr-2 mb-1">
                      <MiniAvatar profilePicture={partner?.profile_picture} />
                    </View>
                  )}

                  {isMine && !isDeleted && (
                    <Pressable onPress={() => setMenuFor(item)} hitSlop={8} className="mr-1.5 mb-1 p-1">
                      <MoreVertical size={16} color="#64748B" />
                    </Pressable>
                  )}

                  <View
                    className={`px-4 py-2.5 ${
                      isMine
                        ? 'bg-brand-primaryLight rounded-2xl rounded-br-md'
                        : 'bg-brand-bgCardMain border border-brand-borderSoft rounded-2xl rounded-bl-md'
                    }`}>
                    <AppText
                      className={`font-sans text-body-md ${
                        isDeleted
                          ? 'italic text-white'
                          : isMine
                          ? 'text-white'
                          : 'text-white'
                      }`}>
                      {isDeleted ? 'This message was deleted' : item.content}
                    </AppText>

                    <View className="flex-row items-center justify-end mt-1.5 gap-2">
                      <AppText
                        className={`font-sans text-[10px]  ${
                          isMine ? 'text-white/70' : 'text-brand-textMuted'
                        }`}>
                        {formatTime(item.created_at)}   
                      </AppText>
                      {isMine && !isDeleted && <MessageTicks status={item.status} />}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* ── Input bar ── */}
        <View className="flex-row items-center px-4 py-3 border-t border-brand-borderSoft bg-brand-bgCardMain">
          <TextInput
            value={text}
            onChangeText={(val) => {
              setText(val);
              getSocket()?.emit('typing', { relationshipId, isTyping: val.length > 0 });
            }}
            placeholder="Type a message..."
            placeholderTextColor="#64748B"
            className="flex-1 bg-brand-bgElevated border border-brand-borderSoft rounded-full px-4 h-11 font-sans text-body-md text-brand-textPrimary"
            multiline={false}
          />
          <Pressable
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            className="ml-2.5 w-11 h-11 rounded-full items-center justify-center"
            style={{
              backgroundColor: text.trim() ? '#A855F7' : '#1E2D42',
            }}>
            <Send size={18} color={text.trim() ? '#FFFFFF' : '#64748B'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ── Delete dropdown sheet ── */}
      <Modal
        visible={!!menuFor}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuFor(null)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setMenuFor(null)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-brand-bgCardMain border-t border-brand-borderSoft rounded-t-2xl pb-6 pt-2">
            <View className="w-10 h-1 rounded-full bg-brand-borderLight self-center my-2" />

            <Pressable onPress={() => menuFor && deleteForMe(menuFor)} className="flex-row items-center px-5 py-4">
              <Trash2 size={18} color="#F87171" />
              <AppText className="font-sansMedium text-body-md text-brand-textPrimary ml-3">
                Delete for me
              </AppText>
            </Pressable>

            <Pressable onPress={() => menuFor && deleteForEveryone(menuFor)} className="flex-row items-center px-5 py-4">
              <Users size={18} color="#F87171" />
              <AppText className="font-sansMedium text-body-md text-brand-textPrimary ml-3">
                Delete for everyone
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => setMenuFor(null)}
              className="flex-row items-center justify-center px-5 py-4 mt-1 border-t border-brand-borderSoft">
              <AppText className="font-sansMedium text-body-md text-brand-textMuted">Cancel</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
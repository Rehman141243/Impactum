
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../services/socket';
import { apiClient, eventEmitter } from '../utils/axiosClient';

interface MediationMessage {
  id: string;
  mediation_id: string;
  sender_id: string | null; 
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface MediationSessionState {
  mediationId: string | null;
  relationshipId: string | null;
  topic: string;
  partnerName: string;
  myName: string;
}

interface MediationSessionContextValue extends MediationSessionState {
  visible: boolean;
  declinedMessage: string | null;
  messages: MediationMessage[];
  sending: boolean;
  loadingHistory: boolean;
  sendError: string | null;         
  sendMessage: (text: string) => Promise<void>;
  closeSession: () => void;
  dismissDeclinedMessage: () => void;
  dismissSendError: () => void;         
}

const MediationSessionContext = createContext<MediationSessionContextValue | undefined>(undefined);

function cleanName(raw?: string | null): string {
  if (!raw) return '';
  if (!raw.includes('@')) return raw;
  return raw.split('@')[0].split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function MediationSessionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [declinedMessage, setDeclinedMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<MediationMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null); 
  const [session, setSession] = useState<MediationSessionState>({
    mediationId: null,
    relationshipId: null,
    topic: '',
    partnerName: '',
    myName: '',
  });

  const closeSession = useCallback(() => {
    setVisible(false);
    setSession(prev => ({ ...prev, mediationId: null }));
    setMessages([]);
    setSendError(null);
  }, []);
  const dismissDeclinedMessage = useCallback(() => setDeclinedMessage(null), []);
  const dismissSendError = useCallback(() => setSendError(null), []);


  const resolveMyName = useCallback(async (relationshipId: string) => {
    try {
      const { data } = await apiClient.get('/relationships');
      const rel = data?.relationships?.find((r: any) => r.id === relationshipId);
      if (!rel) return '';
      const isCreator = rel.creator_id === user?.id;
      return cleanName(isCreator ? rel.creator_name : rel.other_person_name);
    } catch {
      return '';
    }
  }, [user?.id]);


  const loadHistory = useCallback(async (mediationId: string) => {
    setLoadingHistory(true);
    try {
      const { data } = await apiClient.get(`/mediation/${mediationId}/messages`);
      if (data?.success) setMessages(data.data ?? []);
    } catch (err) {
      console.error('[MediationSession] history load error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!session.mediationId) return;
    let cancelled = false;

    (async () => {
      const myName = await resolveMyName(session.relationshipId ?? '');
      if (!cancelled) setSession(prev => ({ ...prev, myName }));

      await loadHistory(session.mediationId!);

      const socket = getSocket() ?? (await connectSocket());
      socket?.emit('join_mediation_room', { mediationId: session.mediationId });
    })();

    return () => {
      cancelled = true;
      const socket = getSocket();
      if (session.mediationId) {
        socket?.emit('leave_mediation_room', { mediationId: session.mediationId });
      }
    };
  }, [session.mediationId]);

  const attachedSocketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!user?.id) return;

    const acceptedEvent = `mediation_accepted:${user.id}`;
    const declinedEvent = `mediation_declined:${user.id}`;
    let cancelled = false;

    const onAccepted = (payload: {
      mediationId: string;
      relationshipId: string;
      topic: string;
      partnerName?: string;
    }) => {
      setSession({
        mediationId: payload.mediationId,
        relationshipId: payload.relationshipId,
        topic: payload.topic,
        partnerName: payload.partnerName ?? 'Your partner',
        myName: '',
      });
      setVisible(true);
    };

    const onDeclined = () => {
      setDeclinedMessage('Your mediation invite was declined.');
    };

    const onMediationMessage = (msg: MediationMessage) => {
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
    };

    const onMediationAiError = (payload: { mediationId: string; message: string }) => {
      setSendError(payload.message); 
    };

    const attach = (socket: Socket | null | undefined) => {
      if (!socket || cancelled || attachedSocketRef.current === socket) return;
      if (attachedSocketRef.current) {
        attachedSocketRef.current.off(acceptedEvent, onAccepted);
        attachedSocketRef.current.off(declinedEvent, onDeclined);
        attachedSocketRef.current.off('mediation_message', onMediationMessage);
        attachedSocketRef.current.off('mediation_ai_error', onMediationAiError);
      }
      socket.on(acceptedEvent, onAccepted);
      socket.on(declinedEvent, onDeclined);
      socket.on('mediation_message', onMediationMessage);
      socket.on('mediation_ai_error', onMediationAiError);
      attachedSocketRef.current = socket;
    };

    connectSocket().then(attach);
    attach(getSocket());

    const onSocketReady = (socket: Socket) => attach(socket);
    eventEmitter.on('socketReady', onSocketReady);

    return () => {
      cancelled = true;
      eventEmitter.off('socketReady', onSocketReady);
      attachedSocketRef.current?.off(acceptedEvent, onAccepted);
      attachedSocketRef.current?.off(declinedEvent, onDeclined);
      attachedSocketRef.current?.off('mediation_message', onMediationMessage);
      attachedSocketRef.current?.off('mediation_ai_error', onMediationAiError);
      attachedSocketRef.current = null;
    };
  }, [user?.id]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !session.mediationId || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const socket = getSocket();
      await new Promise<void>((resolve, reject) => {
        const ackTimeout = setTimeout(() => {
          reject(new Error('Message timed out. Check your connection.'));
        }, 15000);

        socket?.emit(
          'send_mediation_message',
          {
            mediationId: session.mediationId,
            content: trimmed,
            speaker: { name: session.myName, relationship_type: null },
            other_person: { name: session.partnerName, relationship_type: null },
          },
          (ack: { success: boolean; message?: string }) => {
            clearTimeout(ackTimeout);
            if (ack?.success) resolve();
            else reject(new Error(ack?.message ?? 'Failed to send message.'));
          },
        );
      });
    } catch (err: any) {
      console.error('[MediationSession] sendMessage error:', err);
      setSendError(err?.message ?? 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }, [session.mediationId, session.myName, session.partnerName, sending]);

  return (
    <MediationSessionContext.Provider
      value={{
        ...session,
        visible,
        declinedMessage,
        messages,
        sending,
        loadingHistory,
        sendError,
        sendMessage,
        closeSession,
        dismissDeclinedMessage,
        dismissSendError,
      }}>
      {children}
    </MediationSessionContext.Provider>
  );
}

export function useMediationSession() {
  const ctx = useContext(MediationSessionContext);
  if (!ctx) throw new Error('useMediationSession must be used within MediationSessionProvider');
  return ctx;
}
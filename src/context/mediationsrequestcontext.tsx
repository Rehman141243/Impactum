import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

import { useAuth } from './AuthContext';
import { connectSocket, getSocket } from '../services/socket';
import { apiClient, eventEmitter } from '../utils/axiosClient';

interface MediationRequestState {
  mediationId: string | null;
  relationshipId: string | null;
  topic: string;
  requesterName: string;
}
interface SendRequestResult {
  ok: boolean;
  reason?: 'partner_not_joined';
  message?: string;
}
interface MediationRequestContextValue extends MediationRequestState {
  visible: boolean;
  responding: boolean;
  sending: boolean;
  respond: (accept: boolean) => Promise<void>;
  dismiss: () => void;
  sendRequest: (relationshipId: string, topic: string) => Promise<SendRequestResult>;
}

const MediationRequestContext = createContext<MediationRequestContextValue | undefined>(undefined);

export function MediationRequestProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [responding, setResponding] = useState(false);
  const [sending, setSending] = useState(false);
  const [request, setRequest] = useState<MediationRequestState>({
    mediationId: null,
    relationshipId: null,
    topic: '',
    requesterName: '',
  });

  const dismiss = useCallback(() => {
    setVisible(false);
    setRequest(prev => ({ ...prev, mediationId: null }));
  }, []);

  const respond = useCallback(
    async (accept: boolean) => {
      if (!request.mediationId || responding) return;
      setResponding(true);
      try {
      
        await apiClient.patch(`/mediation/${request.mediationId}/respond`, { accept });
        setVisible(false);
        setRequest(prev => ({ ...prev, mediationId: null }));
      } catch (err) {
        console.error('[MediationRequestProvider] respond error:', err);
      } finally {
        setResponding(false);
      }
    },
    [request.mediationId, responding],
  );

  const sendRequest = useCallback(
    async (relationshipId: string, topic: string): Promise<SendRequestResult> => {
      if (!relationshipId || !topic?.trim() || sending) return { ok: false };
      setSending(true);
      try {
        const { data } = await apiClient.post(`/mediation/${relationshipId}/request`, {
          topic: topic.trim(),
        });
  
        if (!data.success) {
     
          return { ok: false, reason: data.reason, message: data.message };
        }
  
        return { ok: true };
      } catch (err) {
        console.error('[MediationRequestProvider] sendRequest error:', err);
        return { ok: false, message: 'Something went wrong. Please try again.' };
      } finally {
        setSending(false);
      }
    },
    [sending],
  );

  const attachedSocketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!user?.id) return;

    const eventName = `mediation_requested:${user.id}`;
    let cancelled = false;

    const handler = (payload: {
      mediationId: string;
      relationshipId: string;
      topic: string;
      requesterName?: string;
    }) => {
      setRequest({
        mediationId: payload.mediationId,
        relationshipId: payload.relationshipId,
        topic: payload.topic,
        requesterName: payload.requesterName ?? 'Your partner',
      });
      setVisible(true);
    };

    const attach = (socket: Socket | null | undefined) => {
      if (!socket || cancelled || attachedSocketRef.current === socket) return;
      if (attachedSocketRef.current) {
        attachedSocketRef.current.off(eventName, handler);
      }
      socket.on(eventName, handler);
      attachedSocketRef.current = socket;
    };

    connectSocket().then(attach);
    attach(getSocket());

    const onSocketReady = (socket: Socket) => attach(socket);
    eventEmitter.on('socketReady', onSocketReady);

    return () => {
      cancelled = true;
      eventEmitter.off('socketReady', onSocketReady);
      attachedSocketRef.current?.off(eventName, handler);
      attachedSocketRef.current = null;
    };
  }, [user?.id]);

  return (
    <MediationRequestContext.Provider
      value={{
        ...request,
        visible,
        responding,
        sending,
        respond,
        dismiss,
        sendRequest,
      }}>
      {children}
    </MediationRequestContext.Provider>
  );
}

export function useMediationRequest() {
  const ctx = useContext(MediationRequestContext);
  if (!ctx) throw new Error('useMediationRequest must be used within MediationRequestProvider');
  return ctx;
}
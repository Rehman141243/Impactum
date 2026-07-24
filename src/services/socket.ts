import { io, Socket } from 'socket.io-client';
import config, { getSocketHeaders } from '../config/config';
import { getTokens } from '../utils/KeyChainServices';
import { eventEmitter } from '../utils/axiosClient';
import { refreshAccessToken } from '../utils/refreshauth';

let socket: Socket | null = null;

const buildSocket = (token: string) =>
  io(config.socketURL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    extraHeaders: getSocketHeaders(),
  });

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  const token = (await getTokens())?.accessToken;
  if (!token) return null;

  socket = buildSocket(token);
  socket.on('connect_error', async err => {
    if (err.message === 'Authentication required' || err.message?.includes('Invalid')) {
      const result = await refreshAccessToken();
      if (result) {
        socket?.disconnect();
        socket = buildSocket(result.access_token);
      } else {
        eventEmitter.emit('tokenExpired', { message: 'Kindly Login again' });
      }
    }
  });
  return socket;
}

export const getSocket = () => socket;
export const disconnectSocket = () => { socket?.disconnect(); socket = null; };
eventEmitter.on('tokenExpired', disconnectSocket);

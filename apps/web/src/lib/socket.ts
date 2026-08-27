import { io, Socket } from 'socket.io-client';
import { getToken, WS_URL } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_URL}/rt`, {
      transports: ['websocket'],
      auth: (cb) => cb({ token: getToken() }),
    });
  }
  return socket;
}

export function resetSocket() {
  socket?.disconnect();
  socket = null;
}

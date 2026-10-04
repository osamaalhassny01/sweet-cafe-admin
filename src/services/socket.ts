import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/formatters';

let socket: Socket | null = null;

export function connectSocket(authKey: string, authMode: 'token' | 'apiKey' = 'token') {
  if (socket?.connected) return;
  
  socket = io(API_BASE_URL, {
    extraHeaders: { 'x-admin-key': authKey },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket?.emit(
      'join-admin-room',
      authMode === 'apiKey' ? { apiKey: authKey } : { token: authKey },
    );
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
}

export function onNewOrder(callback: (order: any) => void) {
  socket?.off('newOrder');  // remove previous listener first
  socket?.on('newOrder', callback);
}

export function onOrderStatusChanged(callback: (order: any) => void) {
  socket?.off('orderStatusChanged');  // remove previous listener first
  socket?.on('orderStatusChanged', callback);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// src/lib/socket.ts
// Cliente de Socket.IO para actualizaciones en tiempo real
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket) return socket;
  socket = io(process.env.NEXT_PUBLIC_API || 'http://localhost:3001', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    timeout: 20000,
    auth: { token },
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

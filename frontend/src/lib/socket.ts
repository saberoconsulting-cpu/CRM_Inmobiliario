// src/lib/socket.ts
// Cliente de Socket.IO para actualizaciones en tiempo real
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let lastToken: string | null = null;
let firstFailureAt: number = 0;

export function getSocket(token: string): Socket {
  if (socket) return socket;
  // Si hubo un error hace menos de 10 s, devolvemos un socket "muerto" que no re-intenta en cada página.
  if (firstFailureAt && Date.now() - firstFailureAt < 10000) {
    return createLazyDead();
  }
  firstFailureAt = 0;
  lastToken = token;
  socket = io(process.env.NEXT_PUBLIC_API || 'http://localhost:3001', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 2,
    reconnectionDelay: 900,
    timeout: 8000,
    auth: { token },
  });
  socket.on('connect_error', () => {
    if (!firstFailureAt) firstFailureAt = Date.now();
  });
  return socket;
}

let deadSocket: Socket | null = null;
function createLazyDead(): Socket {
  if (deadSocket) return deadSocket;
  deadSocket = io('http://localhost:1', { reconnection: false, autoConnect: false }) as Socket;
  return deadSocket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { env } from '../config/env.js';

let io: SocketServer;

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a workspace room
    socket.on('workspace:join', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`[Socket] ${socket.id} joined workspace:${workspaceId}`);
    });

    // Join a widget embed room
    socket.on('widget:join', (embedToken: string) => {
      socket.join(`widget:${embedToken}`);
      console.log(`[Socket] ${socket.id} joined widget:${embedToken}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// ─── Emit Helpers ────────────────────────────────────────
export function emitToWorkspace(workspaceId: string, event: string, data: unknown) {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
}

export function emitToWidget(embedToken: string, event: string, data: unknown) {
  if (io) {
    io.to(`widget:${embedToken}`).emit(event, data);
  }
}

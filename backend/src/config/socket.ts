import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('join', (assignmentId: string) => {
      socket.join(assignmentId);
      console.log(`📌 Client joined room: ${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket not initialized');
  return io;
};
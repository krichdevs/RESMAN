import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

/**
 * Initialize Socket.IO server with authentication
 * @param socketServer - Socket.IO server instance
 */
export function initializeSocket(socketServer: SocketIOServer): void {
  io = socketServer;

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      // Allow connection without auth for public updates
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      logger.warn('Socket authentication failed:', error);
      next(); // Still allow connection for public updates
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId || 'anonymous'})`);

    // Join user-specific room if authenticated
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-based rooms
    if (socket.userRole === 'ADMIN') {
      socket.join('admins');
    }

    // Handle room subscription
    socket.on('subscribe:room', (roomId: string) => {
      socket.join(`room:${roomId}`);
      logger.debug(`Socket ${socket.id} subscribed to room:${roomId}`);
    });

    socket.on('unsubscribe:room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      logger.debug(`Socket ${socket.id} unsubscribed from room:${roomId}`);
    });

    // Handle date subscription for calendar views
    socket.on('subscribe:date', (date: string) => {
      socket.join(`date:${date}`);
      logger.debug(`Socket ${socket.id} subscribed to date:${date}`);
    });

    socket.on('unsubscribe:date', (date: string) => {
      socket.leave(`date:${date}`);
      logger.debug(`Socket ${socket.id} unsubscribed from date:${date}`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
}

/**
 * Emit booking update to relevant clients
 * @param event - Event name
 * @param data - Booking data
 */
export function emitBookingUpdate(event: string, data: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit event');
    return;
  }

  // Emit to room subscribers
  if (data.roomId) {
    io.to(`room:${data.roomId}`).emit(event, data);
  }

  // Emit to date subscribers
  if (data.date) {
    const dateStr = new Date(data.date).toISOString().split('T')[0];
    io.to(`date:${dateStr}`).emit(event, data);
  }

  // Emit to user who made the booking
  if (data.userId) {
    io.to(`user:${data.userId}`).emit(event, data);
  }

  // Emit to admins for all booking events
  io.to('admins').emit(event, data);

  // Emit to all connected clients for general updates
  io.emit(`${event}:all`, { id: data.id, roomId: data.roomId });

  logger.debug(`Emitted ${event} to relevant clients`);
}

/**
 * Emit room update to all clients
 * @param event - Event name
 * @param data - Room data
 */
export function emitRoomUpdate(event: string, data: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit event');
    return;
  }

  io.emit(event, data);
  logger.debug(`Emitted ${event} to all clients`);
}

/**
 * Emit notification to specific user
 * @param userId - User ID
 * @param notification - Notification data
 */
export function emitUserNotification(userId: string, notification: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  logger.debug(`Emitted notification to user:${userId}`);
}

/**
 * Emit notification to all admins
 * @param notification - Notification data
 */
export function emitAdminNotification(notification: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit notification');
    return;
  }

  io.to('admins').emit('admin:notification', notification);
  logger.debug('Emitted notification to admins');
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount(): number {
  if (!io) return 0;
  return io.engine.clientsCount;
}

/**
 * Get Socket.IO server instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

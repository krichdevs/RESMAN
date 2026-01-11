import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createHttpServer, Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import routes
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import bookingRoutes from './routes/bookings';
import timeslotRoutes from './routes/timeslots';
import auditRoutes from './routes/audit';

// Import socket handler
import { initializeSocket } from './services/socket';

export async function createServer(): Promise<{ app: Application; httpServer: Server; io: SocketIOServer }> {
  const app: Application = express();
  const httpServer = createHttpServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Initialize socket handlers
  initializeSocket(io);

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/departments', require('./routes/departments').default);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/timeslots', timeslotRoutes);
  app.use('/api/audit', auditRoutes);

  // API documentation endpoint
  app.get('/api/docs', (req: Request, res: Response) => {
    res.json({
      name: 'Central University Available Class System API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        rooms: '/api/rooms',
        bookings: '/api/bookings',
        timeslots: '/api/timeslots',
        audit: '/api/audit',
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
      path: req.path,
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return { app, httpServer, io };
}

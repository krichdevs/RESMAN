import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs incoming requests and response times
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  logger.info(`→ ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    });
  });

  next();
};

/**
 * Skip logging for certain paths (e.g., health checks)
 */
export const skipPaths = ['/health', '/favicon.ico'];

/**
 * Conditional request logger that skips certain paths
 */
export const conditionalRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (skipPaths.includes(req.path)) {
    next();
    return;
  }

  requestLogger(req, res, next);
};

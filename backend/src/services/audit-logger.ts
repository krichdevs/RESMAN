import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * @param input - Audit log data
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues ? JSON.parse(JSON.stringify(input.oldValues)) : null,
        newValues: input.newValues ? JSON.parse(JSON.stringify(input.newValues)) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    logger.debug(`Audit log created: ${input.action} on ${input.entityType}`);
  } catch (error) {
    // Don't throw error for audit logging failures
    logger.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs for a specific entity
 * @param entityType - Type of entity
 * @param entityId - ID of entity
 */
export async function getEntityAuditLogs(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get audit logs for a specific user
 * @param userId - User ID
 * @param limit - Maximum number of logs to return
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  return prisma.auditLog.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get recent audit logs
 * @param limit - Maximum number of logs to return
 */
export async function getRecentAuditLogs(limit: number = 100) {
  return prisma.auditLog.findMany({
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Clean up old audit logs
 * @param daysToKeep - Number of days to keep logs
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  logger.info(`Cleaned up ${result.count} old audit logs`);
  return result.count;
}

// Predefined action types for consistency
export const AuditActions = {
  // User actions
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_UPDATED: 'USER_UPDATED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  // Room actions
  ROOM_CREATED: 'ROOM_CREATED',
  ROOM_UPDATED: 'ROOM_UPDATED',
  ROOM_DELETED: 'ROOM_DELETED',

  // Booking actions
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_UPDATED: 'BOOKING_UPDATED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',
  BOOKING_DELETED: 'BOOKING_DELETED',

  // Time slot actions
  TIMESLOT_CREATED: 'TIMESLOT_CREATED',
  TIMESLOT_UPDATED: 'TIMESLOT_UPDATED',
  TIMESLOT_DELETED: 'TIMESLOT_DELETED',
  TIMESLOTS_BULK_CREATED: 'TIMESLOTS_BULK_CREATED',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];

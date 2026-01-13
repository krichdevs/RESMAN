// api/lib/audit-logger.ts - Audit logging utilities for serverless

import prisma from './db';

export interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * Non-blocking: should be called without await to avoid extending function execution time
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues || null,
        newValues: input.newValues || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit failure shouldn't break the request
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs(
  filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  const where: any = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
  if (filters?.entityType) where.entityType = filters.entityType;

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters?.startDate) where.createdAt.gte = filters.startDate;
    if (filters?.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: offset,
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
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get distinct actions from audit logs
 */
export async function getAuditActions(): Promise<string[]> {
  const actions = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  });

  return actions.map((a) => a.action);
}

/**
 * Get distinct entity types from audit logs
 */
export async function getAuditEntityTypes(): Promise<string[]> {
  const types = await prisma.auditLog.findMany({
    select: { entityType: true },
    distinct: ['entityType'],
    orderBy: { entityType: 'asc' },
  });

  return types.map((t) => t.entityType);
}

/**
 * Get distinct users who have actions in audit logs
 */
export async function getAuditUsers() {
  const users = await prisma.auditLog.findMany({
    select: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    distinct: ['userId'],
    where: { userId: { not: null } },
    orderBy: { user: { lastName: 'asc' } },
  });

  return users.map((u) => u.user).filter((u) => u !== null);
}

/**
 * Export audit logs as JSON
 */
export async function exportAuditLogs(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<string> {
  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters?.startDate) where.createdAt.gte = filters.startDate;
    if (filters?.endDate) where.createdAt.lte = filters.endDate;
  }

  const logs = await prisma.auditLog.findMany({
    where,
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

  const exportData = {
    exportDate: new Date().toISOString(),
    totalRecords: logs.length,
    logs,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Clear old audit logs (older than specified days)
 */
export async function clearOldAuditLogs(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Get audit statistics
 */
export async function getAuditStats(): Promise<{
  totalLogs: number;
  actionsCount: Record<string, number>;
  entitiesCount: Record<string, number>;
  usersCount: number;
  dateRange: { oldest: Date | null; newest: Date | null };
}> {
  const [totalLogs, oldest, newest] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const actions = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: true,
  });

  const entities = await prisma.auditLog.groupBy({
    by: ['entityType'],
    _count: true,
  });

  const usersCount = await prisma.auditLog.findMany({
    select: { userId: true },
    distinct: ['userId'],
    where: { userId: { not: null } },
  });

  return {
    totalLogs,
    actionsCount: actions.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.action] = item._count;
        return acc;
      },
      {}
    ),
    entitiesCount: entities.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.entityType] = item._count;
        return acc;
      },
      {}
    ),
    usersCount: usersCount.length,
    dateRange: {
      oldest: oldest?.createdAt || null,
      newest: newest?.createdAt || null,
    },
  };
}

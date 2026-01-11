import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { validateQuery, validateParams, uuidParamSchema } from '../middleware/validation';
import { authenticate, isAdmin } from '../middleware/auth';
import { auditFilterSchema, paginationSchema } from '../utils/validators';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/audit
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin only
 */
router.get(
  '/',
  authenticate,
  isAdmin,
  validateQuery(paginationSchema.merge(auditFilterSchema)),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, userId, action, entityType, startDate, endDate } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' };
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
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

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * @route   GET /api/audit/actions
 * @desc    Get list of unique action types
 * @access  Admin only
 */
router.get(
  '/actions',
  authenticate,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const actions = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    res.json({
      success: true,
      data: actions.map((a) => a.action),
    });
  })
);

/**
 * @route   GET /api/audit/entity-types
 * @desc    Get list of unique entity types
 * @access  Admin only
 */
router.get(
  '/entity-types',
  authenticate,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const entityTypes = await prisma.auditLog.findMany({
      select: { entityType: true },
      distinct: ['entityType'],
      orderBy: { entityType: 'asc' },
    });

    res.json({
      success: true,
      data: entityTypes.map((e) => e.entityType),
    });
  })
);

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Admin only
 */
router.get(
  '/user/:userId',
  authenticate,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * @route   GET /api/audit/entity/:entityType/:entityId
 * @desc    Get audit logs for a specific entity
 * @access  Admin only
 */
router.get(
  '/entity/:entityType/:entityId',
  authenticate,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;

    const logs = await prisma.auditLog.findMany({
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

    res.json({
      success: true,
      data: logs,
    });
  })
);

/**
 * @route   GET /api/audit/:id
 * @desc    Get audit log by ID
 * @access  Admin only
 */
router.get(
  '/:id',
  authenticate,
  isAdmin,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id },
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
    });

    if (!log) {
      res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  })
);

/**
 * @route   GET /api/audit/stats/summary
 * @desc    Get audit log statistics
 * @access  Admin only
 */
router.get(
  '/stats/summary',
  authenticate,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get counts by action
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    });

    // Get counts by entity type
    const entityCounts = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: { entityType: true },
      orderBy: { _count: { entityType: 'desc' } },
    });

    // Get total count
    const totalCount = await prisma.auditLog.count({ where });

    // Get most active users
    const activeUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    // Get user details for active users
    const userIds = activeUsers.map((u) => u.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const activeUsersWithDetails = activeUsers.map((u) => ({
      ...u,
      user: users.find((user) => user.id === u.userId),
    }));

    res.json({
      success: true,
      data: {
        totalCount,
        byAction: actionCounts,
        byEntityType: entityCounts,
        mostActiveUsers: activeUsersWithDetails,
      },
    });
  })
);

export default router;

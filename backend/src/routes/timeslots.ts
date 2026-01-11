import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams, uuidParamSchema } from '../middleware/validation';
import { authenticate, isAdmin } from '../middleware/auth';
import { createTimeSlotSchema } from '../utils/validators';
import { createAuditLog } from '../services/audit-logger';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * @route   GET /api/timeslots
 * @desc    Get all time slots
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { roomId, dayOfWeek, isActive } = req.query;

    const where: any = {};

    if (roomId) {
      where.roomId = roomId;
    }

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = Number(dayOfWeek);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            name: true,
            building: true,
          },
        },
      },
      orderBy: [{ roomId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Group by room and day
    const grouped = timeSlots.reduce((acc: any, slot) => {
      const roomKey = slot.room.name;
      if (!acc[roomKey]) {
        acc[roomKey] = {
          room: slot.room,
          days: {},
        };
      }

      const dayName = DAYS_OF_WEEK[slot.dayOfWeek];
      if (!acc[roomKey].days[dayName]) {
        acc[roomKey].days[dayName] = [];
      }

      acc[roomKey].days[dayName].push({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
      });

      return acc;
    }, {});

    res.json({
      success: true,
      data: timeSlots,
      grouped,
    });
  })
);

/**
 * @route   GET /api/timeslots/room/:roomId
 * @desc    Get time slots for a specific room
 * @access  Public
 */
router.get(
  '/room/:roomId',
  asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
      });
      return;
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where: { roomId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Group by day of week
    const byDay = DAYS_OF_WEEK.map((day, index) => ({
      day,
      dayOfWeek: index,
      slots: timeSlots.filter((slot) => slot.dayOfWeek === index),
    }));

    res.json({
      success: true,
      data: {
        room,
        timeSlots,
        byDay,
      },
    });
  })
);

/**
 * @route   GET /api/timeslots/:id
 * @desc    Get time slot by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
      include: {
        room: true,
      },
    });

    if (!timeSlot) {
      res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...timeSlot,
        dayName: DAYS_OF_WEEK[timeSlot.dayOfWeek],
      },
    });
  })
);

/**
 * @route   POST /api/timeslots
 * @desc    Create a new time slot
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  validateBody(createTimeSlotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { roomId, dayOfWeek, startTime, endTime } = req.body;

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
      });
      return;
    }

    // Check for duplicate time slot
    const existingSlot = await prisma.timeSlot.findFirst({
      where: {
        roomId,
        dayOfWeek,
        startTime,
        endTime,
      },
    });

    if (existingSlot) {
      res.status(409).json({
        success: false,
        message: 'Time slot already exists for this room and day',
      });
      return;
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        roomId,
        dayOfWeek,
        startTime,
        endTime,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'TIMESLOT_CREATED',
      entityType: 'TimeSlot',
      entityId: timeSlot.id,
      newValues: { roomId, dayOfWeek, startTime, endTime },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Time slot created for ${room.name} by ${req.user!.email}`);

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: {
        ...timeSlot,
        dayName: DAYS_OF_WEEK[timeSlot.dayOfWeek],
      },
    });
  })
);

/**
 * @route   POST /api/timeslots/bulk
 * @desc    Create multiple time slots at once
 * @access  Admin only
 */
router.post(
  '/bulk',
  authenticate,
  isAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { roomId, slots } = req.body;

    if (!roomId || !slots || !Array.isArray(slots)) {
      res.status(400).json({
        success: false,
        message: 'roomId and slots array are required',
      });
      return;
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
      });
      return;
    }

    const createdSlots = [];
    const errors = [];

    for (const slot of slots) {
      try {
        const timeSlot = await prisma.timeSlot.create({
          data: {
            roomId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        });
        createdSlots.push(timeSlot);
      } catch (error: any) {
        if (error.code === 'P2002') {
          errors.push({
            slot,
            error: 'Duplicate time slot',
          });
        } else {
          errors.push({
            slot,
            error: error.message,
          });
        }
      }
    }

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'TIMESLOTS_BULK_CREATED',
      entityType: 'TimeSlot',
      newValues: { roomId, created: createdSlots.length, errors: errors.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: `Created ${createdSlots.length} time slots`,
      data: {
        created: createdSlots,
        errors,
      },
    });
  })
);

/**
 * @route   PUT /api/timeslots/:id
 * @desc    Update a time slot
 * @access  Admin only
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { startTime, endTime, isActive } = req.body;

    const currentSlot = await prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!currentSlot) {
      res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
      return;
    }

    const timeSlot = await prisma.timeSlot.update({
      where: { id },
      data: {
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'TIMESLOT_UPDATED',
      entityType: 'TimeSlot',
      entityId: timeSlot.id,
      oldValues: currentSlot,
      newValues: { startTime, endTime, isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Time slot updated successfully',
      data: {
        ...timeSlot,
        dayName: DAYS_OF_WEEK[timeSlot.dayOfWeek],
      },
    });
  })
);

/**
 * @route   DELETE /api/timeslots/:id
 * @desc    Delete a time slot
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!timeSlot) {
      res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
      return;
    }

    await prisma.timeSlot.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'TIMESLOT_DELETED',
      entityType: 'TimeSlot',
      entityId: id,
      oldValues: timeSlot,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Time slot deleted successfully',
    });
  })
);

export default router;

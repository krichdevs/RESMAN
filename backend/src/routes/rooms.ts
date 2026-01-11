import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateQuery, validateParams, uuidParamSchema } from '../middleware/validation';
import { authenticate, isAdmin } from '../middleware/auth';
import { createRoomSchema, updateRoomSchema, roomFilterSchema, paginationSchema } from '../utils/validators';
import { createAuditLog } from '../services/audit-logger';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms with filtering and pagination
 * @access  Public
 */
router.get(
  '/',
  validateQuery(paginationSchema.merge(roomFilterSchema)),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, building, minCapacity, maxCapacity, equipment, isActive } = req.query;

    const where: any = {};

    if (building) {
      where.building = building;
    }

    if (minCapacity || maxCapacity) {
      where.capacity = {};
      if (minCapacity) where.capacity.gte = Number(minCapacity);
      if (maxCapacity) where.capacity.lte = Number(maxCapacity);
    }

    if (equipment) {
      const equipmentList = (equipment as string).split(',');
      where.equipment = { hasEvery: equipmentList };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.room.count({ where }),
    ]);

    res.json({
      success: true,
      data: rooms,
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
 * @route   GET /api/rooms/buildings
 * @desc    Get list of unique buildings
 * @access  Public
 */
router.get(
  '/buildings',
  asyncHandler(async (req: Request, res: Response) => {
    const buildings = await prisma.room.findMany({
      select: { building: true },
      distinct: ['building'],
      orderBy: { building: 'asc' },
    });

    res.json({
      success: true,
      data: buildings.map((b) => b.building),
    });
  })
);

/**
 * @route   GET /api/rooms/equipment
 * @desc    Get list of all available equipment types
 * @access  Public
 */
router.get(
  '/equipment',
  asyncHandler(async (req: Request, res: Response) => {
    const rooms = await prisma.room.findMany({
      select: { equipment: true },
    });

    // Flatten and get unique equipment (equipment stored as comma-separated string)
    const allEquipment = new Set<string>();
    rooms.forEach((room) => {
      const eqs = typeof room.equipment === 'string' ? room.equipment.split(',') : (room.equipment as any[] || []);
      eqs.forEach((eq: string) => allEquipment.add(eq.trim()));
    });

    res.json({
      success: true,
      data: Array.from(allEquipment).sort(),
    });
  })
);

/**
 * @route   GET /api/rooms/:id
 * @desc    Get room by ID
 * @access  Public
 */
/**
 * @route   GET /api/rooms/occupancy
 * @desc    Get occupancy metrics for all rooms for a specific date
 * @access  Public
 */
router.get(
  '/occupancy',
  asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date is required',
      });
      return;
    }

    const queryDateStr = date as string;
    const dayOfWeek = new Date(queryDateStr).getDay();

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      rooms.map(async (room) => {
        const totalSlots = await prisma.timeSlot.count({
          where: { roomId: room.id, dayOfWeek, isActive: true },
        });

        const bookedSlots = await prisma.booking.count({
          where: {
            roomId: room.id,
            date: queryDateStr,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        });

        const occupancyPercent = totalSlots === 0 ? 0 : Math.round((bookedSlots / totalSlots) * 100);

        return {
          roomId: room.id,
          name: room.name,
          capacity: room.capacity,
          totalSlots,
          bookedSlots,
          occupancyPercent,
        };
      })
    );

    res.json({
      success: true,
      data: results,
    });
  })
);
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        timeSlots: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
      });
      return;
    }

    res.json({
      success: true,
      data: room,
    });
  })
);

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  isAdmin,
  validateBody(createRoomSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, capacity, building, floor, description, equipment } = req.body;

    // Check if room name already exists
    const existingRoom = await prisma.room.findUnique({
      where: { name },
    });

    if (existingRoom) {
      res.status(409).json({
        success: false,
        message: 'Room with this name already exists',
      });
      return;
    }

    const room = await prisma.room.create({
      data: {
        name,
        capacity,
        building,
        floor,
        description,
        equipment: equipment || [],
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'ROOM_CREATED',
      entityType: 'Room',
      entityId: room.id,
      newValues: { name, capacity, building, floor },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Room created: ${name} by ${req.user!.email}`);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  })
);

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update a room
 * @access  Admin only
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validateParams(uuidParamSchema),
  validateBody(updateRoomSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Get current room data for audit log
    const currentRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!currentRoom) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
      });
      return;
    }

    // Check if new name conflicts with existing room
    if (updateData.name && updateData.name !== currentRoom.name) {
      const existingRoom = await prisma.room.findUnique({
        where: { name: updateData.name },
      });

      if (existingRoom) {
        res.status(409).json({
          success: false,
          message: 'Room with this name already exists',
        });
        return;
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'ROOM_UPDATED',
      entityType: 'Room',
      entityId: room.id,
      oldValues: currentRoom,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Room updated: ${room.name} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  })
);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete a room (soft delete by setting isActive to false)
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
      });
      return;
    }

    // Soft delete
    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'ROOM_DELETED',
      entityType: 'Room',
      entityId: id,
      oldValues: { name: room.name, isActive: true },
      newValues: { isActive: false },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Room deleted: ${room.name} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  })
);

/**
 * @route   GET /api/rooms/:id/availability
 * @desc    Get room availability for a specific date
 * @access  Public
 */
router.get(
  '/:id/availability',
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date is required',
      });
      return;
    }

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        message: 'Room not found',
      });
      return;
    }

    const queryDateStr = date as string;
    const dayOfWeek = new Date(queryDateStr).getDay();

    // Get time slots for this day
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        roomId: id,
        dayOfWeek,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Get bookings for this date
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: id,
        date: queryDateStr,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Mark slots as available or booked
    const availability = timeSlots.map((slot) => {
      const isBooked = bookings.some(
        (booking) =>
          booking.startTime === slot.startTime && booking.endTime === slot.endTime
      );

      return {
        ...slot,
        isAvailable: !isBooked,
        booking: isBooked
          ? bookings.find(
              (b) => b.startTime === slot.startTime && b.endTime === slot.endTime
            )
          : null,
      };
    });

    res.json({
      success: true,
      data: {
        room,
        date: queryDateStr,
        dayOfWeek,
        availability,
      },
    });
  })
);

/**
 * @route   GET /api/rooms/occupancy
 * @desc    Get occupancy metrics for all rooms for a specific date
 * @access  Public
 */
router.get(
  '/occupancy',
  asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date is required',
      });
      return;
    }

    const queryDateStr = date as string;
    const dayOfWeek = new Date(queryDateStr).getDay();

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      rooms.map(async (room) => {
        const totalSlots = await prisma.timeSlot.count({
          where: { roomId: room.id, dayOfWeek, isActive: true },
        });

        const bookedSlots = await prisma.booking.count({
          where: {
            roomId: room.id,
            date: queryDateStr,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        });

        const occupancyPercent = totalSlots === 0 ? 0 : Math.round((bookedSlots / totalSlots) * 100);

        return {
          roomId: room.id,
          name: room.name,
          capacity: room.capacity,
          totalSlots,
          bookedSlots,
          occupancyPercent,
        };
      })
    );

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * @route   GET /api/rooms/occupancy/range
 * @desc    Get occupancy metrics for all rooms over a date range
 * @access  Public
 */
router.get(
  '/occupancy/range',
  asyncHandler(async (req: Request, res: Response) => {
    const { start, end } = req.query;

    if (!start || !end) {
      res.status(400).json({
        success: false,
        message: 'Start and end dates are required (YYYY-MM-DD)',
      });
      return;
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
      res.status(400).json({
        success: false,
        message: 'Invalid date range',
      });
      return;
    }

    // Build list of ISO dates between start and end (inclusive)
    const dates: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      rooms.map(async (room) => {
        const series = [] as Array<{
          date: string;
          totalSlots: number;
          bookedSlots: number;
          occupancyPercent: number;
        }>;

        for (const dt of dates) {
          const dayOfWeek = new Date(dt).getDay();

          const totalSlots = await prisma.timeSlot.count({
            where: { roomId: room.id, dayOfWeek, isActive: true },
          });

          const bookedSlots = await prisma.booking.count({
            where: {
              roomId: room.id,
              date: dt,
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          });

          const occupancyPercent = totalSlots === 0 ? 0 : Math.round((bookedSlots / totalSlots) * 100);

          series.push({ date: dt, totalSlots, bookedSlots, occupancyPercent });
        }

        return {
          roomId: room.id,
          name: room.name,
          capacity: room.capacity,
          series,
        };
      })
    );

    res.json({
      success: true,
      data: results,
    });
  })
);

export default router;

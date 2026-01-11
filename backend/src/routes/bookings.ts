import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateQuery, validateParams, uuidParamSchema } from '../middleware/validation';
import { authenticate, isAdmin } from '../middleware/auth';
import { createBookingSchema, updateBookingSchema, bookingFilterSchema, paginationSchema } from '../utils/validators';
import { createAuditLog } from '../services/audit-logger';
import { sendBookingNotification } from '../services/notify';
import { emitBookingUpdate } from '../services/socket';
import { findConflictingBookings, isValidTimeRange } from '../utils/overlap-check';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validateQuery(paginationSchema.merge(bookingFilterSchema)),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, roomId, userId, status, startDate, endDate } = req.query;

    const where: any = {};

    // Non-admin users can only see their own bookings
    if (req.user!.role !== 'ADMIN') {
      where.userId = req.user!.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
          if (startDate) where.date.gte = startDate as string;
          if (endDate) where.date.lte = endDate as string;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          room: {
            select: {
              id: true,
              name: true,
              building: true,
              floor: true,
              capacity: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: bookings,
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
 * @route   GET /api/bookings/check-availability
 * @desc    Check if a room is available for a given date/time
 * @access  Public
 */
router.get(
  '/check-availability',
  asyncHandler(async (req: Request, res: Response) => {
    const { roomId, date, startTime, endTime } = req.query as any;

    if (!roomId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, message: 'roomId, date, startTime and endTime are required' });
      return;
    }

        const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
            date: date as string,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const conflicts = findConflictingBookings(
      { roomId, date: date as string, startTime, endTime },
      existingBookings.map((b) => ({ roomId: b.roomId, date: b.date, startTime: b.startTime, endTime: b.endTime }))
    );

    res.json({ success: true, data: { available: conflicts.length === 0, conflicts } });
  })
);

/**
 * @route   GET /api/bookings/my
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get(
  '/my',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, upcoming } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (status) {
      where.status = status;
    }

    if (upcoming === 'true') {
      where.date = { gte: new Date().toISOString().slice(0, 10) };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    res.json({
      success: true,
      data: bookings,
    });
  })
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Non-admin users can only view their own bookings
    if (req.user!.role !== 'ADMIN' && booking.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: booking,
    });
  })
);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Authenticated users). Students create PENDING requests; Staff/Admin create CONFIRMED bookings.
 */
router.post(
  '/',
  authenticate,
  validateBody(createBookingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { roomId, title, description, date, startTime, endTime, isRecurring, notes } = req.body;

    // Validate time range
    if (!isValidTimeRange(startTime, endTime)) {
      res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
      return;
    }

    // Check if room exists and is active
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isActive) {
      res.status(404).json({
        success: false,
        message: 'Room not found or inactive',
      });
      return;
    }

    // Check for conflicting bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        date: date as string,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const conflicts = findConflictingBookings(
      { roomId, date: date as string, startTime, endTime },
      existingBookings.map((b) => ({ roomId: b.roomId, date: b.date, startTime: b.startTime, endTime: b.endTime }))
    );

    if (conflicts.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing booking',
        conflicts,
      });
      return;
    }

    // Determine initial status based on role
    const initialStatus = req.user!.role === 'STUDENT' ? 'PENDING' : 'CONFIRMED';

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId: req.user!.id,
        title,
        description,
        date: date as string,
        startTime,
        endTime,
        isRecurring: isRecurring || false,
        notes,
        status: initialStatus,
      },
      include: {
        room: true,
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

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking.id,
      newValues: { roomId, title, date, startTime, endTime },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Send notification
    await sendBookingNotification(booking, 'created');

    // Emit real-time update
    emitBookingUpdate('booking:created', booking);

    logger.info(`Booking created: ${title} by ${req.user!.email}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  })
);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update a booking
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validateParams(uuidParamSchema),
  validateBody(updateBookingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!currentBooking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Check ownership or admin
    if (req.user!.role !== 'ADMIN' && currentBooking.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // If changing time, check for conflicts
    if (updateData.date || updateData.startTime || updateData.endTime) {
          const newDate = updateData.date ? (updateData.date as string) : currentBooking.date;
      const newStartTime = updateData.startTime || currentBooking.startTime;
      const newEndTime = updateData.endTime || currentBooking.endTime;

      if (!isValidTimeRange(newStartTime, newEndTime)) {
        res.status(400).json({
          success: false,
          message: 'Start time must be before end time',
        });
        return;
      }

      const existingBookings = await prisma.booking.findMany({
        where: {
          roomId: currentBooking.roomId,
              date: newDate as string,
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: id }, // Exclude current booking
        },
      });

      const conflicts = findConflictingBookings(
        { roomId: currentBooking.roomId, date: newDate, startTime: newStartTime, endTime: newEndTime },
        existingBookings.map((b) => ({
          roomId: b.roomId,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
        }))
      );

      if (conflicts.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Time slot conflicts with existing booking',
          conflicts,
        });
        return;
      }
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...updateData,
            ...(updateData.date && { date: updateData.date }),
      },
      include: {
        room: true,
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

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'BOOKING_UPDATED',
      entityType: 'Booking',
      entityId: booking.id,
      oldValues: currentBooking,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Send notification
    await sendBookingNotification(booking, 'updated');

    // Emit real-time update
    emitBookingUpdate('booking:updated', booking);

    logger.info(`Booking updated: ${booking.title} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  })
);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status (confirm/cancel)
 * @access  Private (Admin for confirm, Owner or Admin for cancel)
 */
router.put(
  '/:id/status',
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be CONFIRMED, CANCELLED, or COMPLETED',
      });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Only admin can confirm bookings
    if (status === 'CONFIRMED' && req.user!.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Only administrators can confirm bookings',
      });
      return;
    }

    // Owner or admin can cancel
    if (status === 'CANCELLED' && req.user!.role !== 'ADMIN' && booking.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: status as string },
      include: {
        room: true,
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

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: `BOOKING_${status}`,
      entityType: 'Booking',
      entityId: booking.id,
      oldValues: { status: booking.status },
      newValues: { status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Send notification
    await sendBookingNotification(updatedBooking, status.toLowerCase() as any);

    // Emit real-time update
    emitBookingUpdate('booking:status_changed', updatedBooking);

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: updatedBooking,
    });
  })
);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete a booking
 * @access  Private (Owner or Admin)
 */
router.delete(
  '/:id',
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Check ownership or admin
    if (req.user!.role !== 'ADMIN' && booking.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    await prisma.booking.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'BOOKING_DELETED',
      entityType: 'Booking',
      entityId: id,
      oldValues: booking,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Emit real-time update
    emitBookingUpdate('booking:deleted', { id, roomId: booking.roomId });

    logger.info(`Booking deleted: ${booking.title} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  })
);

export default router;

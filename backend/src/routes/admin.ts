import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateQuery, validateParams, uuidParamSchema } from '../middleware/validation';
import { authenticate, isAdmin } from '../middleware/auth';
import { paginationSchema } from '../utils/validators';
import { createAuditLog } from '../services/audit-logger';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// All routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics for admin
 * @access  Admin only
 */
router.get(
  '/dashboard/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total bookings
    const totalBookings = await prisma.booking.count();
    
    // Get bookings this month
    const bookingsThisMonth = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get bookings last month
    const bookingsLastMonth = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // Calculate monthly growth
    const monthlyGrowth = bookingsLastMonth > 0 
      ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100 
      : bookingsThisMonth > 0 ? 100 : 0;

    // Get active users (users who have logged in within last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: thirtyDaysAgo,
        },
        isActive: true,
      },
    });

    // Get total users
    const totalUsers = await prisma.user.count({
      where: { isActive: true },
    });

    // Get total rooms
    const totalRooms = await prisma.room.count({
      where: { isActive: true },
    });

    // Calculate room utilization (rooms with bookings today)
    const today = new Date().toISOString().split('T')[0];
    const roomsWithBookingsToday = await prisma.booking.findMany({
      where: {
        date: today,
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
      select: {
        roomId: true,
      },
      distinct: ['roomId'],
    });

    const roomUtilization = totalRooms > 0 
      ? (roomsWithBookingsToday.length / totalRooms) * 100 
      : 0;

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        activeUsers,
        totalUsers,
        roomUtilization: Math.round(roomUtilization),
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // Round to 1 decimal
        bookingsThisMonth,
        bookingsLastMonth,
        totalRooms,
        recentBookings,
      },
    });
  })
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Admin only
 */
router.get(
  '/users',
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, role, isActive, department } = req.query;
    // Accept includeStudents=true to allow showing STUDENTs in system users view
    const includeStudents = req.query.includeStudents === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    console.log('🔍 DEBUG /admin/users called with:');
    console.log('  - page:', page);
    console.log('  - limit:', limit);
    console.log('  - search:', search);
    console.log('  - role:', role);
    console.log('  - isActive:', isActive);
    console.log('  - department:', department);
    console.log('  - includeStudents:', includeStudents);

    // By default the system users view excludes students for clarity.
    // If a specific role is requested, use it. If `includeStudents=true` is
    // passed, do not apply the default ADMIN/STAFF filter.
    if (!role) {
      if (!includeStudents) {
        where.role = { in: ['ADMIN', 'STAFF'] };
      }
      // otherwise leave role unspecified to include all roles (including STUDENT)
    } else if (role) {
      where.role = role as string;
    }
    
    console.log('📋 where clause built:', JSON.stringify(where, null, 2));

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Department filter
    if (department) {
      where.department = department as string;
    }

    // Active status filter - default to showing active users only
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      where.isActive = true;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          department: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user
 * @access  Admin only
 */
router.post(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      indexNumber, 
      role = 'STUDENT', 
      department, 
      phone 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !department) {
      res.status(400).json({
        success: false,
        message: 'Email, password, firstName, lastName, and department are required',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(indexNumber ? [{ indexNumber }] : []),
        ],
      },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email or index number already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        indexNumber,
        role,
        department,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        indexNumber: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_CREATED_BY_ADMIN',
      entityType: 'User',
      entityId: user.id,
      newValues: { email, firstName, lastName, role, department },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User created by admin: ${email} by ${req.user!.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  })
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update a user
 * @access  Admin only
 */
router.put(
  '/users/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { firstName, lastName, email, indexNumber, role, department, phone, isActive } = req.body;

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if email/indexNumber conflicts with other users
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
        return;
      }
    }

    if (indexNumber && indexNumber !== currentUser.indexNumber) {
      const existingUser = await prisma.user.findUnique({
        where: { indexNumber },
      });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Index number already exists',
        });
        return;
      }
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (indexNumber) updateData.indexNumber = indexNumber;
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        indexNumber: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_UPDATED_BY_ADMIN',
      entityType: 'User',
      entityId: user.id,
      oldValues: currentUser,
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User updated by admin: ${user.email} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  })
);

/**
 * @route   PUT /api/admin/users/:id/reset-password
 * @desc    Reset user password (admin only)
 * @access  Admin only
 */
router.put(
  '/users/:id/reset-password',
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_PASSWORD_RESET_BY_ADMIN',
      entityType: 'User',
      entityId: id,
      newValues: { passwordReset: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`Password reset by admin for user: ${user.email} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: updatedUser,
    });
  })
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete/deactivate a user
 * @access  Admin only
 */
router.delete(
  '/users/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user!.id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
      return;
    }

    // Soft delete by deactivating the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_DEACTIVATED_BY_ADMIN',
      entityType: 'User',
      entityId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User deactivated by admin: ${user.email} by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: updatedUser,
    });
  })
);

/**
 * @route   GET /api/admin/students
 * @desc    Get all students with filtering and pagination
 * @access  Admin only
 */
router.get(
  '/students',
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { role: 'STUDENT' };

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { indexNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          indexNumber: true,
          role: true,
          department: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);

/**
 * @route   GET /api/admin/reports/overview
 * @desc    Get system overview reports
 * @access  Admin only
 */
router.get(
  '/reports/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Booking statistics
    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    // User statistics by role
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: { role: true },
    });

    // Room utilization by building
    const roomStats = await prisma.room.groupBy({
      by: ['building'],
      where: { isActive: true },
      _count: { building: true },
    });

    // Most popular rooms (by booking count)
    const popularRooms = await prisma.booking.groupBy({
      by: ['roomId'],
      where,
      _count: { roomId: true },
      orderBy: { _count: { roomId: 'desc' } },
      take: 10,
    });

    // Get room details for popular rooms
    const roomIds = popularRooms.map(r => r.roomId);
    const rooms = await prisma.room.findMany({
      where: { id: { in: roomIds } },
      select: { id: true, name: true, building: true, capacity: true },
    });

    const popularRoomsWithDetails = popularRooms.map(stat => {
      const room = rooms.find(r => r.id === stat.roomId);
      return {
        ...stat,
        room,
      };
    });

    // Department usage statistics
    const departmentStats = await prisma.user.groupBy({
      by: ['department'],
      where: { isActive: true },
      _count: { department: true },
      orderBy: { _count: { department: 'desc' } },
    });

    res.json({
      success: true,
      data: {
        bookingStats,
        userStats,
        roomStats,
        popularRooms: popularRoomsWithDetails,
        departmentStats,
      },
    });
  })
);

/**
 * @route   GET /api/admin/books
 * @desc    Get all books with filtering and pagination
 * @access  Admin only
 */
router.get(
  '/books',
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, category, isAvailable } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);

/**
 * @route   GET /api/admin/settings
 * @desc    Get system settings
 * @access  Admin only
 */
router.get(
  '/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const systemInfo = {
      totalUsers: await prisma.user.count(),
      totalRooms: await prisma.room.count(),
      totalBookings: await prisma.booking.count(),
      databaseSize: 'N/A',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    res.json({
      success: true,
      data: {
        system: systemInfo,
        features: {
          emailNotifications: true,
          realTimeUpdates: true,
          auditLogging: true,
          multipleRoles: true,
        },
        limits: {
          maxBookingDuration: 8,
          maxAdvanceBooking: 30,
          maxRecurringBookings: 52,
        },
      },
    });
  })
);

export default router;
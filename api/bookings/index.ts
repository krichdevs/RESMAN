// api/bookings/index.ts - GET /api/bookings with filtering
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate, AuthRequest } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate
    if (!(await authenticate(req as AuthRequest, res))) return;

    const { page = '1', limit = '10', roomId, userId, status, startDate, endDate } = req.query;
    const user = (req as AuthRequest).user;

    const where: any = {};

    // Non-admin users can only see their own bookings
    if (user.role !== 'ADMIN') {
      where.userId = user.id;
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

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Bookings list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
}

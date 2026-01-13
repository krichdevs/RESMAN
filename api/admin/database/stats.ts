// api/admin/database/stats.ts - Database statistics
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate, isAdmin } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate
    if (!(await authenticate(req as any, res))) return;
    if (!(await isAdmin(req as any, res))) return;

    const [userCount, roomCount, bookingCount, timeSlotCount, auditLogCount] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.booking.count(),
      prisma.timeSlot.count(),
      prisma.auditLog.count(),
    ]);

    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        tables: {
          users: userCount,
          rooms: roomCount,
          bookings: bookingCount,
          timeSlots: timeSlotCount,
          auditLogs: auditLogCount,
        },
        statistics: {
          activeBookings,
          usersByRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Database stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch database stats',
      error: error.message,
    });
  }
}

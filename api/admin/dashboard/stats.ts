// api/admin/dashboard/stats.ts - GET /api/admin/dashboard/stats
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../lib/db';
import { authenticate, isAdmin, AuthRequest } from '../../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate
    if (!(await authenticate(req as AuthRequest, res))) return;
    if (!(await isAdmin(req as AuthRequest, res))) return;

    const [totalUsers, totalRooms, totalBookings, activeBookings] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
    ]);

    const bookingsThisMonth = await prisma.booking.count({
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
      },
    });

    const bookingsLastMonth = await prisma.booking.count({
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
        },
      },
    });

    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        room: { select: { name: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const roomUtilization = totalRooms > 0 ? Math.round((totalBookings / (totalRooms * 8)) * 100) : 0;
    const monthlyGrowth = bookingsLastMonth > 0 ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100) : 100;

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        activeUsers: totalUsers,
        roomUtilization,
        monthlyGrowth,
        bookingsThisMonth,
        bookingsLastMonth,
        totalRooms,
        totalUsers,
        activeBookings,
        recentBookings,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
}

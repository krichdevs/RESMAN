// api/admin/database/export.ts - GET /api/admin/database/export
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

    const [users, rooms, bookings, timeSlots, auditLogs] = await Promise.all([
      prisma.user.findMany(),
      prisma.room.findMany(),
      prisma.booking.findMany(),
      prisma.timeSlot.findMany(),
      prisma.auditLog.findMany(),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      tables: {
        users,
        rooms,
        bookings,
        timeSlots,
        auditLogs,
      },
      summary: {
        users: users.length,
        rooms: rooms.length,
        bookings: bookings.length,
        timeSlots: timeSlots.length,
        auditLogs: auditLogs.length,
      },
    };

    // Send as JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=resman-export.json');
    return res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error: any) {
    console.error('Database export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export database',
      error: error.message,
    });
  }
}

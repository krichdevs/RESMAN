// api/rooms/[id].ts - GET /api/rooms/:id
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Room ID is required' });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        timeSlots: true,
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    console.error('Room detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
      error: error.message,
    });
  }
}

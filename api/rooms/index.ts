// api/rooms/index.ts - GET /api/rooms with pagination and filtering
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '10', building, minCapacity, maxCapacity, equipment, isActive } = req.query;

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
      where.equipment = { contains: equipmentList.join(',') };
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

    return res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Rooms list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message,
    });
  }
}

# Vercel Serverless Conversion - Implementation Examples

This document provides complete, copy-paste-ready implementations for 3 key endpoints. Use these as templates for converting remaining endpoints.

---

## Example 1: GET /api/rooms (List with Pagination & Filtering)

**File: `api/rooms/index.ts`**

This is a good starting point - no authentication, pagination, and filtering patterns.

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { validatePagination } from '../../lib/validators';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Extract and validate pagination
    const { page = '1', limit = '10' } = req.query as Record<string, string>;
    const { page: pageNum, limit: limitNum, valid, errors } = validatePagination(page, limit);

    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid pagination', errors });
    }

    // Extract filters
    const { building, minCapacity, maxCapacity, equipment, isActive } = req.query as Record<
      string,
      string
    >;

    // Build where clause
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
      const equipmentList = equipment.split(',').map((e) => e.trim());
      where.equipment = { hasEvery: equipmentList };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Calculate skip for pagination
    const skip = (pageNum - 1) * limitNum;

    // Fetch rooms and total count in parallel
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          capacity: true,
          building: true,
          floor: true,
          description: true,
          equipment: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.room.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
```

**Usage Example:**
```bash
# List all rooms
curl "http://localhost:3000/api/rooms"

# With pagination
curl "http://localhost:3000/api/rooms?page=2&limit=20"

# With filters
curl "http://localhost:3000/api/rooms?building=Building%20A&minCapacity=20&maxCapacity=50"

# With equipment filter
curl "http://localhost:3000/api/rooms?equipment=projector,whiteboard"

# Filter by active status
curl "http://localhost:3000/api/rooms?isActive=true"
```

---

## Example 2: POST /api/bookings (Complex Business Logic)

**File: `api/bookings/post.ts`**

This demonstrates authentication, validation, business logic, and conflict detection.

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate } from '../../lib/auth';
import { validateBookingData, isValidDateFormat } from '../../lib/validators';
import {
  isValidTimeRange,
  findConflictingBookings,
  checkTimeSlotAvailability,
  BookingSlot,
} from '../../lib/overlap-check';
import { createAuditLog } from '../../lib/audit-logger';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Step 1: Authenticate user
    const authResult = await authenticate(req, res);
    if (!authResult) return; // Response already sent by authenticate()

    const user = (req as any).user;

    // Step 2: Extract and validate request body
    const { roomId, title, description, date, startTime, endTime, isRecurring, notes } =
      req.body || {};

    // Validate required fields and formats
    const bookingValidation = validateBookingData({
      roomId,
      title,
      date,
      startTime,
      endTime,
    });

    if (!bookingValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: bookingValidation.errors,
      });
    }

    // Step 3: Check if room exists and is active
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        building: true,
        floor: true,
        capacity: true,
        isActive: true,
      },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or is inactive',
      });
    }

    // Step 4: Get time slots for this room/date to check availability
    const dayOfWeek = new Date(date).getDay();
    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        roomId,
        dayOfWeek,
        isActive: true,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Check if requested time falls within available slots
    const hasAvailableSlot = checkTimeSlotAvailability(date, startTime, endTime, availableSlots);

    if (!hasAvailableSlot) {
      return res.status(400).json({
        success: false,
        message: 'Requested time is outside of available time slots for this room',
        availableSlots,
      });
    }

    // Step 5: Check for conflicting bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        date,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        roomId: true,
        date: true,
        startTime: true,
        endTime: true,
      },
    });

    const proposedBooking: BookingSlot = {
      roomId,
      date,
      startTime,
      endTime,
    };

    const conflicts = findConflictingBookings(proposedBooking, existingBookings);

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing booking(s)',
        conflictCount: conflicts.length,
        conflicts,
      });
    }

    // Step 6: Determine initial status based on user role
    const initialStatus = user.role === 'STUDENT' ? 'PENDING' : 'CONFIRMED';

    // Step 7: Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId: user.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        date,
        startTime,
        endTime,
        isRecurring: isRecurring === true,
        notes: notes ? notes.trim() : null,
        status: initialStatus,
      },
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
    });

    // Step 8: Create audit log (fire and forget)
    createAuditLog({
      userId: user.id,
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking.id,
      newValues: {
        roomId,
        title,
        date,
        startTime,
        endTime,
        status: initialStatus,
      },
      ipAddress: req.socket?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    }).catch((err) => console.error('Audit log error:', err));

    // TODO: Send notification email
    // TODO: Emit real-time update via Ably/Socket.io
    // (These should be in separate serverless functions to avoid extending cold start)

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      // Record not found
      return res.status(404).json({
        success: false,
        message: 'Referenced resource not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
```

**Usage Example:**
```bash
# Create a booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "roomId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Team Meeting",
    "description": "Weekly sync with the team",
    "date": "2024-02-20",
    "startTime": "10:00",
    "endTime": "11:00",
    "notes": "Please bring agenda"
  }'
```

---

## Example 3: GET /api/admin/dashboard/stats (Advanced Analytics)

**File: `api/admin/dashboard/stats.ts`**

This demonstrates admin authentication, complex aggregations, and parallel queries.

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../lib/db';
import { authenticate } from '../../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Step 1: Authenticate user
    const authResult = await authenticate(req, res);
    if (!authResult) return;

    const user = (req as any).user;

    // Step 2: Check admin role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    // Step 3: Define date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];

    // Step 4: Fetch all stats in parallel using Promise.all
    // This is more efficient than sequential queries
    const [
      userCount,
      roomCount,
      bookingCount,
      timeSlotCount,
      auditLogCount,
      activeBookings,
      usersByRole,
      activeUsers,
      totalRooms,
      roomsWithBookingsToday,
      recentBookings,
      bookingsThisMonth,
      bookingsLastMonth,
      avgBookingDuration,
      roomUtilizationByRoom,
    ] = await Promise.all([
      // Count queries
      prisma.user.count(),
      prisma.room.count(),
      prisma.booking.count(),
      prisma.timeSlot.count(),
      prisma.auditLog.count(),

      // Active bookings
      prisma.booking.count({
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      }),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),

      // Active users (last 30 days)
      prisma.user.count({
        where: {
          lastLogin: { gte: thirtyDaysAgo },
          isActive: true,
        },
      }),

      // Total active rooms
      prisma.room.count({ where: { isActive: true } }),

      // Rooms with bookings today
      prisma.booking.findMany({
        where: {
          date: today,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
        select: { roomId: true },
        distinct: ['roomId'],
      }),

      // Recent 5 bookings
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          room: {
            select: {
              id: true,
              name: true,
              building: true,
            },
          },
        },
      }),

      // Bookings this month
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Bookings last month
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Average booking duration
      prisma.booking.aggregate({
        _avg: {
          duration: true,
        },
      }),

      // Room utilization by room
      prisma.room.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        take: 10,
      }),
    ]);

    // Step 5: Calculate derived metrics
    const monthlyGrowth =
      bookingsLastMonth > 0
        ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100
        : bookingsThisMonth > 0
        ? 100
        : 0;

    const roomUtilization =
      totalRooms > 0 ? (roomsWithBookingsToday.length / totalRooms) * 100 : 0;

    const usersByRoleMap = usersByRole.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.role] = item._count;
        return acc;
      },
      {}
    );

    // Step 6: Get room utilization for top rooms
    const topRoomsUtilization = await Promise.all(
      roomUtilizationByRoom.map(async (room) => {
        const bookingCount = await prisma.booking.count({
          where: {
            roomId: room.id,
            createdAt: { gte: startOfMonth },
          },
        });

        const slotCount = await prisma.timeSlot.count({
          where: { roomId: room.id },
        });

        const utilization = slotCount > 0 ? (bookingCount / slotCount) * 100 : 0;

        return {
          roomId: room.id,
          roomName: room.name,
          bookings: bookingCount,
          totalSlots: slotCount,
          utilizationPercent: Math.round(utilization),
        };
      })
    );

    // Step 7: Build response
    const statsResponse = {
      success: true,
      data: {
        summary: {
          totalUsers: userCount,
          activeUsers,
          totalRooms,
          totalRoomSlots: timeSlotCount,
          totalBookings: bookingCount,
          activeBookings,
        },
        monthly: {
          bookingsThisMonth,
          bookingsLastMonth,
          monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // 1 decimal place
          growthDirection: monthlyGrowth > 0 ? 'up' : monthlyGrowth < 0 ? 'down' : 'stable',
        },
        utilization: {
          roomUtilizationPercent: Math.round(roomUtilization),
          roomsWithBookingsToday: roomsWithBookingsToday.length,
          avgBookingDurationMinutes: Math.round(avgBookingDuration._avg.duration || 0),
        },
        distribution: {
          usersByRole: usersByRoleMap,
        },
        recentActivity: {
          recentBookings: recentBookings.map((b) => ({
            id: b.id,
            title: b.title,
            room: b.room.name,
            user: `${b.user.firstName} ${b.user.lastName}`,
            date: b.date,
            startTime: b.startTime,
            createdAt: b.createdAt,
          })),
        },
        topRoomsUtilization: topRoomsUtilization,
        auditLog: {
          totalAuditLogs: auditLogCount,
        },
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(statsResponse);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
```

**Usage Example:**
```bash
curl http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 456,
      "activeUsers": 123,
      "totalRooms": 45,
      "totalRoomSlots": 1200,
      "totalBookings": 5678,
      "activeBookings": 234
    },
    "monthly": {
      "bookingsThisMonth": 567,
      "bookingsLastMonth": 523,
      "monthlyGrowth": 8.4,
      "growthDirection": "up"
    },
    "utilization": {
      "roomUtilizationPercent": 65,
      "roomsWithBookingsToday": 29,
      "avgBookingDurationMinutes": 60
    },
    "distribution": {
      "usersByRole": {
        "STUDENT": 400,
        "STAFF": 50,
        "ADMIN": 6
      }
    },
    "recentActivity": {
      "recentBookings": [
        {
          "id": "uuid-here",
          "title": "Team Meeting",
          "room": "Room 101",
          "user": "John Doe",
          "date": "2024-02-20",
          "startTime": "10:00",
          "createdAt": "2024-02-20T09:30:00Z"
        }
      ]
    },
    "topRoomsUtilization": [
      {
        "roomId": "room-uuid",
        "roomName": "Lecture Hall A",
        "bookings": 145,
        "totalSlots": 200,
        "utilizationPercent": 72
      }
    ],
    "auditLog": {
      "totalAuditLogs": 12340
    },
    "timestamp": "2024-02-20T14:30:00Z"
  }
}
```

---

## Testing These Examples

### Test 1: GET /api/rooms
```bash
# Test no params
curl "http://localhost:3000/api/rooms"

# Test pagination
curl "http://localhost:3000/api/rooms?page=1&limit=5"

# Test invalid pagination
curl "http://localhost:3000/api/rooms?page=-1&limit=200"

# Test filters
curl "http://localhost:3000/api/rooms?building=Building%20A&minCapacity=20&maxCapacity=100"
```

### Test 2: POST /api/bookings
```bash
# Test without auth (should fail)
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"roomId":"uuid","title":"Test","date":"2024-02-20","startTime":"10:00","endTime":"11:00"}'

# Test with valid auth token
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"roomId":"uuid","title":"Test","date":"2024-02-20","startTime":"10:00","endTime":"11:00"}'

# Test with invalid data
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"roomId":"uuid","title":"Test","date":"2024-02-20","startTime":"11:00","endTime":"10:00"}'
```

### Test 3: GET /api/admin/dashboard/stats
```bash
# Test without auth
curl "http://localhost:3000/api/admin/dashboard/stats"

# Test with non-admin user (should fail with 403)
curl "http://localhost:3000/api/admin/dashboard/stats" \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"

# Test with admin user
curl "http://localhost:3000/api/admin/dashboard/stats" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## Common Patterns to Reuse

### Pattern: Method Check
```typescript
if (req.method !== 'POST') {
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
```

### Pattern: Authentication
```typescript
const authResult = await authenticate(req, res);
if (!authResult) return;
const user = (req as any).user;
```

### Pattern: Authorization
```typescript
if (user.role !== 'ADMIN') {
  return res.status(403).json({ success: false, message: 'Admin access required' });
}
```

### Pattern: Validation
```typescript
const validation = validateBookingData(req.body);
if (!validation.valid) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: validation.errors,
  });
}
```

### Pattern: Parallel Queries
```typescript
const [result1, result2, result3] = await Promise.all([
  prisma.table1.findMany(),
  prisma.table2.count(),
  prisma.table3.aggregate({}),
]);
```

### Pattern: Fire-and-Forget (Audit Logging)
```typescript
createAuditLog({...}).catch(err => console.error('Error:', err));
```

### Pattern: Error Handling
```typescript
try {
  // handler logic
} catch (error: any) {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
```

---

**These examples are ready to copy and adapt for other endpoints.**


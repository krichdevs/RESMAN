# Vercel Serverless Conversion Guide
## Express Routes to Vercel API Functions

### Overview

This guide provides a complete conversion plan for migrating 8 Express router files (containing 58+ endpoints) to Vercel serverless functions. The conversion maintains the same API contract while adapting to serverless architecture constraints.

---

## Conversion Architecture

### Key Differences

| Aspect | Express (Backend) | Vercel Serverless (api/) |
|--------|------|----------|
| **Request/Response** | `Express.Request/Response` | `VercelRequest/VercelResponse` |
| **Database** | `new PrismaClient()` per request | Singleton `prisma` from `lib/db.ts` |
| **Authentication** | Express middleware | Direct function call at handler start |
| **Validation** | Middleware chain | Inline validation at function start |
| **File Structure** | Single router file → Multiple endpoints | One file per endpoint |
| **Routing** | `router.get/post/put/delete` | Determined by file path |
| **Error Handling** | Express error handler middleware | Direct response returns |

---

## File Structure Mapping

### Current Structure
```
backend/src/routes/
├── rooms.ts        (626 lines, 8 endpoints)
├── bookings.ts     (621 lines, 8 endpoints)
├── auth.ts         (469 lines, 8 endpoints)
├── admin.ts        (815 lines, 9 endpoints)
├── timeslots.ts    (449 lines, 7 endpoints)
├── database.ts     (295 lines, 5 endpoints)
├── audit.ts        (319 lines, 7 endpoints)
└── departments.ts  (~20 lines, 1 endpoint)
```

### New Structure (Vercel)
```
api/
├── rooms/
│   ├── index.ts              # GET /api/rooms (list with pagination)
│   ├── buildings.ts          # GET /api/rooms/buildings
│   ├── equipment.ts          # GET /api/rooms/equipment
│   ├── occupancy.ts          # GET /api/rooms/occupancy
│   ├── [id].ts               # GET /api/rooms/[id]
│   ├── post.ts               # POST /api/rooms
│   ├── [id]/put.ts           # PUT /api/rooms/[id]
│   └── [id]/delete.ts        # DELETE /api/rooms/[id]
│
├── bookings/
│   ├── index.ts              # GET /api/bookings
│   ├── check-availability.ts # GET /api/bookings/check-availability
│   ├── [id].ts               # GET /api/bookings/[id]
│   ├── post.ts               # POST /api/bookings
│   ├── [id]/put.ts           # PUT /api/bookings/[id]
│   ├── [id]/delete.ts        # DELETE /api/bookings/[id]
│   ├── [id]/cancel.ts        # PUT /api/bookings/[id]/cancel
│   └── stats.ts              # GET /api/bookings/stats
│
├── auth/
│   ├── register.ts           # POST /api/auth/register
│   ├── login.ts              # POST /api/auth/login
│   ├── refresh.ts            # POST /api/auth/refresh
│   ├── logout.ts             # POST /api/auth/logout
│   ├── me.ts                 # GET /api/auth/me
│   ├── profile/put.ts        # PUT /api/auth/profile
│   └── password/put.ts       # PUT /api/auth/password
│
├── admin/
│   ├── dashboard/
│   │   └── stats.ts          # GET /api/admin/dashboard/stats
│   ├── users/
│   │   ├── index.ts          # GET /api/admin/users
│   │   ├── post.ts           # POST /api/admin/users
│   │   ├── [id]/put.ts       # PUT /api/admin/users/[id]
│   │   ├── [id]/delete.ts    # DELETE /api/admin/users/[id]
│   │   └── export.ts         # GET /api/admin/users/export
│   ├── rooms/
│   │   ├── index.ts          # GET /api/admin/rooms
│   │   ├── [id]/put.ts       # PUT /api/admin/rooms/[id]
│   │   └── [id]/delete.ts    # DELETE /api/admin/rooms/[id]
│   ├── analytics/
│   │   ├── bookings.ts       # GET /api/admin/analytics/bookings
│   │   ├── users.ts          # GET /api/admin/analytics/users
│   │   └── rooms.ts          # GET /api/admin/analytics/rooms
│   └── database/ (already exists)
│       └── stats.ts          # GET /api/admin/database/stats
│
├── timeslots/
│   ├── index.ts              # GET /api/timeslots
│   ├── [id].ts               # GET /api/timeslots/[id]
│   ├── room/[id].ts          # GET /api/timeslots/room/[id]
│   ├── post.ts               # POST /api/timeslots
│   ├── bulk-create.ts        # POST /api/timeslots/bulk-create
│   ├── [id]/put.ts           # PUT /api/timeslots/[id]
│   └── [id]/delete.ts        # DELETE /api/timeslots/[id]
│
├── audit/
│   ├── index.ts              # GET /api/audit
│   ├── actions.ts            # GET /api/audit/actions
│   ├── users.ts              # GET /api/audit/users
│   ├── entities.ts           # GET /api/audit/entities
│   ├── [id].ts               # GET /api/audit/[id]
│   ├── export.ts             # GET /api/audit/export
│   └── clear.ts              # POST /api/audit/clear
│
└── departments/
    └── index.ts              # GET /api/departments
```

---

## Endpoint Mapping Summary

### Rooms (8 endpoints)
```
GET    /api/rooms                   → rooms/index.ts
GET    /api/rooms/buildings         → rooms/buildings.ts
GET    /api/rooms/equipment         → rooms/equipment.ts
GET    /api/rooms/occupancy         → rooms/occupancy.ts
GET    /api/rooms/:id               → rooms/[id].ts
POST   /api/rooms                   → rooms/post.ts
PUT    /api/rooms/:id               → rooms/[id]/put.ts
DELETE /api/rooms/:id               → rooms/[id]/delete.ts
```

### Bookings (8 endpoints)
```
GET    /api/bookings                → bookings/index.ts
GET    /api/bookings/check-availability → bookings/check-availability.ts
GET    /api/bookings/:id            → bookings/[id].ts
POST   /api/bookings                → bookings/post.ts
PUT    /api/bookings/:id            → bookings/[id]/put.ts
PUT    /api/bookings/:id/cancel     → bookings/[id]/cancel.ts
DELETE /api/bookings/:id            → bookings/[id]/delete.ts
GET    /api/bookings/stats          → bookings/stats.ts
```

### Auth (8 endpoints)
```
POST   /api/auth/register           → auth/register.ts
POST   /api/auth/login              → auth/login.ts
POST   /api/auth/refresh            → auth/refresh.ts
POST   /api/auth/logout             → auth/logout.ts
GET    /api/auth/me                 → auth/me.ts
PUT    /api/auth/profile            → auth/profile/put.ts
PUT    /api/auth/password           → auth/password/put.ts
POST   /api/auth/check-email        → auth/check-email.ts
```

### Admin (9 endpoints)
```
GET    /api/admin/dashboard/stats   → admin/dashboard/stats.ts
GET    /api/admin/users             → admin/users/index.ts
POST   /api/admin/users             → admin/users/post.ts
PUT    /api/admin/users/:id         → admin/users/[id]/put.ts
DELETE /api/admin/users/:id         → admin/users/[id]/delete.ts
GET    /api/admin/users/export      → admin/users/export.ts
GET    /api/admin/analytics/bookings → admin/analytics/bookings.ts
GET    /api/admin/analytics/users   → admin/analytics/users.ts
GET    /api/admin/analytics/rooms   → admin/analytics/rooms.ts
```

### TimeSots (7 endpoints)
```
GET    /api/timeslots               → timeslots/index.ts
GET    /api/timeslots/:id           → timeslots/[id].ts
GET    /api/timeslots/room/:id      → timeslots/room/[id].ts
POST   /api/timeslots               → timeslots/post.ts
POST   /api/timeslots/bulk-create   → timeslots/bulk-create.ts
PUT    /api/timeslots/:id           → timeslots/[id]/put.ts
DELETE /api/timeslots/:id           → timeslots/[id]/delete.ts
```

### Database (5 endpoints)
```
GET    /api/admin/database/stats    → admin/database/stats.ts (already exists)
GET    /api/admin/database/export   → admin/database/export.ts
POST   /api/admin/database/seed     → admin/database/seed.ts
POST   /api/admin/database/clear    → admin/database/clear.ts
GET    /api/admin/database/backup   → admin/database/backup.ts
```

### Audit (7 endpoints)
```
GET    /api/audit                   → audit/index.ts
GET    /api/audit/actions           → audit/actions.ts
GET    /api/audit/users             → audit/users.ts
GET    /api/audit/entities          → audit/entities.ts
GET    /api/audit/:id               → audit/[id].ts
GET    /api/audit/export            → audit/export.ts
POST   /api/audit/clear             → audit/clear.ts
```

### Departments (1 endpoint)
```
GET    /api/departments             → departments/index.ts
```

---

## Conversion Patterns

### Pattern 1: Simple GET List (with pagination)
**Express Version:**
```typescript
router.get('/', 
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const [items, total] = await Promise.all([
      prisma.item.findMany({ skip, take: Number(limit) }),
      prisma.item.count(),
    ]);
    
    res.json({
      success: true,
      data: items,
      pagination: { page: Number(page), limit: Number(limit), total }
    });
  })
);
```

**Vercel Serverless Version (api/items/index.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      prisma.item.findMany({ skip, take: limitNum }),
      prisma.item.count(),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch items', error: error.message });
  }
};
```

### Pattern 2: Authenticated GET with Authorization Check
**Express Version:**
```typescript
router.get('/', 
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // Non-admin users can only see their own data
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    // ... fetch and return data
  })
);
```

**Vercel Serverless Version:**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate } from '../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const authResult = await authenticate(req, res);
    if (!authResult) return; // authenticate() sends response on failure
    
    const user = (req as any).user;

    // Authorization check
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // ... fetch and return data
    res.status(200).json({ success: true, data: results });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
```

### Pattern 3: POST with Body Validation
**Express Version:**
```typescript
router.post('/',
  authenticate,
  isAdmin,
  validateBody(createSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description } = req.body;
    
    const item = await prisma.item.create({
      data: { name, description }
    });
    
    res.status(201).json({ success: true, data: item });
  })
);
```

**Vercel Serverless Version (api/items/post.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate } from '../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate
    const authResult = await authenticate(req, res);
    if (!authResult) return;

    const user = (req as any).user;
    const { name, description } = req.body;

    // Validation
    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const item = await prisma.item.create({
      data: { name, description, createdBy: user.id }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, message: 'Failed to create item' });
  }
};
```

### Pattern 4: Dynamic Route with ID Parameter
**Express Version:**
```typescript
router.get('/:id',
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    
    res.json({ success: true, data: item });
  })
);
```

**Vercel Serverless Version (api/items/[id].ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query as { id?: string };

    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing ID parameter' });
    }

    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
};
```

### Pattern 5: PUT with ID for Updates
**Express Version:**
```typescript
router.put('/:id',
  authenticate,
  validateParams(uuidParamSchema),
  validateBody(updateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    
    const updated = await prisma.item.update({
      where: { id },
      data: { name, description }
    });
    
    res.json({ success: true, data: updated });
  })
);
```

**Vercel Serverless Version (api/items/[id]/put.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../lib/db';
import { authenticate } from '../../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authResult = await authenticate(req, res);
    if (!authResult) return;

    const { id } = req.query as { id?: string };
    const { name, description } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing ID parameter' });
    }

    // Validation
    if (!name && !description) {
      return res.status(400).json({ success: false, message: 'No update fields provided' });
    }

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: { 
        ...(name && { name }),
        ...(description && { description })
      }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};
```

### Pattern 6: DELETE Route
**Express Version:**
```typescript
router.delete('/:id',
  authenticate,
  isAdmin,
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    
    await prisma.item.delete({ where: { id } });
    
    res.json({ success: true, message: 'Deleted successfully' });
  })
);
```

**Vercel Serverless Version (api/items/[id]/delete.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../lib/db';
import { authenticate } from '../../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authResult = await authenticate(req, res);
    if (!authResult) return;

    const user = (req as any).user;
    
    // Authorization
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.query as { id?: string };

    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing ID parameter' });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await prisma.item.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};
```

---

## Detailed Example Conversions

### Example 1: GET /api/rooms/occupancy (Complex Query)

**Express Original (from rooms.ts lines 127-178):**
```typescript
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
```

**Vercel Serverless Version (api/rooms/occupancy.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { date } = req.query as { date?: string };

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      });
    }

    const queryDateStr = date;
    const dayOfWeek = new Date(queryDateStr).getDay();

    // Fetch all active rooms
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { name: 'asc' },
    });

    // Fetch occupancy metrics for each room in parallel
    const results = await Promise.all(
      rooms.map(async (room) => {
        const [totalSlots, bookedSlots] = await Promise.all([
          prisma.timeSlot.count({
            where: { roomId: room.id, dayOfWeek, isActive: true },
          }),
          prisma.booking.count({
            where: {
              roomId: room.id,
              date: queryDateStr,
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          }),
        ]);

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

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error fetching room occupancy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room occupancy',
      error: error.message,
    });
  }
};
```

### Example 2: POST /api/bookings (Complex Business Logic)

**Express Original (from bookings.ts lines 230-343):**
```typescript
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
```

**Vercel Serverless Version (api/bookings/post.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate } from '../../lib/auth';
import { findConflictingBookings, isValidTimeRange } from '../../lib/overlap-check';
import { createAuditLog } from '../../lib/audit-logger';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const authResult = await authenticate(req, res);
    if (!authResult) return;

    const user = (req as any).user;
    const { roomId, title, description, date, startTime, endTime, isRecurring, notes } = req.body;

    // Validation: Required fields
    if (!roomId || !title || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: roomId, title, date, startTime, endTime',
      });
    }

    // Validation: Time range
    if (!isValidTimeRange(startTime, endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // Check room exists and is active
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or inactive',
      });
    }

    // Check for conflicting bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        date,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    const conflicts = findConflictingBookings(
      { roomId, date, startTime, endTime },
      existingBookings.map((b) => ({
        roomId: b.roomId,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
      }))
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing booking',
        conflicts,
      });
    }

    // Determine status based on user role
    const initialStatus = user.role === 'STUDENT' ? 'PENDING' : 'CONFIRMED';

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId: user.id,
        title,
        description: description || null,
        date,
        startTime,
        endTime,
        isRecurring: isRecurring || false,
        notes: notes || null,
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
          },
        },
      },
    });

    // Create audit log (non-blocking)
    createAuditLog({
      userId: user.id,
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking.id,
      newValues: { roomId, title, date, startTime, endTime },
      ipAddress: req.socket?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    }).catch((err) => console.error('Error creating audit log:', err));

    // Note: Real-time notifications (sendBookingNotification, emitBookingUpdate) 
    // should be migrated to a separate serverless function or external service
    // to avoid extending cold start times

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};
```

### Example 3: GET /api/admin/dashboard/stats (Advanced Analytics)

**Vercel Serverless Version (api/admin/dashboard/stats.ts):**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../lib/db';
import { authenticate } from '../../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate and check admin role
    const authResult = await authenticate(req, res);
    if (!authResult) return;

    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];

    // Fetch all stats in parallel
    const [
      userCount,
      roomCount,
      bookingCount,
      timeSlotCount,
      activeBookings,
      usersByRole,
      activeUsers,
      totalRooms,
      roomsWithBookingsToday,
      recentBookings,
      bookingsThisMonth,
      bookingsLastMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.booking.count(),
      prisma.timeSlot.count(),
      prisma.booking.count({
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.count({
        where: {
          lastLogin: { gte: thirtyDaysAgo },
          isActive: true,
        },
      }),
      prisma.room.count({ where: { isActive: true } }),
      prisma.booking.findMany({
        where: {
          date: today,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
        select: { roomId: true },
        distinct: ['roomId'],
      }),
      prisma.booking.findMany({
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
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
    ]);

    // Calculate derived metrics
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

    res.status(200).json({
      success: true,
      data: {
        totalBookings: bookingCount,
        activeUsers,
        totalUsers: userCount,
        roomUtilization: Math.round(roomUtilization),
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        bookingsThisMonth,
        bookingsLastMonth,
        totalRooms,
        activeBookings,
        usersByRole: usersByRoleMap,
        recentBookings,
        summary: {
          totalCount: {
            users: userCount,
            rooms: roomCount,
            bookings: bookingCount,
            timeSlots: timeSlotCount,
          },
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};
```

---

## Implementation Checklist

### Step 1: Prepare Supporting Libraries
- [ ] Review and update [api/lib/db.ts](api/lib/db.ts) - Singleton Prisma client (already exists)
- [ ] Review and update [api/lib/auth.ts](api/lib/auth.ts) - Authentication helpers (already exists, needs enhancement)
- [ ] Create [api/lib/overlap-check.ts](api/lib/overlap-check.ts) - Conflict detection utilities
- [ ] Create [api/lib/audit-logger.ts](api/lib/audit-logger.ts) - Audit logging utilities
- [ ] Create [api/lib/validators.ts](api/lib/validators.ts) - Zod/Joi schemas (extracted from backend)

### Step 2: Create Directory Structure
```bash
# Rooms
mkdir -p api/rooms/{[id]}

# Bookings
mkdir -p api/bookings/{[id]}

# Auth
mkdir -p api/auth/{profile,password}

# Admin
mkdir -p api/admin/{dashboard,users,rooms,analytics,database}
mkdir -p api/admin/users/{[id]}
mkdir -p api/admin/rooms/{[id]}

# TimeSots
mkdir -p api/timeslots/{room,bulk-create,[id]}

# Audit
mkdir -p api/audit/{[id]}

# Departments
mkdir -p api/departments
```

### Step 3: Convert Simple Endpoints First
Priority Order (easiest to hardest):
1. `GET /api/departments` - 1 endpoint, no auth
2. `GET /api/audit/actions` - Simple list, admin-only
3. `GET /api/timeslots` - List with filters
4. `GET /api/rooms/buildings` - Distinct select
5. `GET /api/rooms/equipment` - Array operations
6. `GET /api/bookings/stats` - Aggregations
7. `GET /api/admin/dashboard/stats` - Complex analytics
8. `POST /api/bookings` - Complex business logic

### Step 4: Update Frontend API Calls
- [ ] Verify frontend calls match new API structure
- [ ] Test authentication flow with new serverless functions
- [ ] Verify error responses match expected format

### Step 5: Testing Strategy
- [ ] Unit tests for each endpoint
- [ ] Integration tests with database
- [ ] Load testing for serverless cold starts
- [ ] Test authentication and authorization flows

### Step 6: Deployment
- [ ] Update `vercel.json` with proper configuration
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production

---

## Important Implementation Notes

### 1. Authentication Pattern
The authentication flow has changed from middleware to direct function calls:

**Before (Express Middleware):**
```typescript
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const user = req.user; // Already attached by middleware
}));
```

**After (Vercel Serverless):**
```typescript
export default async (req: VercelRequest, res: VercelResponse) => {
  const authResult = await authenticate(req, res);
  if (!authResult) return; // Response already sent on failure
  const user = (req as any).user; // Attached by authenticate function
}
```

### 2. Query Parameter Type Coercion
Vercel passes query parameters as strings. Always coerce to proper types:

```typescript
// ❌ WRONG
const { page } = req.query; // typeof page === 'string'
const skip = (page - 1) * limit; // NaN!

// ✅ CORRECT
const { page = '1' } = req.query as { page?: string };
const pageNum = Number(page) || 1;
const skip = (pageNum - 1) * limit;
```

### 3. Prisma Singleton Pattern
Database connections must be reused across invocations:

```typescript
// ❌ WRONG - Creates new connection per request
const prisma = new PrismaClient();

// ✅ CORRECT - Uses singleton
import prisma from '../../lib/db';
```

### 4. Request Body Handling
Always validate request body format:

```typescript
// For POST/PUT requests
const { name, email } = req.body;

// Validate early
if (!name || !email) {
  return res.status(400).json({ success: false, message: 'Missing fields' });
}
```

### 5. Error Handling
Avoid asyncHandler wrapper. Use try-catch directly:

```typescript
// ✅ CORRECT for Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // handler logic
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};
```

### 6. Real-time Features (WebSockets, Notifications)
These require special handling in serverless:

- **Notifications**: Use serverless function to store to database, then trigger separate process
- **WebSockets**: Not directly supported in Vercel Functions. Use services like:
  - Ably (https://ably.com)
  - Pusher (https://pusher.com)
  - Socket.io with external service

### 7. File Operations
File operations (reading/writing logs) don't persist in Vercel. Use:
- Cloud storage (AWS S3, Google Cloud Storage)
- Database (store logs in Prisma)
- Logging service (LogRocket, Datadog)

### 8. Cold Start Optimization
Serverless functions have cold start delays. Optimize by:
- Minimizing import statements at top level
- Using singleton patterns for database connections
- Lazy-loading heavy dependencies
- Caching frequently used data

---

## File References

### Libraries to Create/Update
- **Already Exists:**
  - [api/lib/db.ts](api/lib/db.ts)
  - [api/lib/auth.ts](api/lib/auth.ts)

- **Need to Create:**
  - `api/lib/overlap-check.ts` - Conflict detection functions
  - `api/lib/audit-logger.ts` - Audit logging
  - `api/lib/validators.ts` - Validation schemas
  - `api/lib/utils.ts` - Common utilities

### Routes to Migrate
Refer to these Express source files for business logic:
- [backend/src/routes/rooms.ts](../../backend/src/routes/rooms.ts) (626 lines)
- [backend/src/routes/bookings.ts](../../backend/src/routes/bookings.ts) (621 lines)
- [backend/src/routes/auth.ts](../../backend/src/routes/auth.ts) (469 lines)
- [backend/src/routes/admin.ts](../../backend/src/routes/admin.ts) (815 lines)
- [backend/src/routes/timeslots.ts](../../backend/src/routes/timeslots.ts) (449 lines)
- [backend/src/routes/database.ts](../../backend/src/routes/database.ts) (295 lines)
- [backend/src/routes/audit.ts](../../backend/src/routes/audit.ts) (319 lines)
- [backend/src/routes/departments.ts](../../backend/src/routes/departments.ts) (~20 lines)

---

## Next Steps

1. **Review this guide** with the team to ensure understanding of conversion patterns
2. **Create supporting libraries** (overlap-check, audit-logger, validators)
3. **Start with simple endpoints** (departments, audit/actions, etc.)
4. **Move to complex endpoints** (bookings POST, admin dashboard)
5. **Test thoroughly** before deploying to production
6. **Monitor cold start times** and optimize as needed

---

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"
- Ensure `@prisma/client` is installed: `npm install @prisma/client`
- Verify `lib/db.ts` exports the singleton correctly

### Issue: "Undefined query parameters"
- Always cast to string: `const { id } = req.query as { id?: string }`
- Check for undefined before using: `if (!id) return res.status(400).json(...)`

### Issue: "Token verification fails"
- Verify JWT_SECRET environment variable is set in Vercel dashboard
- Check token format: should be `Bearer <token>` in Authorization header

### Issue: "Cold start timeouts"
- Reduce number of imported dependencies
- Lazy-load expensive modules
- Use `connection pooling` for Prisma
- Consider using Prisma Data Proxy for better serverless compatibility

### Issue: "Prisma connection limit errors"
- Set `connection_limit` in DATABASE_URL
- Use Prisma's automatic connection pooling feature
- Consider upgrading to Prisma Data Proxy

---

**Version:** 1.0  
**Last Updated:** January 13, 2026  
**Author:** Code Conversion Expert

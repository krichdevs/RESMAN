# Vercel Serverless Conversion - Quick Start Guide

**Start here if you want to begin implementation immediately.**

---

## Step 1: Understand the Conversion (30 minutes)

### Read These Files in Order:
1. This file (5 min) - Quick start overview
2. [VERCEL_SERVERLESS_SUMMARY.md](VERCEL_SERVERLESS_SUMMARY.md) (5 min) - Executive summary
3. [VERCEL_SERVERLESS_QUICK_REFERENCE.md](VERCEL_SERVERLESS_QUICK_REFERENCE.md) (10 min) - File structure and mapping
4. [VERCEL_SERVERLESS_IMPLEMENTATION_EXAMPLES.md](VERCEL_SERVERLESS_IMPLEMENTATION_EXAMPLES.md) (10 min) - Concrete examples

### Key Concepts to Understand:
- **File-based routing:** Folder structure becomes URL paths
- **Method in filename:** `post.ts` = POST, `[id].ts` = GET, `[id]/put.ts` = PUT
- **Authentication:** No middleware, call `authenticate()` function directly
- **Query parameters:** Always strings - must coerce to proper types

---

## Step 2: Set Up Environment (15 minutes)

### Verify Existing Files
```bash
# Check if library files exist
ls -la api/lib/
# Should show: db.ts, auth.ts

# Check if you have one example admin endpoint
ls -la api/admin/
# Might show: database/stats.ts
```

### Library Files Already Created ✅
```
api/lib/
├── db.ts                    (existing - Prisma singleton)
├── auth.ts                  (existing - JWT authentication)
├── overlap-check.ts         (NEW - conflict detection)
├── audit-logger.ts          (NEW - audit logging)
└── validators.ts            (NEW - input validation)
```

These are **ready to use** - no additional setup needed.

---

## Step 3: Choose Your First Endpoint (5 minutes)

### Option A: Super Easy (Start Here)
Pick ONE of these to implement first:
- **GET /api/departments** (~40 lines)
  - No authentication
  - Single table query
  - No complex logic
  - Perfect for learning the pattern

### Option B: Still Easy
- **GET /api/rooms/buildings** (~50 lines)
  - No authentication
  - Distinct select query
  - No complex logic

### Option C: With Filters
- **GET /api/rooms** (~100 lines)
  - No authentication
  - Pagination + filtering
  - More realistic complexity

### Option D: With Authentication
- **GET /api/timeslots** (~100 lines)
  - No auth required
  - Filtering and grouping
  - Realistic data processing

---

## Step 4: Implement Your First Endpoint (30 minutes)

### Example: Implement GET /api/departments

**Step 4a: Create the directory**
```bash
mkdir -p api/departments
```

**Step 4b: Copy the template below**
```typescript
// File: api/departments/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Fetch all departments
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
    });
  }
};
```

**Step 4c: Create the file**
```bash
# Copy the code above into: api/departments/index.ts
```

**Step 4d: Test it locally**
```bash
# Terminal 1: Start Vercel development server
npm run dev

# Terminal 2: Test the endpoint
curl http://localhost:3000/api/departments
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "name": "Computer Science" },
    { "id": "uuid-2", "name": "Engineering" }
  ]
}
```

---

## Step 5: Implement a POST Endpoint (45 minutes)

### Choose: POST /api/bookings or POST /api/rooms

**For POST /api/bookings (more complex):**
- Follow the complete example in VERCEL_SERVERLESS_IMPLEMENTATION_EXAMPLES.md
- Includes: authentication, validation, conflict detection, audit logging
- ~200 lines but fully explained

**For simpler POST, create POST /api/timeslots:**

```typescript
// File: api/timeslots/post.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate } from '../../lib/auth';
import { validateTimeSlotData } from '../../lib/validators';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate
    const authResult = await authenticate(req, res);
    if (!authResult) return; // Response already sent

    const user = (req as any).user;

    // Check admin role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Validate input
    const { roomId, dayOfWeek, startTime, endTime } = req.body;
    const validation = validateTimeSlotData({ roomId, dayOfWeek, startTime, endTime });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Create time slot
    const slot = await prisma.timeSlot.create({
      data: {
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Time slot created',
      data: slot,
    });
  } catch (error: any) {
    console.error('Error creating time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time slot',
    });
  }
};
```

---

## Step 6: Scale to All Endpoints (Following Days)

### Day 1 Complete These (2-3 hours)
- [x] GET /api/departments
- [ ] GET /api/rooms/buildings
- [ ] GET /api/rooms/equipment
- [ ] GET /api/timeslots
- [ ] GET /api/audit/actions

### Day 2 Complete These (3-4 hours)
- [ ] GET /api/rooms (with pagination)
- [ ] GET /api/bookings (with pagination)
- [ ] GET /api/admin/users (with pagination)
- [ ] GET /api/audit (with pagination)

### Day 3 Complete These (4-5 hours)
- [ ] POST /api/rooms (admin)
- [ ] POST /api/timeslots (admin)
- [ ] All GET [id] endpoints
- [ ] Start PUT endpoints

### Days 4-5 Complex Logic (6-8 hours)
- [ ] POST /api/bookings (most complex - 200 lines)
- [ ] PUT /api/bookings/[id] (update with validation)
- [ ] GET /api/admin/dashboard/stats (analytics)
- [ ] All DELETE endpoints

### Days 6-7 Remaining & Testing (4-6 hours)
- [ ] Remaining auth endpoints
- [ ] All admin analytics endpoints
- [ ] Database operations
- [ ] Full testing suite

---

## Conversion Template (Copy & Adapt)

### For GET Endpoints
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/db';
import { authenticate } from '../../lib/auth';  // Only if needed

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Optional: Authenticate if needed
    // const authResult = await authenticate(req, res);
    // if (!authResult) return;

    // Extract and validate query params
    const { param1, param2 } = req.query;

    // Build database query
    // Fetch data
    const data = await prisma.table.findMany({
      // Your query here
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};
```

### For POST Endpoints
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

    // Validate body
    const { field1, field2 } = req.body;
    if (!field1 || !field2) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Create record
    const record = await prisma.table.create({
      data: { field1, field2 },
    });

    res.status(201).json({
      success: true,
      message: 'Created successfully',
      data: record,
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};
```

### For PUT [id] Endpoints
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../lib/db';
import { authenticate } from '../../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate
    const authResult = await authenticate(req, res);
    if (!authResult) return;

    // Get ID from query
    const { id } = req.query as { id?: string };
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID required' });
    }

    // Get body
    const { field1, field2 } = req.body;

    // Check exists
    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Update
    const updated = await prisma.table.update({
      where: { id },
      data: { 
        ...(field1 !== undefined && { field1 }),
        ...(field2 !== undefined && { field2 }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};
```

### For DELETE [id] Endpoints
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../lib/db';
import { authenticate } from '../../../lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authenticate
    const authResult = await authenticate(req, res);
    if (!authResult) return;
    const user = (req as any).user;

    // Check admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin required' });
    }

    // Get ID
    const { id } = req.query as { id?: string };
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID required' });
    }

    // Check exists
    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Delete
    await prisma.table.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Deleted successfully',
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};
```

---

## Common Issues & Fixes

### Issue: "Cannot find module '@vercel/node'"
**Fix:** Install dependencies:
```bash
npm install @vercel/node
```

### Issue: "Prisma client connection timeout"
**Fix:** Ensure DATABASE_URL is set:
```bash
vercel env pull .env.local
```

### Issue: "JWT token verification fails"
**Fix:** Check JWT_SECRET environment variable:
```bash
vercel env list
# Should show JWT_SECRET
```

### Issue: "Query parameters are undefined"
**Fix:** Cast to string:
```typescript
const { id } = req.query as { id?: string };
if (!id) return res.status(400).json({...});
```

### Issue: "401 Unauthorized on protected endpoints"
**Fix:** Ensure Authorization header:
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Testing Your Endpoints

### Quick Test Script
```bash
#!/bin/bash

# Get JWT token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.data.token')

# Test public endpoint
echo "Testing GET /api/departments..."
curl http://localhost:3000/api/departments

# Test protected endpoint
echo "Testing GET /api/admin/users..."
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Test POST
echo "Testing POST /api/rooms..."
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Room 101","capacity":30,"building":"Building A","floor":1}'
```

---

## Checklist for Each Endpoint

- [ ] Created file in correct location
- [ ] Checked HTTP method (405 if wrong)
- [ ] Added authentication if required
- [ ] Validated input parameters
- [ ] Checked authorization (403 if needed)
- [ ] Made database query
- [ ] Handled errors with try-catch
- [ ] Returned correct status code (200, 201, 400, 403, 404, 500)
- [ ] Tested with curl/Postman
- [ ] Verified response format matches Express version

---

## Reference Files

### Implementation Examples
📖 [VERCEL_SERVERLESS_IMPLEMENTATION_EXAMPLES.md](VERCEL_SERVERLESS_IMPLEMENTATION_EXAMPLES.md)
- Complete GET /api/rooms example (~100 lines)
- Complete POST /api/bookings example (~200 lines)
- Complete GET /api/admin/dashboard/stats example (~180 lines)

### Full Conversion Guide
📖 [VERCEL_SERVERLESS_CONVERSION_GUIDE.md](VERCEL_SERVERLESS_CONVERSION_GUIDE.md)
- 6 conversion patterns
- All 53+ endpoint mappings
- Detailed troubleshooting

### Quick Reference
📖 [VERCEL_SERVERLESS_QUICK_REFERENCE.md](VERCEL_SERVERLESS_QUICK_REFERENCE.md)
- Complete file structure
- Implementation order
- 8-phase timeline

### Source Express Files
- [backend/src/routes/rooms.ts](../../backend/src/routes/rooms.ts) - Reference for business logic
- [backend/src/routes/bookings.ts](../../backend/src/routes/bookings.ts) - Reference for business logic
- [backend/src/routes/auth.ts](../../backend/src/routes/auth.ts) - Reference for business logic
- (And 5 more route files)

---

## Success Criteria

You'll know you're doing this right when:

✅ Simple endpoints (departments, buildings) work immediately  
✅ Authentication flow works (get token, use token, fail without token)  
✅ Pagination works (page=1&limit=10 returns 10 items)  
✅ Filters work (building=A returns only building A rooms)  
✅ Conflicts detected (overlapping bookings rejected)  
✅ Admin checks work (non-admin gets 403)  
✅ 404 returned when item not found  
✅ 400 returned for invalid input  
✅ Audit logs created on mutations  

---

## Timeline

**If you follow this guide:**
- First endpoint: 30 minutes (departments)
- First 5 endpoints: 2-3 hours
- First 15 endpoints: 6-8 hours  
- First 30 endpoints: 12-16 hours
- All 66 files: 25-30 hours (3-4 days of full-time work)

**With a team of 2:**
- Complete conversion: 2-3 weeks
- Testing & deployment: 1 week
- **Total: 3-4 weeks to production**

---

## Next Steps

1. ✅ **Right now:** Read VERCEL_SERVERLESS_SUMMARY.md (5 min)
2. ✅ **Next:** Create api/departments/index.ts (5 min)
3. ✅ **Test it:** Run locally with `npm run dev` (5 min)
4. ✅ **Next:** Create 4 more simple endpoints (2 hours)
5. ✅ **Then:** Create all pagination endpoints (4 hours)
6. ✅ **Complex logic:** POST/PUT endpoints (8 hours)
7. ✅ **Final:** Testing and optimization (4 hours)

---

**Start now. Pick departments. Implement it. Test it. You've got this! 💪**

Questions? Refer to:
- Example code: VERCEL_SERVERLESS_IMPLEMENTATION_EXAMPLES.md
- Quick patterns: This file (scroll up)
- Complex issues: VERCEL_SERVERLESS_CONVERSION_GUIDE.md


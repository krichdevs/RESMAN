# Vercel Serverless Conversion - Quick Reference

## Complete File Structure to Create

```
api/
├── lib/
│   ├── db.ts                          ✓ (already exists)
│   ├── auth.ts                        ✓ (already exists, needs enhancement)
│   ├── overlap-check.ts               (NEW)
│   ├── audit-logger.ts                (NEW)
│   └── validators.ts                  (NEW)
│
├── rooms/
│   ├── index.ts                       GET /api/rooms
│   ├── post.ts                        POST /api/rooms
│   ├── buildings.ts                   GET /api/rooms/buildings
│   ├── equipment.ts                   GET /api/rooms/equipment
│   ├── occupancy.ts                   GET /api/rooms/occupancy
│   ├── [id].ts                        GET /api/rooms/[id]
│   └── [id]/
│       ├── put.ts                     PUT /api/rooms/[id]
│       └── delete.ts                  DELETE /api/rooms/[id]
│
├── bookings/
│   ├── index.ts                       GET /api/bookings
│   ├── post.ts                        POST /api/bookings
│   ├── stats.ts                       GET /api/bookings/stats
│   ├── check-availability.ts          GET /api/bookings/check-availability
│   ├── [id].ts                        GET /api/bookings/[id]
│   └── [id]/
│       ├── put.ts                     PUT /api/bookings/[id]
│       ├── cancel.ts                  PUT /api/bookings/[id]/cancel
│       └── delete.ts                  DELETE /api/bookings/[id]
│
├── auth/
│   ├── register.ts                    POST /api/auth/register
│   ├── login.ts                       POST /api/auth/login
│   ├── refresh.ts                     POST /api/auth/refresh
│   ├── logout.ts                      POST /api/auth/logout
│   ├── check-email.ts                 POST /api/auth/check-email
│   ├── me.ts                          GET /api/auth/me
│   ├── profile/
│   │   └── put.ts                     PUT /api/auth/profile
│   └── password/
│       └── put.ts                     PUT /api/auth/password
│
├── admin/
│   ├── dashboard/
│   │   └── stats.ts                   GET /api/admin/dashboard/stats
│   ├── users/
│   │   ├── index.ts                   GET /api/admin/users
│   │   ├── post.ts                    POST /api/admin/users
│   │   ├── export.ts                  GET /api/admin/users/export
│   │   └── [id]/
│   │       ├── put.ts                 PUT /api/admin/users/[id]
│   │       └── delete.ts              DELETE /api/admin/users/[id]
│   ├── rooms/
│   │   ├── index.ts                   GET /api/admin/rooms
│   │   └── [id]/
│   │       ├── put.ts                 PUT /api/admin/rooms/[id]
│   │       └── delete.ts              DELETE /api/admin/rooms/[id]
│   ├── analytics/
│   │   ├── bookings.ts                GET /api/admin/analytics/bookings
│   │   ├── users.ts                   GET /api/admin/analytics/users
│   │   └── rooms.ts                   GET /api/admin/analytics/rooms
│   └── database/
│       ├── stats.ts                   GET /api/admin/database/stats (already exists)
│       ├── export.ts                  GET /api/admin/database/export
│       ├── seed.ts                    POST /api/admin/database/seed
│       ├── clear.ts                   POST /api/admin/database/clear
│       └── backup.ts                  GET /api/admin/database/backup
│
├── timeslots/
│   ├── index.ts                       GET /api/timeslots
│   ├── post.ts                        POST /api/timeslots
│   ├── bulk-create.ts                 POST /api/timeslots/bulk-create
│   ├── [id].ts                        GET /api/timeslots/[id]
│   ├── room/
│   │   └── [id].ts                    GET /api/timeslots/room/[id]
│   └── [id]/
│       ├── put.ts                     PUT /api/timeslots/[id]
│       └── delete.ts                  DELETE /api/timeslots/[id]
│
├── audit/
│   ├── index.ts                       GET /api/audit
│   ├── actions.ts                     GET /api/audit/actions
│   ├── users.ts                       GET /api/audit/users
│   ├── entities.ts                    GET /api/audit/entities
│   ├── export.ts                      GET /api/audit/export
│   ├── clear.ts                       POST /api/audit/clear
│   └── [id].ts                        GET /api/audit/[id]
│
└── departments/
    └── index.ts                       GET /api/departments
```

## Total Files to Create: ~66 files

### Breakdown by Type:
- **Library files:** 3 (overlap-check, audit-logger, validators)
- **Rooms:** 8 files
- **Bookings:** 9 files
- **Auth:** 8 files
- **Admin:** 11 files (including database, analytics, users, rooms)
- **TimeSots:** 8 files
- **Audit:** 7 files
- **Departments:** 1 file

---

## Endpoint Conversion Mapping

### Authentication Required
These endpoints require `authenticate()` call at the start:
- All `/api/bookings/*` (except check-availability)
- All `/api/auth/me`, `/api/auth/profile`, `/api/auth/password`
- All `/api/admin/*`
- All `/api/audit/*` (also requires isAdmin check)

### Admin Only
These require both `authenticate()` and `isAdmin()` check:
- All `/api/admin/*`
- All `/api/audit/*`
- `DELETE /api/rooms/[id]`
- `PUT /api/rooms/[id]`

### Public Access
These have no authentication requirement:
- `GET /api/rooms`
- `GET /api/rooms/buildings`
- `GET /api/rooms/equipment`
- `GET /api/rooms/occupancy`
- `GET /api/rooms/[id]`
- `GET /api/bookings/check-availability`
- `GET /api/timeslots`
- `GET /api/timeslots/[id]`
- `GET /api/timeslots/room/[id]`
- `GET /api/departments`
- All `/api/auth/register`, `/api/auth/login`, etc.

---

## Implementation Order (Recommended)

### Phase 1: Foundation (Day 1)
1. Create supporting libraries:
   - `api/lib/overlap-check.ts`
   - `api/lib/audit-logger.ts`
   - `api/lib/validators.ts`
   - Update `api/lib/auth.ts` with enhanced validation

2. Test library functions independently

### Phase 2: Simple Endpoints (Day 1-2)
3. `api/departments/index.ts` - No auth, single endpoint
4. `api/rooms/buildings.ts` - No auth, simple distinct query
5. `api/rooms/equipment.ts` - No auth, array manipulation
6. `api/timeslots/index.ts` - No auth, filtering and includes
7. `api/audit/actions.ts` - Admin only, simple list

### Phase 3: List Endpoints with Pagination (Day 2-3)
8. `api/rooms/index.ts` - Pagination, filtering
9. `api/bookings/index.ts` - Pagination, auth, includes
10. `api/admin/users/index.ts` - Pagination, admin, filtering
11. `api/audit/index.ts` - Pagination, admin, date filtering

### Phase 4: CRUD Operations (Day 3-4)
12. `api/rooms/[id].ts` - GET by ID
13. `api/rooms/post.ts` - CREATE room (admin)
14. `api/rooms/[id]/put.ts` - UPDATE room (admin)
15. `api/rooms/[id]/delete.ts` - DELETE room (admin)
16. Similar for bookings, timeslots

### Phase 5: Complex Business Logic (Day 4-5)
17. `api/bookings/post.ts` - Complex validation, conflict checking
18. `api/bookings/[id]/put.ts` - Complex update logic
19. `api/admin/dashboard/stats.ts` - Multiple parallel queries
20. `api/bookings/check-availability.ts` - Complex availability logic

### Phase 6: Admin & Analytics (Day 5-6)
21. `api/admin/users/post.ts` - User creation with validation
22. `api/admin/analytics/*` - Analytics endpoints
23. `api/admin/database/*` - Database operations (seed, export, backup)
24. `api/audit/export.ts` - Data export

### Phase 7: Auth & Specialized (Day 6-7)
25. `api/auth/*` - All auth endpoints
26. `api/bookings/cancel.ts` - Special update operation
27. `api/timeslots/bulk-create.ts` - Bulk operations

### Phase 8: Testing & Optimization (Day 7-8)
28. Unit tests for all endpoints
29. Integration tests with database
30. Performance optimization
31. Cold start time optimization

---

## Key Technical Patterns

### Pattern: Route with Path Parameter
File: `api/items/[id].ts`
```
Express:    GET /api/items/:id
Vercel:     GET /api/items/[id].ts
Parameter:  const { id } = req.query as { id?: string }
```

### Pattern: Nested Route with Path Parameter
File: `api/items/[id]/details.ts`
```
Express:    GET /api/items/:id/details
Vercel:     GET /api/items/[id]/details.ts
Parameter:  const { id } = req.query as { id?: string }
```

### Pattern: Query String Parameters
File: `api/items/index.ts`
```
Express:    GET /api/items?page=1&limit=10
Vercel:     GET /api/items?page=1&limit=10
Parameters: const { page = '1', limit = '10' } = req.query as Record<string, string>
```

### Pattern: POST vs POST in File
- File: `api/items/index.ts` handles both GET and POST (check req.method)
- OR File: `api/items/post.ts` handles only POST (cleaner for Vercel)
  
**Recommendation:** Use separate files for clarity:
- `api/items/index.ts` → GET
- `api/items/post.ts` → POST

### Pattern: HTTP Method Routing
```typescript
export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  // ... handler
};
```

---

## Environment Variables Required

Create/verify in Vercel dashboard:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

---

## Deployment Configuration

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x",
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

---

## Testing Checklist

### Per Endpoint Test:
- [ ] Correct HTTP method
- [ ] Authentication (if required)
- [ ] Authorization (if required)
- [ ] Input validation
- [ ] Query parameter handling
- [ ] Body parameter handling
- [ ] Path parameter extraction
- [ ] Success response format
- [ ] Error response format
- [ ] Database interactions
- [ ] Audit logging (if applicable)

### Integration Tests:
- [ ] Multiple endpoints in sequence
- [ ] Authentication flow (login → create booking → logout)
- [ ] Conflict detection (booking overlap prevention)
- [ ] Pagination accuracy
- [ ] Filtering accuracy
- [ ] Concurrent requests

### Performance Tests:
- [ ] Cold start time < 10 seconds
- [ ] Warm execution < 1 second
- [ ] Database query optimization
- [ ] Large dataset handling (>10k records)

---

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Verify npm packages installed: `npm install` |
| Query parameters undefined | Cast to string: `req.query as Record<string, string>` |
| JWT verification fails | Check JWT_SECRET in Vercel dashboard env vars |
| Database connection timeouts | Enable connection pooling, check DATABASE_URL |
| Cold start > 10 seconds | Reduce imports, enable Prisma Data Proxy |
| Status code not 201 for POST | Explicitly set: `res.status(201).json(...)` |
| CORS errors | Add CORS headers or use Vercel CORS config |

---

## Files Reference

**Source Express Routes (to extract logic from):**
- backend/src/routes/rooms.ts
- backend/src/routes/bookings.ts
- backend/src/routes/auth.ts
- backend/src/routes/admin.ts
- backend/src/routes/timeslots.ts
- backend/src/routes/database.ts
- backend/src/routes/audit.ts
- backend/src/routes/departments.ts

**Supporting Code (to reference for business logic):**
- backend/src/middleware/auth.ts
- backend/src/middleware/validation.ts
- backend/src/utils/validators.ts
- backend/src/services/audit-logger.ts
- backend/src/utils/overlap-check.ts

---

## Key Differences Summary

| Aspect | Express | Vercel |
|--------|---------|--------|
| Request type | Express.Request | VercelRequest |
| Response type | Express.Response | VercelResponse |
| Router setup | Express Router | File-based routing |
| Middleware | Chain before handler | Call within handler |
| Query params | req.query (auto typed) | req.query (always string) |
| Body parsing | Auto with middleware | Auto |
| File imports | Single router | 66+ individual files |
| Deployment | Node.js server | Serverless function |
| Scaling | Manual | Automatic |
| Cold start | N/A | ~5-10 seconds |

---

**Last Updated:** January 13, 2026  
**Status:** Ready for Implementation

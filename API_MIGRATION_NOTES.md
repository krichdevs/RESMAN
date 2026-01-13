# Vercel Serverless API Migration Guide

## Structure

All backend endpoints are now serverless functions:

```
api/
├── auth/
│   ├── login.ts         → POST /api/auth/login
│   ├── register.ts      → POST /api/auth/register
│   └── me.ts           → GET /api/auth/me
├── rooms/
│   ├── index.ts        → GET /api/rooms
│   └── [id].ts         → GET /api/rooms/[id]
├── bookings/
│   ├── index.ts        → GET /api/bookings
│   └── create.ts       → POST /api/bookings
├── admin/
│   └── database/
│       ├── stats.ts    → GET /api/admin/database/stats
│       ├── export.ts   → GET /api/admin/database/export
│       └── cleanup.ts  → POST /api/admin/database/cleanup
└── lib/
    ├── db.ts          → Prisma singleton
    └── auth.ts        → Auth middleware
```

## Migration Notes

1. **Endpoint Pattern**: Each file in `api/` becomes a serverless function
2. **Route Format**: File paths map directly to URLs
   - `api/auth/login.ts` → `/api/auth/login`
   - `api/rooms/index.ts` → `/api/rooms`
   - `api/rooms/[id].ts` → `/api/rooms/:id`

3. **Database**: Changed from SQLite to PostgreSQL
   - Prisma schema updated
   - DATABASE_URL must point to PostgreSQL connection string

4. **Environment Variables**: Set in Vercel dashboard
   - DATABASE_URL
   - JWT_SECRET
   - FRONTEND_URL

## Testing Locally

```bash
# Install vercel CLI
npm install -g vercel

# Run locally
vercel dev

# Frontend will be at http://localhost:3000
# Backend at http://localhost:3000/api
```

## Deployment

```bash
# Push to GitHub
git add .
git commit -m "feat: convert backend to serverless for Vercel"
git push

# Deploy via Vercel dashboard or CLI
vercel --prod
```

## Important: Remaining Endpoints to Create

You still need to create serverless versions of:
- [ ] POST /api/auth/register
- [ ] GET /api/auth/me
- [ ] GET /api/rooms (list all)
- [ ] GET /api/rooms/[id]
- [ ] POST /api/bookings
- [ ] GET /api/bookings
- [ ] GET /api/admin/database/export
- [ ] POST /api/admin/database/cleanup
- [ ] And all other backend routes...

This is a template showing how to structure each endpoint!

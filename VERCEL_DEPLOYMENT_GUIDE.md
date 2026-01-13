# Vercel Deployment Guide for RESMAN

This guide outlines two deployment strategies for hosting the RESMAN application.

---

## Option A: Frontend Only to Vercel (RECOMMENDED - SIMPLER)

Deploy only the React frontend to Vercel, keep backend on separate platform.

### Pros
- ✅ **Simplest setup** - Just connect GitHub and deploy
- ✅ **Fast deployment** - Vercel optimizes for static React apps
- ✅ **Zero cost** - Free tier covers most projects
- ✅ **No code changes** - Works with current app as-is
- ✅ **Easy rollbacks** - Git-based deployments
- ✅ **Automatic preview URLs** - For each pull request
- ✅ **Database stays local** - SQLite continues working

### Cons
- ❌ **Backend on separate platform** - Need to deploy backend separately (Railway, Render, Fly.io, etc.)
- ❌ **CORS management** - Need to configure CORS for different domains
- ❌ **Two deployments to manage** - Frontend and backend separate

### Setup Steps

#### 1. Push to GitHub
```bash
cd c:/Users/quaye/Desktop/PROJECT1/RESMAN
git remote add origin https://github.com/YOUR_USERNAME/resman.git
git branch -M main
git push -u origin main
```

#### 2. Install Vercel CLI
```bash
npm install -g vercel
```

#### 3. Deploy Frontend to Vercel
```bash
cd frontend
vercel
# Follow prompts:
# - Link to existing project? No
# - Set project name: resman-frontend
# - Framework preset: Vite
# - Root directory: ./
```

#### 4. Configure Environment Variables in Vercel Dashboard
```
VITE_API_URL=https://your-backend-domain.com/api
VITE_WS_URL=https://your-backend-domain.com
VITE_APP_NAME=Central University Available Class System
VITE_APP_VERSION=1.0.0
VITE_ENABLE_NOTIFICATIONS=true
```

#### 5. Deploy Backend (Choose One)

**Option A1: Railway.app (Recommended)**
- Sign up at https://railway.app
- Connect GitHub repo
- Add PostgreSQL database
- Deploy backend with environment variables

**Option A2: Render.com**
- Sign up at https://render.com
- Create Web Service
- Connect GitHub
- Deploy backend

**Option A3: Fly.io**
- Sign up at https://fly.io
- Deploy with `flyctl deploy`

#### 6. Update CORS in Backend
Update `backend/src/server.ts`:
```typescript
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  // e.g., FRONTEND_URL=https://resman-frontend.vercel.app
  credentials: true,
})
```

### Result
- Frontend: `https://resman-frontend.vercel.app`
- Backend: `https://resman-api.railway.app` (or similar)

---

## Option B: Full Stack Deployment to Vercel (ADVANCED)

Deploy both frontend and backend to Vercel using serverless functions.

### Pros
- ✅ **Single platform** - Everything in one place
- ✅ **Single deployment** - Push once, everything deploys
- ✅ **Simpler CORS** - Same domain for frontend and API
- ✅ **Free tier available** - Covers serverless functions

### Cons
- ❌ **Complex setup** - Requires restructuring backend
- ❌ **Serverless limitations** - 10-second function timeout
- ❌ **Database issues** - SQLite doesn't work well with serverless (need PostgreSQL)
- ❌ **Cost** - Might exceed free tier with heavy usage
- ❌ **Cold starts** - Functions may have startup delay
- ❌ **Multiple code changes** - Backend and frontend need restructuring

### Setup Steps

#### 1. Create Vercel Configuration
Create `vercel.json` in root directory:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev:frontend",
  "env": {
    "DATABASE_URL": "@database_url"
  },
  "functions": {
    "backend/api/**": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/api/$1"
    }
  ]
}
```

#### 2. Restructure Backend for Serverless
Move `backend/src` to `backend/api` and convert routes to serverless functions.

Each route becomes a separate file:
```
backend/api/
  ├── auth/
  │   ├── [endpoint].ts
  ├── rooms/
  │   ├── [endpoint].ts
  ├── admin/
  │   ├── database/
  │       ├── stats.ts
  │       ├── export.ts
```

#### 3. Migrate Database
- Set up PostgreSQL on Vercel or another platform
- Update Prisma schema to use PostgreSQL
- Run migrations: `prisma migrate deploy`

#### 4. Update Environment Variables
In Vercel dashboard, set:
```
DATABASE_URL=postgresql://user:pass@host/dbname
NODE_ENV=production
JWT_SECRET=your_secret_key
```

#### 5. Deploy to Vercel
```bash
cd root
vercel deploy --prod
```

### Result
- Frontend + Backend: `https://resman.vercel.app`
- API: `https://resman.vercel.app/api/*`

---

## Comparison Table

| Feature | Option A | Option B |
|---------|----------|----------|
| **Setup Difficulty** | Easy (30 min) | Hard (2-3 hours) |
| **Code Changes** | None | Major restructuring |
| **Database** | SQLite works fine | Requires PostgreSQL |
| **Cost** | Low | Medium-High |
| **Maintenance** | Simple | Complex |
| **Performance** | Good | May have cold starts |
| **Recommended** | ✅ YES | ❌ Advanced only |

---

## Recommendation: **Option A - Frontend Only**

### Why?
1. **Quick to implement** - Get live in 30 minutes
2. **No code changes** - Current app works as-is
3. **SQLite works** - No database migration needed
4. **Better performance** - Backend not subject to cold starts
5. **Easier debugging** - Separate frontend/backend logs
6. **Cost-effective** - Vercel free tier + cheap backend hosting

### Next Steps for Option A:
1. ✅ Push code to GitHub
2. ✅ Deploy frontend to Vercel (5 min)
3. ✅ Choose backend platform (Railway/Render/Fly.io)
4. ✅ Deploy backend there (15 min)
5. ✅ Update environment variables
6. ✅ Test full integration

---

## Quick Start (Option A)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy frontend
cd frontend
vercel --prod

# 3. Note the deployment URL
# 4. Deploy backend separately (choose platform)
# 5. Update VITE_API_URL in Vercel environment variables
```

---

## Questions?

Let me know which option you'd like to proceed with and I'll guide you through the exact steps!

**Recommended:** Option A - Frontend to Vercel + Backend to Railway

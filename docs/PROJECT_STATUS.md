# Project Status — RESMAN (Reservation Manager)

Date: 2026-01-10

## Summary
 - Project: RESMAN (Reservation Manager)
 - Location: `RESMAN/`
- Scope: central room inventory, booking creation/modification/cancellation, timetable views, real-time updates, audit logs, role-based auth.

## Implemented (backend)
- Express + TypeScript server entry: `src/server.ts`, `src/index.ts` (HTTP + Socket.IO setup).
- Auth routes: `src/routes/auth.ts` (register, login, refresh, logout, profile, change-password).
- Booking routes: `src/routes/bookings.ts` (create, list, update, status change, delete) with conflict detection and audit logs.
- Rooms & timeslots routes: `src/routes/rooms.ts`, `src/routes/timeslots.ts` (CRUD, block slots, list availability).
- Middleware: auth (`src/middleware/auth.ts`), validation, error handling, request logging.
- Utilities: `src/utils/overlap-check.ts` (time helpers, conflict detection), validators, logger.
- Services: audit-logger, notify (email), socket emitter stubs.
- Prisma schema: `prisma/schema.prisma` — models for `User`, `Room`, `TimeSlot`, `Booking`, `AuditLog`, `RefreshToken`, `Notification`. Datasource uses `sqlite` (via `DATABASE_URL`).
- Tests: unit tests for overlap utilities at `tests/unit/overlaps.test.ts`; integration tests folder exists for bookings.

## Implemented (frontend)
- React + TypeScript app scaffold in `frontend/`.
- Components: `RoomCalendar`, `BookingForm`, `Header`, `ProtectedRoute` and others referenced in docs.
- API client: `src/api/*` with token interceptor.
- Socket.IO client integration in calendar component for real-time updates.

## What I executed and verified
- Extracted course PDF and summarized student-facing usage guidance (earlier step).
- Ran a standalone Node script reproducing the logic in `src/utils/overlap-check.ts` (`backend/scripts/run_overlap_checks.js`) to verify core time utilities and conflict detection — results were successful. Output included expected overlaps, available slot generation, and time conversions.

Commands used to reproduce (run from `available-class-system/backend`):

```powershell
node scripts/run_overlap_checks.js
```

Output (abridged):
- `timeToMinutes 12:30 => 750`
- `minutesToTime 750 => 12:30`
- `doTimesOverlap ... => true`
- `isValidTimeRange 10:00-09:00 => false`
- `findConflictingBookings => [ { roomId: 'r1', startTime: '09:00', endTime: '10:30' } ]`
- `getAvailableSlots no bookings => [08:00-09:00, 09:00-10:00, 10:00-11:00, 11:00-12:00]`

## Current blockers / known issues
- Cannot run full backend `npm ci` / Jest in this environment due to a Windows file permission/lock error while unlinking `esbuild.exe` (path: `available-class-system\node_modules\@esbuild\win32-x64\esbuild.exe`). This prevents installing dev dependencies and running the full test suite locally.
  - Likely causes: file in use by another process (editor, dev server), antivirus locking, or insufficient permissions.

## How to resolve the install/test blocker (recommended)
1. Close any running dev servers, editors, or Node processes that may hold `esbuild.exe`.
2. If using VS Code, close the window or stop any integrated terminals running the project.
3. Temporarily disable antivirus or add an exclusion for the workspace folder.
4. Remove top-level `node_modules` (if safe) and reinstall from the workspace root and subfolders:

```powershell
# From workspace root
# optional: take a backup
Remove-Item -Recurse -Force node_modules
# Then in backend
Set-Location .\available-class-system\backend
npm ci
```

5. If permissions persist, run PowerShell as Administrator and retry.

## Smoke-test steps (once dependencies are installed)
1. Set environment variables (create `.env` in `backend/`):

```text
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret
VITE_API_URL=http://localhost:5000
PORT=5000
```

2. Initialize DB and seed (Prisma):

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

3. Start backend in dev:

```powershell
npm run dev
```

4. In another terminal, verify health endpoint:

```powershell
curl http://localhost:5000/health
```

5. Register a user, login, create a room, create timeslots, then create a booking via API or frontend to observe real-time updates.

## Recommended next steps
- Fix the `npm ci` file-lock issue and run the full test suite (`npm test`) to ensure backend unit/integration tests pass.
- Run frontend dev server (`frontend` folder) and ensure it points to backend via `.env` `VITE_API_URL`.
- Perform end-to-end tests (Cypress) or manual walkthrough: register -> login -> view room calendar -> create booking -> confirm other connected client sees update.
- Add seed data for campus rooms and a minimal README in `available-class-system/docs/` with quick-start commands.

## Changes I made locally for verification
- Added: `backend/scripts/run_overlap_checks.js` — a standalone verifier for overlap-check utilities.
- Added: `pdf_tools/extract_pdf_text.py` and `pdf_tools/extracted.txt` (extracted course PDF content).

If you want, I can:
- Try to resolve the `esbuild.exe` lock (attempt to safely remove the locked file or locate the process holding it).
- Create `docs/README.md` with one-command local startup instructions and a one-page student quick-guide into `docs/STUDENT_QUICKGUIDE.md`.
- Run the backend server and perform automated smoke tests after you allow me to attempt fixing the install blocker.

---

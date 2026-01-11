# RESMAN Architecture Overview — Phase 1

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESMAN (Reservation Manager)                 │
│                   Central University — Miotso Campus              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐              ┌──────────────────────────┐
│    FRONTEND (React)      │◄────────────►│   BACKEND (Express)      │
│   Port: 3000             │              │   Port: 5000             │
│                          │              │                          │
│ ┌────────────────────┐   │              │ ┌────────────────────┐   │
│ │  Landing Page      │   │              │ │ Auth Routes        │   │
│ │  - Public access   │   │              │ │ - Login            │   │
│ │  - Search form     │   │              │ │ - Register         │   │
│ │  - Role selector   │   │              │ │ - Password reset   │   │
│ └────────────────────┘   │              │ └────────────────────┘   │
│                          │              │                          │
│ ┌────────────────────┐   │              │ ┌────────────────────┐   │
│ │ Admin Login        │   │              │ │ Booking Routes     │   │
│ │ - Role check       │   │              │ │ - Create/read      │   │
│ │ - Secure entry     │   │              │ │ - Conflict check   │   │
│ └────────────────────┘   │              │ └────────────────────┘   │
│                          │              │                          │
│ ┌────────────────────┐   │              │ ┌────────────────────┐   │
│ │ Dashboards         │   │              │ │ Room Routes        │   │
│ │ - Student          │   │              │ │ - List/search      │   │
│ │ - Admin            │   │              │ │ - Occupancy        │   │
│ │ - Lecturer         │   │              │ │ - Details          │   │
│ └────────────────────┘   │              │ └────────────────────┘   │
│                          │              │                          │
│ ┌────────────────────┐   │              │ ┌────────────────────┐   │
│ │ Components         │   │              │ │ Database (Prisma)  │   │
│ │ - RoomCalendar     │   │              │ │ - PostgreSQL/SQLite│   │
│ │ - RoomDetailsModal │   │              │ │ - User             │   │
│ │ - Sidebar          │   │              │ │ - Room             │   │
│ │ - Header           │   │              │ │ - Booking          │   │
│ └────────────────────┘   │              │ │ - TimeSlot         │   │
│                          │              │ │ - AuditLog         │   │
│ ┌────────────────────┐   │              │ └────────────────────┘   │
│ │ Context (State)    │   │              │                          │
│ │ - AuthContext      │   │              │ ┌────────────────────┐   │
│ │ - SocketContext    │   │              │ │ Socket.IO          │   │
│ └────────────────────┘   │              │ │ - Real-time        │   │
│                          │              │ │ - Notifications    │   │
│                          │              │ └────────────────────┘   │
└──────────────────────────┘              └──────────────────────────┘
         ▲
         │
    ┌────┴──────┐
    │ Vite Build │
    │ TypeScript │
    │ Tailwind   │
    └───────────┘
```

## 📊 Data Flow Diagram

```
User visits Landing Page
    │
    ├─► Public Room Search
    │   │
    │   └─► GET /api/rooms/occupancy?date=YYYY-MM-DD
    │       │
    │       └─► Display results in grid
    │
    ├─► Student Login
    │   │
    │   └─► Student Dashboard (my bookings)
    │
    ├─► Lecturer/Staff Login
    │   │
    │   └─► Lecturer Dashboard (department rooms)
    │
    └─► Admin Login (/admin-login)
        │
        └─► Admin Dashboard
            │
            ├─► GET /api/admin/stats
            │   └─► Display metrics
            │
            ├─► GET /api/rooms (for room list)
            │
            └─► Management Actions
                ├─► User Management
                ├─► Room Configuration
                └─► Maintenance Scheduling
```

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────┐
│         Landing Page (/)                 │
│  [Student] [Staff] [Admin]              │
└──────────┬──────────┬──────────┬────────┘
           │          │          │
    ┌──────▼──┐  ┌────▼──────┐  └──┬──────────────┐
    │ /login  │  │ /login    │     │ /admin-login │
    │ (General│  │ (Role:    │     │ (Admin only) │
    │ Users)  │  │ LECTURER) │     │              │
    └────┬────┘  └────┬──────┘     └────┬─────────┘
         │            │                  │
         ▼            ▼                  ▼
    ┌──────────────────────────────────────────┐
    │     AuthContext (JWT Token)              │
    │  - Stored in localStorage                │
    │  - Included in API requests              │
    │  - Intercepted on 401 (refresh/redirect)│
    └──────────────────────────────────────────┘
         │                │
    Role: STUDENT    Role: ADMIN
         │                │
         ▼                ▼
    /app/dashboard    /admin/dashboard
    - My Bookings     - System Stats
    - Available Rooms - User Mgmt
    - Search          - Maintenance
```

## 🎯 Component Hierarchy

```
App
├── Router (React Router v6)
│   ├── Routes (public)
│   │   ├── / (LandingPage)
│   │   ├── /login (LoginPage)
│   │   ├── /admin-login (AdminLoginPage) ⭐ NEW
│   │   ├── /register (RegisterPage)
│   │   └── /reset-password (ResetPasswordPage)
│   │
│   ├── Routes (/app/*)
│   │   ├── ProtectedRoute (requires auth)
│   │   │   ├── Sidebar
│   │   │   ├── Header
│   │   │   └── Routes
│   │   │       ├── /dashboard (DashboardPage)
│   │   │       ├── /bookings (BookingPage)
│   │   │       │   └── RoomCalendar ⭐ NEW
│   │   │       └── ...other routes
│   │   │
│   │   └── Modals
│   │       └── RoomDetailsModal ⭐ NEW
│   │
│   └── Routes (/admin/*)
│       ├── ProtectedRoute (requires ADMIN role)
│       │   ├── Sidebar (admin-specific menu)
│       │   ├── Header
│       │   └── Routes
│       │       ├── /dashboard (AdminDashboardPage) ⭐ NEW
│       │       ├── /users (UserManagementPage)
│       │       ├── /rooms (RoomConfigPage)
│       │       └── ...admin routes
│       │
│       └── Modals
│           ├── RoomDetailsModal
│           └── ...admin modals
│
├── Contexts
│   ├── AuthContext (user, login, logout, token)
│   └── SocketContext (real-time events)
│
└── Toast/Notifications
    └── React Hot Toast

New Components (⭐)
├── LandingPage ✨ ENHANCED with:
│   ├── Role-based cards
│   ├── Maintenance alerts
│   └── Public search
│
├── AdminLoginPage ⭐ NEW
│
├── AdminDashboardPage ⭐ NEW
│
├── RoomCalendar ⭐ NEW (can be used in multiple pages)
│
└── RoomDetailsModal ⭐ NEW (reusable modal)
```

## 🔄 State Management

### Context Providers

```
AuthContext
├── user (User object)
│   ├── id
│   ├── email
│   ├── firstName
│   ├── lastName
│   ├── role (STUDENT | LECTURER | ADMIN | STAFF)
│   └── department
├── isAuthenticated (boolean)
├── isLoading (boolean)
├── token (JWT)
├── login(email, password)
├── logout()
└── refreshToken()

SocketContext
├── socket (Socket.IO instance)
├── isConnected (boolean)
├── on(eventName, callback)
├── emit(eventName, data)
└── off(eventName)
```

### Local Component State

```
LandingPage
├── occupancy (room data)
├── rangeData (7-day trends)
├── searchDate
├── minCapacity
├── equipment
├── searchResults
└── isSearching

AdminDashboardPage
├── stats (Users, Bookings, Rooms, etc.)
└── [other metrics]

RoomCalendar
├── timeSlots
├── displayDate
└── selectedSlot

RoomDetailsModal
├── isOpen
└── selectedRoom
```

## 📡 API Endpoints Used

### Frontend → Backend Communication

```
GET /api/rooms/occupancy?date=YYYY-MM-DD
├─ Purpose: Fetch room occupancy for a specific date
├─ Response: Occupancy[]
└─ Used in: LandingPage, DashboardPage

GET /api/rooms/occupancy-range?start=YYYY-MM-DD&end=YYYY-MM-DD
├─ Purpose: Fetch 7-day occupancy trends
├─ Response: OccupancyRange[]
└─ Used in: LandingPage, DashboardPage

GET /api/rooms?page=1&limit=12&capacity=30&equipment=projector
├─ Purpose: Search rooms with filters
├─ Response: {data: Room[], total: number}
└─ Used in: BookingPage, public search

POST /auth/login
├─ Request: {email, password}
├─ Response: {user: User, token: JWT}
└─ Used in: LoginPage, AdminLoginPage

GET /api/admin/stats
├─ Purpose: System statistics (new endpoint needed)
├─ Response: {users, bookings, rooms, maintenance, health}
└─ Used in: AdminDashboardPage

GET /api/rooms/:id/timeslots?date=YYYY-MM-DD
├─ Purpose: Get time slots for specific room/date (new endpoint)
├─ Response: TimeSlot[]
└─ Used in: RoomCalendar
```

## 🎨 Design System

### Color Palette
```
Primary:     #dc2626 (red-600)
Secondary:   #6366f1 (indigo-600)
Tertiary:    #16a34a (green-600)

Backgrounds:
- Page:      #f9fafb (gray-50)
- Card:      #ffffff (white)
- Hover:     #f3f4f6 (gray-100)

Status Colors:
- Success:   #10b981 (green-500)
- Warning:   #f59e0b (amber-500)
- Error:     #ef4444 (red-500)
- Info:      #3b82f6 (blue-500)
```

### Typography
```
Headings:
- H1: 2.25rem (36px), font-bold
- H2: 1.875rem (30px), font-bold
- H3: 1.5rem (24px), font-bold

Body:
- Base: 1rem (16px)
- Small: 0.875rem (14px)
- Tiny: 0.75rem (12px)
```

### Spacing
```
xs:  0.25rem (4px)
sm:  0.5rem (8px)
md:  1rem (16px)
lg:  1.5rem (24px)
xl:  2rem (32px)
2xl: 3rem (48px)
```

## 🚀 Build & Deployment

### Local Development
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
# Auto-reload on file changes
```

### Production Build
```bash
npm run build
# Output: dist/
# Minified, optimized assets
```

### Docker
```bash
docker-compose up
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

---

**Architecture Version**: 1.0 (Phase 1)
**Last Updated**: January 11, 2026
**Maintainer**: GitHub Copilot

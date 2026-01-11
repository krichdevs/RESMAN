# RESMAN — Reservation Manager

A web-based classroom reservation system (RESMAN) designed to eliminate scheduling conflicts, automate room bookings, and provide real-time availability visibility.

## 🎯 Project Overview

This system serves administrators and academic staff to optimize space utilization and reduce administrative overhead at Central University — Miotso Campus.

## 🔧 Tech Stack

### Frontend
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Real-time:** Socket.IO Client
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js with Express
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Real-time:** Socket.IO
- **Email:** Nodemailer

### Architecture & Local Runtime (development)
- **Repository layout:** Monorepo style with `frontend/` and `backend/` folders.
- **Frontend:** React + TypeScript app built with Vite; served on `http://localhost:3000` in dev.
- **Backend:** Express + TypeScript API running on Node.js (typically `http://localhost:5000`). Uses layered structure (routes → services → utils → middleware).
- **Database (dev):** SQLite (file-based) via Prisma by default for local development (`DATABASE_URL="file:./dev.db"`). The codebase is compatible with PostgreSQL in production (infrastructure and docker compose use Postgres).
- **Realtime & Notifications:** Socket.IO for real-time events; nodemailer is available for email but in local/dev mode emails are not sent to external providers unless configured.
- **Auth & Users:** JWT-based auth stored in localStorage on the frontend; registration and password-reset endpoints exist for student self-registration.
- **Scripts & Seeds:** `backend/scripts/quick_seed.ts` and `prisma/seed.ts` provide sample users (admin & students) and rooms for development.

### How to explain this to others (short):
- The app is a full-stack TypeScript project: React + Vite frontend and an Express + Prisma backend running on Node.js. Locally it uses SQLite for convenience; production uses PostgreSQL. Authentication uses JWTs and role-based access, and realtime updates are powered by Socket.IO.

### Infrastructure & DevOps
- **Containerization:** Docker
- **Cloud:** AWS (ECS/EBS, RDS, S3)
- **CI/CD:** GitHub Actions
- **Testing:** Jest, Cypress, React Testing Library
- **Monitoring:** Winston logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/krichdevs/RESMAN.git
cd RESMAN

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📁 Project Structure

```
RESMAN/
├── backend/           # Express.js API server
├── frontend/          # React + Vite application
├── infrastructure/    # Docker, Terraform, CI/CD configs
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── docker-compose.yml # Local development setup
```

## 🎯 Core Features

1. **Real-time Room Availability** - Live updates via WebSockets
2. **Conflict-Free Booking** - Database-level overlap prevention
3. **Role-Based Access Control** - Admin vs Staff permissions
4. **Audit Logging** - Complete trail of all actions
5. **Email Notifications** - Booking confirmations and updates
6. **Responsive Calendar Views** - Daily/weekly scheduling
7. **Advanced Filtering** - By capacity, equipment, building

## 📋 API Documentation

See [API Documentation](./docs/API_Documentation.md) for detailed endpoint information.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

See [Deployment Guide](./docs/Deployment_Guide.md) for production deployment instructions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

Central University IT Department — Miotso Campus

---

© 2024 Central University — Miotso Campus. Motto: FIATH. INTEGRITY. EXCELLENCE. All rights reserved.

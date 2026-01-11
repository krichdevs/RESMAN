#!/bin/bash

# Central University Available Class System - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Central University Available Class System"

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Docker is recommended for running PostgreSQL and Redis."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose is not installed. Docker Compose is recommended for easy setup."
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created backend/.env from template"
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Setup database
echo "🗄️  Setting up database..."
if command -v docker-compose &> /dev/null; then
    echo "🐳 Starting PostgreSQL and Redis with Docker Compose..."
    docker-compose up -d postgres redis
    sleep 5

    # Run migrations
    echo "🛠️  Running database migrations..."
    npx prisma migrate dev --name init

    # Seed database
    echo "🌱 Seeding database..."
    npx prisma db seed
else
    echo "⚠️  Docker Compose not found. Please start PostgreSQL and Redis manually."
    echo "   Then run: cd backend && npx prisma migrate dev && npx prisma db seed"
fi

cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created frontend/.env from template"
fi

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

cd ..

# Create logs directory
mkdir -p logs

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update the .env files in backend/ and frontend/"
echo "2. Start the development servers:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Useful commands:"
echo "  - Start all services: docker-compose up -d"
echo "  - Stop all services: docker-compose down"
echo "  - View logs: docker-compose logs -f"
echo "  - Reset database: docker-compose down -v && docker-compose up -d postgres redis"
echo ""
echo "📖 Documentation: See docs/ directory for API docs and deployment guide"

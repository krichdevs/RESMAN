#!/bin/bash

# RESMAN — Reservation Manager (Central University — Miotso Campus) - Deployment Script
# This script deploys the application to production

set -e

ENVIRONMENT=${1:-production}
TAG=${2:-latest}

echo "🚀 Deploying RESMAN (Reservation Manager) for Central University — Miotso Campus to $ENVIRONMENT"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | xargs)
else
    echo "⚠️  No environment file found. Using defaults."
fi

echo "✅ Prerequisites check passed"

# Build images
echo "🏗️  Building Docker images..."

# Build backend
echo "📦 Building backend image..."
docker build -t cu-resman-backend:$TAG ./backend

# Build frontend
echo "🎨 Building frontend image..."
docker build -t cu-resman-frontend:$TAG ./frontend

echo "✅ Images built successfully"

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Deploying to production..."

    # Use production compose file
    COMPOSE_FILE="infrastructure/docker/docker-compose.prod.yml"

    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker-compose -f $COMPOSE_FILE down || true

    # Start new containers
    echo "🚀 Starting production containers..."
    docker-compose -f $COMPOSE_FILE up -d

    # Wait for services to be healthy
    echo "⏳ Waiting for services to be healthy..."
    sleep 30

    # Run database migrations
    echo "🛠️  Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec -T backend npx prisma migrate deploy

    # Run health check
    echo "🏥 Running health checks..."
    HEALTH_CHECK_URL="http://localhost/health"
    if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
        echo "✅ Health check passed"
    else
        echo "❌ Health check failed"
        exit 1
    fi

elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "🧪 Deploying to staging..."

    # Use staging compose file or default
    COMPOSE_FILE="docker-compose.yml"

    # Stop existing containers
    docker-compose -f $COMPOSE_FILE down || true

    # Start new containers
    docker-compose -f $COMPOSE_FILE up -d

    # Run database migrations
    docker-compose -f $COMPOSE_FILE exec -T backend npx prisma migrate deploy

else
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "   Supported environments: production, staging"
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  - Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  - Restart services: docker-compose -f $COMPOSE_FILE restart"
echo ""
echo "🌐 Application URLs:"
echo "  - Frontend: http://localhost"
echo "  - API: http://localhost/api"
echo "  - Health Check: http://localhost/health"
echo "  - Monitoring: http://localhost:9090 (Prometheus)"
echo "  - Dashboards: http://localhost:3001 (Grafana)"

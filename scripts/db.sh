#!/bin/bash

# Central University Available Class System - Database Management Script
# This script provides utilities for database operations

set -e

COMMAND=${1:-help}
ENVIRONMENT=${2:-development}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the backend directory
check_backend_dir() {
    if [ ! -f "package.json" ] || [ ! -d "prisma" ]; then
        log_error "Please run this script from the backend directory"
        exit 1
    fi
}

# Database operations
case $COMMAND in
    migrate)
        log_info "Running database migrations..."
        check_backend_dir
        npx prisma migrate dev
        log_success "Migrations completed"
        ;;

    generate)
        log_info "Generating Prisma client..."
        check_backend_dir
        npx prisma generate
        log_success "Prisma client generated"
        ;;

    seed)
        log_info "Seeding database..."
        check_backend_dir
        npx prisma db seed
        log_success "Database seeded"
        ;;

    reset)
        log_warning "This will reset the database and delete all data!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Resetting database..."
            check_backend_dir
            npx prisma migrate reset --force
            log_success "Database reset completed"
        else
            log_info "Operation cancelled"
        fi
        ;;

    deploy)
        log_info "Deploying migrations to production..."
        check_backend_dir
        npx prisma migrate deploy
        log_success "Migrations deployed"
        ;;

    studio)
        log_info "Opening Prisma Studio..."
        check_backend_dir
        npx prisma studio
        ;;

    backup)
        BACKUP_FILE=${2:-"backup_$(date +%Y%m%d_%H%M%S).sql"}
        log_info "Creating database backup: $BACKUP_FILE"
        check_backend_dir

        # Get database URL from environment
        if [ -f ".env" ]; then
            export $(grep -v '^#' .env | xargs)
        fi

        if [ -z "$DATABASE_URL" ]; then
            log_error "DATABASE_URL not found in environment"
            exit 1
        fi

        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
        log_success "Backup created: $BACKUP_FILE"
        ;;

    restore)
        BACKUP_FILE=${2}
        if [ -z "$BACKUP_FILE" ]; then
            log_error "Please specify a backup file to restore"
            exit 1
        fi

        if [ ! -f "$BACKUP_FILE" ]; then
            log_error "Backup file not found: $BACKUP_FILE"
            exit 1
        fi

        log_warning "This will overwrite the current database!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Restoring database from: $BACKUP_FILE"
            check_backend_dir

            # Get database URL from environment
            if [ -f ".env" ]; then
                export $(grep -v '^#' .env | xargs)
            fi

            if [ -z "$DATABASE_URL" ]; then
                log_error "DATABASE_URL not found in environment"
                exit 1
            fi

            psql "$DATABASE_URL" < "$BACKUP_FILE"
            log_success "Database restored from: $BACKUP_FILE"
        else
            log_info "Operation cancelled"
        fi
        ;;

    status)
        log_info "Database migration status..."
        check_backend_dir
        npx prisma migrate status
        ;;

    format)
        log_info "Formatting Prisma schema..."
        check_backend_dir
        npx prisma format
        log_success "Schema formatted"
        ;;

    validate)
        log_info "Validating Prisma schema..."
        check_backend_dir
        npx prisma validate
        log_success "Schema validation passed"
        ;;

    help|*)
        echo "Central University Available Class System - Database Management"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  migrate          Run database migrations in development"
        echo "  generate         Generate Prisma client"
        echo "  seed             Seed the database with initial data"
        echo "  reset            Reset database (WARNING: deletes all data)"
        echo "  deploy           Deploy migrations to production"
        echo "  studio           Open Prisma Studio"
        echo "  backup [file]    Create database backup"
        echo "  restore <file>   Restore database from backup"
        echo "  status           Show migration status"
        echo "  format           Format Prisma schema"
        echo "  validate         Validate Prisma schema"
        echo "  help             Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 migrate"
        echo "  $0 backup my_backup.sql"
        echo "  $0 restore my_backup.sql"
        echo ""
        ;;
esac

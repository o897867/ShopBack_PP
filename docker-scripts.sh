#!/bin/bash

# ShopBack Docker Management Scripts
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Development environment
dev_start() {
    print_header "Starting Development Environment"
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from development template"
        cp .env.development .env
    fi
    
    print_status "Building and starting development containers..."
    docker-compose up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    print_status "Development environment is ready!"
    echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "Backend API: ${GREEN}http://localhost:8001${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8001/docs${NC}"
}

dev_stop() {
    print_header "Stopping Development Environment"
    docker-compose down
    print_status "Development environment stopped"
}

dev_logs() {
    print_header "Development Logs"
    docker-compose logs -f "${1:-}"
}

dev_restart() {
    print_header "Restarting Development Environment"
    docker-compose restart "${1:-}"
    print_status "Development environment restarted"
}

# Production environment
prod_start() {
    print_header "Starting Production Environment"
    
    # Check if production environment file exists
    if [ ! -f .env.production ]; then
        print_error "Production environment file not found!"
        print_warning "Please configure .env.production before starting production"
        exit 1
    fi
    
    # Copy production environment
    cp .env.production .env
    
    print_status "Building and starting production containers..."
    docker-compose -f docker-compose.prod.yml up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    print_status "Production environment is ready!"
    echo -e "Application: ${GREEN}http://localhost:80${NC}"
}

prod_stop() {
    print_header "Stopping Production Environment"
    docker-compose -f docker-compose.prod.yml down
    print_status "Production environment stopped"
}

prod_logs() {
    print_header "Production Logs"
    docker-compose -f docker-compose.prod.yml logs -f "${1:-}"
}

# Database operations
db_backup() {
    print_header "Creating Database Backup"
    
    BACKUP_DIR="./backups"
    BACKUP_FILE="shopback_backup_$(date +%Y%m%d_%H%M%S).db"
    
    mkdir -p "$BACKUP_DIR"
    
    if docker-compose ps | grep -q shopback-backend; then
        print_status "Creating backup from running container..."
        docker-compose exec backend cp /app/data/shopback_data.db "/app/backups/$BACKUP_FILE"
        docker cp "$(docker-compose ps -q backend):/app/backups/$BACKUP_FILE" "$BACKUP_DIR/"
    else
        print_warning "Backend container not running. Creating backup from local file..."
        if [ -f "back-end/shopback_data.db" ]; then
            cp "back-end/shopback_data.db" "$BACKUP_DIR/$BACKUP_FILE"
        else
            print_error "Database file not found!"
            exit 1
        fi
    fi
    
    print_status "Backup created: $BACKUP_DIR/$BACKUP_FILE"
}

db_restore() {
    if [ -z "$1" ]; then
        print_error "Please provide backup file path"
        print_status "Usage: $0 db-restore <backup_file>"
        exit 1
    fi
    
    print_header "Restoring Database from Backup"
    print_warning "This will overwrite the current database!"
    
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if docker-compose ps | grep -q shopback-backend; then
            docker-compose exec backend cp "$1" /app/data/shopback_data.db
        else
            cp "$1" back-end/shopback_data.db
        fi
        print_status "Database restored from $1"
    else
        print_status "Restore cancelled"
    fi
}

# Utility functions
clean() {
    print_header "Cleaning Docker Resources"
    
    print_status "Stopping all containers..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    print_status "Removing unused images..."
    docker image prune -f
    
    print_status "Removing unused volumes..."
    docker volume prune -f
    
    print_status "Cleanup completed"
}

status() {
    print_header "Docker Container Status"
    docker-compose ps
    
    if docker-compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q shopback; then
        echo -e "\n${BLUE}Production containers:${NC}"
        docker-compose -f docker-compose.prod.yml ps
    fi
}

health() {
    print_header "Health Check"
    
    # Check backend health
    if curl -f -s http://localhost:8001/api/performance > /dev/null; then
        echo -e "Backend: ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Backend: ${RED}✗ Unhealthy${NC}"
    fi
    
    # Check frontend health
    if curl -f -s http://localhost:3000 > /dev/null; then
        echo -e "Frontend: ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Frontend: ${RED}✗ Unhealthy${NC}"
    fi
}

# Help function
show_help() {
    echo "ShopBack Docker Management Script"
    echo ""
    echo "Development Commands:"
    echo "  dev-start     Start development environment"
    echo "  dev-stop      Stop development environment"
    echo "  dev-restart   Restart development environment"
    echo "  dev-logs      Show development logs"
    echo ""
    echo "Production Commands:"
    echo "  prod-start    Start production environment"
    echo "  prod-stop     Stop production environment"
    echo "  prod-logs     Show production logs"
    echo ""
    echo "Database Commands:"
    echo "  db-backup     Create database backup"
    echo "  db-restore    Restore database from backup"
    echo ""
    echo "Utility Commands:"
    echo "  status        Show container status"
    echo "  health        Check application health"
    echo "  clean         Clean unused Docker resources"
    echo "  help          Show this help message"
}

# Main script logic
case "${1:-help}" in
    "dev-start")     dev_start ;;
    "dev-stop")      dev_stop ;;
    "dev-restart")   dev_restart "$2" ;;
    "dev-logs")      dev_logs "$2" ;;
    "prod-start")    prod_start ;;
    "prod-stop")     prod_stop ;;
    "prod-logs")     prod_logs "$2" ;;
    "db-backup")     db_backup ;;
    "db-restore")    db_restore "$2" ;;
    "status")        status ;;
    "health")        health ;;
    "clean")         clean ;;
    "help")          show_help ;;
    *)               show_help ;;
esac
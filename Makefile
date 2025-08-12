# Blood Donor Management System - Docker Makefile

.PHONY: help build up down logs clean dev prod restart status

# Default target
help:
	@echo "Blood Donor Management System - Docker Commands"
	@echo "=============================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build development containers"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-down     - Stop development environment"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build production containers"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-down    - Stop production environment"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean        - Remove all containers, images, and volumes"
	@echo "  make status       - Show container status"
	@echo "  make logs         - View all logs"
	@echo "  make restart      - Restart all services"
	@echo ""

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend API: http://localhost:7000"
	@echo "MongoDB Express: http://localhost:8081 (admin/admin123)"
	@echo "Redis Commander: http://localhost:8082"
	@echo "Mailhog: http://localhost:8025"

dev-build:
	@echo "Building development containers..."
	docker-compose -f docker-compose.dev.yml build

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-down:
	@echo "Stopping development environment..."
	docker-compose -f docker-compose.dev.yml down

# Production environment
prod:
	@echo "Starting production environment..."
	docker-compose up -d
	@echo "Production environment started!"
	@echo "Application: http://localhost"
	@echo "Backend API: http://localhost:7000"

prod-build:
	@echo "Building production containers..."
	docker-compose build

prod-logs:
	docker-compose logs -f

prod-down:
	@echo "Stopping production environment..."
	docker-compose down

# Utility commands
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose -f docker-compose.dev.yml down -v --rmi all
	docker-compose down -v --rmi all
	docker system prune -f
	@echo "Cleanup completed!"

status:
	@echo "Development containers:"
	docker-compose -f docker-compose.dev.yml ps
	@echo ""
	@echo "Production containers:"
	docker-compose ps

logs:
	@echo "Development logs:"
	docker-compose -f docker-compose.dev.yml logs --tail=50
	@echo ""
	@echo "Production logs:"
	docker-compose logs --tail=50

restart:
	@echo "Restarting all services..."
	docker-compose -f docker-compose.dev.yml restart
	docker-compose restart

# Database commands
db-backup:
	@echo "Creating database backup..."
	docker exec blood-donor-mongodb-dev mongodump --out /data/backup/$(shell date +%Y%m%d_%H%M%S)
	@echo "Backup completed!"

db-restore:
	@echo "Restoring database from backup..."
	docker exec blood-donor-mongodb-dev mongorestore /data/backup/$(BACKUP_DATE)
	@echo "Restore completed!"

# Monitoring commands
monitor:
	@echo "Container resource usage:"
	docker stats --no-stream
	@echo ""
	@echo "Disk usage:"
	docker system df

# Security scan
security-scan:
	@echo "Running security scan on images..."
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image blood-donor-backend:latest
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image blood-donor-frontend:latest

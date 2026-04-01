.PHONY: help install dev build start lint clean db-push db-migrate db-seed db-studio docker-build docker-up docker-down docker-logs test

help:
	@echo "Constituent Response - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make lint         - Run ESLint"
	@echo "  make test         - Run tests"
	@echo ""
	@echo "Database:"
	@echo "  make db-push      - Push schema to database"
	@echo "  make db-migrate   - Run migrations"
	@echo "  make db-seed      - Seed database with sample data"
	@echo "  make db-studio    - Open Prisma Studio"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs  - View Docker logs"
	@echo ""
	@echo "Production:"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

test:
	npm test

clean:
	rm -rf node_modules .next dist coverage

db-push:
	npm run db:push

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

db-studio:
	npm run db:studio

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-dev-up:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

docker-dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

#!/bin/bash

################################################################################
# Constituent Response - First-Time Setup Script
################################################################################
# This script performs initial setup for the constituent-response application:
# - Checks for Docker and Docker Compose installation
# - Creates .env file from .env.example
# - Prompts for required configuration values
# - Generates NEXTAUTH_SECRET
# - Starts Docker containers
# - Waits for database to be healthy
# - Runs database migrations
# - Seeds initial data
# - Displays success message with application URL

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Echo with color
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Docker installation
check_docker() {
    print_header "Checking Docker Installation"

    if ! command_exists docker; then
        print_error "Docker is not installed"
        echo "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker ps >/dev/null 2>&1; then
        print_error "Docker daemon is not running"
        echo "Please start Docker and try again"
        exit 1
    fi

    print_success "Docker is installed and running"
}

# Check Docker Compose installation
check_docker_compose() {
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi

    print_success "Docker Compose is installed"
}

# Create .env file from .env.example
setup_env_file() {
    print_header "Setting Up Environment File"

    if [ -f "$PROJECT_ROOT/.env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Using existing .env file"
            return
        fi
    fi

    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    print_success "Created .env file from .env.example"
}

# Generate NEXTAUTH_SECRET
generate_nextauth_secret() {
    if command_exists openssl; then
        echo "$(openssl rand -base64 32)"
    else
        # Fallback if openssl is not available
        echo "$(head -c 32 /dev/urandom | base64)"
    fi
}

# Prompt user for configuration values
configure_environment() {
    print_header "Configure Environment Variables"

    # Database configuration
    print_info "Database Configuration"
    read -p "  Database User (default: postgres): " DB_USER
    DB_USER="${DB_USER:-postgres}"

    read -sp "  Database Password (default: postgres): " DB_PASSWORD
    DB_PASSWORD="${DB_PASSWORD:-postgres}"
    echo

    read -p "  Database Name (default: constituent_response): " DB_NAME
    DB_NAME="${DB_NAME:-constituent_response}"

    # Construct DATABASE_URL
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public"

    # Redis configuration
    print_info "Redis Configuration"
    read -sp "  Redis Password (default: redis): " REDIS_PASSWORD
    REDIS_PASSWORD="${REDIS_PASSWORD:-redis}"
    echo

    REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379"

    # NextAuth configuration
    print_info "NextAuth Configuration"
    NEXTAUTH_SECRET=$(generate_nextauth_secret)
    print_success "Generated NEXTAUTH_SECRET"

    read -p "  Application URL (default: http://localhost:3000): " NEXTAUTH_URL
    NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

    # AI Provider configuration
    print_info "AI Provider Configuration"
    read -p "  AI Provider (openai/anthropic, default: openai): " AI_PROVIDER
    AI_PROVIDER="${AI_PROVIDER:-openai}"

    if [ "$AI_PROVIDER" = "openai" ]; then
        read -p "  OpenAI API Key: " OPENAI_API_KEY
        ANTHROPIC_API_KEY=""
    else
        OPENAI_API_KEY=""
        read -p "  Anthropic API Key: " ANTHROPIC_API_KEY
    fi

    # Email configuration
    print_info "Email Configuration (SMTP)"
    read -p "  SMTP Host (default: smtp.gmail.com): " SMTP_HOST
    SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"

    read -p "  SMTP Port (default: 587): " SMTP_PORT
    SMTP_PORT="${SMTP_PORT:-587}"

    read -p "  SMTP User: " SMTP_USER
    read -sp "  SMTP Password: " SMTP_PASS
    echo

    read -p "  From Email Address (default: noreply@constituent-response.com): " SMTP_FROM
    SMTP_FROM="${SMTP_FROM:-noreply@constituent-response.com}"

    # Third-party services
    print_info "Third-party Services"
    read -p "  Townhall/Constituent API Key: " TC_API_KEY
    read -p "  Webhook Secret: " TC_WEBHOOK_SECRET

    # Application configuration
    print_info "Application Configuration"
    read -p "  Log Level (debug/info/warn/error, default: info): " LOG_LEVEL
    LOG_LEVEL="${LOG_LEVEL:-info}"

    read -p "  Deployment Mode (single-tenant/multi-tenant, default: single-tenant): " DEPLOYMENT_MODE
    DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-single-tenant}"

    APP_URL="${NEXTAUTH_URL}"

    # Update .env file with values
    update_env_file
}

# Update .env file with configured values
update_env_file() {
    # Use sed to replace values in .env file
    sed -i.bak \
        -e "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" \
        -e "s|^REDIS_URL=.*|REDIS_URL=$REDIS_URL|" \
        -e "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEXTAUTH_SECRET|" \
        -e "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$NEXTAUTH_URL|" \
        -e "s|^AI_PROVIDER=.*|AI_PROVIDER=$AI_PROVIDER|" \
        -e "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" \
        -e "s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY|" \
        -e "s|^SMTP_HOST=.*|SMTP_HOST=$SMTP_HOST|" \
        -e "s|^SMTP_PORT=.*|SMTP_PORT=$SMTP_PORT|" \
        -e "s|^SMTP_USER=.*|SMTP_USER=$SMTP_USER|" \
        -e "s|^SMTP_PASS=.*|SMTP_PASS=$SMTP_PASS|" \
        -e "s|^SMTP_FROM=.*|SMTP_FROM=$SMTP_FROM|" \
        -e "s|^TC_API_KEY=.*|TC_API_KEY=$TC_API_KEY|" \
        -e "s|^TC_WEBHOOK_SECRET=.*|TC_WEBHOOK_SECRET=$TC_WEBHOOK_SECRET|" \
        -e "s|^LOG_LEVEL=.*|LOG_LEVEL=$LOG_LEVEL|" \
        -e "s|^APP_URL=.*|APP_URL=$APP_URL|" \
        -e "s|^DEPLOYMENT_MODE=.*|DEPLOYMENT_MODE=$DEPLOYMENT_MODE|" \
        "$PROJECT_ROOT/.env"

    # Also update database credentials in docker-compose environment
    sed -i.bak \
        -e "s|\${DB_USER:-postgres}|$DB_USER|g" \
        -e "s|\${DB_PASSWORD:-postgres}|$DB_PASSWORD|g" \
        -e "s|\${DB_NAME:-constituent_response}|$DB_NAME|g" \
        -e "s|\${REDIS_PASSWORD:-redis}|$REDIS_PASSWORD|g" \
        "$PROJECT_ROOT/.env"

    rm -f "$PROJECT_ROOT/.env.bak"
    print_success "Updated .env file with configuration values"
}

# Start Docker containers
start_containers() {
    print_header "Starting Docker Containers"

    cd "$PROJECT_ROOT"
    docker-compose up -d
    print_success "Docker containers started"
}

# Wait for PostgreSQL to be healthy
wait_for_postgres() {
    print_header "Waiting for PostgreSQL to Be Ready"

    MAX_ATTEMPTS=30
    ATTEMPT=0

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if docker-compose exec -T postgres pg_isready -U "${DB_USER:-postgres}" >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            return 0
        fi

        ATTEMPT=$((ATTEMPT + 1))
        print_info "Waiting... ($ATTEMPT/$MAX_ATTEMPTS)"
        sleep 2
    done

    print_error "PostgreSQL did not become healthy in time"
    exit 1
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"

    cd "$PROJECT_ROOT"

    if docker-compose exec -T app npx prisma migrate deploy; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Seed database
seed_database() {
    print_header "Seeding Database"

    cd "$PROJECT_ROOT"

    # Check if prisma seed script exists
    if grep -q '"seed"' "$PROJECT_ROOT/package.json" 2>/dev/null; then
        if docker-compose exec -T app npx prisma db seed; then
            print_success "Database seeding completed"
        else
            print_warning "Database seeding failed or not configured"
        fi
    else
        print_info "No seed script found in package.json (optional)"
    fi
}

# Display completion message
display_success_message() {
    print_header "Setup Complete"

    echo
    echo "Your Constituent Response application is ready!"
    echo
    print_success "Services are running:"
    echo "  - Application: ${BLUE}${NEXTAUTH_URL}${NC}"
    echo "  - API: ${BLUE}${NEXTAUTH_URL}/api${NC}"
    echo "  - Database: postgres:5432"
    echo "  - Redis: redis:6379"
    echo "  - Worker: Running in background"
    echo
    print_info "Next steps:"
    echo "  1. Open your browser to ${BLUE}${NEXTAUTH_URL}${NC}"
    echo "  2. Sign in or create an account"
    echo "  3. Configure your tenant/organization settings"
    echo
    print_info "Useful commands:"
    echo "  View logs: docker-compose logs -f app"
    echo "  Stop services: docker-compose down"
    echo "  Backup database: ./scripts/backup.sh"
    echo
    print_info "Environment file location:"
    echo "  ${BLUE}$PROJECT_ROOT/.env${NC}"
    echo
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    cat << EOF
Usage: ./setup.sh [OPTIONS]

First-time setup script for Constituent Response application.

OPTIONS:
    -h, --help      Show this help message
    --no-interactive    Skip interactive prompts (use defaults)

This script will:
    1. Verify Docker and Docker Compose are installed
    2. Create .env configuration file
    3. Prompt for required configuration values
    4. Generate NEXTAUTH_SECRET
    5. Start Docker containers
    6. Run database migrations
    7. Seed initial data

EOF
    exit 0
fi

# Main execution
main() {
    print_header "Constituent Response - Initial Setup"
    echo

    check_docker
    check_docker_compose
    setup_env_file
    configure_environment
    start_containers
    wait_for_postgres
    run_migrations
    seed_database
    display_success_message
}

# Run main function
main

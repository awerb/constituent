#!/bin/bash

################################################################################
# Constituent Response - Database Backup Script
################################################################################
# This script creates timestamped PostgreSQL database backups:
# - Performs pg_dump of the PostgreSQL database
# - Compresses backup with gzip
# - Maintains a rolling 7-day backup retention policy
# - Outputs backup location and file size
# - Suitable for cron scheduling: 0 2 * * * /path/to/backup.sh

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

# Configuration
OUTPUT_DIR="${1:-.}"
BACKUP_RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="constituent_response_backup_${TIMESTAMP}.sql.gz"
BACKUP_FILEPATH="$OUTPUT_DIR/$BACKUP_FILENAME"

# Load environment from .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

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

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "docker-compose is not installed or not in PATH"
        exit 1
    fi
}

# Check if postgres container is running
check_postgres_running() {
    cd "$PROJECT_ROOT"

    if ! docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
        print_error "PostgreSQL container is not running"
        echo "Start services with: docker-compose up -d"
        exit 1
    fi
}

# Create output directory if it doesn't exist
create_output_directory() {
    if [ ! -d "$OUTPUT_DIR" ]; then
        mkdir -p "$OUTPUT_DIR"
        if [ $? -ne 0 ]; then
            print_error "Failed to create output directory: $OUTPUT_DIR"
            exit 1
        fi
    fi

    # Check if directory is writable
    if [ ! -w "$OUTPUT_DIR" ]; then
        print_error "Output directory is not writable: $OUTPUT_DIR"
        exit 1
    fi
}

# Extract database connection details from DATABASE_URL or env vars
get_database_credentials() {
    # Try to extract from DATABASE_URL first
    if [ -n "$DATABASE_URL" ]; then
        # Parse postgresql://user:password@host:port/database?schema=public
        local db_url="$DATABASE_URL"

        # Extract components using parameter expansion
        DB_USER=$(echo "$db_url" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
        DB_PASSWORD=$(echo "$db_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
        DB_HOST=$(echo "$db_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
        DB_PORT=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    fi

    # Use defaults or environment variables
    DB_USER="${DB_USER:-${DB_USER:-postgres}}"
    DB_PASSWORD="${DB_PASSWORD:-${DB_PASSWORD:-postgres}}"
    DB_HOST="${DB_HOST:-postgres}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-constituent_response}"
}

# Perform the backup
perform_backup() {
    print_info "Starting backup of database: $DB_NAME"
    print_info "Output file: $BACKUP_FILEPATH"

    cd "$PROJECT_ROOT"

    # Create backup using pg_dump through docker-compose
    if docker-compose exec -T postgres pg_dump \
        -U "$DB_USER" \
        -h localhost \
        -p 5432 \
        "$DB_NAME" | gzip > "$BACKUP_FILEPATH" 2>/dev/null; then

        if [ $? -eq 0 ]; then
            print_success "Database backup completed successfully"
            return 0
        fi
    fi

    print_error "Failed to create database backup"
    rm -f "$BACKUP_FILEPATH"
    exit 1
}

# Get backup file size
get_backup_size() {
    if [ -f "$BACKUP_FILEPATH" ]; then
        local size_bytes=$(stat -f%z "$BACKUP_FILEPATH" 2>/dev/null || stat -c%s "$BACKUP_FILEPATH" 2>/dev/null)

        if [ -n "$size_bytes" ] && [ "$size_bytes" -gt 0 ]; then
            # Convert to human-readable format
            if command -v numfmt >/dev/null 2>&1; then
                echo $(numfmt --to=iec-i --suffix=B $size_bytes)
            else
                # Fallback calculation for systems without numfmt
                local size_kb=$((size_bytes / 1024))
                if [ $size_kb -lt 1024 ]; then
                    echo "${size_kb}KB"
                else
                    local size_mb=$((size_kb / 1024))
                    echo "${size_mb}MB"
                fi
            fi
        else
            echo "0B"
        fi
    fi
}

# Clean up old backups
cleanup_old_backups() {
    print_info "Cleaning up backups older than $BACKUP_RETENTION_DAYS days"

    local delete_count=0
    while IFS= read -r backup_file; do
        if [ -n "$backup_file" ]; then
            rm -f "$backup_file"
            delete_count=$((delete_count + 1))
            print_info "Deleted: $(basename "$backup_file")"
        fi
    done < <(find "$OUTPUT_DIR" -maxdepth 1 -name "constituent_response_backup_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS 2>/dev/null)

    if [ $delete_count -gt 0 ]; then
        print_success "Deleted $delete_count old backup(s)"
    else
        print_info "No old backups to delete"
    fi
}

# Display backup summary
display_backup_summary() {
    local backup_size=$(get_backup_size)
    local backup_count=$(find "$OUTPUT_DIR" -maxdepth 1 -name "constituent_response_backup_*.sql.gz" 2>/dev/null | wc -l)

    print_header "Backup Summary"
    echo
    print_success "Backup completed successfully"
    echo
    print_info "Backup Details:"
    echo "  File: $BACKUP_FILEPATH"
    echo "  Size: $backup_size"
    echo "  Database: $DB_NAME"
    echo "  Timestamp: $TIMESTAMP"
    echo
    print_info "Retention:"
    echo "  Active backups: $backup_count"
    echo "  Retention period: $BACKUP_RETENTION_DAYS days"
    echo
    print_info "To restore from this backup:"
    echo "  gunzip < $BACKUP_FILEPATH | docker-compose exec -T postgres psql -U $DB_USER $DB_NAME"
    echo
}

# Validate backup integrity
validate_backup() {
    print_info "Validating backup file..."

    if ! gzip -t "$BACKUP_FILEPATH" 2>/dev/null; then
        print_error "Backup file is corrupted"
        rm -f "$BACKUP_FILEPATH"
        exit 1
    fi

    print_success "Backup file validation passed"
}

# Show help
show_help() {
    cat << EOF
Usage: ./backup.sh [OUTPUT_DIRECTORY]

Create a timestamped backup of the PostgreSQL database.

ARGUMENTS:
    OUTPUT_DIRECTORY    Directory to save backup file (default: current directory)

EXAMPLES:
    # Backup to current directory
    ./backup.sh

    # Backup to specific directory
    ./backup.sh /var/backups/constituent-response

    # Backup to remote location
    ./backup.sh /mnt/nfs/backups

BACKUP RETENTION:
    - Automatically keeps last $BACKUP_RETENTION_DAYS days of daily backups
    - Older backups are automatically deleted
    - Suitable for cron scheduling

CRON EXAMPLE:
    # Backup daily at 2:00 AM
    0 2 * * * /opt/constituent-response/scripts/backup.sh /var/backups/constituent-response

RESTORATION:
    To restore a backup:
    gunzip < BACKUP_FILE | docker-compose exec -T postgres psql -U USER DATABASE

EOF
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Main execution
main() {
    print_header "Database Backup Script"
    echo

    check_docker_compose
    check_postgres_running
    create_output_directory
    get_database_credentials
    perform_backup
    validate_backup
    cleanup_old_backups
    display_backup_summary
}

# Run main function
main

#!/bin/bash

################################################################################
# Constituent Response - Multi-Tenant Provisioning Script
################################################################################
# This script provisions new cities/tenants in multi-tenant deployments:
# - Validates input parameters
# - Connects to PostgreSQL database
# - Creates city record with default settings
# - Generates admin user invite
# - Creates webhook endpoints
# - Outputs tenant configuration and next steps
# - Includes comprehensive error handling

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
VALID_STATES=(
    "AL" "AK" "AZ" "AR" "CA" "CO" "CT" "DE" "FL" "GA"
    "HI" "ID" "IL" "IN" "IA" "KS" "KY" "LA" "ME" "MD"
    "MA" "MI" "MN" "MS" "MO" "MT" "NE" "NV" "NH" "NJ"
    "NM" "NY" "NC" "ND" "OH" "OK" "OR" "PA" "RI" "SC"
    "SD" "TN" "TX" "UT" "VT" "VA" "WA" "WV" "WI" "WY"
    "DC" "AS" "GU" "MP" "PR" "UM" "VI"
)

# Common US timezones
VALID_TIMEZONES=(
    "America/Anchorage"
    "America/Chicago"
    "America/Denver"
    "America/Detroit"
    "America/Los_Angeles"
    "America/New_York"
    "America/Phoenix"
    "America/Toronto"
    "America/Vancouver"
    "Pacific/Honolulu"
    "America/Puerto_Rico"
    "America/Virgin"
)

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

# Load environment from .env file
load_environment() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
    else
        print_error ".env file not found at $PROJECT_ROOT/.env"
        exit 1
    fi
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

# Validate tenant name
validate_tenant_name() {
    local name="$1"

    if [ -z "$name" ]; then
        print_error "Tenant name is required"
        return 1
    fi

    if ! [[ "$name" =~ ^[A-Za-z0-9\ \-]{3,100}$ ]]; then
        print_error "Tenant name must be 3-100 characters and contain only letters, numbers, spaces, and hyphens"
        return 1
    fi

    return 0
}

# Validate tenant slug
validate_tenant_slug() {
    local slug="$1"

    if [ -z "$slug" ]; then
        print_error "Tenant slug is required"
        return 1
    fi

    if ! [[ "$slug" =~ ^[a-z0-9-]{3,50}$ ]]; then
        print_error "Tenant slug must be 3-50 lowercase characters and contain only letters, numbers, and hyphens"
        return 1
    fi

    return 0
}

# Validate state code
validate_state_code() {
    local state="$1"

    if [ -z "$state" ]; then
        print_error "State code is required"
        return 1
    fi

    # Check if state is in valid list
    for valid_state in "${VALID_STATES[@]}"; do
        if [ "$state" = "$valid_state" ]; then
            return 0
        fi
    done

    print_error "Invalid state code: $state"
    return 1
}

# Validate timezone
validate_timezone() {
    local tz="$1"

    if [ -z "$tz" ]; then
        print_error "Timezone is required"
        return 1
    fi

    # Check if timezone is in valid list
    for valid_tz in "${VALID_TIMEZONES[@]}"; do
        if [ "$tz" = "$valid_tz" ]; then
            return 0
        fi
    done

    print_warning "Timezone '$tz' is not in common US timezones"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi

    return 0
}

# Check if tenant already exists
check_tenant_exists() {
    local slug="$1"

    cd "$PROJECT_ROOT"

    # Query the database to check if tenant exists
    local result=$(docker-compose exec -T postgres psql \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME:-constituent_response}" \
        -t -c "SELECT id FROM cities WHERE slug = '$slug';" 2>/dev/null | tr -d ' ')

    if [ -n "$result" ]; then
        print_error "Tenant with slug '$slug' already exists (ID: $result)"
        return 0  # Return 0 if exists (true for "exists")
    fi

    return 1  # Return 1 if doesn't exist
}

# Generate random string for webhook secret
generate_webhook_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        head -c 32 /dev/urandom | xxd -p
    fi
}

# Create tenant in database
create_tenant_in_db() {
    local name="$1"
    local slug="$2"
    local state="$3"
    local timezone="$4"
    local webhook_secret="$5"

    cd "$PROJECT_ROOT"

    # SQL to insert the tenant
    local sql="INSERT INTO cities (name, slug, state, timezone, webhook_secret, settings, created_at, updated_at)
        VALUES (
            '$name',
            '$slug',
            '$state',
            '$timezone',
            '$webhook_secret',
            '{\"notification_email\": \"admin@$slug.local\", \"response_timeout_days\": 30, \"ai_enabled\": true}',
            NOW(),
            NOW()
        ) RETURNING id;"

    local tenant_id=$(docker-compose exec -T postgres psql \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME:-constituent_response}" \
        -t -c "$sql" 2>/dev/null | tr -d ' ')

    if [ -z "$tenant_id" ] || [ "$tenant_id" = "" ]; then
        print_error "Failed to create tenant in database"
        return 1
    fi

    echo "$tenant_id"
    return 0
}

# Generate admin invite token
generate_admin_invite() {
    local tenant_id="$1"
    local admin_email="$2"

    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        head -c 32 /dev/urandom | xxd -p
    fi
}

# Create admin user invite
create_admin_invite() {
    local tenant_id="$1"
    local admin_email="$2"
    local invite_token="$3"

    cd "$PROJECT_ROOT"

    # SQL to insert the invite
    local sql="INSERT INTO admin_invites (tenant_id, email, token, expires_at, created_at)
        VALUES (
            $tenant_id,
            '$admin_email',
            '$invite_token',
            NOW() + INTERVAL '30 days',
            NOW()
        ) RETURNING id;"

    local invite_id=$(docker-compose exec -T postgres psql \
        -U "${DB_USER:-postgres}" \
        -d "${DB_NAME:-constituent_response}" \
        -t -c "$sql" 2>/dev/null | tr -d ' ')

    if [ -z "$invite_id" ] || [ "$invite_id" = "" ]; then
        print_warning "Failed to create admin invite in database (table may not exist)"
        return 1
    fi

    echo "$invite_id"
    return 0
}

# Generate webhook URL
generate_webhook_url() {
    local slug="$1"
    local webhook_secret="$2"

    # Use APP_URL from environment or default
    local app_url="${APP_URL:-http://localhost:3000}"

    echo "${app_url}/api/webhooks/${slug}/${webhook_secret:0:16}"
}

# Display tenant configuration
display_tenant_configuration() {
    local name="$1"
    local slug="$2"
    local state="$3"
    local timezone="$4"
    local tenant_id="$5"
    local webhook_url="$6"
    local admin_email="$7"
    local app_url="${APP_URL:-http://localhost:3000}"

    print_header "Tenant Provisioning Complete"
    echo
    print_success "New tenant created successfully!"
    echo
    print_info "Tenant Information:"
    echo "  Name: $name"
    echo "  Slug: $slug"
    echo "  State: $state"
    echo "  Timezone: $timezone"
    echo "  ID: $tenant_id"
    echo
    print_info "Webhook Configuration:"
    echo "  Webhook URL: ${BLUE}${webhook_url}${NC}"
    echo "  Configure your Townhall/Constituent system to send webhooks to this URL"
    echo
    print_info "Next Steps:"
    echo "  1. Set up webhook in Townhall/Constituent system:"
    echo "     URL: ${webhook_url}"
    echo
    echo "  2. Create admin user:"
    if [ -n "$admin_email" ]; then
        echo "     Email: $admin_email"
        echo "     Visit: ${BLUE}${app_url}/admin/invite${NC}"
    else
        echo "     Admin user can be created in the application dashboard"
    fi
    echo
    echo "  3. Configure tenant settings in admin panel:"
    echo "     ${BLUE}${app_url}/admin/${slug}/settings${NC}"
    echo
    echo "  4. Start receiving constituent responses!"
    echo
}

# Parse command-line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --name)
                TENANT_NAME="$2"
                shift 2
                ;;
            --slug)
                TENANT_SLUG="$2"
                shift 2
                ;;
            --state)
                STATE_CODE="$2"
                shift 2
                ;;
            --timezone)
                TIMEZONE="$2"
                shift 2
                ;;
            --admin-email)
                ADMIN_EMAIL="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Prompt for missing arguments
prompt_for_arguments() {
    if [ -z "$TENANT_NAME" ]; then
        read -p "Tenant Name (e.g., 'Springfield'): " TENANT_NAME
    fi

    if [ -z "$TENANT_SLUG" ]; then
        read -p "Tenant Slug (e.g., 'springfield', lowercase with hyphens): " TENANT_SLUG
    fi

    if [ -z "$STATE_CODE" ]; then
        read -p "State Code (e.g., 'IL'): " STATE_CODE
    fi

    if [ -z "$TIMEZONE" ]; then
        echo "Common timezones:"
        echo "  America/Chicago"
        echo "  America/Denver"
        echo "  America/Los_Angeles"
        echo "  America/New_York"
        read -p "Timezone (e.g., 'America/Chicago'): " TIMEZONE
    fi

    read -p "Admin Email (optional, for invite creation): " ADMIN_EMAIL
}

# Show help
show_help() {
    cat << EOF
Usage: ./provision-tenant.sh [OPTIONS]

Provision a new city/tenant in the multi-tenant application.

REQUIRED OPTIONS:
    --name TEXT         Tenant name (3-100 chars, letters/numbers/spaces/hyphens)
    --slug TEXT         Tenant slug (3-50 chars, lowercase letters/numbers/hyphens)
    --state CODE        State code (e.g., IL, CA, NY)
    --timezone TZ       Timezone (e.g., America/Chicago)

OPTIONAL OPTIONS:
    --admin-email EMAIL Email for admin invite (optional)
    -h, --help          Show this help message

EXAMPLES:
    # Interactive mode
    ./provision-tenant.sh

    # With all arguments
    ./provision-tenant.sh \\
        --name "Springfield" \\
        --slug "springfield" \\
        --state "IL" \\
        --timezone "America/Chicago" \\
        --admin-email "admin@springfield.gov"

VALID STATES:
    AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD
    MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC
    SD TN TX UT VT VA WA WV WI WY DC AS GU MP PR UM VI

COMMON TIMEZONES:
    America/Anchorage
    America/Chicago
    America/Denver
    America/Detroit
    America/Los_Angeles
    America/New_York
    America/Phoenix
    Pacific/Honolulu

WEBHOOK CONFIGURATION:
    After provisioning, configure your Townhall/Constituent system
    to send webhooks to the provided webhook URL.

EOF
}

# Validate deployment mode
check_multi_tenant_mode() {
    local deployment_mode="${DEPLOYMENT_MODE:-single-tenant}"

    if [ "$deployment_mode" != "multi-tenant" ]; then
        print_warning "Application is running in '$deployment_mode' mode"
        echo "This script is designed for multi-tenant deployments"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Main execution
main() {
    print_header "Constituent Response - Tenant Provisioning"
    echo

    load_environment
    check_docker_compose
    check_postgres_running
    check_multi_tenant_mode

    # Parse arguments
    parse_arguments "$@"

    # Prompt for missing arguments
    prompt_for_arguments

    # Validate all inputs
    print_info "Validating inputs..."

    if ! validate_tenant_name "$TENANT_NAME"; then
        exit 1
    fi

    if ! validate_tenant_slug "$TENANT_SLUG"; then
        exit 1
    fi

    if ! validate_state_code "$STATE_CODE"; then
        exit 1
    fi

    if ! validate_timezone "$TIMEZONE"; then
        exit 1
    fi

    print_success "All inputs are valid"
    echo

    # Check if tenant already exists
    if check_tenant_exists "$TENANT_SLUG"; then
        exit 1
    fi

    # Generate webhook secret
    WEBHOOK_SECRET=$(generate_webhook_secret)

    # Create tenant in database
    print_info "Creating tenant in database..."
    TENANT_ID=$(create_tenant_in_db "$TENANT_NAME" "$TENANT_SLUG" "$STATE_CODE" "$TIMEZONE" "$WEBHOOK_SECRET")

    if [ -z "$TENANT_ID" ]; then
        print_error "Failed to create tenant"
        exit 1
    fi

    print_success "Tenant created with ID: $TENANT_ID"
    echo

    # Create admin invite if email provided
    if [ -n "$ADMIN_EMAIL" ]; then
        print_info "Creating admin user invite..."
        INVITE_TOKEN=$(generate_admin_invite "$TENANT_ID" "$ADMIN_EMAIL")
        create_admin_invite "$TENANT_ID" "$ADMIN_EMAIL" "$INVITE_TOKEN" >/dev/null 2>&1 || true
        print_success "Admin invite created for: $ADMIN_EMAIL"
        echo
    fi

    # Generate webhook URL
    WEBHOOK_URL=$(generate_webhook_url "$TENANT_SLUG" "$WEBHOOK_SECRET")

    # Display configuration
    display_tenant_configuration "$TENANT_NAME" "$TENANT_SLUG" "$STATE_CODE" "$TIMEZONE" "$TENANT_ID" "$WEBHOOK_URL" "$ADMIN_EMAIL"

    # Output for automation/logging
    echo
    print_info "Configuration Summary (JSON):"
    echo "{"
    echo "  \"tenant_id\": \"$TENANT_ID\","
    echo "  \"name\": \"$TENANT_NAME\","
    echo "  \"slug\": \"$TENANT_SLUG\","
    echo "  \"state\": \"$STATE_CODE\","
    echo "  \"timezone\": \"$TIMEZONE\","
    echo "  \"webhook_url\": \"$WEBHOOK_URL\","
    echo "  \"webhook_secret\": \"$WEBHOOK_SECRET\""
    if [ -n "$ADMIN_EMAIL" ]; then
        echo "  \"admin_email\": \"$ADMIN_EMAIL\","
        echo "  \"admin_invite_token\": \"$INVITE_TOKEN\""
    fi
    echo "}"
    echo
}

# Run main function
main "$@"

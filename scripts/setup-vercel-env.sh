#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENV_FILE=".env.local"
VARS_TO_SYNC=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "VITE_GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "GOOGLE_REDIRECT_URI"
    "TOKENS_ENCRYPTION_KEY"
    "VITE_GEMINI_API_KEY"
)

echo -e "${BLUE}🔧 Vercel Environment Variables Setup${NC}"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ $ENV_FILE not found.${NC}"
    exit 1
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not installed. Run 'bun add -g vercel' first.${NC}"
    exit 1
fi

# Parse args
BATCH_MODE=false
for arg in "$@"; do
    if [ "$arg" == "--batch" ]; then
        BATCH_MODE=true
    fi
done

# Function to get value from .env.local
get_env_value() {
    local key=$1
    grep "^$key=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'"
}

# Function to add env var
add_vercel_env() {
    local key=$1
    local value=$2
    local env=$3

    echo -n "$value" | vercel env add "$key" "$env"
}

echo -e "${YELLOW}Reading variables from $ENV_FILE...${NC}"

for var in "${VARS_TO_SYNC[@]}"; do
    local_val=$(get_env_value "$var")

    if [ -z "$local_val" ]; then
        echo -e "${YELLOW}⚠️  $var not found in .env.local. Skipping.${NC}"
        continue
    fi

    echo -e "\n${BLUE}Configuring $var${NC}"
    echo "Current local value: ${local_val:0:10}..."

    if [ "$BATCH_MODE" = false ]; then
        read -p "Use this value? (y/n/custom): " choice
        case "$choice" in
            y|Y) value="$local_val" ;;
            n|N) continue ;;
            custom)
                read -p "Enter value: " value
                ;;
            *) continue ;;
        esac
    else
        value="$local_val"
    fi

    # Add to all environments
    echo "Adding to Production..."
    echo -n "$value" | vercel env add "$var" production > /dev/null 2>&1 || echo "  Failed or already exists"

    echo "Adding to Preview..."
    echo -n "$value" | vercel env add "$var" preview > /dev/null 2>&1 || echo "  Failed or already exists"

    echo "Adding to Development..."
    echo -n "$value" | vercel env add "$var" development > /dev/null 2>&1 || echo "  Failed or already exists"

    echo -e "${GREEN}Done.${NC}"
done

echo -e "\n${GREEN}✅ Environment setup complete!${NC}"
echo "Run 'vercel env ls' to verify."


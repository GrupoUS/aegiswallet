#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 AegisWallet Vercel Deployment Script${NC}"

# Function to check command existence
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}❌ Error: $1 is not installed.${NC}"
        exit 1
    fi
}

# Parse arguments
SKIP_TESTS=false
SKIP_BUILD=false
PROD_DIRECT=false

for arg in "$@"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --prod-direct)
            PROD_DIRECT=true
            shift
            ;;
    esac
done

# 1. Validation
echo -e "\n${YELLOW}🔍 Phase 1: Validation...${NC}"
check_command "vercel"
check_command "bun"

if [ "$SKIP_TESTS" = false ]; then
    echo "Running quality checks..."
    if ! bun run quality; then
        echo -e "${RED}❌ Quality checks failed. Aborting deployment.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Quality checks passed.${NC}"
else
    echo -e "${YELLOW}⚠️ Skipping quality checks.${NC}"
fi

# 2. Build
echo -e "\n${YELLOW}🏗️ Phase 2: Build...${NC}"
if [ "$SKIP_BUILD" = false ]; then
    echo "Pulling Vercel environment..."
    if ! vercel pull --yes; then
        echo -e "${RED}❌ Vercel pull failed. Make sure you are logged in and project is linked.${NC}"
        exit 1
    fi

    echo "Building project for Vercel..."
    if ! vercel build; then
        echo -e "${RED}❌ Vercel build failed. Aborting deployment.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Build successful.${NC}"
else
    echo -e "${YELLOW}⚠️ Skipping build.${NC}"
fi

# 3. Deployment
echo -e "\n${YELLOW}🚀 Phase 3: Deployment...${NC}"

if [ "$PROD_DIRECT" = true ]; then
    echo "Deploying directly to Production..."
    DEPLOY_CMD="vercel deploy --prod --prebuilt"
else
    echo "Deploying to Preview..."
    DEPLOY_CMD="vercel deploy --prebuilt"
fi

echo "Executing: $DEPLOY_CMD"
if $DEPLOY_CMD; then
    echo -e "\n${GREEN}✅ Deployment initiated successfully!${NC}"
else
    echo -e "\n${RED}❌ Deployment failed.${NC}"
    exit 1
fi

# 4. Post-Deploy info
echo -e "\n${YELLOW}ℹ️  Next steps:${NC}"
echo "1. Verify deployment URL above"
echo "2. Check logs: vercel logs [url]"
if [ "$PROD_DIRECT" = false ]; then
    echo "3. To promote to production: vercel promote [url]"
fi

exit 0


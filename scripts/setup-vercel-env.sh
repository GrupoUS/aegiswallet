#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up Vercel Environment Variables${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}   npm install -g vercel${NC}"
    exit 1
fi

# Check if project is linked
if [ ! -f .vercel/project.json ]; then
    echo -e "${YELLOW}⚠️  Project not linked to Vercel. Please run:${NC}"
    echo -e "${YELLOW}   vercel link${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Setting up environment variables...${NC}"

# Production environment variables
echo -e "${YELLOW}Setting Production Environment Variables:${NC}"

# Database Configuration
vercel env add DATABASE_URL production <<< "${DATABASE_URL:-}"
vercel env add DATABASE_URL_UNPOOLED production <<< "${DATABASE_URL_UNPOOLED:-}"

# Clerk Configuration
vercel env add VITE_CLERK_PUBLISHABLE_KEY production <<< "${VITE_CLERK_PUBLISHABLE_KEY:-}"
vercel env add CLERK_SECRET_KEY production <<< "${CLERK_SECRET_KEY:-}"
vercel env add CLERK_WEBHOOK_SECRET production <<< "${CLERK_WEBHOOK_SECRET:-}"

# App Configuration
vercel env add VITE_APP_ENV production <<< "production"
vercel env add VITE_API_URL production <<< "https://aegiswallet.vercel.app"
vercel env add VITE_SITE_URL production <<< "https://aegiswallet.vercel.app"

# Google OAuth
vercel env add VITE_GOOGLE_CLIENT_ID production <<< "${VITE_GOOGLE_CLIENT_ID:-}"
vercel env add GOOGLE_CLIENT_SECRET production <<< "${GOOGLE_CLIENT_SECRET:-}"
vercel env add GOOGLE_REDIRECT_URI production <<< "https://aegiswallet.vercel.app/api/v1/google-calendar/auth/callback"

# Stripe Configuration
vercel env add STRIPE_SECRET_KEY production <<< "${STRIPE_SECRET_KEY:-}"
vercel env add STRIPE_PUBLISHABLE_KEY production <<< "${STRIPE_PUBLISHABLE_KEY:-}"
vercel env add STRIPE_WEBHOOK_SECRET production <<< "${STRIPE_WEBHOOK_SECRET:-}"
vercel env add STRIPE_SUCCESS_URL production <<< "${STRIPE_SUCCESS_URL:-https://aegiswallet.vercel.app/billing/success}"
vercel env add STRIPE_CANCEL_URL production <<< "${STRIPE_CANCEL_URL:-https://aegiswallet.vercel.app/billing/cancel}"
vercel env add STRIPE_PORTAL_RETURN_URL production <<< "${STRIPE_PORTAL_RETURN_URL:-https://aegiswallet.vercel.app/settings/billing}"

# AI Services (Secret)
vercel env add ANTHROPIC_API_KEY production <<< "${ANTHROPIC_API_KEY:-}"
vercel env add OPENROUTER_API_KEY production <<< "${OPENROUTER_API_KEY:-}"
vercel env add GEMINI_API_KEY production <<< "${GEMINI_API_KEY:-}"
vercel env add OPENAI_API_KEY production <<< "${OPENAI_API_KEY:-}"

# Search Services (Secret)
vercel env add TAVILY_API_KEY production <<< "${TAVILY_API_KEY:-}"
vercel env add EXA_API_KEY production <<< "${EXA_API_KEY:-}"
vercel env add UPSTASH_CONTEXT7_API_KEY production <<< "${UPSTASH_CONTEXT7_API_KEY:-}"
vercel env add GITHUB_PERSONAL_ACCESS_TOKEN production <<< "${GITHUB_PERSONAL_ACCESS_TOKEN:-}"
vercel env add JINA_API_KEY production <<< "${JINA_API_KEY:-}"

# Supabase MCP (Secret)
vercel env add SUPABASE_ACCESS_TOKEN production <<< "${SUPABASE_ACCESS_TOKEN:-}"
vercel env add SUPABASE_PROJECT_REF production <<< "${SUPABASE_PROJECT_REF:-}"

# Feature Flags
vercel env add VITE_ENABLE_THEME_TOGGLE production <<< "true"
vercel env add VITE_LGPD_ENABLED production <<< "true"
vercel env add VITE_AUDIT_LOGGING_ENABLED production <<< "true"

echo -e "${GREEN}✅ Production environment variables set!${NC}"

# Preview environment variables (same as production for now)
echo -e "${YELLOW}Setting Preview Environment Variables (same as production):${NC}"

# Database Configuration
vercel env add DATABASE_URL preview <<< "${DATABASE_URL:-}"
vercel env add DATABASE_URL_UNPOOLED preview <<< "${DATABASE_URL_UNPOOLED:-}"

# Clerk Configuration
vercel env add VITE_CLERK_PUBLISHABLE_KEY preview <<< "${VITE_CLERK_PUBLISHABLE_KEY:-}"
vercel env add CLERK_SECRET_KEY preview <<< "${CLERK_SECRET_KEY:-}"
vercel env add CLERK_WEBHOOK_SECRET preview <<< "${CLERK_WEBHOOK_SECRET:-}"

# App Configuration
vercel env add VITE_APP_ENV preview <<< "preview"
vercel env add VITE_API_URL preview <<< "https://aegiswallet.vercel.app"
vercel env add VITE_SITE_URL preview <<< "https://aegiswallet.vercel.app"

# Google OAuth
vercel env add VITE_GOOGLE_CLIENT_ID preview <<< "${VITE_GOOGLE_CLIENT_ID:-}"
vercel env add GOOGLE_CLIENT_SECRET preview <<< "${GOOGLE_CLIENT_SECRET:-}"
vercel env add GOOGLE_REDIRECT_URI preview <<< "https://aegiswallet.vercel.app/api/v1/google-calendar/auth/callback"

# Stripe Configuration
vercel env add STRIPE_SECRET_KEY preview <<< "${STRIPE_SECRET_KEY:-}"
vercel env add STRIPE_PUBLISHABLE_KEY preview <<< "${STRIPE_PUBLISHABLE_KEY:-}"
vercel env add STRIPE_WEBHOOK_SECRET preview <<< "${STRIPE_WEBHOOK_SECRET:-}"
vercel env add STRIPE_SUCCESS_URL preview <<< "${STRIPE_SUCCESS_URL:-https://aegiswallet.vercel.app/billing/success}"
vercel env add STRIPE_CANCEL_URL preview <<< "${STRIPE_CANCEL_URL:-https://aegiswallet.vercel.app/billing/cancel}"
vercel env add STRIPE_PORTAL_RETURN_URL preview <<< "${STRIPE_PORTAL_RETURN_URL:-https://aegiswallet.vercel.app/settings/billing}"

# AI Services (Secret)
vercel env add ANTHROPIC_API_KEY preview <<< "${ANTHROPIC_API_KEY:-}"
vercel env add OPENROUTER_API_KEY preview <<< "${OPENROUTER_API_KEY:-}"
vercel env add GEMINI_API_KEY preview <<< "${GEMINI_API_KEY:-}"
vercel env add OPENAI_API_KEY preview <<< "${OPENAI_API_KEY:-}"

# Search Services (Secret)
vercel env add TAVILY_API_KEY preview <<< "${TAVILY_API_KEY:-}"
vercel env add EXA_API_KEY preview <<< "${EXA_API_KEY:-}"
vercel env add UPSTASH_CONTEXT7_API_KEY preview <<< "${UPSTASH_CONTEXT7_API_KEY:-}"
vercel env add GITHUB_PERSONAL_ACCESS_TOKEN preview <<< "${GITHUB_PERSONAL_ACCESS_TOKEN:-}"
vercel env add JINA_API_KEY preview <<< "${JINA_API_KEY:-}"

# Supabase MCP (Secret)
vercel env add SUPABASE_ACCESS_TOKEN preview <<< "${SUPABASE_ACCESS_TOKEN:-}"
vercel env add SUPABASE_PROJECT_REF preview <<< "${SUPABASE_PROJECT_REF:-}"

# Feature Flags
vercel env add VITE_ENABLE_THEME_TOGGLE preview <<< "true"
vercel env add VITE_LGPD_ENABLED preview <<< "true"
vercel env add VITE_AUDIT_LOGGING_ENABLED preview <<< "true"

echo -e "${GREEN}✅ Preview environment variables set!${NC}"

# Development environment variables (for local development)
echo -e "${YELLOW}Setting Development Environment Variables (for local .env):${NC}"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << EOF
# Database Configuration
DATABASE_URL="${DATABASE_URL:-}"
DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-}"

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY="${VITE_CLERK_PUBLISHABLE_KEY:-}"
CLERK_SECRET_KEY="${CLERK_SECRET_KEY:-}"
CLERK_WEBHOOK_SECRET="${CLERK_WEBHOOK_SECRET:-}"

# App Configuration
VITE_APP_ENV="development"
VITE_API_URL="http://localhost:3000"
VITE_SITE_URL="http://localhost:5173"

# Google OAuth
VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/v1/google-calendar/auth/callback"

# Stripe Configuration
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"
STRIPE_SUCCESS_URL="http://localhost:5173/billing/success"
STRIPE_CANCEL_URL="http://localhost:5173/billing/cancel"
STRIPE_PORTAL_RETURN_URL="http://localhost:5173/settings/billing"

# AI Services
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"

# Search Services
TAVILY_API_KEY="${TAVILY_API_KEY:-}"
EXA_API_KEY="${EXA_API_KEY:-}"
UPSTASH_CONTEXT7_API_KEY="${UPSTASH_CONTEXT7_API_KEY:-}"
GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-}"
JINA_API_KEY="${JINA_API_KEY:-}"

# Supabase MCP
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

# Feature Flags
VITE_ENABLE_THEME_TOGGLE=true
VITE_LGPD_ENABLED=true
VITE_AUDIT_LOGGING_ENABLED=true
EOF
    echo -e "${GREEN}✅ Created .env.local file${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local already exists. Please update it manually if needed.${NC}"
fi

echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo -e "${YELLOW}📋 Summary:${NC}"
echo -e "   - Production environment variables set in Vercel"
echo -e "   - Preview environment variables set in Vercel"
echo -e "   - Development environment variables in .env.local"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "   1. Run: bun run build"
echo -e "   2. Run: bun run deploy:vercel:preview"
echo -e "   3. Test the deployment"
echo -e "   4. Run: bun run deploy:vercel:prod (for production)"

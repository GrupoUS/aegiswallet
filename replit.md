# AegisWallet

## Overview

AegisWallet is a voice-first autonomous financial assistant designed specifically for the Brazilian market. It is NOT a cryptocurrency wallet. The application provides personal finance management with PIX integration, LGPD compliance, and progressive AI autonomy (targeting 50% → 95% automation of financial tasks).

Key characteristics:
- **Target Market**: Brazil (Portuguese-first interfaces, PIX/boleto payments)
- **Primary Interface**: Voice commands in Brazilian Portuguese
- **Compliance**: LGPD (Brazilian data protection), WCAG 2.1 AA+ accessibility
- **Architecture**: Full-stack monorepo with React frontend and Hono API backend

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript strict mode
- **Routing**: TanStack Router with file-based route generation
- **State Management**: TanStack Query for server state, React hooks for local state
- **Styling**: Tailwind CSS 4.x with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with Bun runtime

### Backend Architecture
- **Runtime**: Bun (development), Node.js 20 (production/Vercel)
- **Framework**: Hono with RPC-style endpoints
- **API Structure**: RESTful v1 API at `/api/v1/*`
- **Authentication**: Clerk with webhook-based user sync
- **Validation**: Zod schemas for request/response validation

### Database Layer
- **Database**: PostgreSQL (Replit in development, Neon in production)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Security**: Row Level Security (RLS) policies for multi-tenant isolation
- **Connection**: Universal client that works with both Neon and standard PostgreSQL
- **Schema Location**: `src/db/schema/**/*.ts`

### Authentication Flow
- Clerk handles all authentication (OAuth, email, SSO)
- User sync via Clerk webhooks to Neon database
- Service account pattern for administrative database operations
- RLS policies enforce user data isolation

### Code Quality
- **Linting/Formatting**: Biome (replaces ESLint/Prettier)
- **Type Checking**: TypeScript strict mode, no `any` types
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Commits**: Conventional Commits format

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting with connection pooling (SSL mode: verify-full)
- **Clerk**: Authentication, user management, and webhooks
- **Vercel**: Deployment platform with Edge Functions

### AI/ML Services
- **Google Generative AI**: Gemini models for AI assistant
- **Anthropic**: Claude models (alternative AI provider)
- **OpenAI**: GPT models (alternative AI provider)

### Payment & Financial
- **Stripe**: Subscription billing and payment processing
- **PIX Integration**: Brazilian instant payment system (planned)

### Optional Integrations
- **Google Calendar**: Bidirectional sync for financial events
- **Vercel Blob**: File storage

### Environment Variables Required
```
DATABASE_URL              # Neon pooled connection
DATABASE_URL_UNPOOLED     # Neon direct connection (migrations)
VITE_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
VITE_API_URL
```
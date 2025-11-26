---
title: "AegisWallet Technology Stack"
last_updated: 2025-11-25
form: reference
tags: [tech-stack, bun, react, typescript, supabase, hono-rpc, hono]
related:
  - ../architecture/source-tree.md
  - ../architecture/coding-standards.md
  - ../prd.md
---

# AegisWallet Technology Stack

## Overview

This document defines the **DEFINITIVE** technology selection for the entire AegisWallet project. All development must use these exact versions and configurations to ensure consistency, security, and performance targets are met for the Brazilian autonomous financial assistant.

## Core Principles

- **Performance First**: Sub-150ms voice response times for optimal user experience
- **Type Safety**: End-to-end TypeScript prevents runtime errors in financial transactions
- **Edge-First**: Serverless architecture for optimal performance in Brazilian market
- **Security at Every Layer**: LGPD compliance and financial data protection
- **Developer Experience**: Modern tooling for rapid development velocity

## Technology Stack Matrix

### Core Runtime & Languages

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Bun** | Latest | Package management and runtime | 3-5x faster than npm/pnpm, native TypeScript support |
| **TypeScript** | 5.9.3 | Type-safe development (frontend & backend) | Prevents runtime errors in financial interfaces, end-to-end type safety |
| **Node.js** | Compatible | Runtime compatibility | Bun provides Node.js compatibility for ecosystem libraries |

### Frontend Framework & Libraries

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **React** | 19.2.0 | Voice-first mobile interface | Latest features for voice processing and mobile optimization |
| **React DOM** | 19.2.0 | React rendering | Required for React 19 web applications |
| **TanStack Router** | 1.132.41 | Type-safe routing | File-based routing with full TypeScript support |
| **TanStack Query** | 5.90.2 | Server state management | Real-time financial data synchronization, caching, optimistic updates |
| **TanStack Query Devtools** | 5.90.2 | Development debugging | Query inspection and debugging tools |

### Routing & State Management

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **TanStack Router** | 1.132.41 | Client-side routing | Type-safe, file-based routing with code splitting |
| **Zustand** | 5.0.8 | Client state management | Lightweight, simple state management for UI state |
| **TanStack Query** | 5.90.2 | Server state management | Handles server data fetching, caching, and synchronization |

### UI Components & Styling

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **shadcn/ui** | 3.4.0 | UI component library | WCAG 2.1 AA compliant, accessible, professional design |
| **Radix UI** | Various | Headless UI primitives | Accessible, unstyled components (Avatar, Dialog, Dropdown, etc.) |
| **Tailwind CSS** | 4.1.14 | Utility-first styling | Rapid UI development, consistent design system |
| **@tailwindcss/postcss** | 4.1.14 | PostCSS plugin | Tailwind CSS v4 PostCSS integration |
| **tailwindcss-animate** | 1.0.7 | Animation utilities | Pre-built animation classes for Tailwind |
| **tailwind-merge** | 3.3.1 | Class merging utility | Intelligent Tailwind class merging without conflicts |
| **class-variance-authority** | 0.7.1 | Variant management | Type-safe component variants and styling |
| **clsx** | 2.1.1 | Conditional classes | Utility for constructing className strings |
| **next-themes** | 0.4.6 | Theme management | Dark/light mode with system preference support |

### Backend & API

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Hono** | 4.10.4 | Edge-first API framework | Sub-150ms response times, lightweight, modern |
| **@hono/node-server** | 1.19.5 | Node.js adapter | Runs Hono on Node.js/Bun runtime |
| **@hono/zod-validator** | 0.5.0 | Request validation middleware | Type-safe input validation with Zod schemas |
| **Hono RPC** | (via Hono) | Type-safe HTTP endpoints | Simpler than tRPC, ~50KB bundle reduction, clearer stack traces |

> **Note**: The project migrated from tRPC to Hono RPC. See `docs/architecture/hono-rpc-architecture.md` for details.

### Database & Infrastructure

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Supabase** | 2.48.3 (CLI) | Backend infrastructure | PostgreSQL + Auth + Realtime + Storage + RLS |
| **@supabase/supabase-js** | 2.74.0 | Supabase client | JavaScript client for Supabase services |
| **PostgreSQL** | Latest (via Supabase) | Relational database | ACID compliance, complex queries, financial data integrity |
| **Supabase Auth** | Included | User authentication | Secure, social login support, JWT-based |
| **Supabase Realtime** | Included | Real-time data sync | Live financial updates for autonomous assistant |
| **Supabase Storage** | Included | File storage | Receipts, documents, voice recordings |
| **Row Level Security (RLS)** | Included | Data access control | Tenant isolation, LGPD compliance |

### Forms & Validation

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **React Hook Form** | 7.64.0 | Form state management | Performant, flexible form handling with minimal re-renders |
| **@hookform/resolvers** | 5.2.2 | Validation resolvers | Integration with Zod and other validation libraries |
| **Zod** | 4.1.12 | Schema validation | Runtime validation for all external inputs, type inference |

### Animation & Interactions

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Motion (Framer Motion)** | 12.23.22 | Animation library | Smooth, performant animations for UI interactions |
| **@dnd-kit/core** | 6.3.1 | Drag and drop | Accessible drag-and-drop functionality |
| **@dnd-kit/modifiers** | 9.0.0 | DnD modifiers | Snap-to-grid, constraints, and other DnD behaviors |
| **@dnd-kit/utilities** | 3.2.2 | DnD utilities | Helper functions for drag-and-drop operations |
| **React Aria Components** | 1.13.0 | Accessible interactions | Adobe's accessible component primitives |

### Icons & Assets

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Lucide React** | 0.544.0 | Primary icon library | Beautiful, consistent icons with React components |
| **@tabler/icons-react** | 3.35.0 | Additional icons | Extended icon set for financial interfaces |
| **@remixicon/react** | 4.6.0 | Remix icons | Additional icon options for UI variety |
| **React QR Code** | 2.0.18 | QR code generation | PIX payment QR codes and authentication |

### Data Visualization & Charts

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Recharts** | 3.2.1 | Chart library | Composable charting library for financial data visualization |
| **React Day Picker** | 9.11.0 | Date picker | Accessible date selection for financial calendars |
| **date-fns** | 4.1.0 | Date utilities | Modern date manipulation and formatting |

### Development Tools

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Vite** | 7.1.9 | Build tool & dev server | Fast HMR, optimized builds, TypeScript support |
| **@vitejs/plugin-react** | 5.0.4 | React plugin | React Fast Refresh and JSX support |
| **Concurrently** | 9.2.1 | Script runner | Run multiple dev servers simultaneously |
| **Terser** | 5.44.0 | JavaScript minifier | Production code minification |

### Testing

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Vitest** | 3.2.4 | Unit & integration testing | 3-5x faster than Jest, excellent TypeScript support |
| **@vitest/ui** | 3.2.4 | Test UI | Visual test runner and debugging interface |
| **@vitest/coverage-v8** | 3.2.4 | Code coverage | V8 coverage provider for accurate metrics |
| **@testing-library/react** | 16.3.0 | React testing utilities | User-centric testing approach |
| **@testing-library/jest-dom** | 6.9.1 | DOM matchers | Custom matchers for DOM assertions |
| **jsdom** | 27.0.0 | DOM implementation | Browser environment simulation for tests |

### Code Quality & Linting

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **OXLint** | 1.19.0 | Primary linter | 50-100x faster than ESLint, Rust-based |
| **Biome** | 2.2.5 | Code formatter | Fast, opinionated code formatting |
| **TypeScript** | 5.9.3 | Type checking | Strict mode enabled for maximum type safety |

### Build & Deployment

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Vite** | 7.1.9 | Production bundler | Tree-shaking, code splitting, optimized builds |
| **PostCSS** | 8.5.6 | CSS processing | Tailwind CSS processing and optimization |
| **Autoprefixer** | 10.4.21 | CSS vendor prefixes | Automatic browser compatibility |
| **Supabase CLI** | 2.48.3 | Database migrations | Declarative database management, type generation |

### Additional Utilities

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **lovable-tagger** | 1.1.10 | Development utility | Project-specific tagging and organization |
| **Sonner** | 2.0.7 | Toast notifications | Beautiful, accessible toast notifications |

## Key Architectural Decisions

### Edge-First Performance
- **Hono Framework**: Lightweight, edge-optimized API framework for sub-150ms TTFB
- **Supabase Edge Functions**: Serverless backend with Brazilian region deployment
- **Vite Build Optimization**: Code splitting and tree-shaking for minimal bundle size
- **TanStack Query Caching**: Intelligent client-side caching reduces server requests

### Type Safety End-to-End
- **TypeScript Strict Mode**: Prevents entire classes of runtime errors
- **Hono RPC + Zod**: Type-safe API endpoints with shared validation schemas
- **Zod Validation**: Runtime validation for all external inputs
- **Generated Database Types**: Direct mapping from Postgres schema to TypeScript
- **React Hook Form + Zod**: Type-safe form validation and submission

### Real-Time Financial Data
- **Supabase Realtime**: Live transaction updates and account balance changes
- **TanStack Query**: Optimistic updates for instant UI feedback
- **WebSocket Connections**: Persistent connections for real-time notifications
- **Conflict Resolution**: Automatic handling of concurrent financial operations

### Security & Compliance
- **Row Level Security (RLS)**: Tenant isolation in shared database
- **LGPD Compliance**: Brazilian data protection regulations
- **Secure Authentication**: JWT-based with social login support via Supabase Auth
- **Audit Trails**: Complete logging for financial operations
- **Input Validation**: Zod schemas validate all user inputs and API requests

### Component Architecture
- **shadcn/ui + Radix UI**: Accessible, composable UI components
- **Tailwind CSS**: Utility-first styling with design system consistency
- **Motion (Framer Motion)**: Smooth animations and transitions
- **Multiple Icon Libraries**: Comprehensive icon coverage (Lucide, Tabler, Remixicon)
- **React Aria Components**: Accessible interaction patterns

### Developer Experience
- **Bun Runtime**: 3-5x faster package installation and script execution
- **Vite HMR**: Instant hot module replacement during development
- **TypeScript**: Full IDE support with autocomplete and type checking
- **TanStack Router**: File-based routing with automatic code generation
- **Vitest**: Fast test execution with watch mode
- **OXLint**: Near-instant linting feedback (50-100x faster than ESLint)

## Performance Targets

| Metric | Target | Maximum | Measurement Point |
|--------|--------|---------|-------------------|
| Voice Response Time | <500ms | <1s | Command → Audio response |
| API Response Time | <150ms | <300ms | Hono server execution |
| Database Query | <50ms | <100ms | Supabase query execution |
| App Startup | <3s | <5s | Cold start to interactive |
| Transaction Sync | <2s | <5s | Bank sync → UI update |
| Build Time | <30s | <60s | Production build completion |
| Test Execution | <10s | <30s | Full test suite run |

## Development Workflow

### Required Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Open Banking APIs (Future Phase)
OPEN_BANKING_CLIENT_ID=your-client-id
OPEN_BANKING_CLIENT_SECRET=your-client-secret

# AI Services (Future Phase)
OPENAI_API_KEY=your-openai-key

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

### Essential Commands
```bash
# Development
bun dev                    # Start Vite dev server (frontend only)
bun dev:full               # Start both frontend and backend servers
bun dev:client             # Start frontend only
bun dev:server             # Start backend server only

# Building
bun build                  # Build client and server
bun build:client           # Build frontend with Vite
bun build:server           # Server build (runtime compilation)
bun build:dev              # Development build

# Production
bun start                  # Start production server
bun start:prod             # Start with NODE_ENV=production
bun preview                # Build and preview production

# Quality Assurance
bun lint                   # Run OXLint and Biome
bun lint:oxlint            # Lint with OXLint (50-100x faster)
bun lint:biome             # Format with Biome
bun lint:fix               # Auto-fix formatting issues

# Testing
bun test                   # Run unit tests
bun test:unit              # Run unit tests
bun test:integration       # Run integration tests
bun test:coverage          # Run tests with coverage report
bun test:watch             # Run tests in watch mode

# Type Checking
bun type-check             # TypeScript strict mode validation

# Database
bunx supabase db push      # Apply database migrations
bunx supabase gen types    # Generate TypeScript types

# Routing
bun routes:generate        # Generate TanStack Router routes

# Code Quality (CI)
bun quality                # Run lint + test with coverage
bun quality:ci             # Run OXLint + test coverage (CI optimized)
```

## Import Patterns

### Supabase Client
```typescript
import { supabase } from "@/integrations/supabase/client"

// Example usage
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
```

### Hono RPC API Client
```typescript
import { apiClient } from "@/lib/api-client"
import { useQuery, useMutation } from "@tanstack/react-query"

// Query example
const { data, isLoading } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => apiClient.get('/api/v1/transactions'),
})

// Mutation example
const { mutate } = useMutation({
  mutationFn: (input) => apiClient.post('/api/v1/transactions', input),
})
```

### Hono RPC Server Endpoint
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '@/server/middleware/auth'

const router = new Hono()

router.get('/transactions', authMiddleware, async (c) => {
  const { supabase } = c.get('auth')
  const { data, error } = await supabase.from('transactions').select('*')
  if (error) return c.json({ error: 'Failed to fetch' }, 500)
  return c.json({ data })
})
```

### TanStack Query
```typescript
import { useQuery, useMutation } from "@tanstack/react-query"

// Example usage
const { data, isLoading } = useQuery({
  queryKey: ['transactions'],
  queryFn: fetchTransactions,
})
```

### TanStack Router
```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router"

// Example route
export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})
```

### Forms & Validation
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// Example schema
const formSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
})

// Example form
const form = useForm({
  resolver: zodResolver(formSchema),
})
```

### UI Components
```typescript
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"

// shadcn/ui components with Radix UI primitives
```

### Styling Utilities
```typescript
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

// Merge Tailwind classes
const className = cn("base-class", condition && "conditional-class")

// Create variants
const buttonVariants = cva("base-styles", {
  variants: {
    variant: {
      default: "default-styles",
      outline: "outline-styles",
    },
  },
})
```

## Technology Relationships

```mermaid
graph TB
    Bun[Bun Runtime] --> Vite[Vite Dev Server]
    Bun --> Hono[Hono API Server]

    Vite --> React[React 19 App]
    React --> Router[TanStack Router]
    React --> Query[TanStack Query]
    React --> Form[React Hook Form]

    Hono --> HonoRPC[Hono RPC Endpoints]
    Query --> ApiClient[API Client]
    ApiClient --> HonoRPC

    HonoRPC --> Supabase[Supabase Client]
    HonoRPC --> ZodValidator[@hono/zod-validator]

    Supabase --> Postgres[(PostgreSQL + RLS)]
    Supabase --> Auth[Supabase Auth]
    Supabase --> Realtime[Supabase Realtime]
    Supabase --> Storage[Supabase Storage]

    React --> UI[shadcn/ui]
    UI --> Radix[Radix UI Primitives]
    React --> Tailwind[Tailwind CSS]
    React --> Motion[Motion/Framer Motion]

    Form --> Zod[Zod Validation]
    ZodValidator --> Zod

    subgraph "Development Tools"
        Vitest[Vitest Testing]
        OXLint[OXLint Linter]
        Biome[Biome Formatter]
        TypeScript[TypeScript Compiler]
    end

    React --> Vitest
    Hono --> Vitest
    React --> TypeScript
    Hono --> TypeScript

    subgraph "State Management"
        Query
        Zustand[Zustand Store]
    end

    React --> Zustand
```

## Current Implementation Status

### ✅ Fully Implemented
- **Core Runtime**: Bun package manager and runtime
- **Frontend Stack**: React 19 + TypeScript 5.9.3 + Vite 7.1.9
- **Routing**: TanStack Router v1 with file-based routing
- **State Management**: TanStack Query v5 + Zustand v5
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS 4.1.14
- **Backend**: Hono 4.10.4 + Hono RPC (migrated from tRPC)
- **API Client**: Custom apiClient with TanStack Query integration
- **Database**: Supabase with PostgreSQL, Auth, Realtime, Storage
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest 3.2.4 with coverage
- **Code Quality**: OXLint + Biome formatter
- **Animation**: Motion (Framer Motion) 12.23.22
- **Icons**: Lucide, Tabler, Remixicon
- **Charts**: Recharts for data visualization

### 🚧 Future Phases
- **AI Provider Factory**: Scale from OpenAI to multiple providers
- **Bank Integration**: Belvo API for Open Banking connectivity
- **Advanced Analytics**: Customer behavior insights and financial recommendations
- **Voice Processing**: Speech-to-text and text-to-speech integration
- **E2E Testing**: Playwright for comprehensive workflow testing
- **Monitoring**: Application performance monitoring and error tracking

## Constraints and Trade-offs

### What We Chose Over Alternatives

#### Runtime & Package Management
- **Bun over Node.js/npm**: 3-5x performance improvement, native TypeScript, faster installs
- **Bun over pnpm/yarn**: Simpler tooling, better performance, native TypeScript execution

#### Frontend Framework
- **React 19 over Vue/Svelte**: Larger ecosystem, better TypeScript support, team expertise
- **TanStack Router over React Router**: Type-safe routing, file-based, better DX
- **TanStack Query over SWR**: More features, better caching, larger community

#### Backend & API
- **Hono over Express**: Lightweight, edge-optimized, modern API, better performance
- **Hono RPC over tRPC**: Simpler stack, ~50KB bundle reduction, clearer debugging, direct HTTP semantics
- **Hono RPC over GraphQL**: Simpler setup, no schema language, direct endpoint mapping

#### Database & Infrastructure
- **Supabase over AWS RDS**: Faster development, built-in auth/realtime/storage, cost-effective
- **Supabase over Firebase**: PostgreSQL (relational), better querying, open-source
- **PostgreSQL over MongoDB**: ACID compliance, complex queries, financial data integrity

#### UI & Styling
- **Tailwind CSS over CSS-in-JS**: Better performance, smaller bundle, easier maintenance
- **shadcn/ui over Material-UI**: More customizable, better accessibility, modern design
- **Radix UI over Headless UI**: More components, better accessibility, active development

#### Testing & Quality
- **Vitest over Jest**: 3-5x faster, better TypeScript support, Vite integration
- **OXLint over ESLint**: 50-100x faster, Rust-based, instant feedback
- **Biome over Prettier**: Faster formatting, unified tooling

#### Forms & Validation
- **React Hook Form over Formik**: Better performance, smaller bundle, less re-renders
- **Zod over Yup**: Better TypeScript inference, more features, active development

### Limitations to Consider

#### Vendor Dependencies
- **Supabase Dependency**: Core infrastructure relies on single vendor
- **Bun Maturity**: Newer runtime, smaller ecosystem than Node.js
- **Migration Complexity**: Moving away from Supabase would require significant refactoring

#### Market Focus
- **Brazilian Market Optimization**: Architecture optimized for Brazilian financial systems
- **LGPD Compliance**: Built-in compliance may not translate to other regions
- **Portuguese-First**: Internationalization would require additional work

#### Technical Constraints
- **Voice-First Architecture**: Optimized for voice interactions, may need adaptation for other UX patterns
- **Edge Deployment**: Requires edge-compatible code, limits some Node.js libraries
- **Type Safety Trade-off**: Strict typing increases development time but reduces runtime errors

#### Performance Trade-offs
- **Bundle Size**: Multiple icon libraries and UI components increase initial bundle
- **Real-time Overhead**: Supabase Realtime connections consume resources
- **Animation Performance**: Motion library adds bundle size for smooth animations

### Risk Mitigation Strategies

1. **Vendor Lock-in**: Abstract Supabase client behind repository pattern for easier migration
2. **Bun Compatibility**: Test critical dependencies for Bun compatibility before adoption
3. **Performance Monitoring**: Implement bundle analysis and performance tracking
4. **Type Safety**: Maintain strict TypeScript configuration to catch errors early
5. **Testing Coverage**: Maintain 80%+ test coverage for critical business logic

## Version Compatibility Matrix

| Technology | Minimum Version | Current Version | Maximum Tested |
|------------|----------------|-----------------|----------------|
| Bun | 1.0.0 | Latest | Latest |
| TypeScript | 5.0.0 | 5.9.3 | 5.9.x |
| React | 19.0.0 | 19.2.0 | 19.x |
| Vite | 7.0.0 | 7.1.9 | 7.x |
| Hono | 4.0.0 | 4.10.4 | 4.x |
| @hono/zod-validator | 0.4.0 | 0.5.0 | 0.x |
| TanStack Query | 5.0.0 | 5.90.2 | 5.x |
| TanStack Router | 1.0.0 | 1.132.41 | 1.x |
| Supabase JS | 2.0.0 | 2.74.0 | 2.x |
| Tailwind CSS | 4.0.0 | 4.1.14 | 4.x |
| Vitest | 3.0.0 | 3.2.4 | 3.x |
| Zod | 4.0.0 | 4.1.12 | 4.x |
| Motion | 11.0.0 | 12.23.22 | 12.x |
| Recharts | 2.0.0 | 3.2.1 | 3.x |

> **Migration Note**: tRPC has been replaced by Hono RPC. See `docs/architecture/hono-rpc-architecture.md` for migration details.

## Dependency Update Policy

### Critical Updates (Apply Immediately)
- Security vulnerabilities (CVE patches)
- Bug fixes affecting production functionality
- Performance improvements with proven benefits

### Regular Updates (Monthly Review)
- Minor version updates with new features
- Dependency updates for better compatibility
- Documentation improvements

### Major Updates (Quarterly Planning)
- Breaking changes requiring code modifications
- New major versions with significant changes
- Architecture-level technology changes

### Testing Requirements
- **Patch Updates**: Unit tests must pass
- **Minor Updates**: Unit + integration tests must pass
- **Major Updates**: Full test suite + manual QA required

---

**Status**: ✅ Active and Maintained
**Last Updated**: 2025-10-06
**Ownership**: Fullstack Development Team
**Review Cadence**: Monthly technology updates, quarterly architecture review
**Next Review**: 2025-11-06
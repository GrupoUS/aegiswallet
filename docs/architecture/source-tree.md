---
title: "AegisWallet Project Structure"
last_updated: 2025-10-06
form: reference
tags: [project-structure, single-repo, file-organization]
related:
  - ../architecture/tech-stack.md
  - ../architecture/coding-standards.md
  - ../prd.md
---

# AegisWallet Project Structure

## Overview

This document defines the complete project structure for AegisWallet, organized as a **single repository** with clear domain separation for the Brazilian autonomous financial assistant. The structure prioritizes voice-first development, financial component organization, and maintainability at scale.

## Repository Organization

```plaintext
aegiswallet/
├── .github/                           # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml                    # Type checking, linting, testing
│       └── deploy.yaml                # Deployment to staging/production
├── docs/                              # Documentation
│   ├── architecture/                  # Architecture documents (sharded)
│   │   ├── coding-standards.md        # Development standards and patterns
│   │   ├── tech-stack.md              # Technology stack decisions
│   │   └── source-tree.md             # This project structure guide
│   ├── prd.md                         # Product requirements document
│   ├── qa/                            # Quality assurance assessments
│   └── design-specs/                  # UI/UX specifications
├── src/                               # Source code (single repo structure)
│   ├── routes/                        # TanStack Router v5 file-based routing
│   │   ├── __root.tsx                 # Root route with layout, sidebar, providers
│   │   ├── index.tsx                  # Home page (/)
│   │   ├── dashboard.tsx              # Dashboard page with 3-column layout
│   │   ├── login.tsx                  # Login page (/login)
│   │   ├── transactions.tsx           # Transactions page (/transactions)
│   │   ├── saldo.tsx                  # Balance page (/saldo)
│   │   ├── calendario.tsx             # Weekly calendar page (/calendario)
│   │   ├── contas.tsx                 # Accounts management page (/contas)
│   │   └── pix/                       # PIX pages
│   │       ├── index.tsx              # PIX dashboard (/pix/)
│   │       ├── transferir.tsx         # Send PIX (/pix/transferir)
│   │       ├── receber.tsx            # Receive PIX (/pix/receber)
│   │       └── historico.tsx          # PIX history (/pix/historico)
│   ├── components/                    # React components organized by domain
│   │   ├── voice/                     # Voice interface components
│   │   │   ├── VoiceDashboard.tsx     # Main voice interface
│   │   │   ├── MainVoiceInterface.tsx # Voice command interface
│   │   │   ├── VoiceIndicator.tsx     # Voice activity indicator
│   │   │   └── VoiceResponse.tsx      # Voice response handling
│   │   ├── financial/                 # Financial management components
│   │   │   ├── BrazilianComponents.tsx # Brazilian-specific financial UI
│   │   │   └── financial-amount.tsx   # Amount formatting component
│   │   ├── pix/                       # PIX-specific components
│   │   │   ├── PixSidebar.tsx         # PIX keys sidebar
│   │   │   ├── PixConverter.tsx       # Amount calculator
│   │   │   ├── PixChart.tsx           # Transaction chart
│   │   │   └── PixTransactionsTable.tsx # Transaction table
│   │   ├── calendar/                  # Financial calendar components
│   │   │   ├── financial-calendar.tsx # Main weekly calendar view
│   │   │   ├── calendar-context.tsx   # Calendar state with Supabase
│   │   │   ├── compact-calendar.tsx   # Mini calendar component
│   │   │   └── mini-calendar-widget.tsx # Dashboard calendar widget
│   │   ├── accessibility/             # Accessibility components
│   │   │   ├── AccessibilityProvider.tsx # A11y context
│   │   │   └── AccessibilitySettings.tsx # Settings UI
│   │   ├── ai/                        # AI/Intelligence components
│   │   │   └── IntelligencePanel.tsx  # AI insights panel
│   │   ├── emergency/                 # Emergency mode
│   │   │   └── EmergencyDashboard.tsx # Emergency dashboard
│   │   ├── layout/                    # Layout components
│   │   │   └── AppLayout.tsx          # Application layout wrapper
│   │   ├── providers/                 # React context providers
│   │   │   └── TRPCProvider.tsx       # tRPC client provider
│   │   ├── examples/                  # Component examples
│   │   │   └── hover-border-gradient-example.tsx
│   │   └── ui/                        # Base UI components (shadcn/ui)
│   │       ├── event-calendar/        # Event calendar UI components
│   │       │   ├── event-calendar.tsx # Main calendar component
│   │       │   ├── week-view.tsx      # Weekly view grid
│   │       │   ├── time-grid.tsx      # Hour grid (8AM-7PM)
│   │       │   ├── event-card.tsx     # Draggable event cards
│   │       │   ├── event-dialog.tsx   # Create/edit event dialog
│   │       │   ├── calendar-header.tsx # Calendar navigation header
│   │       │   ├── types.ts           # Calendar type definitions
│   │       │   └── index.tsx          # Exports
│   │       ├── button.tsx             # Button component
│   │       ├── card.tsx               # Card component
│   │       ├── calendar.tsx           # Base calendar component
│   │       ├── chart.tsx              # Chart component
│   │       ├── dialog.tsx             # Dialog component
│   │       ├── form.tsx               # Form components
│   │       ├── input.tsx              # Input component
│   │       ├── select.tsx             # Select component
│   │       ├── sidebar.tsx            # Sidebar component
│   │       ├── switch.tsx             # Switch component
│   │       ├── table.tsx              # Table component
│   │       ├── textarea.tsx           # Textarea component
│   │       ├── bento-grid.tsx         # Bento grid layout
│   │       ├── gradient-button.tsx    # Gradient button
│   │       ├── hover-border-gradient.tsx # Hover effects
│   │       ├── animated-theme-toggler.tsx # Theme switcher
│   │       └── [35+ other shadcn/ui components]
│   ├── integrations/                  # External service integrations
│   │   └── supabase/                  # Supabase client configuration
│   │       ├── client.ts              # Supabase browser client
│   │       ├── auth.ts                # Authentication helpers
│   │       └── realtime.ts            # Realtime subscriptions
│   ├── lib/                           # Core libraries and utilities
│   │   ├── analytics/                 # Analytics and feedback
│   │   │   └── feedbackCollector.ts   # User feedback collection
│   │   ├── formatters/                # Data formatters
│   │   │   └── brazilianFormatters.ts # Brazilian formats (currency, date)
│   │   ├── security/                  # Security utilities
│   │   │   └── VoiceConfirmationService.ts # Voice confirmation
│   │   ├── speech/                    # Speech services
│   │   │   ├── SpeechSynthesisService.ts # Text-to-speech
│   │   │   └── SpeechRecognitionService.ts # Speech-to-text
│   │   ├── utils.ts                   # General utilities
│   │   └── validation/                # Zod schema definitions (if exists)
│   ├── server/                        # Backend API (Hono + tRPC)
│   │   ├── routers/                   # tRPC router definitions
│   │   │   ├── _app.ts                # Main tRPC router
│   │   │   ├── index.ts               # Router exports
│   │   │   ├── pix.ts                 # PIX transaction procedures
│   │   │   ├── transactions.ts        # Transaction procedures
│   │   │   └── [additional routers]   # Other domain routers
│   │   └── [server config files]      # Server setup files
│   ├── hooks/                         # Custom React hooks
│   │   ├── use-mobile.ts              # Mobile device detection
│   │   ├── use-transactions.tsx       # Transaction management
│   │   ├── useFinancialEvents.ts      # Financial calendar events
│   │   ├── useMultimodalResponse.ts   # Multimodal voice responses
│   │   ├── usePix.tsx                 # PIX operations
│   │   ├── useSecureConfirmation.ts   # Security confirmations
│   │   ├── useVoiceCommand.ts         # Voice command processing
│   │   └── useVoiceRecognition.ts     # Voice recognition engine
│   ├── styles/                        # Global styles and themes
│   │   ├── globals.css                # Global CSS variables
│   │   ├── components.css             # Component-specific styles
│   │   └── themes/                    # Theme configurations
│   │       ├── light.ts               # Light theme
│   │       └── dark.ts                # Dark theme
│   ├── types/                         # TypeScript type definitions
│   │   ├── database.types.ts          # Supabase generated types
│   │   ├── financial-events.ts        # Financial calendar event types
│   │   ├── pix.ts                     # PIX transaction types
│   │   └── [domain-specific types]    # Other type definitions
│   ├── contexts/                      # React contexts
│   │   └── AuthContext.tsx            # Authentication context
│   ├── data/                          # Static data
│   │   └── accounts.json              # Account data
│   ├── services/                      # Business logic services
│   │   └── voiceCommandProcessor.ts   # Voice command processing
│   ├── styles/                        # Global styles
│   │   └── globals.css                # Global CSS
│   ├── test/                          # Test files
│   │   ├── setup.ts                   # Test setup
│   │   ├── utils/                     # Test utilities
│   │   ├── security/                  # Security tests
│   │   └── voice/                     # Voice feature tests
│   ├── App.tsx                        # Main application component
│   ├── main.tsx                       # Application entry point
│   ├── index.css                      # Main stylesheet
│   └── routeTree.gen.ts               # Generated route tree (TanStack Router)
├── public/                            # Static assets
│   ├── icons/                         # App icons and favicons
│   ├── images/                        # Static images
│   └── locales/                       # Localization files
│       └── pt-BR/                     # Brazilian Portuguese
├── tests/                             # Test files
│   ├── e2e/                           # End-to-end tests
│   │   ├── voice-commands.spec.ts     # Voice command workflows
│   │   ├── transactions.spec.ts       # Transaction management tests
│   │   └── accessibility.spec.ts      # Accessibility tests
│   ├── unit/                          # Unit tests
│   │   ├── components/                # Component tests
│   │   ├── hooks/                     # Hook tests
│   │   └── lib/                       # Library tests
│   └── integration/                   # Integration tests
│       ├── api/                       # API tests
│       └── database/                  # Database tests
├── scripts/                           # Build and deployment scripts
│   ├── build.sh                       # Build automation
│   ├── deploy.sh                      # Deployment script
│   └── db-migrate.sh                  # Database migration script
├── env.example                        # Environment variables template
├── .env.local.example                 # Local environment template
├── package.json                       # Dependencies and scripts
├── bun.lockb                          # Bun lockfile
├── tsconfig.json                      # TypeScript configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── vite.config.ts                     # Vite build configuration
├── vitest.config.ts                   # Vitest testing configuration
├── playwright.config.ts               # Playwright E2E configuration
└── README.md                          # Project documentation
```

## Directory Structure Rationale

### **`src/routes/`** - TanStack Router v5 File-Based Routing

**File-Based Routing Convention**: Each file in `src/routes/` represents a route in the application
- **`__root.tsx`**: Root layout with sidebar, providers, and authentication context
- **`index.tsx`**: Home page route at `/`
- **`{name}.tsx`**: Creates route at `/{name}` (e.g., `dashboard.tsx` → `/dashboard`)
- **`{folder}/index.tsx`**: Creates route at `/{folder}/` (e.g., `pix/index.tsx` → `/pix/`)
- **`{folder}/{name}.tsx`**: Nested routes (e.g., `pix/transferir.tsx` → `/pix/transferir`)

**Route Files Include**:
- `createFileRoute()` export for route definition
- Component that renders the page
- Optional loaders, search params, and beforeLoad hooks
- Import and compose reusable components from `src/components/`

**Benefits**:
- Type-safe routing with automatic route tree generation
- Automatic code splitting per route
- Clear file-to-URL mapping
- Co-located route logic with components

### **`src/components/`** - React Components by Domain

**Voice Components (`voice/`)**: Core differentiator for AegisWallet
- Priority directory containing voice recognition, processing, and response components
- Voice-first interface components for Brazilian Portuguese interactions
- Real-time voice command processing and feedback systems

**Financial Components (`financial/`)**: Domain-specific business logic
- Transaction management, budget tracking, and payment automation
- Brazilian-specific features like boleto handling
- Smart payment automation and financial insights display

**PIX Components (`pix/`)**: Brazilian instant payment system
- PIX key management and favorites sidebar
- Amount calculator with Brazilian real formatting
- Transaction history chart and table
- QR Code generation for receiving payments

**Calendar Components (`calendar/`)**: Financial events management
- Calendar view with financial events display
- Event cards for bills, payments, and income
- Calendar context for state management
- Integration with financial data

**Accessibility Components (`accessibility/`)**: WCAG 2.1 AA compliance
- Screen reader support for visually impaired users
- Keyboard navigation for motor-impaired users
- High contrast modes and text scaling

**UI Components (`ui/`)**: Base component library
- shadcn/ui components customized for financial applications
- Consistent design system across all interfaces
- Responsive design optimized for mobile-first Brazilian users

### **`src/integrations/supabase/`** - Database and Authentication

- **Client Configuration**: Browser-safe Supabase client with RLS policies
- **Authentication**: Social login, email/password, and session management
- **Realtime**: WebSocket connections for live financial updates
- **Type Safety**: Generated TypeScript types from database schema

### **`src/lib/`** - Core Business Logic

**AI Services (`ai/`)**: Voice command processing and insights
- Natural language processing for Portuguese voice commands
- Financial insights generation and recommendation engine
- Machine learning models for transaction categorization

**Localization (`localization/`)**: Brazilian market adaptation
- Portuguese translations and cultural adaptations
- Brazilian real (BRL) currency formatting
- Local date/time formats and business day calculations

**Validation (`validation/`)**: Type-safe data validation
- Zod schemas for all external inputs and API requests
- Financial transaction validation with business rules
- Voice command validation and sanitization

### **`src/server/`** - Backend API Layer

**tRPC Routers**: Type-safe API procedures
- Authentication and authorization procedures
- Financial transaction processing with audit trails
- Voice command processing and response generation
- Open Banking API integration with Brazilian banks

**Middleware**: Cross-cutting concerns
- Authentication and session validation
- Request validation with Zod schemas
- Rate limiting for voice command processing
- Error handling with proper logging

## Import Patterns and Conventions

### Route File Pattern (TanStack Router v5)
```typescript
// src/routes/pix/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { PixSidebar } from '@/components/pix/PixSidebar'
import { PixConverter } from '@/components/pix/PixConverter'
import { PixChart } from '@/components/pix/PixChart'

export const Route = createFileRoute('/pix/')({
  component: PixDashboard,
})

function PixDashboard() {
  return (
    <div className="flex">
      <PixSidebar />
      <main className="flex-1">
        <PixConverter />
        <PixChart />
      </main>
    </div>
  )
}
```

### Component Imports
```typescript
// Voice components
import { VoiceDashboard } from "@/components/voice/VoiceDashboard"
import { VoiceProcessor } from "@/components/voice/VoiceProcessor"

// Financial components
import { TransactionList } from "@/components/financial/TransactionList"
import { BoletoPayment } from "@/components/financial/BoletoPayment"

// PIX components
import { PixSidebar } from "@/components/pix/PixSidebar"
import { PixConverter } from "@/components/pix/PixConverter"

// Calendar components
import { CalendarView } from "@/components/calendar/CalendarView"

// Base UI components
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
```

### Integration Imports
```typescript
// Supabase client
import { supabase } from "@/integrations/supabase/client"
import { createRealtimeSubscription } from "@/integrations/supabase/realtime"

// AI services
import { processVoiceCommand } from "@/lib/ai/voice-commands"
import { generateFinancialInsights } from "@/lib/ai/financial-insights"
```

### Hook Imports
```typescript
// Custom hooks
import { useAuth } from "@/hooks/useAuth"
import { useVoiceCommands } from "@/hooks/useVoiceCommands"
import { useTransactions } from "@/hooks/useTransactions"
import { useRealtimeSync } from "@/hooks/useRealtimeSync"
```

## File Naming Conventions

### Components
- **React Components**: `PascalCase.tsx` (e.g., `VoiceDashboard.tsx`)
- **Component Tests**: `PascalCase.spec.ts` (e.g., `VoiceDashboard.spec.ts`)
- **Component Stories**: `PascalCase.stories.ts` (e.g., `VoiceDashboard.stories.ts`)

### Hooks and Utilities
- **Custom Hooks**: `camelCase.ts` with `use` prefix (e.g., `useVoiceCommands.ts`)
- **Utility Functions**: `camelCase.ts` (e.g., `currency-formatter.ts`)
- **Type Definitions**: `camelCase.ts` (e.g., `transactions.ts`)

### Configuration Files
- **Build Config**: `kebab-case.config.ts` (e.g., `vite.config.ts`)
- **Environment**: `env.example`, `.env.local`
- **Documentation**: `kebab-case.md` (e.g., `coding-standards.md`)

## Development Workflow

### Local Development Setup
```bash
# Install dependencies
bun install

# Start development server
bun dev

# Run tests
bun test

# Type checking
bun type-check

# Linting
bun lint
```

### Environment Configuration
```bash
# Copy environment templates
cp env.example .env.local
cp .env.local.example .env

# Configure Supabase
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Configure Open Banking
OPEN_BANKING_CLIENT_ID=your-client-id
OPEN_BANKING_CLIENT_SECRET=your-client-secret
```

## Testing Organization

### Test File Locations
- **Unit Tests**: Mirror source file structure in `tests/unit/`
- **Integration Tests**: Database and API integration in `tests/integration/`
- **E2E Tests**: User workflows in `tests/e2e/`

### Test Naming Patterns
```typescript
// Unit test example
tests/unit/components/voice/VoiceDashboard.spec.ts

// Integration test example
tests/integration/api/transactions.spec.ts

// E2E test example
tests/e2e/voice-commands.spec.ts
```

## Deployment Structure

### Build Output
```bash
dist/                              # Production build output
├── assets/                         # Static assets (CSS, JS, images)
├── index.html                      # Main HTML entry point
└── server/                         # Server-side assets (if needed)
```

### CI/CD Integration
- **GitHub Actions**: Automated testing and deployment
- **Vercel**: Preview deployments for pull requests
- **Supabase**: Database migrations and type generation

## Security Considerations

### File Access Patterns
- **Client-Side**: Only `src/components/`, `src/hooks/`, public assets
- **Server-Side**: `src/server/`, environment variables, secrets
- **Shared**: `src/lib/`, `src/types/`, configuration files

### Environment Variable Handling
```typescript
// Client-side variables (VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// Server-side variables (no prefix)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
```

## Scalability Considerations

### Code Organization for Growth
- **Domain Separation**: Clear boundaries between voice, financial, and UI components
- **Shared Libraries**: Reusable utilities and types in `src/lib/`
- **API Structure**: Organized tRPC routers by business domain
- **Testing Strategy**: Comprehensive coverage at all levels

### Performance Optimization
- **Code Splitting**: Lazy loading for voice and financial components
- **Bundle Analysis**: Regular monitoring of bundle size impact
- **Caching Strategy**: Supabase real-time for live data updates
- **Image Optimization**: Responsive images for mobile performance

---

**Status**: ✅ Active
**Ownership**: Fullstack Development Team
**Review cadence**: Monthly structure review, quarterly optimization assessment
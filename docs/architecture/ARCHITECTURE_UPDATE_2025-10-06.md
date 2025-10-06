# AegisWallet - Architecture Update (January 6, 2025)

## Executive Summary

This document reflects the **actual implemented architecture** as of January 6, 2025, capturing the current state of the codebase. It supplements the main architecture documents with accurate, real-world implementation details.

## Current Implementation Status

### ✅ Fully Implemented Features

#### 1. **Financial Calendar System** (NEW)
- **Weekly View Calendar** with hourly grid (8 AM - 7 PM)
- **Event Management**: Create, edit, delete, drag-and-drop events
- **Recurrence Support**: RRULE-based recurring events
- **Real-time Sync**: Supabase integration for live updates
- **Components**:
  - `src/components/ui/event-calendar/` - Base calendar UI components
  - `src/components/calendar/` - Financial calendar implementation
  - `src/hooks/useFinancialEvents.ts` - Event management hooks
  - `src/types/financial-events.ts` - Type definitions

#### 2. **PIX Integration** (COMPLETE)
- **Full PIX Dashboard** (`/pix/`)
- **PIX Transfer** (`/pix/transferir`)
- **PIX Receive** with QR Code generation (`/pix/receber`)
- **Transaction History** (`/pix/historico`)
- **Components**:
  - `PixSidebar.tsx` - PIX keys management
  - `PixConverter.tsx` - Amount calculator
  - `PixChart.tsx` - Transaction visualization
  - `PixTransactionsTable.tsx` - Transaction listing
- **Backend**: tRPC router for PIX operations
- **Database**: Supabase tables for PIX transactions

#### 3. **Voice Interface Foundation**
- **Voice Command Processing**: `useVoiceCommand.ts`, `useVoiceRecognition.ts`
- **Multimodal Responses**: `useMultimodalResponse.ts`
- **Security**: `useSecureConfirmation.ts`, `VoiceConfirmationService.ts`
- **Speech Services**:
  - `SpeechRecognitionService.ts` - Speech-to-text
  - `SpeechSynthesisService.ts` - Text-to-speech
- **Components**:
  - `VoiceDashboard.tsx` - Main interface
  - `MainVoiceInterface.tsx` - Command interface
  - `VoiceIndicator.tsx` - Activity indicator

#### 4. **Authentication & Authorization**
- **Supabase Auth** integration
- **Row Level Security** (RLS) policies
- **AuthContext** provider
- **Protected Routes** via TanStack Router

#### 5. **UI Component Library**
- **40+ shadcn/ui components** fully integrated
- **Custom Components**:
  - `BentoGrid` - Dashboard layout
  - `AnimatedThemeToggler` - Theme switching
  - `GradientButton` - Enhanced buttons
  - `HoverBorderGradient` - Interactive effects
  - `Sidebar` - Application navigation

### 📂 Actual Directory Structure

```
src/
├── components/              # React components by domain
│   ├── accessibility/       # A11y components
│   ├── ai/                  # Intelligence panel
│   ├── calendar/            # Financial calendar
│   ├── emergency/           # Emergency dashboard
│   ├── examples/            # Component examples
│   ├── financial/           # Financial components
│   ├── layout/              # Layout wrappers
│   ├── pix/                 # PIX components
│   ├── providers/           # Context providers
│   ├── ui/                  # Base UI library
│   │   └── event-calendar/  # Calendar UI components
│   └── voice/               # Voice interface

├── contexts/                # React contexts
│   └── AuthContext.tsx

├── data/                    # Static data
│   └── accounts.json

├── hooks/                   # Custom React hooks
│   ├── use-mobile.ts
│   ├── use-transactions.tsx
│   ├── useFinancialEvents.ts
│   ├── useMultimodalResponse.ts
│   ├── usePix.tsx
│   ├── useSecureConfirmation.ts
│   ├── useVoiceCommand.ts
│   └── useVoiceRecognition.ts

├── integrations/            # External services
│   └── supabase/
│       ├── client.ts
│       ├── auth.ts
│       └── realtime.ts

├── lib/                     # Core utilities
│   ├── analytics/
│   ├── formatters/
│   ├── security/
│   ├── speech/
│   └── utils.ts

├── routes/                  # TanStack Router v5
│   ├── __root.tsx           # Root layout
│   ├── index.tsx            # Home
│   ├── dashboard.tsx        # Dashboard (3-column)
│   ├── login.tsx            # Authentication
│   ├── saldo.tsx            # Balance
│   ├── calendario.tsx       # Calendar
│   ├── contas.tsx           # Accounts
│   ├── transactions.tsx     # Transactions
│   └── pix/                 # PIX routes
│       ├── index.tsx
│       ├── transferir.tsx
│       ├── receber.tsx
│       └── historico.tsx

├── server/                  # Backend (tRPC)
│   └── routers/
│       ├── _app.ts
│       ├── index.ts
│       ├── pix.ts
│       └── transactions.ts

├── services/                # Business logic
│   └── voiceCommandProcessor.ts

├── styles/                  # Global styles
│   └── globals.css

├── test/                    # Test files
│   ├── setup.ts
│   ├── security/
│   ├── utils/
│   └── voice/

├── types/                   # TypeScript types
│   ├── database.types.ts    # Supabase generated
│   ├── financial-events.ts  # Calendar events
│   └── pix.ts               # PIX types

├── App.tsx                  # Main app
├── main.tsx                 # Entry point
├── index.css                # Styles
└── routeTree.gen.ts         # Generated routes
```

## Technology Stack (Validated)

| Component | Technology | Version | Status |
|-----------|------------|---------|--------|
| **Runtime** | Bun | Latest | ✅ Active |
| **Frontend** | React | 19.2.0 | ✅ Active |
| **Router** | TanStack Router | 1.114.3 | ✅ Active |
| **State** | TanStack Query | 5.90.2 | ✅ Active |
| **Backend** | Hono + tRPC | 11.6.0 | ✅ Active |
| **Database** | Supabase | 2.58.0 | ✅ Active |
| **UI** | Tailwind CSS | 4.1.14 | ✅ Active |
| **UI Library** | shadcn/ui | Latest | ✅ Active |
| **Forms** | React Hook Form | 7.64.0 | ✅ Active |
| **Validation** | Zod | 4.1.11 | ✅ Active |
| **Drag & Drop** | @dnd-kit | Latest | ✅ Active |
| **Charts** | Recharts | Latest | ✅ Active |

## Implemented Routes

### Public Routes
- `/` - Home/Landing page
- `/login` - Authentication

### Protected Routes
- `/dashboard` - Main dashboard (3-column layout with mini calendar)
- `/saldo` - Balance overview
- `/calendario` - **Weekly financial calendar** (NEW)
- `/contas` - Accounts management
- `/transactions` - Transaction history
- `/pix/` - PIX dashboard
- `/pix/transferir` - Send PIX
- `/pix/receber` - Receive PIX (QR Code)
- `/pix/historico` - PIX history

## Key Architectural Decisions

### 1. Calendar Implementation
**Decision**: Weekly view with hourly grid instead of monthly view
- **Rationale**: Better for financial event timing precision
- **Pattern**: Event calendar as reusable UI component
- **Integration**: Full Supabase sync with real-time updates
- **Features**: Drag-and-drop, RRULE recurrence, event dialog

### 2. Component Organization
**Decision**: Domain-driven folder structure
- `components/calendar/` - Financial calendar domain components
- `components/ui/event-calendar/` - Base calendar UI components
- `components/pix/` - PIX-specific components
- `components/voice/` - Voice interface components

### 3. State Management
**Pattern**: React Context + TanStack Query + Supabase Realtime
- **Global State**: React Context (Auth, Calendar)
- **Server State**: TanStack Query hooks
- **Real-time**: Supabase subscriptions

### 4. Type Safety
**Pattern**: End-to-end TypeScript
- **Database**: Supabase generated types (`database.types.ts`)
- **API**: tRPC inferred types
- **Domain**: Custom type definitions per domain

## Database Schema Updates

### Financial Events Table
```sql
CREATE TABLE financial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  start TIMESTAMPTZ NOT NULL,
  end TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,  -- income, expense, bill, scheduled, transfer
  amount NUMERIC(15,2),
  color TEXT,
  icon TEXT,
  status TEXT,
  category TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users own events" ON financial_events
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_financial_events_user_date 
  ON financial_events(user_id, start DESC);
```

### PIX Transactions Table
```sql
CREATE TABLE pix_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,  -- sent, received, scheduled
  amount NUMERIC(15,2) NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL,
  recipient_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  transaction_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
CREATE POLICY "Users own PIX transactions" ON pix_transactions
  FOR ALL USING (auth.uid() = user_id);
```

## API Structure (tRPC)

### Implemented Routers

```typescript
// src/server/routers/_app.ts
export const appRouter = router({
  pix: pixRouter,           // PIX operations
  transactions: transactionsRouter,  // Transaction management
  // ... additional routers
});
```

### PIX Router
```typescript
// src/server/routers/pix.ts
export const pixRouter = router({
  sendTransfer: protectedProcedure
    .input(sendPixSchema)
    .mutation(sendPix),
  
  generateQRCode: protectedProcedure
    .input(generateQRSchema)
    .mutation(generateQR),
  
  getHistory: protectedProcedure
    .input(historySchema)
    .query(getPixHistory),
  
  getStatistics: protectedProcedure
    .query(getPixStats),
});
```

## Performance Characteristics

### Measured Metrics
- **Calendar Load Time**: <200ms (initial render)
- **Event Drag-and-Drop**: 60fps (smooth)
- **PIX Dashboard**: <300ms (with charts)
- **Route Navigation**: <100ms (TanStack Router)
- **Real-time Updates**: <500ms (Supabase)

### Bundle Size
- **Main Bundle**: ~450KB (gzipped)
- **Route Chunks**: ~50-80KB each (code splitting)
- **UI Components**: ~180KB (shadcn/ui)

## Development Workflow

### Available Commands
```bash
# Development
bun dev                    # Start dev server (port 8080-8088)
bun build                  # Production build

# Quality
bun lint                   # OXLint + Biome
bun type-check             # TypeScript validation
bun test                   # Vitest unit tests

# Database
bunx supabase db push      # Apply migrations
bunx supabase gen types    # Generate TS types

# Router
bun run generate           # Generate route tree
```

## Security Implementation

### Authentication Flow
1. **Supabase Auth** - Email/password + social providers
2. **Row Level Security** - Database-level access control
3. **tRPC Context** - Server-side auth validation
4. **Protected Routes** - Client-side route guards

### Voice Confirmation
- **Pattern**: Voice passphrase for high-risk operations
- **Implementation**: `VoiceConfirmationService.ts`
- **Fallback**: PIN code or biometric

## Next Development Priorities

### Phase 1 - Voice Integration (In Progress)
- [ ] Complete voice command processor integration
- [ ] Brazilian Portuguese NLU model
- [ ] Voice feedback loop
- [ ] Command history tracking

### Phase 2 - Open Banking (Planned)
- [ ] Belvo API integration
- [ ] Bank account linking
- [ ] Transaction sync
- [ ] Balance updates

### Phase 3 - AI Autonomy (Planned)
- [ ] Financial insights engine
- [ ] Payment automation
- [ ] Smart categorization
- [ ] Trust level progression

## Documentation Status

### Up-to-Date Documents
- ✅ `CALENDAR_ADVANCED_FEATURES.md` - Complete calendar docs
- ✅ `PIX_PAGES_IMPLEMENTATION.md` - PIX implementation guide
- ✅ `source-tree.md` - Updated project structure (this update)

### Needs Update
- ⚠️ `architecture.md` - Supplement with this document
- ⚠️ `tech-stack.md` - Validate versions
- ⚠️ `coding-standards.md` - Add calendar patterns

## Migration Notes

### Breaking Changes Since Last Update
- **Calendar View**: Changed from monthly to weekly
- **Dashboard Layout**: 2-column → 3-column (added mini calendar)
- **PIX Routes**: Restructured under `/pix/*` namespace

### Deprecated Components
- ❌ `sidebar-old.tsx` - Replaced by new `sidebar.tsx`
- ❌ Monthly calendar view - Replaced by weekly EventCalendar

---

**Status**: ✅ Current Implementation Snapshot  
**Last Updated**: January 6, 2025  
**Reviewed By**: Architecture Review Droid  
**Next Review**: March 2025 or upon major feature release

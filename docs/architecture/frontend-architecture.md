---
title: "AegisWallet Frontend Architecture"
last_updated: 2025-10-04
form: specification
tags: [frontend, react, typescript, voice-interface, brazilian-market]
related:
  - ../architecture/tech-stack.md
  - ../architecture/source-tree.md
  - ../architecture/coding-standards.md
  - ../prd.md
---

# AegisWallet Frontend Architecture

**Voice-first autonomous financial assistant for Brazilian market**  
**React 19 + Vite + TanStack Router v5 + TanStack Query v5 + Tailwind CSS**  
**Performance Targets**: <500ms voice response, <3s app startup, Lighthouse ≥90

## 1. Frontend Technology Stack

**Core Stack**: React 19.2.0 + Vite 7.1.9 + TanStack Router 1.114.3 + TanStack Query 5.90.2 + Tailwind CSS 4.1.14  
**Development**: Bun + TypeScript 5.9.3 + Vitest 3.2.4 + Playwright + OXLint 1.19.0  
**State**: Zustand 5.0.2 + React Hook Form 7.55.0 + Zod 4.1.11  
**Components**: shadcn/ui + WCAG 2.1 AA+ compliance

**Dependencies**:
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.90.2",
    "@tanstack/react-router": "^1.114.3", 
    "@trpc/client": "^11.6.0",
    "@trpc/react-query": "^11.6.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.55.0",
    "tailwindcss": "^4.1.14",
    "typescript": "^5.9.3",
    "vite": "^7.1.9",
    "zod": "^4.1.11",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.9.1",
    "vitest": "^3.2.4",
    "oxlint": "^1.19.0",
    "biome": "^2.2.5"
  }
}

## 2. Project Structure

### Frontend Directory Organization

```plaintext
src/
├── components/
│   ├── accessibility/     # WCAG 2.1 AA+ compliance
│   │   ├── AccessibilityProvider.tsx
│   │   ├── ScreenReaderAnnouncer.tsx
│   │   └── KeyboardNavigation.tsx
│   ├── financial/         # Brazilian financial components
│   │   ├── financial-amount.tsx
│   │   ├── BoletoPayment.tsx
│   │   └── PixTransfer.tsx
│   ├── providers/         # React context providers
│   │   ├── TRPCProvider.tsx
│   │   └── VoiceProvider.tsx
│   ├── ui/                # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── voice/             # Voice interface components
│   │   ├── VoiceDashboard.tsx
│   │   ├── VoiceIndicator.tsx
│   │   └── VoiceResponse.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── use-transactions.tsx
│   ├── useVoiceRecognition.tsx
│   └── use-auth.ts
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts
├── lib/
│   ├── ai/transactionCategorizer.ts
│   ├── localization/ptBR.ts
│   ├── utils.ts
│   └── voiceCommandProcessor.ts
├── pages/                  # Legacy, migrating to routes
│   ├── Dashboard.tsx
│   └── Login.tsx
├── routes/                 # TanStack Router
│   ├── __root.tsx
│   ├── index.tsx
│   ├── dashboard.tsx
│   └── transactions.tsx
├── server/                 # tRPC procedures
│   ├── context.ts
│   ├── index.ts
│   └── procedures/
│       ├── auth.ts
│       ├── transactions.ts
│       └── users.ts
├── styles/
│   ├── accessibility.css
│   └── globals.css
├── App.tsx
├── index.css
├── main.tsx
└── router.tsx
```

**Component Organization Principles**:
- **Domain-First Structure**: Components organized by business domain
- **Voice Components**: Core differentiator, highest development priority
- **Financial Components**: Brazilian market-specific business logic
- **Accessibility Components**: WCAG 2.1 AA+ compliance mandatory
- **UI Components**: Reusable base components with voice enhancements

## 3. Component Standards

### Component Template & Standards

```typescript
// Voice component with accessibility and voice integration
import React from 'react'
import { cn } from '@/lib/utils'
import { useVoiceState } from '@/hooks/useVoiceRecognition'

interface VoiceComponentProps {
  readonly className?: string; readonly onVoiceCommand?: (command: string) => void; readonly children?: React.ReactNode
}
export const VoiceComponent: React.FC<VoiceComponentProps> = ({ className, onVoiceCommand, children }) => {
  const { isListening } = useVoiceState()
  return (
    <div className={cn('voice-component', 'focus-within:ring-2 focus-within:ring-primary', className)}
         role="application" aria-label="Voice command interface">{children}</div>
  )
}
```

**Naming**: Components (`PascalCase.tsx`), Hooks (`useCamelCase.ts`), Utilities (`camelCase.ts`)

**Requirements**: Readonly props, ARIA labels, keyboard navigation, voice hooks, error handling, skeleton loading, accessibility testing

## 4. State Management

### TanStack Query + Zustand Configuration

```typescript
// TanStack Query - server state
import { createTRPCReact } from '@trpc/react-query'
export const trpc = createTRPCReact<AppRouter>()
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
    mutations: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }) },
  },
})

// Zustand - voice state
import { create } from 'zustand'
interface VoiceState {
  isListening: boolean; currentCommand: string | null; lastResponse: string | null
  autonomyLevel: number; setListening: (l: boolean) => void; setCommand: (c: string | null) => void
  setResponse: (r: string | null) => void; setAutonomyLevel: (l: number) => void
}
export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false, currentCommand: null, lastResponse: null, autonomyLevel: 50,
  setListening: (listening) => set({ isListening: listening }),
  setCommand: (command) => set({ currentCommand: command }),
  setResponse: (response) => set({ lastResponse: response }),
  setAutonomyLevel: (level) => set({ autonomyLevel: level }),
}))
```

### Data Patterns

- **Financial**: TanStack Query with 30s stale time, real-time updates
- **Voice**: Optimistic updates, instant feedback
- **Client**: Minimal Zustand store for voice interactions only

## 5. API Integration & Routing

### tRPC + Router Configuration

```typescript
// TRPC Provider
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from '@/lib/trpc'

const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  }))
  const [trpcClient] = React.useState(() => trpc.createClient({
    links: [httpBatchLink({ url: '/trpc', headers: () => {
      const token = localStorage.getItem('supabase_token')
      return token ? { authorization: `Bearer ${token}` } : {}
    }})],
  }))
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

// Root Route
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TRPCProvider } from '@/components/providers/TRPCProvider'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'
export const Route = createRootRoute({ component: RootComponent })
function RootComponent() {
  return (
    <AccessibilityProvider>
      <TRPCProvider>
        <div className="min-h-screen bg-background font-sans"><Outlet /></div>
      </TRPCProvider>
    </AccessibilityProvider>
  )
}

// Protected Route
import { useAuth } from '@/hooks/use-auth'
export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" />
  return <Outlet />
}
```

### Route Organization

- **Public**: `/`, `/login`, `/signup`
- **Protected**: `/dashboard`, `/transactions`, `/settings`
- **Voice**: `/voice/*` for deep voice integration
- **Error**: `/404`, `/500` for proper error handling

## 6. Styling Guidelines

### Tailwind CSS + Design System

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0066CC', dark: '#0052A3' },      // Trust blue
        success: { DEFAULT: '#00A650', dark: '#008140' },      // PIX green  
        warning: { DEFAULT: '#FF6B00', dark: '#E55A00' },      // Alert orange
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'voice-listening': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

### Voice & Financial Interface Colors

- **Voice**: Listening (green pulse), Processing (blue), Error (red)
- **Financial**: Positive (green), Negative (red), Pending (orange)

### Accessibility CSS

```css
.focus-visible:focus { outline: 2px solid var(--primary); outline-offset: 2px; }
.voice-announce { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
@media (prefers-reduced-motion: reduce) { .voice-listening { animation: none; } }
@media (prefers-contrast: high) { .voice-component { border: 2px solid currentColor; } }
```

### Responsive Breakpoints

- **sm**: 375px, **md**: 768px, **lg**: 1024px, **xl**: 1280px

## 7. Testing Requirements

### Vitest Configuration + Patterns

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, environment: 'jsdom', setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*'] },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})

// Voice Component Testing
import { render, screen } from '@testing-library/react'
import { VoiceDashboard } from '../VoiceDashboard'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
vi.mock('@/hooks/useVoiceRecognition')
describe('VoiceDashboard', () => {
  it('displays listening indicator when voice is active', () => {
    vi.mocked(useVoiceRecognition).mockReturnValue({
      isListening: true, startListening: vi.fn(), stopListening: vi.fn(), currentTranscript: 'transferir R$ 100',
    })
    render(<VoiceDashboard />)
    expect(screen.getByRole('status', { name: 'Ouvindo comando de voz' })).toBeInTheDocument()
  })
})

// Accessibility Testing
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)
export const testAccessibility = async (container: HTMLElement) => {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}
```

### Coverage Requirements

- **Critical**: 95%+ coverage (voice, financial, auth, accessibility)
- **Non-Critical**: 80%+ coverage (UI, utilities, types) 
- **E2E**: Playwright for complete voice workflows

## 8. Environment Configuration

### Environment Variables + Validation

```bash
# .env.example
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-key
VITE_AZURE_SPEECH_KEY=your-azure-speech-key
VITE_BELVO_CLIENT_ID=your-belvo-client-id
VITE_BELVO_CLIENT_SECRET=your-belvo-client-secret
VITE_APP_NAME=AegisWallet
VITE_APP_VERSION=1.0.0
VITE_ENABLE_VOICE_COMMANDS=true
VITE_ENABLE_PIX_TRANSFERS=true
VITE_ENABLE_BOLETO_PAYMENTS=true
```

```typescript
// src/lib/env.ts
import { z } from 'zod'
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_ENABLE_VOICE_COMMANDS: z.string().transform(Boolean),
})
export const env = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_ENABLE_VOICE_COMMANDS: import.meta.env.VITE_ENABLE_VOICE_COMMANDS,
})
```

## 9. Developer Standards

### Essential Commands + Import Patterns

```bash
bun dev:client              # Start Vite dev server
bun dev                     # Start full stack
bun lint                    # Run OXLint + Biome
bun test                    # Run unit tests
bun test:coverage           # Generate coverage
bun type-check              # TypeScript validation
bun build                   # Production build
bun preview                 # Preview build
```

```typescript
import { supabase } from "@/integrations/supabase/client"
import { trpc } from "@/lib/trpc"
import { useQuery, useMutation } from "@tanstack/react-query"
import { VoiceDashboard } from "@/components/voice/VoiceDashboard"
import { Button } from "@/components/ui/button"
```

### Coding Rules

**MUST**: TypeScript strict, WCAG 2.1 AA+, ARIA labels, voice testing, Brazilian localization, @/ imports

**SHOULD**: Mobile-first, optimistic updates, loading states, Portuguese localization, Brazilian testing

**MUST NOT**: No accessibility testing, no voice error handling, no hardcoded strings, ignore TypeScript warnings, skip financial testing

### Performance & Security

**Performance**: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, Voice <500ms, Accuracy >95%, Startup <3s, Bundle <650KB

**Security**: Sanitize inputs, validate data, proper error handling, HTTPS, no localStorage for sensitive data, LGPD compliance, mask sensitive info

---

**Status**: ✅ Optimized Architecture Document (< 400 lines)  
**Ownership**: Frontend Development Team


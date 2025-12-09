# Feature Modules Guide

## Package Identity

**Purpose**: Self-contained feature modules following Domain-Driven Design
**Architecture**: Layered (domain → backends → hooks → components → pages)

## Current Features

| Feature | Status | Complexity |
|---------|--------|------------|
| `ai-chat/` | ✅ Production | High |

## Setup & Run

> See root `AGENTS.md` for global commands (`bun dev:client`, `bun type-check`)

```bash
bun test src/features          # Unit tests for features
bun test:e2e:flows             # E2E user journeys
```

## Feature Architecture Pattern

Each feature follows a consistent layered structure:

```
src/features/[feature-name]/
├── domain/                    # Core types and interfaces
│   ├── types.ts               # TypeScript interfaces
│   ├── events.ts              # Domain events
│   └── [Entity]Backend.ts     # Backend interface contract
├── backends/                  # Backend implementations
│   ├── [Provider]Backend.ts   # Provider-specific implementations
│   ├── MockBackend.ts         # Testing backend
│   └── index.ts               # Factory and exports
├── agent/                     # AI agent logic (if applicable)
│   ├── prompts/               # System prompts and templates
│   ├── tools/                 # LLM tool definitions
│   └── context/               # Context management
├── components/                # UI components
├── hooks/                     # React hooks
├── pages/                     # Route pages
├── persistence/               # Data persistence
├── config/                    # Feature configuration
└── README.md                  # Feature documentation
```

## AI Chat Feature (`ai-chat/`)

### Architecture Overview

```
ai-chat/
├── domain/           # AG-UI Protocol compatible types
├── backends/         # Multi-provider support
│   ├── GeminiBackend.ts     # Primary (Google Gemini)
│   ├── AegisBackend.ts      # Custom Aegis agent
│   ├── CopilotKitBackend.ts # CopilotKit integration
│   └── MockBackend.ts       # Development/testing
├── agent/            # Financial AI agent
│   ├── tools/               # Function calling (accounts, transactions)
│   └── context/             # Financial context service
├── components/       # Chat UI (shadcn/ui)
└── hooks/            # State management (useChatController)
```

### Key Patterns

#### ✅ DO: Backend Factory Pattern

```typescript
// Copy pattern from: src/features/ai-chat/backends/index.ts
import { GeminiBackend } from './GeminiBackend';
import { MockBackend } from './MockBackend';

export function createBackend(type: 'gemini' | 'mock' = 'gemini') {
  switch (type) {
    case 'gemini':
      return new GeminiBackend({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    case 'mock':
      return new MockBackend();
  }
}
```

#### ✅ DO: Domain-Driven Types

```typescript
// Copy pattern from: src/features/ai-chat/domain/types.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatBackend {
  sendMessage(message: string): AsyncGenerator<StreamEvent>;
  abort(): void;
}
```

#### ✅ DO: Agent Tools with Zod Schemas

```typescript
// Copy pattern from: src/features/ai-chat/agent/tools/definitions.ts
import { z } from 'zod';

export const getAccountBalancesSchema = z.object({
  accountId: z.string().optional().describe('Filter by specific account'),
});

export const financialTools = {
  getAccountBalances: {
    description: 'Get user bank account balances',
    parameters: getAccountBalancesSchema,
  },
};
```

#### ❌ DON'T: Mix Domain Logic with UI

```typescript
// ❌ BAD: Domain logic in component
function ChatWidget() {
  const [messages, setMessages] = useState([]);
  // Direct API calls and state management mixed with UI
}

// ✅ GOOD: Separate concerns
function ChatWidget() {
  const { messages, sendMessage } = useChatController(backend);
  // UI only, logic in hook
}
```

## Touch Points / Key Files

**AI Chat Core**:
- `src/features/ai-chat/domain/types.ts` - Message types, AG-UI Protocol
- `src/features/ai-chat/backends/GeminiBackend.ts` - Primary AI backend
- `src/features/ai-chat/agent/factory.ts` - Agent creation
- `src/features/ai-chat/hooks/useChatController.ts` - State management

**Agent Tools**:
- `src/features/ai-chat/agent/tools/definitions.ts` - Tool schemas
- `src/features/ai-chat/agent/tools/handlers/` - Tool implementations

**Components**:
- `src/features/ai-chat/components/ChatContainer.tsx` - Main container
- `src/features/ai-chat/components/ChatConversation.tsx` - Message display
- `src/features/ai-chat/pages/AiChatPage.tsx` - Route page

## JIT Index Hints

```bash
# Find all backends
rg -n "class.*Backend" src/features/

# Find tool handlers
rg -n "export (async )?function" src/features/ai-chat/agent/tools/handlers/

# Find domain types
rg -n "export (interface|type)" src/features/*/domain/

# Find hooks
rg -n "export function use[A-Z]" src/features/*/hooks/

# Search for specific tool
rg -n "getAccountBalances" src/features/
```

## Adding New Features

1. Create directory structure following architecture pattern above
2. Define domain types in `domain/types.ts`
3. Implement backend(s) with factory pattern
4. Create hooks, build components (shadcn/ui)
5. Add README.md and tests in `__tests__/`

## Brazilian Compliance

> See root `AGENTS.md` for full compliance matrix

- **AI Chat**: LGPD consent required via `AIConsentModal.tsx`

## Pre-PR Checks

```bash
bun test src/features && bun type-check
```

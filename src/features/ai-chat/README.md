# AI Chat Feature

## Overview
Unified AI chat experience supporting multiple backends (Gemini, CopilotKit, AG-UI, Ottomator) with streaming responses, reasoning visibility, and voice integration.

## Component Integration Pattern

The AI chat feature uses a three-layer component architecture:

1. **shadcn/ui** - Base UI components (Button, Input, ScrollArea, etc.)
2. **ai-sdk.dev Elements** - Semantic wrapper components providing accessibility and structure
3. **KokonutUI** - Specialized AI input components with enhanced UX

### ai-sdk.dev Elements (`src/components/ai-elements/`)
- `Conversation` - Wraps message list with ARIA live regions
- `Response` - Wraps assistant message content
- `Reasoning` - Wraps AI reasoning/thinking display
- `PromptInput` - Wraps input form with semantic labels
- `Suggestion` - Wraps suggestion navigation
- `Task` - Wraps task tracking display
- `OpenInChat` - Wraps share/export functionality

### KokonutUI Components (`src/components/kokonutui/`)
- `AiPrompt` - Feature-rich prompt input with voice and attachment support
- `AiInputSearch` - Search-oriented input for AI queries
- `AiLoading` - Versatile loading indicators (dots, spinner, skeleton, pulse)

## Architecture

### Domain Layer
- **Types** (`domain/types.ts`): AG-UI Protocol-compatible message types
- **Events** (`domain/events.ts`): Stream event utilities

### Backend Abstraction
- **Interface** (`backends/ChatBackend.ts`): Universal backend contract
- **Factory** (`backends/index.ts`): `createChatBackend()` for type-safe backend creation
- **Implementation**:
  - `GeminiBackend`: Google Gemini API integration (currently implemented)
  - API key validation: Throws descriptive error when `VITE_GEMINI_API_KEY` is missing
  - See `docs/ai-chat-architecture.md` for future backend integration notes (CopilotKit, AG-UI, Ottomator)

### React Integration
- **Hook** (`hooks/useChatController.ts`): Manages conversation state, streaming, and reasoning visibility
  - Returns `enableReasoningView` based on options or `VITE_ENABLE_AI_REASONING` env var
- **Components** (`components/`): UI components with ai-sdk.dev Elements + KokonutUI integration
  - `ChatConversation`: Message list wrapped with `Conversation` element
  - `ChatResponse`: Message content wrapped with `Response` element
  - `ChatReasoning`: Reasoning display wrapped with `Reasoning` element
  - `ChatPromptInput`: Input using KokonutUI `AiPrompt` wrapped with `PromptInput`
  - `ChatSuggestions`: Suggestion chips wrapped with `Suggestion` element
  - `ChatTasks`: Task cards wrapped with `Task` element
  - `ChatSearchBar`: Search input using KokonutUI `AiInputSearch`
  - `ChatLoading`: Loading states using KokonutUI `AiLoading`

## Usage

```typescript
import { getDefaultBackend } from '@/features/ai-chat/backends';
import { useChatController } from '@/features/ai-chat/hooks/useChatController';

// Using default backend (validates API key)
const backend = getDefaultBackend(); // Throws if VITE_GEMINI_API_KEY is missing
const chat = useChatController(backend, {
  enableVoiceFeedback: true,
  enableReasoningView: import.meta.env.VITE_ENABLE_AI_REASONING === 'true',
});

// Using search bar
import { ChatSearchBar } from '@/features/ai-chat/components';

<ChatSearchBar
  onSearch={(query) => chat.sendMessage(query)}
  placeholder="Pesquisar transações..."
/>
```

## Environment Configuration

**Required Variables**:
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (get from Google AI Studio)
- `VITE_DEFAULT_AI_MODEL`: Model to use (default: `gemini-pro`)

**Optional Variables**:
- `VITE_ENABLE_AI_REASONING`: Show reasoning panel (`true`/`false`, default: `false`)

**Troubleshooting**:
- If you see "VITE_GEMINI_API_KEY is not configured" error, add the key to your `.env` file
- Use `env.example` as a template for required environment variables

## Adding New Backends

1. Implement `ChatBackend` interface
2. Map provider message format to AG-UI protocol
3. Implement streaming using async iterators
4. Export from `backends/index.ts`
5. Document integration in `docs/ai-chat-architecture.md`

## Testing

Run tests: `bun test src/features/ai-chat`

Test coverage targets:
- Domain types: 100%
- Chat controller: ≥90%
- Backend implementations: ≥85%
- Components: ≥80%

## Performance

- TTFB target: ≤150ms (P95)
- Token streaming rate: ≥50 tokens/second
- UI responsiveness: 60fps during streaming

## Accessibility

- ARIA live regions for streaming updates
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader support
- Focus management

## Future Enhancements

- [ ] Tool/function calling support
- [ ] Agent orchestration (multi-agent conversations)
- [ ] RAG integration with knowledge bases
- [ ] Conversation persistence (Supabase)
- [ ] Multi-modal inputs (images, audio)
- [ ] Conversation branching/forking
- [ ] Export conversations (PDF, Markdown)

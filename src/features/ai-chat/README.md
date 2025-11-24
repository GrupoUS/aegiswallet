# AI Chat Feature

## Overview
Unified AI chat experience supporting multiple backends (Gemini, CopilotKit, AG-UI, Ottomator) with streaming responses, reasoning visibility, and voice integration.

## Architecture

### Domain Layer
- **Types** (`domain/types.ts`): AG-UI Protocol-compatible message types
- **Events** (`domain/events.ts`): Stream event utilities

### Backend Abstraction
- **Interface** (`backends/ChatBackend.ts`): Universal backend contract
- **Implementations**:
  - `GeminiBackend`: Primary backend using Google Gemini API
  - `CopilotKitBackend`: Stub for CopilotKit integration
  - `AgUiBackend`: Stub for direct AG-UI protocol
  - `OttomatorBackend`: Stub for Ottomator RAG agents

### React Integration
- **Hook** (`hooks/useChatController.ts`): Manages conversation state and streaming
- **Components** (`components/`): UI components built on shadcn/ui and ai-sdk.dev Elements

## Usage

```typescript
import { GeminiBackend } from '@/features/ai-chat/backends';
import { useChatController } from '@/features/ai-chat/hooks/useChatController';

const backend = new GeminiBackend({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const chat = useChatController(backend, { enableVoiceFeedback: true });
```

## Adding New Backends

1. Implement `ChatBackend` interface
2. Map provider message format to AG-UI protocol
3. Implement streaming using async iterators
4. Add to backend factory in `backends/index.ts`

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

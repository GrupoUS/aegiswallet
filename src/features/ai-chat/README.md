# AI Chat Feature

Unified AI chat experience for AegisWallet supporting multiple backends (Gemini, CopilotKit, AG-UI, Ottomator) with AG-UI Protocol compatibility, streaming responses, reasoning visibility, and voice integration.

## Architecture

The feature follows a clean layered architecture:

```
ai-chat/
├── domain/           # Core types and interfaces
│   ├── types.ts      # AG-UI Protocol compatible message types
│   ├── events.ts     # Stream event factories and type guards
│   └── ChatBackend.ts # Backend interface contract
├── backends/         # Backend implementations
│   ├── GeminiBackend.ts     # Primary backend (Google Gemini)
│   ├── CopilotKitBackend.ts # Stub for CopilotKit integration
│   ├── AgUiBackend.ts       # Stub for direct AG-UI Protocol
│   ├── OttomatorBackend.ts  # Stub for Ottomator RAG agents
│   ├── MockBackend.ts       # Development/testing backend
│   └── index.ts             # Factory and exports
├── components/       # UI components (shadcn/ui + ai-elements)
├── hooks/            # React hooks
│   └── useChatController.ts # Main chat state management
└── config/           # Configuration
    └── models.ts     # Gemini model definitions
```

## Quick Start

### Basic Usage

```tsx
import { GeminiBackend } from '@/features/ai-chat/backends';
import { useChatController } from '@/features/ai-chat/hooks/useChatController';
import { ChatLayout, ChatConversation, ChatPromptInput } from '@/features/ai-chat/components';

function MyChat() {
  const backend = new GeminiBackend({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  });

  const {
    messages,
    sendMessage,
    isStreaming,
    stopStreaming,
  } = useChatController(backend);

  return (
    <ChatLayout title="My Assistant">
      <ChatConversation messages={messages} reasoning={[]} isStreaming={isStreaming} />
      <ChatPromptInput onSend={sendMessage} isStreaming={isStreaming} onStop={stopStreaming} />
    </ChatLayout>
  );
}
```

### Using the Full Container

For a complete chat experience with model selection and suggestions:

```tsx
import { ChatContainer } from '@/features/ai-chat/components';

function ChatPage() {
  return <ChatContainer />;
}
```

## Configuration

### Environment Variables

```bash
# Required for Gemini backend
VITE_GEMINI_API_KEY=your-api-key-here

# Optional: Default model (defaults to gemini-flash-lite-latest)
VITE_DEFAULT_AI_MODEL=gemini-flash-latest

# Optional: Enable reasoning visibility (default: false)
VITE_ENABLE_AI_REASONING=true
```

### Available Models

From `config/models.ts`:

| Model | Description | Speed | Cost |
|-------|-------------|-------|------|
| `gemini-flash-lite-latest` | Fastest, lightweight | Fastest | Lowest |
| `gemini-flash-latest` | Balanced speed/quality | Fast | Low |
| `gemini-3-pro-preview` | Best quality | Balanced | Medium |

## Component Integration Pattern

The AI chat uses a layered component architecture:

1. **shadcn/ui** - Base UI components (Button, Input, ScrollArea, etc.)
2. **ai-elements** - Semantic wrapper components from `src/components/ai-elements/`
3. **KokonutUI** - Specialized AI input components from `src/components/kokonutui/`

### Available Components

```tsx
import {
  ChatContainer,      // Full chat interface with backend integration
  ChatLayout,         // Structural layout (header/main/footer)
  ChatConversation,   // Message list with auto-scroll
  ChatResponse,       // Assistant message with markdown rendering
  ChatReasoning,      // Collapsible reasoning panel
  ChatImage,          // Image display with lightbox
  ChatPromptInput,    // Input with voice support
  ChatSuggestions,    // Suggestion chips
  ChatTasks,          // Task tracking panel
  ChatLoading,        // Loading states
  ChatContext,        // Token usage display
  ChatOpenInChatLink, // Share to external chat providers
  ChatSearchBar,      // Search input
  ChatWidget,         // Floating widget version
  ModelSelector,      // Model selection dropdown
} from '@/features/ai-chat/components';
```

## Backend System

### Creating Custom Backends

Implement the `ChatBackend` interface:

```typescript
import type { ChatBackend, ModelInfo } from '@/features/ai-chat/domain/ChatBackend';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '@/features/ai-chat/domain/types';
import { ChatEvents } from '@/features/ai-chat/domain/events';

class MyCustomBackend implements ChatBackend {
  async *send(
    messages: ChatMessage[],
    options?: ChatRequestOptions
  ): AsyncGenerator<ChatStreamChunk> {
    // Your implementation
    yield ChatEvents.textDelta('Hello');
    yield ChatEvents.done();
  }

  abort(): void {
    // Cancel ongoing request
  }

  getModelInfo(): ModelInfo {
    return {
      id: 'my-model',
      name: 'My Custom Model',
      provider: 'Custom',
      capabilities: { streaming: true, multimodal: false, tools: false, reasoning: false },
    };
  }
}
```

### Backend Factory

Use the factory for dynamic backend creation:

```typescript
import { createChatBackend } from '@/features/ai-chat/backends';

// Create Gemini backend
const backend = createChatBackend({
  type: 'gemini',
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: 'gemini-flash-latest',
});
```

## useChatController Hook

The main hook for managing chat state:

```typescript
const {
  // State
  messages,          // ChatMessage[] - conversation history
  isLoading,         // boolean - initial request loading
  isStreaming,       // boolean - actively receiving chunks
  streamingContent,  // string - current streaming content
  streamingReasoning,// string - current reasoning content
  suggestions,       // ChatSuggestion[] - current suggestions
  tasks,             // ChatTask[] - active tasks
  reasoning,         // ChatReasoningChunk[] - reasoning chunks
  error,             // ChatError | null - error state
  enableReasoningView, // boolean - reasoning visibility

  // Actions
  sendMessage,       // (content: string) => Promise<void>
  stopStreaming,     // () => void
  applySuggestion,   // (suggestion: ChatSuggestion) => void
  clearConversation, // () => void
  regenerateLastMessage, // () => Promise<void>
} = useChatController(backend, {
  enableVoiceFeedback: true,
  enableReasoningView: true,
  maxMessages: 100,
  systemPrompt: 'You are a helpful financial assistant.',
  onMessageSent: (msg) => console.log('Sent:', msg),
  onError: (err) => toast.error(err.message),
});
```

## Stream Events

The chat system uses AG-UI Protocol compatible stream events:

| Event Type | Description |
|------------|-------------|
| `message-start` | New message beginning |
| `message-end` | Message complete |
| `text-delta` | Text content chunk |
| `reasoning-delta` | Reasoning/thinking chunk |
| `tool-call-start` | Tool call beginning |
| `tool-call-end` | Tool call complete |
| `suggestion` | Follow-up suggestion |
| `task` | Task status update |
| `error` | Error occurred |
| `done` | Stream complete |

### Event Helpers

```typescript
import { ChatEvents, isTextDeltaChunk, isErrorChunk } from '@/features/ai-chat/domain/events';

// Create events
const textEvent = ChatEvents.textDelta('Hello');
const errorEvent = ChatEvents.error({ code: 'ERROR', message: 'Failed' });

// Type guards
if (isTextDeltaChunk(chunk)) {
  console.log('Text:', chunk.payload);
}
```

## Testing

Run tests:

```bash
bun test src/features/ai-chat
```

### Test Coverage Targets

| Component | Target |
|-----------|--------|
| Domain types | 100% |
| useChatController | ≥90% |
| Backend implementations | ≥85% |
| UI components | ≥80% |

## Performance

| Metric | Target |
|--------|--------|
| TTFB (Time to First Byte) | ≤150ms (P95) |
| Token streaming rate | ≥50 tokens/second |
| UI responsiveness | 60fps during streaming |

## Accessibility

- ARIA live regions for streaming updates
- Keyboard navigation (Tab, Enter, Esc, Ctrl+K)
- Screen reader support
- Focus management
- WCAG 2.1 AA compliant

## Future Enhancements

- [ ] Tool/function calling support
- [ ] Agent orchestration (multi-agent conversations)
- [ ] RAG integration with knowledge bases (Ottomator)
- [ ] Conversation persistence (NeonDB)
- [ ] Multi-modal inputs (images, audio)
- [ ] Conversation branching/forking
- [ ] Export conversations (PDF, Markdown)

## Related Documentation

- [AI Chat Architecture](../../../docs/ai-chat-architecture.md)
- [AI Chat SDK Comparison](../../../docs/ai-chat-sdk-comparison.md)
- [AG-UI Protocol](https://github.com/ag-ui-protocol/ag-ui)

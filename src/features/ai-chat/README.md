# AI Chat Feature

This directory contains the implementation of the Unified AI Chat Experience for AegisWallet.

## Architecture

The feature is designed with a clean separation of concerns:

- **`domain/`**: Contains the core types (`ChatMessage`, `ChatRole`) and the `ChatBackend` interface. This is the source of truth for the chat model.
- **`backends/`**: Contains implementations of `ChatBackend`. Currently, `GeminiBackend` is implemented.
- **`components/`**: Contains UI components built with shadcn/ui and following the `ai-sdk` conceptual model.
- **`hooks/`**: Contains `useChatController`, which manages the chat state and bridges the UI with the backend.

## Usage

To use the chat feature, simply render the `AiChatPage` component or compose the sub-components as needed.

```tsx
import AiChatPage from '@/features/ai-chat/pages/AiChatPage';

export default function Page() {
  return <AiChatPage />;
}
```

## Extending

### Adding a New Backend

1.  Create a new class in `backends/` that implements `ChatBackend`.
2.  Implement the `send` method to yield `ChatStreamChunk`s.
3.  Swap the backend in `AiChatPage` or inject it via props.

### Customizing UI

The UI components are modular. You can replace `ChatConversation` or `ChatPromptInput` with custom implementations as long as they adhere to the data flow managed by `useChatController`.

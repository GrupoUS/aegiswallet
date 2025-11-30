# Frontend Architecture - Voice-First Experience

## Stack Técnico (Modern & Performant)

| Componente | Tecnologia | Versão | Optimização |
|------------|------------|--------|------------|
| Runtime | Bun | Latest | 3-5x faster than Node.js |
| Framework | React 19 | 19.x | Concurrent features |
| Routing | TanStack Router | 1.139+ | File-based, type-safe |
| Data Fetching | TanStack Query | 5.90+ | Smart caching |
| State | Zustand | 5.x | Lightweight state |
| Forms | React Hook Form + Zod | 7.x / 4.x | Type-safe forms |
| Styling | Tailwind CSS | 4.x | Utility-first |
| UI Components | shadcn/ui + Radix | - | WCAG 2.1 AA compliant |
| Build | Vite | 7.x | Lightning-fast builds |

---

## Estrutura de Diretórios (Voice-First)

```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── voice/                 # Voice interface components ⭐
│   │   ├── VoiceDashboard.tsx
│   │   ├── VoiceIndicator.tsx
│   │   └── VoiceResponse.tsx
│   ├── ai-elements/           # AI chat semantic components ⭐
│   │   ├── Conversation.tsx
│   │   ├── Response.tsx
│   │   ├── Reasoning.tsx
│   │   └── PromptInput.tsx
│   ├── kokonutui/            # AI-specific UI patterns ⭐
│   │   ├── AiPrompt.tsx
│   │   ├── AiInputSearch.tsx
│   │   └── AiLoading.tsx
│   ├── accessibility/         # Brazilian accessibility ⭐
│   │   ├── AccessibilityProvider.tsx
│   │   └── hooks/
│   ├── financial/             # Financial components
│   ├── layout/                # Layout components
│   └── providers/             # Context providers
├── features/
│   ├── ai-chat/               # AI chat feature ⭐
│   │   ├── ChatLayout.tsx
│   │   ├── ChatConversation.tsx
│   │   ├── ChatSuggestions.tsx
│   │   └── hooks/
│   └── calendar/              # Financial calendar
├── routes/                    # TanStack Router
│   ├── __root.tsx            # Root layout
│   ├── index.tsx             # Voice-first home ⭐
│   ├── dashboard.tsx         # Minimal dashboard
│   ├── ai-chat.lazy.tsx      # AI chat route ⭐
│   └── calendar.tsx          # Financial calendar
├── hooks/                     # Custom hooks
│   ├── useVoiceRecognition.ts ⭐ Voice recognition
│   ├── useMultimodalResponse.ts ⭐ TTS integration
│   └── useAccessibility.ts    # Brazilian accessibility
├── lib/
│   ├── voiceCommandProcessor.ts ⭐ Voice command NLU ⭐
│   ├── nlu/                   # Natural Language Understanding ⭐
│   └── stt/                   # Speech-to-Text services ⭐
└── types/                     # TypeScript types
```

---

## Voice Interface Architecture ⭐

### Voice Command Processing Pipeline

```typescript
interface VoiceCommandPipeline {
  1. Wake Detection: "Ok Assistente" or tap gesture
  2. Speech Recognition: Portuguese (BR) - 95% accuracy target
  3. Intent Classification: 6 essential commands + variations
  4. Context Analysis: Financial data + user history
  5. AI Processing: Autonomous decision making
  6. Response Generation: Voice + visual feedback
  7. Action Execution: Financial operations
  8. Confirmation: Success/failure feedback
}
```

### 6 Essential Voice Commands (95% of needs)

1. **"Como está meu saldo?"** - Current balance + available funds
2. **"Quanto posso gastar esse mês?"** - Budget availability + recommendations
3. **"Tem algum boleto programado para pagar?"** - Upcoming bills + payment options
4. **"Tem algum recebimento programado para entrar?"** - Scheduled income + dates
5. **"Como ficará meu saldo no final do mês?"** - Month-end projection + trends
6. **"Faz uma transferência para tal pessoa?"** - Transfer + security verification

### Voice Response Patterns

```typescript
interface VoiceResponseTemplate {
  greeting: string;           // "Claro", "Com certeza", "Entendido"
  acknowledgment: string;     // Echo of user's request
  data: FinancialData;        // Specific financial information
  context: string;           // Additional relevant information
  suggestion: string;        // Optional recommendation
  confirmation: string;      // Action confirmation or question
}
```

### AI Autonomy Visualization

```typescript
interface AutonomyLevel {
  level: number;              // 0-100 percentage
  visualIndicator: string;    // Progress bar, confidence meter
  capabilities: string[];     // What AI can do autonomously
  userApproval: boolean;      // Requires confirmation for sensitive actions
  transparency: string;       // What AI shows user about its decisions
}
```

**Autonomy Levels:**
- **0-25**: Learning Phase - Basic balance queries only
- **26-50**: Assistant Phase - Bill reminders, basic transfers
- **51-75**: Autonomy Phase - Autonomous bill payments
- **76-100**: Trust Phase - Full financial management

---

## AI Chat Architecture ⭐

### Unified Chat System

**Backend Support:**
- **Gemini**: Google Gemini API (fully implemented)
- **CopilotKit**: Future integration
- **AG-UI Protocol**: Direct protocol support
- **Ottomator**: RAG agents integration

### Chat Layers

#### 1. Domain Layer
```typescript
// Universal message format - AG-UI compatible
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
}
```

#### 2. Backend Abstraction
```typescript
interface ChatBackend {
  send(messages: ChatMessage[]): AsyncIterableIterator<ChatStreamChunk>;
  abort(): void;
  getModelInfo(): ModelInfo;
}
```

#### 3. React Integration
```typescript
// useChatController hook
const {
  messages,
  isLoading,
  sendMessage,
  error,
  enableReasoningView
} = useChatController({
  enableReasoningView: process.env.VITE_ENABLE_AI_REASONING === 'true'
});
```

### Voice + Chat Integration

**Input Methods:**
- **Voice Input**: `ChatPromptInput` + `useVoiceCommand` for speech-to-text
- **Text Input**: Standard typing with autocomplete suggestions
- **Hybrid**: Voice + touch combinations for sensitive actions

**Output Methods:**
- **Voice Output**: `useMultimodalResponse` for text-to-speech
- **Visual Output**: Streaming response display
- **Combined**: Voice response with visual confirmation

### AI Chat Components

**Core Components:**
- `ChatLayout`: Structural layout with voice support
- `ChatConversation`: Message list with auto-scroll
- `ChatResponse`: Assistant message with markdown rendering
- `ChatReasoning`: Collapsible AI reasoning view
- `ChatPromptInput`: Voice + text input integration
- `ChatSuggestions`: Intelligent suggestion chips

**Voice Integration:**
- `AiPrompt` (KokonutUI): Feature-rich input with voice support
- `ChatSearchBar`: Search-driven chat flows
- `ChatOpenInChatLink`: Share to external AI providers

---

## Data Fetching & State Management

### TanStack Query Patterns

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Voice-optimized query
const { data, isLoading } = useQuery({
  queryKey: ['balance'],
  queryFn: () => apiClient.get('/api/v1/voice/balance'),
  staleTime: 30_000, // 30 seconds for financial data
})

// Optimistic updates for voice commands
const { mutate } = useMutation({
  mutationFn: (data) => apiClient.post('/api/v1/pix/transactions', data),
  onMutate: async (newTransaction) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(['transactions'])

    // Snapshot previous value
    const previousTransactions = queryClient.getQueryData(['transactions'])

    // Optimistically update
    queryClient.setQueryData(['transactions'], old => [...old, newTransaction])

    return { previousTransactions }
  },
  onError: (err, newTransaction, context) => {
    // Rollback on error
    queryClient.setQueryData(['transactions'], context.previousTransactions)
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries(['transactions'])
  },
})
```

### Voice Command State Management

```typescript
// Voice recognition state
interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  transcript: string
  confidence: number
  error: string | null
  supported: boolean
}

// useVoiceRecognition hook integration
const {
  isListening,
  isProcessing,
  transcript,
  confidence,
  startListening,
  stopListening
} = useVoiceRecognition({
  onTranscript: handleVoiceTranscript,
  onError: handleVoiceError
})
```

---

## Brazilian Accessibility & Localization ⭐

### WCAG 2.1 AA Compliance

**Voice-First Accessibility:**
- Screen reader announcements for voice responses
- Keyboard navigation with voice shortcuts
- High contrast voice visualization indicators
- Font size scaling for voice feedback displays

**Brazilian Localization:**
```typescript
// Portuguese Brazilian voice settings
const voiceSettings = {
  language: 'pt-BR',
  accent: 'neutral-sao-paulo',
  speed: 140, // words per minute
  tone: 'professional-friendly',
  gender: 'neutral' // inclusive voice
}

// Brazilian date/currency formatting
const formatters = {
  currency: new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }),
  date: new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
```

### Voice Emergency Patterns

**Emergency Voice Commands:**
- `"Ajuda"` - Emergency contact mode
- `"Emergência"` - Call predefined contact
- `"Sem voz"` - Switch to visual-only mode
- `"Acessibilidade"` - Enhanced accessibility mode

**Visual-Only Mode Features:**
- Large text and high contrast options
- Simplified navigation with clear labels
- Emergency contact quick access
- Voice commands remain available as backup

---

## Component Patterns

### Voice Interface Components

```typescript
// Voice Dashboard - Main interface
export const VoiceDashboard = () => {
  const { isListening, startListening, stopListening } = useVoiceRecognition();

  return (
    <div className="voice-dashboard">
      <VoiceIndicator isListening={isListening} />
      <VoiceResponse />
      <VoiceButton
        onPress={isListening ? stopListening : startListening}
      />
    </div>
  );
};

// Voice Feedback Component
export const VoiceResponse = ({ command, response }: VoiceResponseProps) => {
  const { speak } = useMultimodalResponse();

  useEffect(() => {
    if (response) {
      speak(response.message);
    }
  }, [response, speak]);

  return (
    <Card className="voice-response">
      <CardContent>
        <div className="transcript">{command}</div>
        <div className="response">{response.message}</div>
      </CardContent>
    </Card>
  );
};
```

### AI Chat Components

```typescript
// Chat Layout with Voice Integration
export const ChatLayout = () => {
  const { messages, sendMessage, isLoading } = useChatController({
    enableReasoningView: process.env.VITE_ENABLE_AI_REASONING === 'true'
  });

  return (
    <div className="chat-layout">
      <ChatConversation messages={messages} />
      <ChatPromptInput
        onSubmit={sendMessage}
        disabled={isLoading}
        voiceEnabled={true}
      />
      {isLoading && <ChatLoading />}
    </div>
  );
};
```

---

## Performance Optimization

### Targets (Voice-First Optimized)

| Métrica | Alvo | Voice-Specific |
|---------|------|----------------|
| Voice Response Time | <200ms | <150ms TTFB |
| Speech Recognition | <500ms | 95% accuracy |
| Chat Streaming | <150ms | 60fps UI updates |
| LCP | < 2.5s | Optimized for voice |
| TTI | < 3s | Voice ready state |

### Optimizations

**Voice Performance:**
- Pre-load speech recognition models
- Cache voice command patterns
- Optimize audio processing with Web Workers
- Implement voice-specific code splitting

**Chat Performance:**
- Streaming responses with immediate TTFB
- Lazy-load AI chat route (`ai-chat.lazy.tsx`)
- Memoize message components with `React.memo`
- Implement virtual scrolling for long conversations

**General Performance:**
- Code splitting por rota (TanStack Router)
- Prefetch de rotas adjacentes
- Cache de queries (TanStack Query)
- Service Worker for offline voice commands

---

## Development Scripts

```bash
# Development
bun dev                    # Vite dev server
bun dev:full              # Dev server + voice tools

# Voice Testing
bun test:voice            # Voice recognition tests
bun test:voice:accuracy   # Speech accuracy tests
bun test:accessibility    # WCAG compliance tests

# Build
bun build                 # Production build
bun build:client          # Frontend only build
bun preview               # Build preview

# Quality
bun lint                  # OXLint + Biome
bun lint:fix              # Auto-fix issues
bun type-check            # TypeScript validation
bun test                  # Unit + integration tests
bun test:e2e              # End-to-end voice tests

# Routes
bun routes:generate       # Generate route tree
```

---

## Environment Variables

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# AI Chat (Voice Assistant)
VITE_GEMINI_API_KEY=...
VITE_ENABLE_AI_REASONING=true

# Voice Recognition
VITE_VOICE_SERVICE_KEY=...
VITE_STT_PROVIDER=google|azure|aws

# Text-to-Speech
VITE_TTS_SERVICE_KEY=...
VITE_TTS_PROVIDER=google|azure|aws

# API (uses Hono RPC)
VITE_API_URL=http://localhost:3000
```

---

## Future Enhancements

**Phase 2 (Advanced Voice):**
- Multi-language support (English/Spanish)
- Voice biometrics authentication
- Context-aware voice responses
- Voice-controlled financial automation

**Phase 3 (AI Evolution):**
- RAG integration with financial knowledge base
- Multi-agent conversations
- Voice-driven investment recommendations
- Personalized voice personality adaptation

**Phase 4 (Enterprise):**
- Team voice collaboration
- Voice analytics dashboard
- Custom voice models
- On-premise voice processing

---

**Última Atualização**: Novembro 2025
**Status**: Voice-First MVP Complete
**Quality Target**: ≥9.5/10 (Voice + AI + Accessibility)

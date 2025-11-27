# Voice Interface Architecture Reference

## Voice-First Design Principles

### Essential Voice Commands
AegisWallet implements six essential voice commands that cover 95% of financial operations:

```typescript
const ESSENTIAL_VOICE_COMMANDS = [
  {
    command: "Como está meu saldo?",
    intent: "balance_query",
    response_time: "<500ms",
    confidence_threshold: 0.85
  },
  {
    command: "Quanto posso gastar esse mês?", 
    intent: "spending_capacity_query",
    response_time: "<800ms",
    confidence_threshold: 0.80
  },
  {
    command: "Tem algum boleto programado para pagar?",
    intent: "scheduled_bills_query", 
    response_time: "<600ms",
    confidence_threshold: 0.85
  },
  {
    command: "Tem algum recebimento programado para entrar?",
    intent: "scheduled_income_query",
    response_time: "<600ms", 
    confidence_threshold: 0.85
  },
  {
    command: "Como ficará meu saldo no final do mês?",
    intent: "balance_projection_query",
    response_time: "<1000ms",
    confidence_threshold: 0.80
  },
  {
    command: "Faz uma transferência para [pessoa] de [valor]?",
    intent: "money_transfer",
    response_time: "<2000ms",
    confidence_threshold: 0.90
  }
];
```

## Voice Processing Pipeline

### Speech Recognition Integration
```typescript
// Speech-to-text processing with Brazilian Portuguese optimization
class VoiceRecognitionService {
  private recognition: SpeechRecognition;
  private language = 'pt-BR';
  
  constructor() {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = this.language;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
  }
  
  async startListening(): Promise<VoiceStream> {
    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        const confidence = event.results[event.results.length - 1][0].confidence;
        
        if (confidence > 0.8) {
          resolve({
            transcript: transcript.toLowerCase().trim(),
            confidence,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      this.recognition.start();
    });
  }
}
```

### Intent Classification System
```typescript
// AI-powered intent classification for financial commands
class IntentClassifier {
  private model: AIService;
  private confidenceThreshold = 0.8;
  
  async classifyIntent(transcript: string): Promise<VoiceIntent> {
    const normalizedTranscript = this.normalizePortugueseText(transcript);
    
    const intentPatterns = {
      balance_query: [
        /saldo|quantos? (tenhos?|tenho).*conta/i,
        /como.*está.*minha.*conta/i,
        /quanto.*dinheiro/i
      ],
      transfer_query: [
        /transfer(e|ir|ência)?.*para/i,
        /envia(r|do).*para/i,
        /manda(r|do).*dinheiro/i
      ],
      bill_query: [
        /boleto|conta.*pagar/i,
        /tem.*conta.*programada/i,
        /pagar.*conta/i
      ]
    };
    
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedTranscript)) {
          return {
            intent,
            confidence: this.calculateConfidence(transcript, pattern),
            entities: this.extractEntities(transcript, intent)
          };
        }
      }
    }
    
    // Fallback to AI classification
    return await this.aiClassify(normalizedTranscript);
  }
  
  private normalizePortugueseText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim();
  }
}
```

### Voice Response Generation
```typescript
// Text-to-speech response generation with Brazilian Portuguese
class VoiceResponseService {
  private synthesis: SpeechSynthesis;
  private voice: SpeechSynthesisVoice;
  
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voice = this.getBrazilianPortugueseVoice();
  }
  
  async generateResponse(text: string, context: ResponseContext): Promise<void> {
    const formattedResponse = this.formatFinancialResponse(text, context);
    const utterance = new SpeechSynthesisUtterance(formattedResponse);
    
    utterance.voice = this.voice;
    utterance.rate = 1.0; // Normal speech rate
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 0.9; // Slightly reduced for comfort
    
    // Add natural pauses for financial data
    utterance.text = this.addNaturalPauses(formattedResponse);
    
    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);
      
      this.synthesis.speak(utterance);
    });
  }
  
  private formatFinancialResponse(text: string, context: ResponseContext): string {
    if (context.type === 'balance') {
      return this.formatBalanceResponse(text, context.data);
    }
    
    if (context.type === 'transfer') {
      return this.formatTransferResponse(text, context.data);
    }
    
    return text;
  }
  
  private formatBalanceResponse(text: string, balance: number): string {
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(balance);
    
    return text.replace('{amount}', formattedAmount);
  }
}
```

## Voice Component Architecture

### Voice Dashboard Component
```typescript
interface VoiceDashboardProps {
  onVoiceCommand: (command: VoiceCommand) => void;
  autonomyLevel: number;
  isConnected: boolean;
}

export const VoiceDashboard: React.FC<VoiceDashboardProps> = ({
  onVoiceCommand,
  autonomyLevel,
  isConnected
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  
  const voiceRecognition = useVoiceRecognition({
    onResult: (transcript) => {
      setCurrentTranscript(transcript);
      processVoiceCommand(transcript);
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      handleVoiceError(error);
    }
  });
  
  const processVoiceCommand = async (transcript: string) => {
    try {
      const intent = await classifyIntent(transcript);
      const response = await executeVoiceAction(intent);
      
      setLastResponse(response.text);
      onVoiceCommand({
        transcript,
        intent: intent.intent,
        response: response.text,
        confidence: intent.confidence,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      setLastResponse('Desculpe, não entendi. Poderia repetir?');
    }
  };
  
  return (
    <div className="voice-dashboard" role="application" aria-label="Painel de voz">
      <VoiceIndicator 
        isListening={isListening}
        autonomyLevel={autonomyLevel}
      />
      
      <TranscriptDisplay 
        transcript={currentTranscript}
        response={lastResponse}
      />
      
      <VoiceControls
        isListening={isListening}
        isConnected={isConnected}
        onStart={() => {
          setIsListening(true);
          voiceRecognition.start();
        }}
        onStop={() => {
          setIsListening(false);
          voiceRecognition.stop();
        }}
      />
      
      <AccessibilityAnnouncer message={lastResponse} />
    </div>
  );
};
```

### Voice Feedback Components
```typescript
// Voice indicator with visual feedback
const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ 
  isListening, 
  autonomyLevel 
}) => {
  return (
    <div 
      className={cn(
        "voice-indicator",
        isListening && "listening",
        isListening && "animate-pulse"
      )}
      role="status"
      aria-label={isListening ? "Ouvindo comando de voz" : "Voz inativa"}
    >
      <div className="voice-level">
        {isListening && (
          <div className="voice-wave">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
      
      <div className="autonomy-indicator">
        <span className="text-xs text-gray-500">
          Autonomia: {autonomyLevel}%
        </span>
      </div>
    </div>
  );
};

// Transcript display with accessibility
const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  response
}) => {
  return (
    <div className="transcript-display" role="log" aria-live="polite">
      {transcript && (
        <div className="user-transcript">
          <span className="label">Você:</span>
          <span className="text">{transcript}</span>
        </div>
      )}
      
      {response && (
        <div className="ai-response">
          <span className="label">Assistente:</span>
          <span className="text">{response}</span>
        </div>
      )}
    </div>
  );
};
```

## Error Handling and Fallbacks

### Voice Error Recovery
```typescript
class VoiceErrorHandler {
  async handleRecognitionError(error: SpeechRecognitionErrorEvent): Promise<string> {
    const errorMessages = {
      'no-speech': 'Não ouvi nada. Poderia falar mais alto?',
      'audio-capture': 'Problema com o microfone. Verifique se está conectado.',
      'not-allowed': 'Permissão negada. Permita o acesso ao microfone.',
      'network': 'Problema de conexão. Verifique sua internet.',
      'aborted': 'Operação cancelada.'
    };
    
    return errorMessages[error.error] || 'Ocorreu um erro. Tente novamente.';
  }
  
  async handleLowConfidence(transcript: string, confidence: number): Promise<string> {
    if (confidence < 0.5) {
      return 'Não entendi bem. Poderia repetir de outra forma?';
    }
    
    if (confidence < 0.7) {
      return `Entendi "${transcript}". É isso mesmo?`;
    }
    
    return '';
  }
}
```

### Accessibility Integration
```typescript
// Screen reader announcements for voice interactions
const AccessibilityAnnouncer: React.FC<{message: string}> = ({ message }) => {
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      // Clear announcement after it's read
      setTimeout(() => setAnnouncement(''), 100);
    }
  }, [message]);
  
  return (
    <div 
      className="sr-only" 
      role="status" 
      aria-live="assertive" 
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
};
```

## Performance Optimization

### Voice Processing Optimization
```typescript
const voiceOptimization = {
  // Preload speech models
  preloadModels: true,
  
  // Use Web Workers for intensive processing
  useWebWorkers: true,
  
  // Cache common command patterns
  cachePatterns: {
    'saldo': { intent: 'balance_query', confidence: 0.9 },
    'transferir': { intent: 'transfer_query', confidence: 0.9 },
    'boleto': { intent: 'bill_query', confidence: 0.85 }
  },
  
  // Optimize for Brazilian Portuguese
  languageOptimization: {
    accentHandling: true,
    colloquialisms: ['tá', 'pra', 'pro', 'cê'],
    financialTerms: ['reais', 'real', 'centavos', 'pix', 'boleto']
  }
};
```

This reference provides comprehensive guidance for implementing voice-first interfaces optimized for Brazilian financial applications, with emphasis on natural language processing, error handling, and accessibility compliance.
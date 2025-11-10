# 🛠️ Padrões de Erros Conhecidos e Soluções

*Guia prático para problemas comuns no stack AegisWallet*

---

## 📋 ÍNDICE RÁPIDO

1. [tRPC Type Errors](#trpc-type-errors)
2. [LGPD Compliance Issues](#lgpd-compliance-issues)
3. [Voice Command Failures](#voice-command-failures)
4. [Database Schema Problems](#database-schema-problems)
5. [Brazilian Market Issues](#brazilian-market-issues)
6. [Performance Patterns](#performance-patterns)
7. [Security Vulnerabilities](#security-vulnerabilities)

---

## 🔧 tRPC TYPE ERRORS

### Problema 1: ctx.user Undefined

**Sintoma**:
```typescript
// Erro em runtime
Property 'user' does not exist on type 'Context'
```

**Causa**:
```typescript
// ❌ Contexto tipado incorretamente
export type Context = inferAsyncReturnType<typeof createContext>;

export const createContext = async () => {
  return {
    session,
    user: session?.user || null, // Não tipado
    supabase,
  };
};
```

**Solução**:
```typescript
// ✅ Corrigir tipo do contexto
export interface CreateContextOptions {
  session: Session | null;
  supabase: SupabaseClient;
}

export const createContext = async (): Promise<CreateContextOptions> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    session,
    user: session?.user ?? null,
    supabase,
  };
};

export type Context = CreateContextOptions;

// ✅ Procedures com tipos corretos
export const balanceRouter = router({
  getBalance: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }
      return { userId: ctx.user.id };
    }),
});
```

### Problema 2: Input Validation Missing

**Sintoma**:
```typescript
// Erro de validação em runtime
ZodError: Invalid input
```

**Causa**:
```typescript
// ❌ Sem validação de input
export const transferRouter = router({
  createTransfer: protectedProcedure
    .mutation(async ({ input }) => {
      // input pode ser undefined ou inválido
      return processTransfer(input);
    }),
});
```

**Solução**:
```typescript
// ✅ Adicionar validação Zod
import { z } from 'zod';

const createTransferSchema = z.object({
  recipientKey: z.string().min(1),
  amount: z.number().positive().max(10000), // Limite PIX
  message: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

export const transferRouter = router({
  createTransfer: protectedProcedure
    .input(createTransferSchema)
    .mutation(async ({ input, ctx }) => {
      // Input validado e type-safe
      return processTransfer(input, ctx.user.id);
    }),
});
```

### Problema 3: Date Serialization Issues

**Sintoma**:
```typescript
// Datas chegam como string no frontend
expected Date but got string
```

**Causa**:
```typescript
// ❌ Supabase retorna datas como string
const transaction = await supabase
  .from('transactions')
  .select('*')
  .single(); // transaction_date é string
```

**Solução**:
```typescript
// ✅ Transformador customizado para datas
const dateTransformer = {
  input: (val: unknown) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  },
  output: (val: unknown) => {
    if (val instanceof Date) return val.toISOString();
    return val;
  },
};

// ✅ Ou usar Zod com transform
const transactionSchema = z.object({
  transaction_date: z.string().transform((str) => new Date(str)),
});
```

---

## 🛡️ LGPD COMPLIANCE ISSUES

### Problema 1: Consentimento de Voz Não Implementado

**Sintoma**:
```typescript
// Teste de LGPD falha
Expected voice_data_consent to be defined
```

**Solução**:
```typescript
// ✅ Interface de consentimento completo
interface UserConsent {
  data_processing: boolean;
  analytics: boolean;
  voice_data_consent: boolean;
  voice_recording_consent: boolean;
  biometric_consent: boolean;
  marketing_consent: boolean;
  consent_version: string;
  consent_date: Date;
  ip_address: string;
  user_agent: string;
}

// ✅ Tabela no banco
CREATE TABLE user_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  consent_version VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

// ✅ Service de consentimento
export class ConsentService {
  async recordConsent(
    userId: string, 
    consentData: Partial<UserConsent>
  ): Promise<void> {
    const { error } = await supabase
      .from('user_consent')
      .insert([{
        user_id: userId,
        consent_type: 'voice_data',
        granted: consentData.voice_data_consent,
        consent_version: '1.0.0',
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
      }]);

    if (error) throw new Error('Failed to record consent');
  }

  async hasConsent(userId: string, type: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_consent')
      .select('granted')
      .eq('user_id', userId)
      .eq('consent_type', type)
      .eq('granted', true)
      .single();

    return !!data;
  }
}
```

### Problema 2: Retenção de Dados Não Definida

**Sintoma**:
```typescript
// Política de retenção ausente
Expected voice_data_retention to be defined
```

**Solução**:
```typescript
// ✅ Configuração de retenção
interface DataRetentionConfig {
  voice_data: '30_days' | '90_days' | '1_year';
  transcriptions: '1_year' | '5_years';
  audit_logs: '5_years' | '10_years';
  user_data: 'indefinite' | '5_years';
  financial_data: '7_years'; // Obrigatório por lei
}

// ✅ Service de retenção
export class DataRetentionService {
  private retentionConfig: DataRetentionConfig = {
    voice_data: '90_days',
    transcriptions: '1_year',
    audit_logs: '5_years',
    user_data: 'indefinite',
    financial_data: '7_years',
  };

  async cleanupExpiredData(): Promise<void> {
    const retentionDates = this.calculateRetentionDates();
    
    // Limpar dados de voz expirados
    if (retentionDates.voice_data) {
      await supabase
        .from('voice_recordings')
        .delete()
        .lt('created_at', retentionDates.voice_data);
    }

    // Limpar transcrições expiradas
    if (retentionDates.transcriptions) {
      await supabase
        .from('voice_transcriptions')
        .delete()
        .lt('created_at', retentionDates.transcriptions);
    }
  }

  private calculateRetentionDates(): Record<string, Date | null> {
    const now = new Date();
    return {
      voice_data: this.subtractDays(now, 90),
      transcriptions: this.subtractDays(now, 365),
      audit_logs: this.subtractDays(now, 365 * 5),
      financial_data: this.subtractDays(now, 365 * 7), // Não remove
    };
  }
}
```

### Problema 3: Direito à Esquecimento

**Solução**:
```typescript
// ✅ Service de anonimização
export class RightToForgottenService {
  async anonymizeUserData(userId: string): Promise<void> {
    // Anonimizar dados pessoais
    await supabase
      .from('users')
      .update({
        email: `deleted_${userId}@deleted.com`,
        full_name: 'DELETED USER',
        phone: null,
        cpf: null,
        birth_date: null,
      })
      .eq('id', userId);

    // Anonimizar transações (manter dados financeiros)
    await supabase
      .from('transactions')
      .update({
        description: 'TRANSACTION DELETED',
        notes: null,
      })
      .eq('user_id', userId);

    // Deletar dados de voz permanentemente
    await supabase
      .from('voice_recordings')
      .delete()
      .eq('user_id', userId);

    // Deletar transcrições
    await supabase
      .from('voice_transcriptions')
      .delete()
      .eq('user_id', userId);

    // Registrar em audit log
    await this.auditLogDeletion(userId);
  }
}
```

---

## 🎤 VOICE COMMAND FAILURES

### Problema 1: Timeout em Redes Brasileiras

**Sintoma**:
```typescript
// Timeout em comandos de voz
Request timeout - Please try again
```

**Causa**:
```typescript
// ❌ Timeout muito curto para 3G/4G no Brasil
constructor(config: STTConfig) {
  this.config = {
    timeout: config.timeout || 8000, // 8s muito pouco
  };
}
```

**Solução**:
```typescript
// ✅ Timeout adaptativo baseado na rede
export class AdaptiveSTTService extends SpeechToTextService {
  private getNetworkBasedTimeout(): number {
    const connection = (navigator as any).connection;
    
    if (!connection) return 15000; // Default 15s

    const { effectiveType, downlink } = connection;
    
    // Configuração baseada na qualidade da rede
    const timeouts = {
      'slow-2g': 30000,    // 30s para 2G
      '2g': 25000,         // 25s para 2G
      '3g': 20000,         // 20s para 3G
      '4g': 15000,         // 15s para 4G
    };

    return timeouts[effectiveType as keyof typeof timeouts] || 15000;
  }

  async transcribe(audioBlob: Blob | File): Promise<STTResult> {
    const adaptiveTimeout = this.getNetworkBasedTimeout();
    this.config.timeout = adaptiveTimeout;
    
    return super.transcribe(audioBlob);
  }
}
```

### Problema 2: Voice Activity Detection Não Implementado

**Solução**:
```typescript
// ✅ Implementar VAD
export class VoiceActivityDetector {
  private isDetecting = false;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private speechDetected = false;

  constructor(
    private onSpeechStart: () => void,
    private onSpeechEnd: () => void,
    private silenceDuration = 1500 // 1.5s de silêncio
  ) {}

  async startDetection(stream: MediaStream): Promise<void> {
    this.isDetecting = true;
    
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 512;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const detect = () => {
      if (!this.isDetecting) return;

      analyser.getByteFrequencyData(dataArray);
      
      // Calcular energia do sinal
      const energy = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const threshold = 30; // Ajustável

      if (energy > threshold && !this.speechDetected) {
        this.speechDetected = true;
        this.onSpeechStart();
        this.resetSilenceTimer();
      } else if (energy <= threshold && this.speechDetected) {
        this.startSilenceTimer();
      }

      requestAnimationFrame(detect);
    };

    detect();
  }

  private resetSilenceTimer(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
    this.silenceTimeout = null;
  }

  private startSilenceTimer(): void {
    if (this.silenceTimeout) return;

    this.silenceTimeout = setTimeout(() => {
      this.speechDetected = false;
      this.onSpeechEnd();
    }, this.silenceDuration);
  }

  stop(): void {
    this.isDetecting = false;
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }
  }
}
```

### Problema 3: Cache de Transcrições Ausente

**Solução**:
```typescript
// ✅ Cache inteligente de transcrições
export class TranscriptionCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 100;

  interface CacheEntry {
    transcription: string;
    timestamp: number;
    audioHash: string;
  }

  async getTranscription(audioBlob: Blob): Promise<string | null> {
    const audioHash = await this.hashAudio(audioBlob);
    const cached = this.cache.get(audioHash);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.transcription;
    }
    
    return null;
  }

  async cacheTranscription(audioBlob: Blob, transcription: string): Promise<void> {
    const audioHash = await this.hashAudio(audioBlob);
    
    // Limpar cache se necessário
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(audioHash, {
      transcription,
      timestamp: Date.now(),
      audioHash,
    });
  }

  private async hashAudio(audioBlob: Blob): Promise<string> {
    const buffer = await audioBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

---

## 🗄️ DATABASE SCHEMA PROBLEMS

### Problema 1: Tabelas Faltantes

**Solução**:
```sql
-- ✅ Criar tabelas críticas ausentes
CREATE TABLE IF NOT EXISTS voice_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  command_id UUID REFERENCES voice_commands(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  category VARCHAR(50), -- 'accuracy', 'speed', 'understanding'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  command_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INTEGER,
  audio_duration_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_code VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  signature TEXT, -- Assinatura digital
  retention_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_voice_metrics_user_created ON voice_metrics(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_voice_feedback_user_rating ON voice_feedback(user_id, rating);
```

### Problema 2: Colunas Faltantes

**Solução**:
```sql
-- ✅ Adicionar colunas ausentes
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS voice_feedback BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accessibility_high_contrast BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessibility_large_text BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessibility_screen_reader BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_recognition_language VARCHAR(10) DEFAULT 'pt-BR';

ALTER TABLE bank_accounts 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_nickname VARCHAR(100),
ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(20) DEFAULT 'daily';

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS voice_command_id UUID REFERENCES voice_commands(id),
ADD COLUMN IF NOT EXISTS category_suggestion VARCHAR(100);
```

---

## 🇧🇷 BRAZILIAN MARKET ISSUES

### Problema 1: Validação de CPF Incompleta

**Solução**:
```typescript
// ✅ Validação completa de CPF
export class CPFValidator {
  static isValid(cpf: string): boolean {
    // Remover caracteres não numéricos
    const cleanedCPF = cpf.replace(/[^\d]/g, '');
    
    // Verificar tamanho
    if (cleanedCPF.length !== 11) return false;
    
    // Verificar sequências inválidas
    if (/^(\d)\1{10}$/.test(cleanedCPF)) return false;
    
    // Calcular dígitos verificadores
    let sum = 0;
    let remainder: number;
    
    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanedCPF.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanedCPF.substring(9, 10))) return false;
    
    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanedCPF.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanedCPF.substring(10, 11))) return false;
    
    return true;
  }

  static format(cpf: string): string {
    const cleaned = cpf.replace(/[^\d]/g, '');
    if (cleaned.length !== 11) return cpf;
    
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }

  static generate(): string {
    let cpf = '';
    
    // Gerar 9 dígitos base
    for (let i = 0; i < 9; i++) {
      cpf += Math.floor(Math.random() * 10).toString();
    }
    
    // Calcular dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    cpf += remainder.toString();
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    cpf += remainder.toString();
    
    return this.format(cpf);
  }
}
```

### Problema 2: Formatação de Telefone Brasileiro

**Solução**:
```typescript
// ✅ Formatação completa de telefones brasileiros
export class PhoneFormatter {
  static format(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '');
    
    // Celular com 9 dígitos (ex: 11987654321)
    if (cleaned.length === 11 && cleaned[2] === '9') {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    
    // Celular sem 9 (antigo) ou fixo (ex: 1187654321)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    // Com DDD internacional (ex: 5511987654321)
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    
    // Sem formatação conhecida
    return phone;
  }

  static isValid(phone: string): boolean {
    const cleaned = phone.replace(/[^\d]/g, '');
    
    // Verificar tamanhos válidos
    const validLengths = [10, 11]; // Fixo ou celular
    if (!validLengths.includes(cleaned.length)) return false;
    
    // Verificar DDDs válidos
    const ddd = parseInt(cleaned.slice(0, 2));
    const validDDDs = [
      11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
      21, 22, 24, // RJ
      27, 28, // ES
      31, 32, 33, 34, 35, 37, 38, // MG
      41, 42, 43, 44, 45, 46, // PR
      47, 48, 49, // SC
      51, 53, 54, 55, // RS
      61, 62, 63, 64, 65, 66, 67, 68, 69, // Centro-Oeste
      71, 73, 74, 75, 77, // BA
      79, // SE
      81, 82, 83, 84, 85, 86, 87, 88, 89, // PE, PI, CE, RN
      91, 92, 93, 94, 95, 96, 97, 98, 99, // Norte
    ];
    
    return validDDDs.includes(ddd);
  }
}
```

### Problema 3: Formatação de Valores BRL

**Solução**:
```typescript
// ✅ Formatação robusta de valores brasileiros
export class BRLFormatter {
  static format(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  static parse(value: string): number {
    // Remover formatação brasileira
    const cleaned = value
      .replace(/[R$\s]/g, '') // Remove R$ e espaços
      .replace(/\./g, '') // Remove pontos de milhar
      .replace(/,/g, '.'); // Converte vírgula para ponto
    
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      throw new Error(`Valor monetário inválido: ${value}`);
    }
    
    return parsed;
  }

  static formatCompact(value: number): string {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return this.format(value);
  }
}
```

---

## ⚡ PERFORMANCE PATTERNS

### Problema 1: Bundle Size Optimization

**Solução**:
```typescript
// ✅ Configuração otimizada de code splitting
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Framework components
          if (id.includes('@tanstack')) {
            return 'framework';
          }
          
          // Heavy components
          if (id.includes('recharts') || id.includes('date-fns')) {
            return 'visualization';
          }
          
          // Voice features (lazy load)
          if (id.includes('voice') || id.includes('speech')) {
            return 'voice-features';
          }
          
          // Banking features
          if (id.includes('banking') || id.includes('pix')) {
            return 'banking';
          }
          
          // UI components
          if (id.includes('@radix-ui')) {
            return 'ui-components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@tanstack/react-router',
    ],
  },
});
```

### Problema 2: Lazy Loading de Componentes

**Solução**:
```typescript
// ✅ Componentes pesados com lazy loading
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading para componentes pesados
const VoiceDashboard = lazy(() => import('@/components/voice/VoiceDashboard'));
const FinancialCalendar = lazy(() => import('@/components/calendar/financial-calendar'));
const PixTransfer = lazy(() => import('@/components/financial/PixTransfer'));

// Componente wrapper com loading
export function LazyVoiceDashboard() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <VoiceDashboard />
    </Suspense>
  );
}

// ✅ Prefetching inteligente
export function usePrefetchComponents() {
  const location = useLocation();
  
  useEffect(() => {
    // Prefetch com base na navegação
    if (location.pathname === '/dashboard') {
      import('@/components/voice/VoiceDashboard');
    }
    
    if (location.pathname === '/pix') {
      import('@/components/financial/PixTransfer');
    }
  }, [location.pathname]);
}
```

### Problema 3: Cache Strategy

**Solução**:
```typescript
// ✅ Estratégia de cache multicamadas
export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly MEMORY_TTL = 5 * 60 * 1000; // 5 minutos
  
  interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Memory cache (mais rápido)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < memoryEntry.ttl) {
      return memoryEntry.data;
    }
    
    // 2. Session storage
    try {
      const sessionEntry = sessionStorage.getItem(`cache:${key}`);
      if (sessionEntry) {
        const parsed = JSON.parse(sessionEntry);
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          // Atualizar memory cache
          this.memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      // Ignorar erro de sessionStorage
    }
    
    // 3. IndexedDB para dados grandes
    try {
      const dbEntry = await this.getFromIndexedDB(key);
      if (dbEntry && Date.now() - dbEntry.timestamp < dbEntry.ttl) {
        // Atualizar caches superiores
        this.set(key, dbEntry.data, dbEntry.ttl);
        return dbEntry.data;
      }
    } catch {
      // Ignorar erro de IndexedDB
    }
    
    return null;
  }

  async set<T>(key: string, data: T, ttl: number = this.MEMORY_TTL): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    // Memory cache
    this.memoryCache.set(key, entry);
    
    // Session storage
    try {
      sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch {
      // Limpar cache se estiver cheio
      this.clearOldestMemoryEntries();
      sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    }
    
    // IndexedDB para dados grandes
    if (JSON.stringify(data).length > 1024) {
      this.setToIndexedDB(key, entry);
    }
  }

  private clearOldestMemoryEntries(): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Manter apenas os 50 mais recentes
    const toKeep = entries.slice(-50);
    this.memoryCache = new Map(toKeep);
  }

  // Métodos IndexedDB...
  private async getFromIndexedDB(key: string): Promise<CacheEntry | null> {
    // Implementação do IndexedDB
    return null;
  }

  private async setToIndexedDB(key: string, entry: CacheEntry): Promise<void> {
    // Implementação do IndexedDB
  }
}
```

---

## 🔒 SECURITY VULNERABILITIES

### Problema 1: Session Management

**Solução**:
```typescript
// ✅ Session management seguro
export class SessionManager {
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private readonly WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutos
  private sessionTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;

  constructor(private onSessionExpire: () => void) {}

  startSession(): void {
    this.clearTimers();
    
    // Timer de warning
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning();
    }, this.WARNING_TIMEOUT);
    
    // Timer de expiração
    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, this.SESSION_TIMEOUT);
  }

  extendSession(): void {
    // Limpar timers existentes
    this.clearTimers();
    
    // Atualizar última atividade
    this.updateLastActivity();
    
    // Reiniciar timers
    this.startSession();
  }

  private clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private expireSession(): void {
    // Limpar dados sensíveis
    this.clearSensitiveData();
    
    // Notificar expiração
    this.onSessionExpire();
  }

  private clearSensitiveData(): void {
    // Limpar cache sensível
    sessionStorage.clear();
    
    // Limpar tokens
    localStorage.removeItem('supabase.auth.token');
    
    // Limpar dados de formulários
    document.querySelectorAll('input[type="password"]').forEach(input => {
      (input as HTMLInputElement).value = '';
    });
  }

  private updateLastActivity(): void {
    localStorage.setItem('lastActivity', Date.now().toString());
  }

  private showSessionWarning(): void {
    // Mostrar modal de warning
    if (confirm('Sua sessão expirará em 5 minutos. Deseja continuar?')) {
      this.extendSession();
    }
  }
}
```

### Problema 2: Rate Limiting

**Solução**:
```typescript
// ✅ Rate limiting por IP e usuário
export class RateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  
  interface AttemptRecord {
    count: number;
    firstAttempt: number;
    lastAttempt: number;
  }

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutos
  ) {}

  async checkLimit(identifier: string): Promise<boolean> {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return true;
    }
    
    // Resetar se a janela de tempo expirou
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return true;
    }
    
    // Incrementar tentativas
    record.count++;
    record.lastAttempt = now;
    
    // Verificar limite
    if (record.count > this.maxAttempts) {
      // Log de tentativa de ataque
      await this.logSuspiciousActivity(identifier, record);
      return false;
    }
    
    return true;
  }

  private async logSuspiciousActivity(
    identifier: string, 
    record: AttemptRecord
  ): Promise<void> {
    const logEntry = {
      identifier,
      attempts: record.count,
      timespan: record.lastAttempt - record.firstAttempt,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    // Enviar para monitoring
    await fetch('/api/security/rate-limit-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    });
  }

  // Rate limiting específico para API
  static createApiLimiter(): RateLimiter {
    return new RateLimiter(100, 60 * 1000); // 100 requisições por minuto
  }
  
  // Rate limiting para login
  static createAuthLimiter(): RateLimiter {
    return new RateLimiter(5, 15 * 60 * 1000); // 5 tentativas em 15 minutos
  }
}
```

### Problema 3: CSRF Protection

**Solução**:
```typescript
// ✅ CSRF token implementation
export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf-token';
  private static readonly HEADER_NAME = 'X-CSRF-Token';

  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    
    // Set também em cookie para verificação server-side
    document.cookie = `${this.TOKEN_KEY}=${token}; SameSite=Strict; Secure`;
  }

  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  static validateToken(requestedToken: string): boolean {
    const storedToken = this.getToken();
    return storedToken === requestedToken;
  }

  static addToRequest(headers: Record<string, string>): void {
    const token = this.getToken();
    if (token) {
      headers[this.HEADER_NAME] = token;
    }
  }

  // Middleware para tRPC
  static createCSRFMiddleware() {
    return async ({ ctx, next }: any) => {
      const requestToken = ctx.req?.headers?.['x-csrf-token'];
      
      if (!requestToken || !this.validateToken(requestToken)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'CSRF token inválido',
        });
      }
      
      return next();
    };
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Crítico (Implementar Imediatamente)
- [ ] Corrigir tipo `ctx.user` no tRPC
- [ ] Implementar consentimento LGPD para voz
- [ ] Criar tabelas `voice_feedback`, `voice_metrics`, `audit_logs`
- [ ] Adicionar colunas faltantes nas tabelas existentes
- [ ] Implementar session management
- [ ] Adicionar rate limiting

### ✅ Alto Impacto (Próximas 2 semanas)
- [ ] Implementar VAD para comandos de voz
- [ ] Corrigir validação de CPF
- [ ] Implementar timeout adaptativo
- [ ] Adicionar cache de transcrições
- [ ] Implementar CSRF protection
- [ ] Corrigir formatação brasileira

### ✅ Médio Impacto (Próximo mês)
- [ ] Otimizar bundle size
- [ ] Implementar lazy loading
- [ ] Adicionar estratégia de cache multicamadas
- [ ] Implementar direito à esquecimento
- [ ] Otimizar para redes móveis

---

## 🔗 MONITORAMENTO E ALERTAS

### Métricas Chave:
```typescript
// ✅ Configuração de monitoring
export const performanceMetrics = {
  voiceCommandLatency: 'voice_command_processing_time_ms',
  errorRate: 'error_rate_percentage',
  apiResponseTime: 'api_response_time_ms',
  bundleSize: 'bundle_size_kb',
  memoryUsage: 'memory_usage_mb',
};

// ✅ Alertas automáticos
export const alerts = {
  voiceCommandFailure: {
    threshold: 10, // 10% de falha
    window: '5m',
    action: 'notify_team',
  },
  apiTimeout: {
    threshold: 5, // 5% de timeout
    window: '1m',
    action: 'escalate',
  },
  securityViolation: {
    threshold: 1, // Qualquer violação
    window: 'immediate',
    action: 'alert_security',
  },
};
```

---

*Guia atualizado em: 07/11/2025*
*Baseado em problemas reais identificados no código*

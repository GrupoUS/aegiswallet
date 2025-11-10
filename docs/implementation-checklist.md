# ✅ Checklist de Implementação Rápida

*Guia prático para implementar as correções críticas no AegisWallet*

---

## 🚑 FASE CRÍTICA - IMPLEMENTAR EM 24-48H

### 1. LGPD Consentimento Mínimo (2 horas)

```typescript
// ✅ Adicionar em src/components/auth/ConsentForm.tsx
const VoiceConsentForm = () => {
  const [consents, setConsents] = useState({
    voice_data_processing: false,
    biometric_data: false,
    audio_recording: false,
  });

  const handleSubmit = async () => {
    await supabase.from('user_consent').insert([{
      user_id: user.id,
      consent_type: 'voice_data',
      granted: consents.voice_data_processing,
      consent_version: '1.0.0',
    }]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <input
          type="checkbox"
          checked={consents.voice_data_processing}
          onChange={(e) => setConsents(prev => ({
            ...prev,
            voice_data_processing: e.target.checked
          }))}
        />
        Permito processamento de dados de voz para comandos financeiros
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={consents.biometric_data}
          onChange={(e) => setConsents(prev => ({
            ...prev,
            biometric_data: e.target.checked
          }))}
        />
        Permito armazenamento de padrões de voz biométricos
      </label>
      
      <button type="submit">Salvar Preferências</button>
    </form>
  );
};
```

### 2. Correção Type Safety tRPC (3 horas)

```typescript
// ✅ Corrigir em src/server/context.ts
export interface CreateContextOptions {
  session: Session | null;
  user: User | null;
  supabase: SupabaseClient;
}

export const createContext = async (): Promise<CreateContextOptions> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    session,
    user: session?.user ?? null, // ✅ Tipado corretamente
    supabase,
  };
};

export type Context = CreateContextOptions;

// ✅ Corrigir procedures
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

### 3. Criação de Tabelas Críticas (1 hora)

```sql
-- ✅ Executar no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS user_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  consent_version VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  command_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices essenciais
CREATE INDEX idx_user_consent_user_granted ON user_consent(user_id, granted);
CREATE INDEX idx_voice_feedback_user_rating ON voice_feedback(user_id, rating);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
```

### 4. Session Management Básico (2 horas)

```typescript
// ✅ Adicionar em src/lib/sessionManager.ts
export class SessionManager {
  private readonly TIMEOUT = 30 * 60 * 1000; // 30 minutos
  
  constructor() {
    this.setupActivityTracking();
    this.startTimeoutWarning();
  }

  private setupActivityTracking() {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
  }

  private resetTimer() {
    localStorage.setItem('lastActivity', Date.now().toString());
  }

  private startTimeoutWarning() {
    setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity > this.TIMEOUT - 300000) { // 5 minutos antes
        this.showWarning();
      }
      
      if (timeSinceActivity > this.TIMEOUT) {
        this.expireSession();
      }
    }, 60000); // Verificar a cada minuto
  }

  private showWarning() {
    if (confirm('Sua sessão expirará em 5 minutos. Deseja continuar?')) {
      this.resetTimer();
    }
  }

  private expireSession() {
    supabase.auth.signOut();
    window.location.href = '/login';
  }
}

// ✅ Inicializar em src/main.tsx
new SessionManager();
```

---

## ⚡ FASE ALTA - IMPLEMENTAR EM 1 SEMANA

### 5. Validação CPF Completa (4 horas)

```typescript
// ✅ Substituir em src/lib/utils.ts
export class CPFValidator {
  static isValid(cpf: string): boolean {
    const cleaned = cpf.replace(/[^\d]/g, '');
    
    if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
      return false;
    }

    let sum = 0;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(cleaned.substring(10, 11));
  }

  static format(cpf: string): string {
    const cleaned = cpf.replace(/[^\d]/g, '');
    if (cleaned.length !== 11) return cpf;
    
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
}
```

### 6. Rate Limiting Básico (3 horas)

```typescript
// ✅ Adicionar em src/server/middleware/rateLimit.ts
export class SimpleRateLimiter {
  private attempts = new Map<string, number[]>();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutos
  ) {}

  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.attempts.has(identifier)) {
      this.attempts.set(identifier, []);
    }

    const attempts = this.attempts.get(identifier)!;
    
    // Remover tentativas antigas
    const recentAttempts = attempts.filter(time => time > windowStart);
    this.attempts.set(identifier, recentAttempts);

    if (recentAttempts.length >= this.maxAttempts) {
      return false; // Bloqueado
    }

    // Adicionar tentativa atual
    recentAttempts.push(now);
    return true; // Permitido
  }
}

// ✅ Middleware para tRPC
export const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const limiter = new SimpleRateLimiter();
  const identifier = ctx.user?.id || ctx.req?.headers['x-forwarded-for'] || 'anonymous';
  
  if (!limiter.checkLimit(identifier)) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas tentativas. Tente novamente em alguns minutos.'
    });
  }
  
  return next();
});
```

### 7. Error Boundary React (2 horas)

```typescript
// ✅ Adicionar em src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Enviar para monitoring
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Ops! Algo deu errado</h1>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ Implementar em src/App.tsx
function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
```

### 8. Timeout Adaptativo para Voz (3 horas)

```typescript
// ✅ Modificar em src/lib/stt/speechToTextService.ts
export class AdaptiveSTTService extends SpeechToTextService {
  private getNetworkBasedTimeout(): number {
    const connection = (navigator as any).connection;
    
    if (!connection) return 15000;

    const timeouts = {
      'slow-2g': 30000, // 30s
      '2g': 25000,      // 25s
      '3g': 20000,      // 20s
      '4g': 15000,      // 15s
    };

    return timeouts[connection.effectiveType] || 15000;
  }

  async transcribe(audioBlob: Blob): Promise<STTResult> {
    const originalTimeout = this.config.timeout;
    this.config.timeout = this.getNetworkBasedTimeout();
    
    try {
      return await super.transcribe(audioBlob);
    } finally {
      this.config.timeout = originalTimeout;
    }
  }
}

// ✅ Substituir factory function
export function createSTTService(): SpeechToTextService {
  return new AdaptiveSTTService({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    language: 'pt',
    timeout: 15000, // Default aumentado
  });
}
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### ✅ Testes Obrigatórios (Implementar Junto)

```typescript
// ✅ Adicionar em src/test/critical.test.ts
describe('Critical Fixes', () => {
  it('should validate CPF correctly', () => {
    expect(CPFValidator.isValid('123.456.789-09')).toBe(true);
    expect(CPFValidator.isValid('111.111.111-11')).toBe(false);
    expect(CPFValidator.isValid('123')).toBe(false);
  });

  it('should enforce rate limiting', async () => {
    const limiter = new SimpleRateLimiter(3, 1000); // 3 tentativas por segundo
    
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(true);
    expect(limiter.checkLimit('user1')).toBe(false); // Bloqueado
  });

  it('should handle session timeout', () => {
    const manager = new SessionManager();
    expect(() => manager.resetTimer()).not.toThrow();
  });
});
```

### ✅ Validação de Implementação

- [ ] **LGPD**: Formulário de consentimento aparecendo no primeiro login
- [ ] **Type Safety**: Zero erros TypeScript em compilation
- [ ] **Database**: Todas as tabelas criadas no Supabase
- [ ] **Session**: Logout automático após 30 minutos inativo
- [ ] **CPF**: Validação funcionando nos formulários
- [ ] **Rate Limit**: APIs protegidas contra abuse
- [ ] **Error Boundary**: App não quebra completamente em erros
- [ ] **Voice Timeout**: Comandos funcionando em conexões lentas

---

## 🚀 COMANDOS DE EXECUÇÃO

### Para Implementar Imediato:

```bash
# 1. Criar tabelas no banco
bunx supabase db push

# 2. Gerar types do banco
bun types:generate

# 3. Rodar testes críticos
bun test:unit src/test/critical.test.ts

# 4. Verificar type safety
bunx tsc --noEmit

# 5. Build e deploy
bun build:client
bun build:server
```

### Para Validação:

```bash
# Verificar LGPD compliance
bun test:unit src/test/quality-control/lgpd-compliance-issues.test.ts

# Verificar type safety
bun test:unit src/test/quality-control/trpc-type-violations.test.ts

# Verificar database schema
bun test:unit src/test/quality-control/database-schema-mismatches.test.ts

# Testar performance de voz
bun test:unit src/test/performance/voiceCommandPerformance.test.ts
```

---

## 📞 SUPORTE RÁPIDO

### Se Algo Der Errado:

1. **Database Issues**
   ```bash
   # Verificar schema
   bunx supabase db diff --schema public
   # Reset migration
   bunx supabase db reset
   ```

2. **TypeScript Errors**
   ```bash
   # Verificar tipos
   bunx tsc --noEmit --pretty
   # Corrigir automaticamente
   bun lint:fix
   ```

3. **Build Issues**
   ```bash
   # Limpar build
   rm -rf dist node_modules
   bun install
   bun build
   ```

### Contatos de Emergência:
- **Tech Lead**: [Slack #tech-lead]
- **DevOps**: [Slack #devops]
- **Product**: [Slack #product]

---

## 🎯 SUCCESS CRITERIA

### Para Considerar Implementação Bem-Sucedida:

- ✅ Zero erros TypeScript
- ✅ Todos os testes críticos passando
- ✅ Build funcionando sem warnings
- ✅ LGPD consent working no frontend
- ✅ Rate limiting ativo nas APIs
- ✅ Session timeout funcional
- ✅ CPF validation working nos forms
- ✅ Voice commands funcionando em 3G

### Métricas Pós-Implementação:
- Tempo de resposta < 2s
- Taxa de erro < 1%
- Uptime > 99.5%
- LGPD compliance 100%

---

## 📝 NOTAS FINAIS

**Importante**: Este checklist é para mitigação imediata de riscos críticos. Após implementar todos os itens, prossiga com o roadmap completo de 3 meses documentado nos outros arquivos.

**Lembre-se**: 
- Teste cada item em staging antes de prod
- Monitore logs nos primeiros dias
- Tenha rollback plan pronto
- Comunique mudanças para equipe

---

*Checklist atualizado: 07/11/2025*  
*Próxima revisão: 14/11/2025*

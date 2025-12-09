# Utility Libraries Guide

## Package Identity

**Purpose**: Shared utilities, security, compliance, and domain-specific libraries
**Scope**: Mixed client/server utilities (check usage notes below)

## Client vs Server Usage

| Module | Usage | Notes |
|--------|-------|-------|
| `api-client.ts`, `utils.ts`, `formatters/` | Client-safe | Import freely in components |
| `nlu/`, `speech/`, `stt/`, `tts/` | Client-safe | Browser APIs |
| `server-actions/` | Server-only | Never import in frontend |
| `security/security-middleware.ts` | Server-only | Backend middleware |
| `compliance/`, `lgpd/` | Mostly server | Some require DB access |

## Setup & Run

> See root `AGENTS.md` for global commands (`bun type-check`, `bun lint`)

```bash
bun test src/lib               # Unit tests for utilities
```

## Library Structure

```
src/lib/
├── ai/                        # AI/LLM utilities
│   ├── consent/               # LGPD consent for AI
│   ├── context/               # Financial context service
│   ├── prompts/               # System prompts
│   ├── security/              # Input sanitization
│   └── tools/                 # AI tool definitions
├── compliance/                # LGPD compliance service
├── formatters/                # Brazilian formatters (currency, dates)
├── import/                    # Bank statement import
│   ├── extractors/            # CSV/PDF extractors
│   ├── processors/            # Bank detection, Gemini processing
│   └── validators/            # Duplicate checking, schema validation
├── lgpd/                      # LGPD data retention
├── localization/              # PT-BR localization
├── logging/                   # Structured logging
├── multimodal/                # Response templates
├── nlu/                       # Natural Language Understanding
│   ├── nluEngine.ts           # Core NLU engine
│   ├── intentClassifier.ts    # Intent classification
│   ├── entityExtractor.ts     # Entity extraction
│   └── brazilianPatterns.ts   # PT-BR patterns
├── security/                  # Security utilities
│   ├── sanitization.ts        # Input sanitization
│   ├── auditLogger.ts         # LGPD audit logging
│   ├── fraudDetection.ts      # Transaction fraud detection
│   └── rateLimiter.ts         # Rate limiting
├── speech/                    # Speech recognition service
├── stt/                       # Speech-to-text
├── stripe/                    # Stripe client config
├── tts/                       # Text-to-speech
├── utils/                     # Generic utilities
├── validation/                # Zod validators
├── api-client.ts              # API client wrapper
└── utils.ts                   # cn() and common utilities
```

## Key Patterns

### API Client Pattern

#### ✅ DO: Type-Safe API Client

```typescript
// Copy pattern from: src/lib/api-client.ts
class ApiClient {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new ApiError(response);
    const { data } = await response.json();
    return data as T;
  }
}

export const apiClient = new ApiClient();
```

### Brazilian Formatters Pattern

#### ✅ DO: BRL Currency Formatting

```typescript
// Copy pattern from: src/lib/formatters/brazilianFormatters.ts
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Usage: formatBRL(1500.50) → "R$ 1.500,50"
```

#### ✅ DO: Brazilian Date Formatting

```typescript
// Copy pattern from: src/lib/formatters/brazilianFormatters.ts
export function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Usage: formatDateBR(new Date()) → "09/12/2024"
```

### NLU Engine Pattern

#### ✅ DO: Intent Classification

```typescript
// Copy pattern from: src/lib/nlu/nluEngine.ts
export class NLUEngine {
  async processUtterance(text: string): Promise<NLUResult> {
    const normalized = this.normalizer.normalize(text);
    const intent = this.classifier.classify(normalized);
    const entities = this.extractor.extract(normalized);

    return { intent, entities, confidence: intent.confidence };
  }
}

export const createNLUEngine = () => new NLUEngine(DEFAULT_CONFIG);
```

### Security Pattern

#### ✅ DO: Input Sanitization

```typescript
// Copy pattern from: src/lib/security/sanitization.ts
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/[<>'"]/g, '')            // Remove special chars
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
}
```

#### ✅ DO: Audit Logging (LGPD)

```typescript
// Copy pattern from: src/lib/security/auditLogger.ts
export function logDataAccess(
  userId: string,
  action: 'view' | 'export' | 'delete',
  resource: string,
  metadata?: Record<string, unknown>
) {
  logger.info('LGPD_DATA_ACCESS', {
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}
```

### Compliance Service Pattern

#### ✅ DO: LGPD Compliance Checks

```typescript
// Copy pattern from: src/lib/compliance/compliance-service.ts
export class ComplianceService {
  async validateConsent(userId: string, purpose: string): Promise<boolean> {
    const consent = await this.getConsentRecord(userId, purpose);
    return consent?.granted === true && !this.isExpired(consent);
  }

  async requestDataExport(userId: string): Promise<ExportResult> {
    await logDataAccess(userId, 'export', 'user_data');
    // LGPD Art. 18 - Right to data portability
    return this.generateUserDataExport(userId);
  }
}
```

### Import Pipeline Pattern

#### ✅ DO: Bank Statement Processing

```typescript
// Copy pattern from: src/lib/import/processors/gemini-processor.ts
export async function processStatement(
  file: File,
  options: ProcessOptions
): Promise<Transaction[]> {
  const extracted = await csvExtractor.extract(file);
  const bank = bankDetector.detect(extracted);
  const validated = await duplicateChecker.check(extracted.transactions);

  return validated;
}
```

### Anti-Patterns

- ❌ Hardcoded locale → ✅ Use `formatBRL()` from formatters
- ❌ Skip sanitization → ✅ Use `sanitizeInput()` first
- ❌ Missing audit logs → ✅ Log via `auditLogger.ts` for LGPD

## Touch Points / Key Files

**Core**: `api-client.ts`, `utils.ts`, `formatters/brazilianFormatters.ts`
**Security**: `security/sanitization.ts`, `security/auditLogger.ts`
**Compliance**: `compliance/compliance-service.ts`, `lgpd/dataRetention.ts`
**NLU**: `nlu/nluEngine.ts`, `nlu/brazilianPatterns.ts`
**Import**: `import/extractors/csv-extractor.ts`, `import/processors/bank-detector.ts`

## JIT Index Hints

```bash
rg -n "export function format" src/lib/formatters/
rg -n "export (function|class)" src/lib/security/
rg -n "LGPD|consent|audit" src/lib/
```

## Brazilian Compliance

> See root `AGENTS.md` for full compliance matrix

- **LGPD**: `lib/compliance/` and `lib/lgpd/`
- **Localization**: PT-BR in `localization/ptBR.ts`

## Pre-PR Checks

```bash
bun test src/lib && bun type-check
```

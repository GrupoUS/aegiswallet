---
name: webapp-testing
description: Advanced healthcare testing framework for AegisWallet using Biome + Vitest. Provides LGPD compliance testing, Portuguese voice interface validation, tRPC type-safe testing, and Supabase RLS validation. Integrates with 4-phase quality control methodology for comprehensive healthcare fintech testing in Brazilian market.
license: Complete terms in LICENSE.txt
version: 2.0.0
author: AegisWallet Development Team
lastUpdated: 2025-01-20
---

# 🏥 AegisWallet Web Application Testing Framework

**Purpose**: Comprehensive healthcare compliance testing framework for Brazilian fintech applications using Biome + Vitest integration.

**When to use**: Use this skill when you need to:
- Test LGPD compliance for patient data handling
- Validate Portuguese voice interface functionality
- Ensure tRPC type-safe API integration
- Test Supabase Row Level Security (RLS) policies
- Run healthcare compliance validation
- Execute performance testing for critical patient flows
- Validate accessibility compliance (WCAG 2.1 AA)
- Run 4-phase quality control methodology

## 🚀 Quick Start

### Basic Healthcare Testing
```bash
# Run all healthcare compliance tests
bun test:healthcare

# Run comprehensive healthcare test suite with quality gates
bun test:healthcare-full

# Run specific test categories
vitest run --config vitest.healthcare.config.ts src/test/healthcare/lgpd-compliance.test.ts
vitest run --config vitest.healthcare.config.ts src/test/healthcare/voice-interface.test.ts
```

### Quality Control Integration
```bash
# Run tests with Biome linting (50-100x faster than ESLint)
bun run lint && bun test:healthcare

# Generate comprehensive test report
bun scripts/run-healthcare-tests.ts
```

## 🏗️ Architecture Overview

### Testing Stack
- **Biome 2.3**: Ultra-fast linting and formatting (50-100x faster than ESLint)
- **Vitest 3.2**: Vite-native test runner (3-5x faster than Jest)
- **React Testing Library**: User-centric component testing
- **TypeScript Strict Mode**: Type-safe testing with full coverage

### Healthcare Compliance Features
- **LGPD Testing**: Data masking, consent management, audit trails
- **Voice Interface**: Portuguese command recognition with 95%+ confidence
- **Accessibility**: WCAG 2.1 AA compliance for voice-first interfaces
- **Security**: RLS policy validation, SQL injection prevention
- **Performance**: Core Web Vitals monitoring for patient flows

### Integration Points
- **tRPC**: Type-safe API procedure testing
- **Supabase**: Database RLS and authentication testing
- **Quality Control**: 4-phase methodology integration
- **Bun**: Optimized package management and execution

## 📋 Test Categories

### 1. LGPD Compliance Testing (`lgpd-compliance.test.ts`)

**Purpose**: Ensure Brazilian data protection law compliance

**Test Coverage**:
- ✅ Explicit consent before data collection
- ✅ Data masking for sensitive information (CPF, phone)
- ✅ Right to erasure implementation
- ✅ Audit trail validation
- ✅ Data minimization principles
- ✅ Purpose limitation enforcement

**Key Validators**:
```typescript
// Custom LGPD compliance matcher
expect(maskedCPF).toBeLGPDCompliant('cpf')
expect(phone).toBeLGPDCompliant('phone')

// Consent validation
expect(patientData.lgpdConsent).toMatchObject({
  timestamp: expect.any(String),
  ip: '127.0.0.1',
  deviceId: 'test-device-id',
  consentType: 'treatment',
  version: '1.0',
})
```

### 2. Voice Interface Testing (`voice-interface.test.ts`)

**Purpose**: Validate Portuguese voice command processing for healthcare

**Test Coverage**:
- ✅ Brazilian Portuguese speech recognition (pt-BR)
- ✅ Financial command processing (transferir, pagar, etc.)
- ✅ Medical appointment scheduling
- ✅ Confidence threshold validation (95%+)
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Error handling and fallback mechanisms

**Voice Command Examples**:
```typescript
// Financial commands
'transferir cem reais para João Silva'
'pagar consulta com Dr. Pedro'
'ver saldo da minha conta'

// Medical commands
'agendar consulta para amanhã'
'marcar exame com cardiologista'
'cancelar consulta de hoje'
```

### 3. tRPC Integration Testing (`trpc-integration.test.ts`)

**Purpose**: Type-safe API procedure testing with healthcare compliance

**Test Coverage**:
- ✅ Type-safe procedure inputs/outputs
- ✅ LGPD data masking in API responses
- ✅ Authentication and authorization
- ✅ Error handling and validation
- ✅ Performance benchmarking
- ✅ Database transaction integrity

**Key Patterns**:
```typescript
// Type-safe mocking with MSW
const trpc = createTRPCMsw<AppRouter>()
const mockProcedure = trpc.patients.getById.query((req, res, ctx) => {
  // Validate LGPD compliance
  if (!req.input.patientId) {
    return res(ctx.status(400), ctx.data({
      error: 'Patient ID required',
      code: 'MISSING_PATIENT_ID'
    }))
  }
  // Return masked patient data
  return res(ctx.data({
    id: req.input.id,
    cpf: '***.***.***-**', // LGPD masked
    phone: '+55******4321', // LGPD masked
  }))
})
```

### 4. Supabase RLS Testing (`supabase-rls.test.ts`)

**Purpose**: Row Level Security policy validation for healthcare data

**Test Coverage**:
- ✅ Patient data access control
- ✅ Role-based permissions (patient, doctor, admin)
- ✅ JWT token validation
- ✅ Audit trail enforcement
- ✅ Data masking in database responses
- ✅ Cross-tenant isolation

**RLS Test Pattern**:
```typescript
await testRLSPolicy(
  'authenticated',         // User role
  { userId: 'patient-001' }, // User context
  'select',                // Operation
  'patients',             // Table
  true                    // Expected access
)
```

## 🔧 Configuration

### Vitest Healthcare Configuration (`vitest.healthcare.config.ts`)

**Key Features**:
- Sequential testing for data integrity
- 95%+ coverage for critical healthcare components
- JSDOM environment with healthcare-specific setup
- Performance benchmarking integration
- Brazilian locale configuration

```typescript
export default defineConfig({
  test: {
    // Sequential testing for healthcare compliance
    sequence: { concurrent: false, shuffle: false },
    
    // Healthcare-specific coverage thresholds
    coverage: {
      thresholds: {
        global: { branches: 90, functions: 90, lines: 90, statements: 90 },
        'src/features/patients/**': { branches: 95, functions: 95, lines: 95, statements: 95 },
        'src/features/appointments/**': { branches: 95, functions: 95, lines: 95, statements: 95 },
      }
    },
    
    // Healthcare environment setup
    globalSetup: './src/test/healthcare-global-setup.ts',
    setupFiles: ['./src/test/healthcare-setup.ts'],
    
    // Include healthcare-specific test files
    include: [
      'src/features/**/lgpd-compliance.test.{ts,tsx}',
      'src/features/**/voice-interface.test.{ts,tsx}',
      'src/features/**/healthcare-compliance.test.{ts,tsx}',
    ],
  }
})
```

### Biome Configuration for Testing

**Healthcare-Specific Rules**:
```json
{
  "files": {
    "includes": [
      "src/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "vitest.healthcare.config.ts"
    ]
  },
  "linter": {
    "rules": {
      "security": {
        "noDangerouslySetInnerHtml": "warn"
      },
      "a11y": {
        "noLabelWithoutControl": "warn",
        "useButtonType": "warn"
      },
      "correctness": {
        "useExhaustiveDependencies": "error"
      }
    }
  }
}
```

## 🎯 Usage Patterns

### Pattern 1: LGPD Compliance Testing
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect } from 'vitest'

// Test consent flow
test('requires LGPD consent before data collection', async () => {
  render(<PatientForm />)
  
  const submitButton = screen.getByTestId('submit-patient')
  expect(submitButton).toBeDisabled()
  
  // Enable consent
  await userEvent.click(screen.getByTestId('lgpd-consent'))
  expect(submitButton).toBeEnabled()
})
```

### Pattern 2: Voice Interface Testing
```typescript
// Mock speech recognition
global.SpeechRecognition = vi.fn().mockImplementation(() => ({
  lang: 'pt-BR',
  start: vi.fn(),
  onresult: null,
}))

test('processes Portuguese voice commands', async () => {
  const onCommand = vi.fn()
  render(<VoiceAssistant onCommand={onCommand} />)
  
  // Simulate voice command
  await userEvent.click(screen.getByTestId('start-listening'))
  
  await waitFor(() => {
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'transferir cem reais para João',
        confidence: 0.95,
        language: 'pt-BR',
      })
    )
  })
})
```

### Pattern 3: tRPC Type-Safe Testing
```typescript
import { createTRPCMsw } from 'msw-trpc'
import { setupServer } from 'msw/node'

test('validates LGPD compliance in API', async () => {
  const trpc = createTRPCMsw<AppRouter>()
  
  // Mock procedure with LGPD validation
  trpc.patients.create.mutation((req, res, ctx) => {
    if (!req.input.lgpdConsent) {
      return res(ctx.status(400), ctx.data({
        error: 'LGPD consent required',
        code: 'LGPD_CONSENT_REQUIRED'
      }))
    }
    
    return res(ctx.data({
      ...req.input,
      cpf: '***.***.***-**', // Mask sensitive data
    }))
  })
  
  const result = await trpc.patients.create.mutate({
    name: 'Test Patient',
    cpf: '12345678900',
    // Missing LGPD consent
  })
  
  expect(result).toMatchObject({
    error: 'LGPD consent required',
    code: 'LGPD_CONSENT_REQUIRED'
  })
})
```

### Pattern 4: Quality Control Integration
```typescript
import QualityControlTestingFramework from '@/test/utils/quality-control-integration'

test('full quality control workflow', async () => {
  const qc = new QualityControlTestingFramework(global.testUtils)
  
  // Phase 1: Detection
  const detection = await qc.startDetectionPhase()
  expect(detection.errors).toEqual(expect.any(Array))
  
  // Phase 2: Research
  const research = await qc.startResearchPhase(detection.errors)
  expect(research.recommendations).toEqual(expect.any(Array))
  
  // Phase 3: Planning
  const planning = await qc.startPlanningPhase(research.research!)
  expect(planning.plan?.atomicTasks).toEqual(expect.any(Array))
  
  // Phase 4: Execution
  const execution = await qc.startExecutionPhase(planning.plan!)
  expect(execution.execution?.validationResults).toEqual(expect.any(Array))
})
```

## 📊 Quality Gates

### Pre-Deployment Checklist
- [ ] All LGPD compliance tests pass (100%)
- [ ] Voice interface confidence ≥95%
- [ ] Code coverage ≥90% (95% for patient data)
- [ ] Biome linting passes with ≤5 warnings
- [ ] RLS policies validated for all roles
- [ ] Performance tests meet Core Web Vitals
- [ ] Accessibility compliance WCAG 2.1 AA
- [ ] Quality control workflow completed

### Success Metrics
```typescript
const qualityMetrics = {
  codeQuality: 95,      // Biome score
  security: 100,        // LGPD + RLS compliance
  performance: 92,      // Core Web Vitals
  compliance: 100,      // Healthcare regulations
  overall: 96.75        // Weighted average
}
```

## 🔍 Debugging & Troubleshooting

### Common Issues

**1. Speech Recognition Mocking**
```typescript
// Ensure Web Speech API is properly mocked
beforeAll(() => {
  global.SpeechRecognition = vi.fn()
  global.webkitSpeechRecognition = global.SpeechRecognition
})
```

**2. LGPD Data Masking**
```typescript
// Use custom matcher for validation
expect(patient.cpf).toBeLGPDCompliant('cpf')
expect(patient.phone).toBeLGPDCompliant('phone')
```

**3. Supabase Authentication**
```typescript
// Mock JWT tokens for RLS testing
const createMockJWT = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${body}.mock-signature`
}
```

### Performance Optimization

**1. Test Execution**
- Use `vitest.healthcare.config.ts` for healthcare-specific configuration
- Enable `fileParallelism: false` for data integrity
- Set appropriate timeouts (30s for database operations)

**2. Code Quality**
- Run Biome before tests (`bun lint` + `bun test`)
- Use sequential testing for healthcare compliance
- Enable coverage reporting with `--coverage`

## 📚 Reference Files

### Test Fixtures
- `src/test/fixtures/patients/` - LGPD-compliant patient data
- `src/test/fixtures/voice-commands/` - Portuguese voice commands
- `src/test/fixtures/lgpd-audit/` - Audit trail examples

### Configuration Files
- `vitest.healthcare.config.ts` - Healthcare test configuration
- `biome.json` - Linting rules for test files
- `src/test/healthcare-setup.ts` - Global test setup
- `src/test/healthcare-global-setup.ts` - Test environment setup

### Utilities
- `src/test/utils/quality-control-integration.ts` - 4-phase methodology
- `scripts/run-healthcare-tests.ts` - Comprehensive test runner

## 🚨 Security & Compliance Notes

### LGPD Compliance
- All patient data must be masked in test fixtures
- Consent flows must be explicitly tested
- Audit trail validation is mandatory
- Right to erasure must be verifiable

### Healthcare Data Handling
- Test data must not contain real patient information
- Use mock data with proper masking patterns
- Validate RLS policies for all user roles
- Ensure cross-tenant data isolation

### Voice Interface Security
- Validate confidence thresholds (≥95%)
- Test error handling and fallback mechanisms
- Ensure accessibility compliance
- Verify Brazilian Portuguese language support

## 🎯 Best Practices

1. **Test Organization**: Group tests by healthcare compliance area
2. **Data Privacy**: Always mask sensitive data in test fixtures
3. **Type Safety**: Use TypeScript strict mode for all test files
4. **Performance**: Monitor Core Web Vitals for patient flows
5. **Accessibility**: Include WCAG 2.1 AA compliance testing
6. **Documentation**: Maintain clear test descriptions and expectations
7. **CI/CD Integration**: Use quality gates for deployment approval
8. **Audit Trail**: Log all test activities for compliance verification

## 🔗 Integration Points

### Quality Control Methodology
- **Phase 1**: Error detection with automated scanning
- **Phase 2**: Research-driven solution planning
- **Phase 3**: Atomic task decomposition
- **Phase 4**: Systematic execution with validation

### Tool Integration
- **Serena MCP**: Pattern discovery and analysis
- **Context7**: Official documentation research
- **Tavily**: Healthcare regulation research
- **Archon**: Project knowledge base integration

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-20  
**Compatible**: AegisWallet v1.0.0+  
**Requirements**: Node.js 18+, Bun 1.0+, TypeScript 5.0+
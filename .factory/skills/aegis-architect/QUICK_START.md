# 🚀 AegisWallet Architecture - Quick Start Guide

## When to Use This Skill

Use the **aegis-architect** skill when you need to:
- Design voice-first financial applications for the Brazilian market
- Implement PIX, boletos, or Open Banking integrations
- Set up real-time financial data synchronization
- Design secure, LGPD-compliant financial systems
- Optimize performance for sub-500ms voice responses
- Create event-driven financial transaction systems
- Implement enhanced NLU with Brazilian Portuguese specialization

## Quick Examples

### 1. Voice Interface Design
```
"How should I design the voice interface for Brazilian financial commands?"
```

### 2. PIX Integration
```
"What's the best way to implement PIX transfers with tRPC?"
```

### 3. Performance Optimization
```
"How do I optimize voice response times to under 500ms?"
```

### 4. LGPD Compliance
```
"Show me how to implement LGPD data masking for financial applications"
```

## Key Features

### 🎯 Voice-First Architecture
- Six essential voice commands covering 95% of financial operations
- Sub-500ms voice response time optimization
- Brazilian Portuguese speech recognition and synthesis

### 🇧🇷 Brazilian Financial Integration
- PIX instant payment system implementation
- Boleto payment processing
- CPF/CNPJ document validation
- Portuguese localization and financial terminology

### 🔒 Security & Compliance
- LGPD (Brazilian GDPR) compliance patterns
- Row Level Security (RLS) implementation
- Financial data encryption and audit trails

## Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Voice Response Time | <500ms | <1s |
| PIX Processing | <2s | <5s |
| API Response Time | <150ms | <300ms |
| App Startup | <3s | <5s |
| Lighthouse Score | ≥90 | - |

## Technology Stack

- **Runtime**: Bun (3-5x faster than npm)
- **Backend**: Hono (Edge-first API framework)
- **Frontend**: React 19 (Voice interface optimized)
- **Database**: Supabase (PostgreSQL + Auth + Realtime + RLS)
- **API**: tRPC v11 (Type-safe procedures)
- **Styling**: Tailwind CSS 4.x

## Essential Commands

```bash
# Development with voice features
bun dev:voice              # Start with voice processing

# Quality assurance
bun lint:voice             # Voice component linting
bun test:voice             # Voice command tests
bun benchmark:voice        # Voice response time testing

# Architecture validation
python scripts/validate_architecture.py
python scripts/performance_audit.py
```

## Key Architecture Patterns

### Voice Command Processing
```typescript
const ESSENTIAL_VOICE_COMMANDS = [
  "Como está meu saldo?",           // Balance query
  "Quanto posso gastar esse mês?",   // Spending capacity
  "Tem algum boleto programado?",    // Scheduled bills
  "Faz uma transferência para...",   // Money transfer
];
```

### Brazilian Financial Integration
```typescript
interface PIXTransaction {
  amount: Money;
  pixKey: PIXKey; // email, cpf, cnpj, phone, random
  description: string;
  recipientName: string;
  responseTime: <2000ms; // PIX processing target
}
```

## References Available

- `references/brazilian-financial-systems.md` - PIX, Boletos, and API integration
- `references/performance-optimization.md` - Voice performance and optimization
- `references/lgpd-compliance.md` - Brazilian data protection compliance
- `references/tech-stack.md` - Complete technology specifications
- `references/voice-interface.md` - Voice interaction patterns

## Validation Tools

Run architecture compliance checks:

```bash
python scripts/validate_architecture.py --directory ./your-project
python scripts/performance_audit.py --directory ./your-project --output json
```

## Need More Help?

1. **Check the detailed documentation** in `SKILL.md`
2. **Use the reference files** for specific implementations
3. **Run validation scripts** for compliance checking
4. **Use provided templates** for consistent implementation

---

**Built for the Brazilian financial market with voice-first autonomous assistance in mind.** 🇧🇷🎤

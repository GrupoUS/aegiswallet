# AegisWallet Architecture Skill

## Overview

The AegisWallet Architecture Skill (`aegis-architect`) provides specialized expertise for designing and implementing voice-first autonomous financial assistants for the Brazilian market. This skill focuses on the AegisWallet technology stack: **Bun + Hono + React 19 + Supabase + tRPC**, with deep expertise in Brazilian financial systems integration.

## When to Use This Skill

Use this skill when working on:
- **Architecture Design** for voice-first financial applications
- **Technology Stack Decisions** for Brazilian fintech projects
- **PIX and Boleto Integration** with Brazilian payment systems
- **Voice Interface Implementation** with Brazilian Portuguese optimization
- **Real-time Financial Systems** with sub-500ms response targets
- **Security and LGPD Compliance** for Brazilian data protection
- **Performance Optimization** for voice-first applications
- **Database Design** with Row Level Security and financial patterns

## Key Features

### 🎯 Voice-First Architecture
- Six essential voice commands covering 95% of financial operations
- Sub-500ms voice response time optimization
- Brazilian Portuguese speech recognition and synthesis
- AI autonomy progression from 50% to 95%

### 🇧🇷 Brazilian Financial Integration
- PIX instant payment system implementation
- Boleto payment processing
- CPF/CNPJ document validation
- Portuguese localization and financial terminology

### 🔒 Security & Compliance
- LGPD (Brazilian GDPR) compliance patterns
- Row Level Security (RLS) implementation
- Financial data encryption and audit trails
- Multi-layer authentication with biometric support

### ⚡ Performance Optimization
- Edge-first architecture with Hono
- Real-time synchronization with Supabase
- Bundle optimization for fast loading
- Core Web Vitals compliance (Lighthouse ≥90)

## What's Included

### 📚 Core Documentation
- **SKILL.md**: Comprehensive architecture guidance and patterns
- **references/tech-stack.md**: Complete technology specifications
- **references/voice-interface.md**: Voice interaction patterns
- Additional reference materials for Brazilian market integration

### 🛠️ Validation Tools
- **scripts/validate_architecture.py**: Architecture compliance validation
- **scripts/performance_audit.py**: Performance benchmarking and optimization
- Automated checking for security patterns, voice optimization, and Brazilian market compliance

### 📋 Templates & Assets
- **assets/templates/voice-component.tsx**: Voice-first React component template
- **assets/templates/trpc-procedure.ts**: Financial API procedure template
- Brazilian Portuguese localization patterns
- Accessibility and WCAG 2.1 AA compliance examples

## Quick Start

### Using the Skill

1. **Architecture Guidance**: Ask about AegisWallet architecture decisions
   ```
   "How should I design the voice interface for Brazilian financial commands?"
   "What's the best way to implement PIX transfers with tRPC?"
   "How do I optimize voice response times to under 500ms?"
   ```

2. **Validation Tools**: Run architecture compliance checks
   ```bash
   python scripts/validate_architecture.py --directory ./your-project
   python scripts/performance_audit.py --directory ./your-project --output json
   ```

3. **Template Usage**: Copy and adapt templates for your implementation
   - Voice component template for Portuguese speech interfaces
   - tRPC procedure template for financial transactions

### Key Architecture Patterns

#### Voice Command Processing
```typescript
const ESSENTIAL_VOICE_COMMANDS = [
  "Como está meu saldo?",           // Balance query
  "Quanto posso gastar esse mês?",   // Spending capacity
  "Tem algum boleto programado?",    // Scheduled bills
  "Faz uma transferência para...",   // Money transfer
];
```

#### Brazilian Financial Integration
```typescript
interface PIXTransaction {
  amount: Money;
  pixKey: PIXKey; // email, cpf, cnpj, phone, random
  description: string;
  recipientName: string;
  responseTime: <2000ms; // PIX processing target
}
```

#### Security Architecture
```sql
-- Row Level Security for tenant isolation
CREATE POLICY "Users can access own data" ON transactions
  FOR ALL USING (auth.uid() = user_id);
```

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
- **Styling**: Tailwind CSS 4.x (Brazilian design system)
- **State**: TanStack Query v5 (Real-time synchronization)

## Security & Compliance

### LGPD Compliance
- Data minimization and purpose limitation
- User consent management and revocation
- Right to access, deletion, and portability
- Automatic data retention policies

### Financial Security
- Row Level Security for multi-tenant isolation
- End-to-end encryption for sensitive data
- Comprehensive audit trails for financial operations
- Multi-factor authentication with biometric support

## Development Workflow

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

## Contributing

This skill follows AegisWallet's KISS and YAGNI principles:
- **Keep It Simple**: Direct implementations without over-engineering
- **You Aren't Gonna Need It**: Build only what requirements specify
- **Voice First**: Primary interaction through essential voice commands
- **Type Safety**: End-to-end TypeScript with no implicit any
- **Real-time**: Instant updates via Supabase subscriptions

## License

MIT License - See LICENSE file for details

## Support

For issues or questions about AegisWallet architecture:
1. Check the comprehensive documentation in `SKILL.md`
2. Run validation scripts for compliance checking
3. Use provided templates for consistent implementation
4. Follow Brazilian financial system integration patterns

---

**Built for the Brazilian financial market with voice-first autonomous assistance in mind.** 🇧🇷🎤
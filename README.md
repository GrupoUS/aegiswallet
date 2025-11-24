# 🛡️ AegisWallet

**Voice-First Autonomous Financial Assistant for Brazil**

AegisWallet is an intelligent financial management platform designed specifically for the Brazilian market, featuring voice-first interaction, PIX integration, and progressive AI autonomy (50% → 95% automation).

---

## 📅 Integração Google Calendar

O AegisWallet oferece sincronização bidirecional com Google Calendar, permitindo que você:

- Sincronize eventos financeiros com sua agenda do Google
- Crie eventos arrastando e soltando no calendário
- Mantenha seus compromissos financeiros sempre atualizados
- Controle quais dados são sincronizados (privacidade LGPD)

### Configuração

1. Acesse as configurações do calendário
2. Clique em "Conectar Google Calendar"
3. Autorize o acesso à sua conta Google
4. Configure as opções de sincronização

Para mais detalhes, consulte a [documentação completa](./docs/google-calendar-integration.md).

---

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server (client + server)
bun dev:full

# Or start separately
bun dev:client  # Vite dev server (port 5173)
bun dev:server  # Hono server (port 3000)

# Run tests
bun test

# Validate code quality
bun quality
```

---

## 🎨 Design System

AegisWallet uses a semantic color token system for consistent, accessible UI design.

### Color Tokens

- **Semantic States**: `success`, `warning`, `destructive`, `info`
- **Financial**: `financial-positive`, `financial-negative`, `financial-neutral`
- **PIX Branding**: `pix-primary`, `pix-accent`

### Usage Example

```typescript
// ✅ DO: Use semantic tokens
<Badge className="bg-success/10 text-success">Completed</Badge>
<span className="text-financial-positive">+R$ 1.500,00</span>

// ❌ DON'T: Use hardcoded colors
<Badge className="bg-green-100 text-green-700">Completed</Badge>
<span className="text-green-600">+R$ 1.500,00</span>
```

### Validation

```bash
# Validate color usage
bun run validate:colors

# Pre-commit hook automatically validates colors
git commit -m "feat: add new feature"
```

📖 **Full Documentation**: [Color System Guide](docs/design-specs/COLOR-SYSTEM-GUIDE.md)

---

## 🏗️ Technology Stack

### Core
- **Runtime**: Bun (3-5x faster than npm/pnpm)
- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Hono (Edge-first) + tRPC v11
- **Database**: Supabase (Postgres + Auth + Realtime + RLS)

### Frontend
- **Routing**: TanStack Router v5
- **State**: TanStack Query v5
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod

### Backend
- **API**: tRPC v11 (type-safe)
- **Server**: Hono (edge-optimized)
- **Auth**: Supabase Auth
- **Database**: Supabase (RLS enabled)

### Quality
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: OXLint (50-100x faster) + Biome
- **Type Safety**: TypeScript strict mode
- **Git Hooks**: Husky (pre-commit validation)

---

## 📁 Project Structure

```
src/
├── components/          # React UI components
│   ├── ui/             # shadcn/ui components
│   ├── financial/      # Financial components
│   ├── pix/            # PIX components
│   └── voice/          # Voice interaction components
├── routes/             # TanStack Router pages
├── server/             # Backend Hono + tRPC server
│   ├── routers/        # tRPC routers
│   ├── procedures/     # tRPC procedures
│   └── middleware/     # Server middleware
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── services/           # Business logic services
├── types/              # TypeScript type definitions
└── integrations/       # External integrations
    └── supabase/       # Supabase client
```

---

## 🧪 Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test:coverage

# Run in watch mode
bun test:watch

# Run integration tests
bun test:integration
```

**Coverage Target**: 90%+ for critical business logic

---

## 🔍 Code Quality

```bash
# Run linting
bun lint

# Fix linting issues
bun lint:fix

# Run quality checks (lint + test + coverage)
bun quality

# CI mode (for pipelines)
bun quality:ci
```

### Quality Gates

All code changes must pass:
- ✅ Automated tests (100% pass rate)
- ✅ Type checking (zero TypeScript errors)
- ✅ Linting (OXLint + Biome)
- ✅ Color validation (no hardcoded colors)
- ✅ Security scan (zero high-severity vulnerabilities)

---

## 🚢 Deployment

### Local Build & Preview

```bash
# Build for production
bun build

# Start production server locally
bun start:prod

# Preview build
bun preview
```

### Vercel Deployment

AegisWallet is optimized for Vercel deployment with native Hono and Vite support.

#### Quick Deploy

```bash
# 1. Setup environment variables
bun deploy:vercel:setup

# 2. Deploy to preview
bun deploy:vercel:preview

# 3. Deploy to production
bun deploy:vercel:prod
```

#### Manual Deployment

```bash
# Install Vercel CLI
bun add -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
# ... (repeat for all variables)

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Verify Deployment

```bash
# Check deployment status
bun deploy:vercel:check

# View logs
vercel logs [deployment-url]
```

📖 **Full Documentation**: [Vercel Deployment Guide](docs/deployment/VERCEL-DEPLOYMENT-GUIDE.md)

---

## 📚 Documentation

- [Color System Guide](docs/design-specs/COLOR-SYSTEM-GUIDE.md)
- [Component Usage Guide](docs/components/color-usage-guide.md)
- [Implementation Summary](docs/design-specs/IMPLEMENTATION-COMPLETE.md)
- [Phase 5 Progress](docs/design-specs/PHASE-5-PROGRESS.md)
- [Integração Google Calendar](docs/google-calendar-integration.md)

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
2. Make changes following the style guide
3. Run quality checks: `bun quality`
4. Commit (pre-commit hooks will validate)
5. Push and create a pull request

### Code Standards

- Use semantic color tokens (never hardcoded colors)
- Follow KISS and YAGNI principles
- Maintain 90%+ test coverage for critical code
- Write meaningful commit messages (conventional commits)
- Ensure TypeScript strict mode compliance

---

## 📄 License

[Add your license here]

---

## 🙏 Acknowledgments

Built with:
- [Bun](https://bun.sh/) - Fast JavaScript runtime
- [React](https://react.dev/) - UI library
- [Hono](https://hono.dev/) - Edge-first web framework
- [tRPC](https://trpc.io/) - Type-safe APIs
- [Supabase](https://supabase.com/) - Backend platform
- [TanStack](https://tanstack.com/) - Router & Query
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component library

---

**Made with ❤️ for the Brazilian market**

# Frontend - AegisWallet

## Stack Técnico

| Componente | Tecnologia | Versão |
|------------|------------|--------|
| Runtime | Bun | Latest |
| Framework | React | 19.x |
| Routing | TanStack Router | 1.139+ |
| Data Fetching | TanStack Query | 5.90+ |
| State | Zustand | 5.x |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui + Radix | - |
| Build | Vite | 7.x |

---

## Estrutura de Diretórios

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   ├── financial/       # Componentes financeiros
│   └── providers/       # Context providers
├── routes/              # TanStack Router (file-based)
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Home
│   ├── dashboard.tsx    # Dashboard
│   ├── calendario.tsx   # Calendário financeiro
│   ├── contas.tsx       # Contas
│   ├── ai-chat.tsx      # Chat com IA
│   ├── configuracoes/   # Configurações
│   └── billing/         # Billing
├── hooks/               # Custom hooks
├── lib/                 # Utilitários
├── types/               # TypeScript types
├── contexts/            # React contexts
└── services/            # Business logic
```

---

## Rotas Principais

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | index.tsx | Landing/Login |
| `/dashboard` | dashboard.tsx | Dashboard principal |
| `/calendario` | calendario.tsx | Calendário financeiro |
| `/contas` | contas.tsx | Gerenciar contas |
| `/contas-bancarias` | contas-bancarias.tsx | Contas bancárias |
| `/saldo` | saldo.tsx | Visualização de saldo |
| `/ai-chat` | ai-chat.tsx | Chat com IA |
| `/configuracoes` | configuracoes.tsx | Configurações |
| `/privacidade` | privacidade.tsx | Privacidade (LGPD) |

---

## Componentes UI (shadcn/ui)

### Instalados

```
accordion, alert, avatar, badge, breadcrumb, button, calendar,
card, checkbox, collapsible, dialog, dropdown-menu, form, input,
label, popover, progress, radio-group, scroll-area, select,
separator, sheet, skeleton, slider, switch, table, tabs,
textarea, toast, tooltip
```

### Uso

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function Example() {
  return (
    <Card>
      <CardHeader>Título</CardHeader>
      <CardContent>
        <Button>Ação</Button>
      </CardContent>
    </Card>
  )
}
```

---

## Data Fetching

### TanStack Query

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Query
const { data, isLoading } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => apiClient.get('/api/v1/transactions'),
})

// Mutation
const { mutate } = useMutation({
  mutationFn: (data) => apiClient.post('/api/v1/transactions', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['transactions'])
  },
})
```

---

## Forms

### React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição obrigatória'),
})

type FormData = z.infer<typeof schema>

function TransactionForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    // ...
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  )
}
```

---

## Autenticação (Clerk)

### Provider

```tsx
// main.tsx
import { ClerkProvider } from '@clerk/clerk-react'
import { ptBR } from '@clerk/localizations'

<ClerkProvider
  publishableKey={CLERK_KEY}
  localization={ptBR}
>
  <App />
</ClerkProvider>
```

### Hooks

```tsx
import { useUser, useAuth, useClerk } from '@clerk/clerk-react'

function Profile() {
  const { user } = useUser()
  const { signOut } = useClerk()

  return (
    <div>
      <p>Olá, {user?.firstName}</p>
      <button onClick={() => signOut()}>Sair</button>
    </div>
  )
}
```

### Componentes

```tsx
import { SignIn, SignUp, UserButton } from '@clerk/clerk-react'

// Login
<SignIn />

// Registro
<SignUp />

// Avatar com menu
<UserButton />
```

---

## State Management

### Zustand (UI State)

```tsx
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

---

## Styling

### Tailwind CSS 4

```tsx
// Uso básico
<div className="flex items-center gap-4 p-4 bg-background">
  <span className="text-foreground font-medium">Texto</span>
</div>

// Responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* ... */}
</div>

// Dark mode
<div className="bg-white dark:bg-gray-900">
  {/* ... */}
</div>
```

### Utilitário cn()

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)}>
```

---

## Formatação (Brasil)

### Moeda

```tsx
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

formatCurrency(1234.56) // "R$ 1.234,56"
```

### Data

```tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

format(new Date(), 'dd/MM/yyyy', { locale: ptBR })
format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
```

---

## Acessibilidade

### Requisitos WCAG 2.1 AA

- Contraste mínimo 4.5:1
- Foco visível em todos elementos interativos
- Labels em todos os inputs
- Alt text em imagens
- Navegação por teclado

### Componentes Acessíveis

```tsx
// Radix UI já fornece acessibilidade
import { Dialog, DialogTrigger, DialogContent } from '@radix-ui/react-dialog'

// React Aria para casos especiais
import { useButton } from 'react-aria'
```

---

## Scripts

```bash
# Desenvolvimento
bun dev              # Inicia Vite dev server
bun dev:full         # Dev server + backend

# Build
bun build            # Build produção
bun build:client     # Build apenas frontend
bun preview          # Preview do build

# Qualidade
bun lint             # OXLint + Biome
bun lint:fix         # Auto-fix
bun type-check       # TypeScript check

# Testes
bun test             # Vitest
bun test:watch       # Watch mode
bun test:coverage    # Com cobertura

# Rotas
bun routes:generate  # Gera route tree
```

---

## Variáveis de Ambiente

```bash
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# API (opcional - usa proxy em dev)
VITE_API_URL=http://localhost:3000
```

---

## Performance

### Targets

| Métrica | Alvo |
|---------|------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTI | < 3s |

### Otimizações

- Code splitting por rota (TanStack Router)
- Lazy loading de componentes pesados
- Prefetch de rotas adjacentes
- Cache de queries (TanStack Query)

---

**Última Atualização**: Novembro 2025

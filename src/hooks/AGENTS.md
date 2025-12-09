# React Hooks Guide

## Package Identity

**Purpose**: Custom React hooks for state management and data fetching
**Pattern**: TanStack Query (useQuery/useMutation) + Optimistic Updates

## Setup & Run

> See root `AGENTS.md` for global commands (`bun dev:client`, `bun type-check`)

```bash
bun test src/hooks             # Unit tests for hooks
```

## Hook Structure

```
src/hooks/
├── billing/                   # Billing & subscription hooks
│   ├── useBillingHistory.ts
│   ├── useBillingPortal.ts
│   ├── useCheckout.ts
│   ├── useInvoices.ts
│   ├── usePaymentMethods.ts
│   ├── usePlans.ts
│   └── useSubscription.ts
├── useBankAccounts.ts         # Bank account CRUD
├── useContacts.ts             # Contact management
├── useDashboard.ts            # Dashboard aggregation
├── useFinancialEvents.ts      # Financial events (calendar)
├── useProfile.ts              # User profile
├── useVoiceCommand.ts         # Voice command state
├── useVoiceRecognition.ts     # Voice recognition
├── useAIChat.ts               # AI chat state
└── use-*.ts                   # Additional hooks
```

## Hook Patterns

### Data Fetching Pattern (TanStack Query)

#### ✅ DO: Query with Type Safety

```typescript
// Copy pattern from: src/hooks/useBankAccounts.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useBankAccounts() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      return await apiClient.get<BankAccount[]>('/v1/bank-accounts');
    },
  });

  return {
    accounts: data || [],
    isLoading,
    error,
    refetch,
  };
}
```

#### ✅ DO: Mutation with Optimistic Updates

```typescript
// Copy pattern from: src/hooks/useBankAccounts.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const { mutate: createAccount, isPending } = useMutation({
  mutationFn: async (input: CreateAccountInput) => {
    return await apiClient.post<BankAccount>('/v1/bank-accounts', input);
  },
  onSuccess: (data) => {
    queryClient.setQueryData(['bank-accounts'], (old: BankAccount[] | undefined) => {
      return old ? [data, ...old] : [data];
    });
    toast.success('Conta bancária criada com sucesso!');
  },
  onError: (error: Error) => {
    toast.error(error.message || 'Erro ao criar conta bancária');
  },
});
```

#### ✅ DO: Return Interface Pattern

```typescript
// Copy pattern from: src/hooks/useBankAccounts.ts
export interface UseBankAccountsReturn {
  accounts: BankAccount[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createAccount: (input: CreateAccountInput) => void;
  updateAccount: (input: UpdateAccountInput) => void;
  deleteAccount: (input: { id: string }) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
```

### Voice Hook Pattern

#### ✅ DO: Voice State Management

```typescript
// Copy pattern from: src/hooks/useVoiceCommand.ts
export function useVoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const voiceService = getVoiceService();

  const startListening = useCallback(() => {
    voiceService.startListening(
      (result) => {
        setTranscript(result.transcript);
        if (result.intent) {
          navigate({ to: result.intent });
        }
      },
      (error) => toast.error('Erro no reconhecimento de voz')
    );
    setIsListening(true);
  }, []);

  return { isListening, transcript, startListening, stopListening };
}
```

### Anti-Patterns

#### ❌ DON'T: Direct Fetch in Components

```typescript
// ❌ BAD: useState + useEffect for data fetching
function MyComponent() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
}

// ✅ GOOD: TanStack Query hook
function MyComponent() {
  const { data, isLoading } = useQuery({ queryKey: ['data'], queryFn: fetchData });
}
```

#### ❌ DON'T: Missing Query Key Invalidation

```typescript
// ❌ BAD: No cache invalidation
const { mutate } = useMutation({
  mutationFn: createItem,
  onSuccess: () => toast.success('Created!'),
});

// ✅ GOOD: Invalidate or update cache
const { mutate } = useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    toast.success('Created!');
  },
});
```

#### ❌ DON'T: English-Only Toast Messages

```typescript
// ❌ BAD: English messages
toast.error('Failed to create account');

// ✅ GOOD: Portuguese messages
toast.error('Erro ao criar conta bancária');
```

## Touch Points / Key Files

**Banking**:
- `src/hooks/useBankAccounts.ts` - Bank account CRUD
- `src/hooks/useFinancialEvents.ts` - Financial calendar events
- `src/hooks/useDashboard.ts` - Dashboard data aggregation

**Billing**:
- `src/hooks/billing/useSubscription.ts` - Subscription state
- `src/hooks/billing/useCheckout.ts` - Checkout flow
- `src/hooks/billing/usePlans.ts` - Available plans

**Voice**:
- `src/hooks/useVoiceCommand.ts` - Voice command handling
- `src/hooks/useVoiceRecognition.ts` - Low-level voice API

**User**:
- `src/hooks/useProfile.ts` - User profile
- `src/hooks/useUserData.ts` - User data sync

## JIT Index Hints

```bash
# Find all hooks
rg -n "export function use[A-Z]" src/hooks/

# Find query keys
rg -n "queryKey:" src/hooks/

# Find mutations
rg -n "useMutation" src/hooks/

# Find specific hook
rg -n "useBankAccounts" src/

# Find toast messages (for i18n)
rg -n "toast\.(success|error)" src/hooks/
```

## Query Key Conventions

```typescript
// Single entity
queryKey: ['bank-account', accountId]

// Collection
queryKey: ['bank-accounts']

// Filtered collection
queryKey: ['bank-accounts', { status: 'active' }]

// Nested resource
queryKey: ['bank-accounts', accountId, 'transactions']
```

## Brazilian Compliance

> See root `AGENTS.md` for full compliance matrix

- **Messages**: All toast/error messages in Portuguese
- **LGPD**: User consent hooks (`use-compliance.ts`)

## Pre-PR Checks

```bash
bun test src/hooks && bun type-check
```

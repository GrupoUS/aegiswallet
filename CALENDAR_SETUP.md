# 📅 Calendário Financeiro - Setup e Integração com Supabase

## 🎯 Visão Geral

O Calendário Financeiro é um sistema completo para rastrear entradas, saídas, contas a pagar e agendamentos financeiros com integração em tempo real com Supabase.

## 📦 Componentes Implementados

### Frontend

1. **Calendário Principal** (`/calendario`)
   - Visualização mensal completa
   - Indicadores visuais por tipo de evento
   - Dialog com detalhes de eventos
   - Resumo financeiro do mês

2. **Mini Calendário** (Dashboard)
   - Widget compacto no dashboard
   - Lista de próximos 5 eventos
   - Navegação para calendário completo

3. **Context & Hooks**
   - `CalendarContext`: Estado global compartilhado
   - `useFinancialEvents`: Query de eventos
   - `useFinancialEventMutations`: CRUD operations
   - `useFinancialEventsRealtime`: Subscriptions em tempo real

### Backend (Supabase)

1. **Tabela**: `financial_events`
2. **Views**: 
   - `upcoming_financial_events`
   - `monthly_financial_summary`
3. **RLS Policies**: 4 políticas de segurança
4. **Indexes**: 5 índices de performance
5. **Real-time**: Suporte a subscriptions

## 🚀 Setup Inicial

### Passo 1: Aplicar Migration no Supabase

**Opção A: Via Supabase Dashboard (Recomendado)**

1. Acesse: https://supabase.com/dashboard/project/clvdvpbnuifxedpqgrgo/editor
2. Vá em: **SQL Editor** → **New Query**
3. Cole o conteúdo do arquivo: `supabase/migrations/20251006115133_financial_events.sql`
4. Click em **Run** (ou **F5**)
5. Verifique se não há erros

**Opção B: Via Supabase CLI**

```bash
# Certificar que está autenticado
bunx supabase login

# Aplicar apenas a migration de financial_events
# (Cuidado: isso aplicará TODAS as migrations pendentes)
bunx supabase db push
```

### Passo 2: Verificar Tabela Criada

No Supabase Dashboard:
1. Vá em **Table Editor**
2. Verifique se a tabela `financial_events` existe
3. Confira as colunas e tipos

### Passo 3: Seed de Dados (Opcional)

Para popular com dados de exemplo:

```sql
-- No SQL Editor do Supabase Dashboard
-- Substitua 'YOUR_USER_ID' pelo UUID do usuário autenticado

SELECT seed_financial_events_for_user('YOUR_USER_ID'::uuid);
```

Para obter seu User ID:
```sql
SELECT id FROM auth.users WHERE email = 'seu-email@example.com';
```

### Passo 4: Testar Aplicação

1. Inicie o servidor de desenvolvimento:
```bash
bun run dev
```

2. Faça login na aplicação

3. Navegue para: **Calendário** (na sidebar)

4. Verifique:
   - ✅ Calendário renderiza
   - ✅ Eventos aparecem (se foram seeded)
   - ✅ Mini calendário no dashboard funciona
   - ✅ Click em evento abre detalhes

## 📊 Estrutura da Tabela

```sql
financial_events (
  id UUID PRIMARY KEY,
  user_id UUID (FK users),
  bank_account_id UUID (FK bank_accounts),
  
  -- Event Details
  title TEXT,
  description TEXT,
  
  -- Financial Info
  amount DECIMAL(15,2),
  category TEXT,
  
  -- Event Type & Status
  event_type TEXT ('income'|'expense'|'bill'|'scheduled'|'transfer'),
  status TEXT ('pending'|'paid'|'scheduled'|'cancelled'),
  
  -- Date/Time
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN,
  
  -- Visual & UX
  color TEXT ('emerald'|'rose'|'orange'|'blue'|'violet'),
  icon TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN,
  recurrence_rule TEXT,
  parent_event_id UUID (FK financial_events),
  
  -- Additional
  location TEXT,
  notes TEXT,
  
  -- Integration
  transaction_id UUID (FK transactions),
  bill_id UUID (FK bills),
  pix_transaction_id UUID (FK pix_transactions),
  
  -- Metadata
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## 🔐 Row Level Security (RLS)

A tabela possui 4 políticas RLS:

1. **SELECT**: Usuários só veem seus próprios eventos
2. **INSERT**: Usuários só podem criar eventos para si mesmos
3. **UPDATE**: Usuários só podem atualizar seus próprios eventos
4. **DELETE**: Usuários só podem deletar seus próprios eventos

## 🔄 Real-time Subscriptions

O sistema automaticamente escuta mudanças na tabela:

```typescript
// Implementado em useFinancialEventsRealtime
supabase
  .channel('financial_events_changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'financial_events' 
  }, callback)
  .subscribe()
```

## 🎨 Cores e Tipos de Eventos

| Tipo | Cor | Ícone | Descrição |
|------|-----|-------|-----------|
| `income` | 🟢 Emerald | 💰 | Receitas/Entradas |
| `expense` | 🔴 Rose | 💸 | Despesas/Saídas |
| `bill` | 🟡 Orange | 📄 | Contas a pagar |
| `scheduled` | 🔵 Blue | 📅 | Pagamentos agendados |
| `transfer` | 🟣 Violet | ↔️ | Transferências |

## 📝 API de Uso

### Query de Eventos

```typescript
import { useFinancialEvents } from '@/hooks/useFinancialEvents'

function MyComponent() {
  const { events, loading, error } = useFinancialEvents()
  
  if (loading) return <Spinner />
  if (error) return <Error message={error.message} />
  
  return <EventList events={events} />
}
```

### Mutações

```typescript
import { useFinancialEventMutations } from '@/hooks/useFinancialEvents'

function AddEventForm() {
  const { addEvent, loading } = useFinancialEventMutations()
  
  const handleSubmit = async (data) => {
    const newEvent = await addEvent({
      title: data.title,
      amount: data.amount,
      start: new Date(data.date),
      end: new Date(data.date),
      type: 'expense',
      status: 'pending',
      color: 'rose',
    })
  }
}
```

### Context Global

```typescript
import { useCalendar } from '@/components/calendar/calendar-context'

function CalendarPage() {
  const { 
    currentDate, 
    setCurrentDate, 
    events, 
    addEvent, 
    updateEvent, 
    deleteEvent 
  } = useCalendar()
  
  return <FinancialCalendar />
}
```

## 🐛 Troubleshooting

### Problema: Eventos não aparecem

**Solução**:
1. Verifique se a tabela foi criada no Supabase
2. Confira se o usuário está autenticado
3. Verifique se há dados na tabela: 
   ```sql
   SELECT * FROM financial_events LIMIT 10;
   ```
4. Check console do browser para erros
5. Se não houver dados, use a função seed

### Problema: Real-time não funciona

**Solução**:
1. Verifique se Real-time está habilitado no projeto Supabase:
   - Dashboard → Database → Replication
   - Certifique que `financial_events` está na lista
2. Check console para erros de subscription

### Problema: RLS Bloqueando Acesso

**Solução**:
1. Verifique se o usuário está autenticado
2. Confirme que o `user_id` nos eventos corresponde ao `auth.uid()`
3. Teste as policies no SQL Editor:
   ```sql
   SELECT * FROM financial_events WHERE auth.uid() = user_id;
   ```

## 🚀 Próximos Passos

- [ ] Implementar recorrência de eventos (RRULE)
- [ ] Adicionar notificações de eventos próximos
- [ ] Integrar com `transactions` e `bills` existentes
- [ ] Exportar calendário para iCal
- [ ] Adicionar filtros avançados
- [ ] Implementar drag-and-drop para reagendar

## 📚 Referências

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [TanStack Router](https://tanstack.com/router/latest)
- [React Day Picker](https://react-day-picker.js.org/)

---

**Última atualização**: 06/10/2025
**Versão**: 1.0.0

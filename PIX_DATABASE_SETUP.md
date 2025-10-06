# 🗄️ Setup do Banco de Dados PIX - AegisWallet

## Opção 1: Aplicar via Supabase Dashboard (RECOMENDADO)

### Passo 1: Acessar o SQL Editor
1. Abra https://supabase.com/dashboard/project/clvdvpbnuifxedpqgrgo
2. Navegue até **SQL Editor** no menu lateral
3. Clique em **New Query**

### Passo 2: Aplicar o SQL
1. Copie todo o conteúdo do arquivo `pix_tables_standalone.sql`
2. Cole no SQL Editor
3. Clique em **Run** (ou pressione Ctrl+Enter)
4. Aguarde a confirmação de sucesso

### Passo 3: Verificar Tabelas Criadas
Execute no SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'pix%';
```

Você deve ver:
- `pix_keys`
- `pix_transactions`
- `pix_qr_codes`

---

## Opção 2: Via Supabase CLI (se Docker estiver rodando)

### Reparar histórico de migrations
```bash
cd C:\Users\Admin\aegiswallet

# Marcar migrations como aplicadas
supabase migration repair --status applied 20240101000000
supabase migration repair --status applied 20240101000001
supabase migration repair --status applied 20250104_banking_connections
supabase migration repair --status applied 20250104_banking_monitoring
supabase migration repair --status applied 20250104_boleto_pix_systems
supabase migration repair --status applied 20250104_data_normalization
supabase migration repair --status applied 20250104_ingestion_pipeline
supabase migration repair --status applied 20250104_payment_orchestration
supabase migration repair --status applied 20250104_security_compliance
supabase migration repair --status applied 20250104_security_confirmations
supabase migration repair --status applied 20250104_user_experience
supabase migration repair --status applied 20250104_voice_analytics
supabase migration repair --status applied 20250104_voice_feedback
supabase migration repair --status applied 20250104_voice_stt_tables
supabase migration repair --status applied 20251004165807
supabase migration repair --status applied 20251006115133

# Aplicar apenas a migration PIX
supabase db push --include-all
```

---

## Opção 3: Via psql (Direct Connection)

### Obter string de conexão
No Supabase Dashboard:
1. **Settings** → **Database**
2. Copie a **Connection string** (Direct)
3. Substitua `[YOUR-PASSWORD]` pela senha do projeto

### Aplicar SQL
```bash
psql "postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -f pix_tables_standalone.sql
```

---

## ✅ Verificação Pós-Instalação

Execute no SQL Editor:

```sql
-- 1. Verificar tabelas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'pix%'
ORDER BY table_name;

-- 2. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'pix%'
ORDER BY tablename, policyname;

-- 3. Verificar índices
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'pix%'
ORDER BY tablename, indexname;

-- 4. Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table LIKE 'pix%'
ORDER BY event_object_table, trigger_name;

-- 5. Verificar funções
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%pix%' OR routine_name IN ('get_pix_stats', 'is_qr_code_valid'))
ORDER BY routine_name;
```

### Resultado Esperado:
- **3 tabelas**: pix_keys, pix_transactions, pix_qr_codes
- **10 políticas RLS**: 4 para pix_keys, 3 para pix_transactions, 3 para pix_qr_codes
- **9+ índices**: Para performance otimizada
- **3 triggers**: Para atualização automática de updated_at
- **2 funções**: get_pix_stats e is_qr_code_valid

---

## 🔄 Habilitar Realtime (Opcional)

Para receber updates em tempo real no frontend:

```sql
-- Habilitar publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_qr_codes;
```

---

## 🧪 Testar Inserção de Dados

```sql
-- Inserir chave PIX de teste (substitua o user_id por um UUID válido)
INSERT INTO public.pix_keys (user_id, key_type, key_value, label, is_favorite)
VALUES (
    'SEU-USER-UUID-AQUI',
    'email',
    'teste@exemplo.com',
    'Email Principal',
    true
)
RETURNING *;

-- Inserir transação PIX de teste
INSERT INTO public.pix_transactions (
    user_id,
    transaction_type,
    status,
    amount,
    description,
    pix_key,
    pix_key_type,
    recipient_name,
    completed_at
)
VALUES (
    'SEU-USER-UUID-AQUI',
    'received',
    'completed',
    150.00,
    'Teste de transação',
    'teste@exemplo.com',
    'email',
    'João Silva',
    NOW()
)
RETURNING *;

-- Verificar estatísticas
SELECT * FROM public.get_pix_stats('SEU-USER-UUID-AQUI', '30d');
```

---

## 📊 Schema das Tabelas

### pix_keys
```sql
id               UUID PRIMARY KEY
user_id          UUID NOT NULL
key_type         TEXT CHECK (email|cpf|cnpj|phone|random)
key_value        TEXT NOT NULL
label            TEXT
is_favorite      BOOLEAN DEFAULT false
is_active        BOOLEAN DEFAULT true
created_at       TIMESTAMP WITH TIME ZONE
updated_at       TIMESTAMP WITH TIME ZONE
```

### pix_transactions
```sql
id                  UUID PRIMARY KEY
user_id             UUID NOT NULL
transaction_type    TEXT CHECK (sent|received|scheduled)
status              TEXT CHECK (pending|processing|completed|failed|cancelled)
amount              DECIMAL(15,2) NOT NULL
description         TEXT
pix_key             TEXT NOT NULL
pix_key_type        TEXT
recipient_name      TEXT
recipient_document  TEXT
transaction_id      TEXT
end_to_end_id       TEXT (Unique PIX system ID)
scheduled_date      TIMESTAMP WITH TIME ZONE
completed_at        TIMESTAMP WITH TIME ZONE
error_message       TEXT
metadata            JSONB
created_at          TIMESTAMP WITH TIME ZONE
updated_at          TIMESTAMP WITH TIME ZONE
```

### pix_qr_codes
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL
pix_key         TEXT NOT NULL
amount          DECIMAL(15,2)
description     TEXT
qr_code_data    TEXT NOT NULL (BR Code)
qr_code_image   TEXT (Base64 or URL)
is_active       BOOLEAN DEFAULT true
expires_at      TIMESTAMP WITH TIME ZONE
times_used      INTEGER DEFAULT 0
max_uses        INTEGER
created_at      TIMESTAMP WITH TIME ZONE
updated_at      TIMESTAMP WITH TIME ZONE
```

---

## 🚨 Troubleshooting

### Erro: "extension uuid-ossp does not exist"
**Solução:** Habilite a extensão primeiro:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Erro: "relation pix_keys already exists"
**Solução:** As tabelas já existem. Verifique com:
```sql
SELECT * FROM information_schema.tables WHERE table_name LIKE 'pix%';
```

### Erro: "permission denied for table pix_keys"
**Solução:** Verifique as políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'pix_keys';
```

### Realtime não funciona
**Solução:** Verifique a publicação:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Se as tabelas PIX não aparecerem, execute:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pix_qr_codes;
```

---

## 📝 Próximos Passos

Após aplicar as migrations:

1. ✅ Gerar tipos TypeScript: `bun run types:generate`
2. ✅ Criar tRPC procedures para PIX
3. ✅ Integrar Realtime subscriptions nos componentes
4. ✅ Testar fluxo completo de transferência PIX

---

**Status:** Aguardando aplicação das migrations no Supabase  
**Arquivos:** `pix_tables_standalone.sql` (versão standalone pronta para uso)

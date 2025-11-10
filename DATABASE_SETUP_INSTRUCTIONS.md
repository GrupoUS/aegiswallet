# 🗄️ Database Setup Instructions - AegisWallet

**Data**: 10/11/2025  
**Arquivo**: `supabase/migrations/20251110_critical_tables.sql`

## 📋 Passos para Executar Migration

### 1. Acessar Painel do Supabase
1. Faça login em [supabase.com](https://supabase.com)
2. Selecione o projeto: `clvdvpbnuifxedpqgrgo`
3. Vá para `SQL Editor` no menu lateral

### 2. Executar Migration
1. Copie todo o conteúdo do arquivo `supabase/migrations/20251110_critical_tables.sql`
2. Cole no SQL Editor do Supabase
3. Clique em `Run` para executar a migration

### 3. Verificar Tabelas Criadas
Após executar a migration, verifique se as seguintes tabelas foram criadas:
- ✅ `user_consent` - Consentimentos LGPD
- ✅ `voice_feedback` - Feedback de voz
- ✅ `audit_logs` - Logs de auditoria
- ✅ `data_subject_requests` - Solicitações LGPD
- ✅ `legal_holds` - Bloqueios legais
- ✅ `user_activity` - Atividade do usuário
- ✅ `voice_recordings` - Gravações de voz
- ✅ `biometric_patterns` - Padrões biométricos

### 4. Gerar Types Localmente
```bash
bunx supabase gen types --local > src/types/database.types.ts
```

### 5. Verificar Row Level Security (RLS)
No painel do Supabase, vá em `Authentication > Policies` e verifique se todas as políticas foram criadas:
- Users can view/manage their own data
- Service role has full access

## 🔧 Estrutura das Tabelas

### user_consent
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth.users)
- consent_type (VARCHAR(100))
- granted (BOOLEAN)
- consent_version (VARCHAR(20))
- consent_date (TIMESTAMP)
- ip_address (INET)
- user_agent (TEXT)
```

### voice_feedback
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth.users)
- command_text (TEXT)
- recognized_text (TEXT)
- confidence_score (DECIMAL(5,4))
- rating (INTEGER 1-5)
- feedback_text (TEXT)
```

### audit_logs
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth.users)
- action (VARCHAR(100))
- resource_type (VARCHAR(50))
- resource_id (UUID)
- old_values (JSONB)
- new_values (JSONB)
- ip_address (INET)
- success (BOOLEAN)
```

## 🚨 Importante

1. **Execute a migration completa** - não execute parcialmente
2. **Verifique se todas as tabelas foram criadas** antes de prosseguir
3. **Teste as RLS policies** criando um usuário e verificando o acesso
4. **Backup antes de executar** em produção

## ✅ Validação Pós-Setup

Execute estas consultas para validar:

```sql
-- Verificar tabelas criadas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_consent', 'voice_feedback', 'audit_logs', 
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
  )
ORDER BY table_name;

-- Verificar RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs', 
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
)
ORDER BY tablename, policyname;

-- Verificar índices
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename IN (
    'user_consent', 'voice_feedback', 'audit_logs', 
    'data_subject_requests', 'legal_holds', 'user_activity',
    'voice_recordings', 'biometric_patterns'
)
ORDER BY tablename, indexname;
```

---

## 📞 Suporte

Se encontrar problemas durante a setup:

1. **Verifique o log de erros** no SQL Editor
2. **Confirme as permissões** do usuário
3. **Verifique se o projeto está ativo**
4. **Execute em partes** se encontrar timeout

---

**Após executar estas instruções, continue com os próximos passos do setup local.**
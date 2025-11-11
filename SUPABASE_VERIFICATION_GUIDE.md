# 🔍 Supabase Migration Verification Guide

**Migration**: 20251110_critical_tables.sql  
**Date**: 10/11/2025  

## 📋 Quick Verification Steps

### 1. Execute Quick Check Script
1. Abra o [Painel Supabase](https://supabase.com/dashboard/project/clvdvpbnuifxedpqgrgo)
2. Vá para **SQL Editor**
3. Copie e cole o conteúdo do arquivo `supabase/quick_check.sql`
4. Clique em **Run**

### 2. Expected Results
O quick check deve mostrar:

```
✅ SUCCESS: All tables created (8/8)
✅ ENABLED: RLS em todas as tabelas
✅ SUFFICIENT: RLS Policies (≥16 policies)
✅ SUFFICIENT: Indexes (≥15 indexes)
✅ SUFFICIENT: Triggers (≥4 triggers)
✅ MIGRATION SUCCESSFUL
```

### 3. Detailed Verification (Optional)
Se precisar de verificação detalhada:
1. Execute o script `supabase/verify_migration.sql`
2. Verifique cada seção manualmente

## 🗄️ Tabelas Esperadas (8)

| Nome da Tabela | Função | RLS | Índices |
|----------------|--------|-----|---------|
| `user_consent` | LGPD - Consentimentos | ✅ | ✅ |
| `voice_feedback` | Feedback de voz | ✅ | ✅ |
| `audit_logs` | Logs de auditoria | ✅ | ✅ |
| `data_subject_requests` | Solicitações LGPD | ✅ | ✅ |
| `legal_holds` | Bloqueios legais | ✅ | ✅ |
| `user_activity` | Atividade do usuário | ✅ | ✅ |
| `voice_recordings` | Gravações de voz | ✅ | ✅ |
| `biometric_patterns` | Padrões biométricos | ✅ | ✅ |

## 🔐 RLS Policies Esperadas (Mínimo 16)

### Por tabela (policies):
1. **user_consent**:
   - Users can view their own consent records
   - Users can update their own consent records  
   - Service role can manage consent records

2. **voice_feedback**:
   - Users can view their own feedback
   - Users can insert their own feedback
   - Service role can manage feedback

3. **audit_logs**:
   - Users can view their own audit logs
   - Service role can manage audit logs

4. **data_subject_requests**:
   - Users can view their own requests
   - Users can create their own requests
   - Service role can manage requests

5. **legal_holds**:
   - Users can view their own legal holds
   - Service role can manage legal holds

6. **user_activity**:
   - Users can view their own activity
   - Service role can manage activity

7. **voice_recordings**:
   - Users can view their own recordings
   - Service role can manage recordings

8. **biometric_patterns**:
   - Users can view their own patterns
   - Service role can manage patterns

## 🚨 Troubleshooting

### Se tabelas não foram criadas:
```sql
-- Verificar se houve erro na migration
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC LIMIT 5;
```

### Se RLS não foi habilitado:
```sql
-- Habilitar RLS manualmente (se necessário)
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_feedback ENABLE ROW LEVEL SECURITY;
-- ... para todas as tabelas
```

### Se policies não foram criadas:
```sql
-- Verificar se policies existem
SELECT * FROM pg_policies WHERE tablename = 'user_consent';
```

### Se triggers não foram criados:
```sql
-- Verificar triggers
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## 📱 Validação via App

Após verificar no banco, teste no aplicativo:

1. **Crie um novo usuário** → Deve funcionar
2. **Tente fazer login** → Rate limit deve funcionar
3. **Verifique logs de auditoria** → Devem aparecer
4. **Teste timeout de sessão** → Deve funcionar após 30min

## 🔧 Próximos Passos

Se tudo estiver correto:

1. ✅ **Generate types**:
   ```bash
   bunx supabase gen types --local > src/types/database.types.ts
   ```

2. ✅ **Testar aplicação**:
   ```bash
   bun dev
   ```

3. ✅ **Verificar logs** no painel Supabase

4. ✅ **Monitorar performance** das queries

## 📞 Suporte

Se encontrar problemas:

1. **Logs do painel**: Authentication → Logs
2. **SQL Editor**: Verificar mensagens de erro
3. **Settings**: Database → Extensions (verificar se uuid-ossp está ativa)

---

**Execute o `quick_check.sql` primeiro para validação rápida!**
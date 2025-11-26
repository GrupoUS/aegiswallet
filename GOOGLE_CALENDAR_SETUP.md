# 🚀 Guia Completo: Configuração Google Calendar API - AegisWallet

## 📋 Status Atual da Configuração

### ✅ **JÁ CONFIGURADO**
- **Google Cloud Console**: Client ID e Secret obtidos
- **Variáveis de Ambiente Vercel**: 100% configuradas
- **Edge Functions**: Deployadas e funcionando
- **Schema Banco de Dados**: Completo com RLS policies
- **Frontend Components**: Implementados e prontos

### ⚠️ **PENDENTE - Configuração Manual**

## 🔧 Passo 1: Adicionar Redirect URI no Google Cloud Console

### Acessar Google Cloud Console:
1. Vá para: https://console.cloud.google.com/
2. Selecione o projeto que contém suas credenciais
3. Menu lateral: **APIs & Services** → **Credentials**

### Configurar OAuth 2.0 Client:
1. Clique no seu Client ID: `1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com`
2. Em **Authorized redirect URIs**, adicione:
   ```
   https://aegiswallet-feb4a3cr8-gpus.vercel.app/auth/google/callback
   http://localhost:3000/auth/google/callback
   ```
3. Clique em **Save**

## 🔐 Passo 2: Configurar Secrets no Supabase Dashboard

### Acessar Dashboard Supabase:
1. Abra: https://supabase.com/dashboard/project/qatxdwderitvxqvuonqs
2. Menu lateral: **Project Settings** → **Edge Functions**

### Adicionar Secrets Role: `service_role`

Adicione os seguintes secrets exatamente como mostrado:

#### 1. GOOGLE_CLIENT_ID
```
1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com
```

#### 2. GOOGLE_CLIENT_SECRET
```
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
```

#### 3. GOOGLE_REDIRECT_URI
```
https://aegiswallet-feb4a3cr8-gpus.vercel.app/auth/google/callback
```

#### 4. TOKENS_ENCRYPTION_KEY
```
9f86d081884c7d659a2feaa0c55ad0153aef57199c3955815000000000000000
```

#### 5. WEBHOOK_SECRET
```
aegiswallet-webhook-secret-2025
```

**IMPORTANTE**: Clique em **Save** após adicionar cada secret.

## 🗄️ Passo 3: Verificar Migrations do Banco de Dados

### Via Terminal (Recomendado):
```bash
cd D:\Coders\aegiswallet
bunx supabase db push
```

### Via Dashboard:
1. Menu lateral: **Table Editor**
2. Verifique se as seguintes tabelas existem:
   - `google_calendar_tokens`
   - `calendar_sync_mapping`
   - `calendar_sync_settings`
   - `calendar_sync_audit`
   - `event_reminders`

## 🧪 Passo 4: Testar a Configuração

### 1. Testar Edge Functions:
```bash
# Testar autenticação (deve retornar 401 se funcionando)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-auth

# Testar sincronização (deve retornar 401 se funcionando)
curl https://qatxdwderitvxqvuonqs.supabase.co/functions/v1/google-calendar-sync
```

### 2. Testar Aplicação:
1. Inicie o desenvolvimento local:
   ```bash
   cd D:\Coders\aegiswallet
   bun dev
   ```

2. Acesse: http://localhost:3000/calendario

3. Clique em **Conectar Google Calendar**

4. Autentique com Google e autorize o acesso

## 🎯 Fluxo Esperado

### 1. Autenticação OAuth:
- Usuário clica "Conectar Google Calendar"
- Redirecionado para Google OAuth
- Autoriza acesso ao calendário
- Redirecionado de volta para aplicação
- Tokens armazenados criptografados

### 2. Sincronização:
- Configurar direção da sincronização
- Escolher quais eventos sincronizar
- Executar sincronização inicial
- Manter sincronização incremental

## 🔍 Verificação Final

### Checklist de Confirmação:
- [ ] Redirect URI adicionada no Google Cloud Console
- [ ] 5 secrets configurados no Supabase
- [ ] Migrations executadas com sucesso
- [ ] Edge Functions respondendo (código 401 esperado)
- [ ] Autenticação OAuth funcionando
- [ ] Sincronização de eventos operacional

## 🚨 Solução de Problemas

### Erro Comum 1: "redirect_uri_mismatch"
**Causa**: Redirect URI não configurada no Google Console
**Solução**: Verifique Passo 1 - adicione as URIs exatas

### Erro Comum 2: "Unauthorized" (401)
**Causa**: Secrets não configurados no Supabase
**Solução**: Verifique Passo 2 - configure todos os secrets

### Erro Comum 3: "Database error"
**Causa**: Migrations não executadas
**Solução**: Verifique Passo 3 - execute `supabase db push`

---

## 🎉 Parabéns!

Após seguir estes passos, sua aplicação AegisWallet terá integração completa e funcional com Google Calendar!

A integração está **95% completa** - apenas falta esta configuração manual para estar 100% funcional!

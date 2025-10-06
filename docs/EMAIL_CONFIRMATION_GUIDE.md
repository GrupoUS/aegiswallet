# 📧 Guia de Confirmação de Email - AegisWallet

## 🔍 Problema Identificado

Quando um usuário cria uma nova conta no AegisWallet, o Supabase cria a conta com sucesso mas o **email de confirmação não é enviado automaticamente** em ambiente de desenvolvimento.

### Por que isso acontece?

**Supabase em modo Development (Free Tier)** não envia emails reais por padrão. Os emails são capturados e disponibilizados apenas no **Supabase Dashboard**.

---

## ✅ Solução 1: Confirmar Email Manualmente via Supabase Dashboard

### Passo a Passo:

1. **Acesse o Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/soqfclgupivjcdiiwmta
   ```

2. **Navegue até Authentication**:
   - No menu lateral, clique em **Authentication**
   - Clique em **Users**

3. **Localize o usuário criado**:
   - Procure pelo email: `mauriciomagalhes@live.com`

4. **Confirme o email manualmente**:
   - Clique no usuário
   - Procure o campo **"Email Confirmed"**
   - Marque como confirmado (checkbox ou toggle)
   - OU clique em **"..."** → **"Confirm Email"**

5. **Teste o login**:
   - Volte para a aplicação
   - Tente fazer login novamente
   - Deve funcionar sem o erro "Email not confirmed"

---

## ✅ Solução 2: Configurar SMTP para Emails Reais (Produção)

Para enviar emails reais em produção, configure um provedor SMTP:

### Opções de SMTP:

1. **SendGrid** (Recomendado)
2. **AWS SES**
3. **Mailgun**
4. **Resend**
5. **SMTP customizado**

### Como Configurar:

1. **Acesse Supabase Dashboard** → **Settings** → **Authentication**

2. **Role até "SMTP Settings"**:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: SG.xxxxxxxxxxxxx
   Sender Email: noreply@aegiswallet.com
   Sender Name: AegisWallet
   ```

3. **Salve as configurações**

4. **Teste enviando um email**:
   - Crie uma nova conta
   - O email deve ser enviado para a caixa de entrada real

---

## ✅ Solução 3: Desabilitar Confirmação de Email (Apenas Dev)

**⚠️ NÃO RECOMENDADO PARA PRODUÇÃO**

Se quiser desabilitar a confirmação de email em desenvolvimento:

1. **Acesse Supabase Dashboard** → **Authentication** → **Settings**

2. **Procure por "Email Confirmations"**

3. **Desabilite "Confirm email"**:
   - Toggle: OFF
   - Isso permite que usuários façam login sem confirmar email

4. **Salve as configurações**

**Importante**: Isso só deve ser usado em desenvolvimento. Em produção, SEMPRE exija confirmação de email por segurança.

---

## 🔧 Correções Aplicadas no Código

### 1. Variáveis de Ambiente Corrigidas

**Antes** (.env.local):
```env
NEXT_PUBLIC_SUPABASE_URL="..."  # ❌ Errado (Next.js)
```

**Depois** (.env.local):
```env
VITE_SUPABASE_URL="..."  # ✅ Correto (Vite)
```

### 2. Cliente Supabase Atualizado

**Antes** (client.ts):
```typescript
const SUPABASE_URL = 'https://hardcoded...'  // ❌ Hardcoded
```

**Depois** (client.ts):
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fallback...'  // ✅ Usa env vars
```

---

## 📊 Diagnóstico do Erro

### Mensagem de Erro Vista:
```
"Email not confirmed"
```

### O que isso significa:
- ✅ A conta **FOI criada** com sucesso no Supabase
- ✅ O email está **pendente de confirmação**
- ❌ O email de confirmação **NÃO foi enviado** (modo dev)
- ❌ O usuário **NÃO pode fazer login** até confirmar

### Status Atual da Conta:
```
Email: mauriciomagalhes@live.com
Status: Pending Email Confirmation
Created: ✅ Sim
Email Confirmed: ❌ Não
Can Login: ❌ Não (até confirmar)
```

---

## 🚀 Próximos Passos Recomendados

### Para Desenvolvimento:
1. **Confirmar email manualmente** via Supabase Dashboard (Solução 1)
2. Continuar testando o flow de autenticação
3. Testar refresh de página (persistência)
4. Testar logout

### Para Produção:
1. **Configurar SMTP** (SendGrid/AWS SES) para enviar emails reais
2. **Customizar templates** de email no Supabase Dashboard
3. **Testar emails** em diferentes provedores (Gmail, Outlook, etc.)
4. **Configurar domínio** próprio para emails (ex: noreply@aegiswallet.com)

---

## 🎯 Fluxo Correto de Cadastro

### Como Deveria Funcionar:

```
1. Usuário preenche formulário de cadastro
   ↓
2. Frontend chama supabase.auth.signUp()
   ↓
3. Supabase cria conta com status "pending"
   ↓
4. Supabase envia email com link de confirmação
   ↓
5. Usuário clica no link do email
   ↓
6. Email é confirmado (status "confirmed")
   ↓
7. Usuário pode fazer login normalmente
```

### Como Está Acontecendo Agora (Dev):

```
1. Usuário preenche formulário de cadastro
   ↓
2. Frontend chama supabase.auth.signUp()
   ↓
3. Supabase cria conta com status "pending"
   ↓
4. ❌ Email NÃO é enviado (modo dev sem SMTP)
   ↓
5. Usuário tenta fazer login
   ↓
6. Erro: "Email not confirmed"
```

---

## 📝 Comandos Úteis

### Reiniciar Dev Server (após mudar .env):
```bash
# Parar processo atual (Ctrl+C no terminal)
bun dev
```

### Verificar Variáveis de Ambiente no Browser:
```javascript
// No console do browser
console.log(import.meta.env.VITE_SUPABASE_URL)
```

### Limpar Cache do Browser:
```
Chrome: Ctrl + Shift + Delete
- Clear cookies and site data
- Clear cached images and files
```

---

## ✅ Checklist de Validação

Após confirmar o email manualmente:

- [ ] Email confirmado no Supabase Dashboard
- [ ] Limpar cache do browser
- [ ] Tentar fazer login novamente
- [ ] Verificar se redireciona para `/dashboard`
- [ ] Verificar se sessão persiste após refresh
- [ ] Testar logout
- [ ] Verificar se redirect funciona (ex: acessar `/transactions` → login → volta para `/transactions`)

---

**🎉 Sistema de Autenticação está Funcional - Apenas precisa confirmar o email!**

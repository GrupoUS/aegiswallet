# Configuração do Google OAuth para Login

Este guia detalha como configurar o Google OAuth para autenticação de usuários via Supabase Auth.

## Problema Comum

O erro **"Invalid API key"** ao tentar fazer login com Google geralmente indica que as credenciais não estão configuradas corretamente no Supabase Dashboard.

## Pré-requisitos

- Credenciais OAuth 2.0 do Google Cloud Console:
  - Client ID
  - Client Secret
- Acesso ao Supabase Dashboard do projeto
- Acesso ao Vercel Dashboard (para variáveis de ambiente)

## Credenciais do Projeto

**Client ID**: `1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com`
**Client Secret**: `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`

## Passo 1: Configurar no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione o projeto **AegisWallet** (project ID: `qatxdwderitvxqvuonqs`)
3. Navegue para **Authentication** → **Providers**
4. Encontre o provedor **Google** na lista
5. Clique no toggle ou botão para **ativar** o provedor Google
6. Configure os seguintes campos:
   - **Client ID (for OAuth)**: `1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: `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`
7. Clique em **Save** para salvar as alterações

> ⚠️ **Importante**: As alterações podem levar alguns minutos para serem propagadas. Aguarde 2-3 minutos antes de testar.

## Passo 2: Verificar Redirect URIs no Supabase

O Supabase geralmente configura automaticamente o redirect URI padrão:
- `https://qatxdwderitvxqvuonqs.supabase.co/auth/v1/callback`

Este URI já deve estar configurado. Se necessário, você pode verificar em:
- **Authentication** → **URL Configuration** → **Redirect URLs**

Certifique-se de que os seguintes URLs estão na lista:
- `https://aegiswallet.vercel.app`
- `https://qatxdwderitvxqvuonqs.supabase.co/auth/v1/callback`
- `http://localhost:5173` (para desenvolvimento local)

## Passo 3: Configurar no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Selecione o projeto que contém as credenciais OAuth
3. Navegue para **APIs & Services** → **Credentials**
4. Encontre o OAuth 2.0 Client ID com o ID: `1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq`
5. Clique para editar
6. Em **Authorized redirect URIs**, adicione/verifique os seguintes URIs:

```
https://qatxdwderitvxqvuonqs.supabase.co/auth/v1/callback
https://aegiswallet.vercel.app
http://localhost:5173
```

7. Clique em **Save** para salvar as alterações

> ⚠️ **Importante**: O redirect URI deve corresponder **exatamente** ao que o Supabase espera. Qualquer diferença (incluindo trailing slash) causará falha na autenticação.

## Passo 4: Configurar Variáveis de Ambiente no Vercel

As variáveis de ambiente no Vercel são necessárias para funcionalidades adicionais (como Google Calendar), mas o login básico depende principalmente da configuração no Supabase Dashboard.

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto **aegiswallet**
3. Navegue para **Settings** → **Environment Variables**
4. Verifique/Configure as seguintes variáveis:

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| `VITE_GOOGLE_CLIENT_ID` | `1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `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` | Production, Preview, Development |

5. Certifique-se de que ambas as variáveis estão habilitadas para **Production**, **Preview** e **Development**
6. Clique em **Save** para cada variável

> 💡 **Dica**: Após adicionar/atualizar variáveis de ambiente, você pode precisar fazer um novo deploy ou aguardar o próximo deploy automático para que as mudanças sejam aplicadas.

## Passo 5: Configuração Local (Opcional)

Para desenvolvimento local, configure o arquivo `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

> ⚠️ **Importante**: Nunca commite o arquivo `.env.local` no repositório. Ele está no `.gitignore`.

## Passo 6: Testar a Configuração

1. Aguarde 2-3 minutos após fazer as alterações no Supabase Dashboard
2. Faça um novo deploy no Vercel (ou aguarde o próximo deploy automático)
3. Acesse `https://aegiswallet.vercel.app/login`
4. Clique no botão **"Entrar com Google"**
5. Você deve ser redirecionado para a página de consentimento do Google
6. Após autorizar, você deve ser redirecionado de volta para o aplicativo e estar autenticado

## Troubleshooting

### Erro: "Invalid API key"

**Causa**: Credenciais não configuradas no Supabase Dashboard ou credenciais incorretas.

**Solução**:
1. Verifique se as credenciais estão corretas no Supabase Dashboard
2. Certifique-se de que o provedor Google está **ativado**
3. Aguarde alguns minutos para propagação das mudanças

### Erro: "redirect_uri_mismatch"

**Causa**: O redirect URI no Google Cloud Console não corresponde ao esperado pelo Supabase.

**Solução**:
1. Verifique se o redirect URI `https://qatxdwderitvxqvuonqs.supabase.co/auth/v1/callback` está configurado no Google Cloud Console
2. Certifique-se de que não há trailing slashes ou diferenças de maiúsculas/minúsculas
3. O redirect URI deve corresponder **exatamente** ao configurado

### Erro: "access_denied"

**Causa**: O usuário negou permissão ou há problema com os escopos OAuth.

**Solução**:
1. Verifique se a tela de consentimento OAuth no Google Cloud Console está publicada
2. Certifique-se de que os escopos necessários estão configurados
3. Tente novamente com uma conta diferente

### Login funciona localmente mas não em produção

**Causa**: Variáveis de ambiente não configuradas no Vercel ou redirect URIs incorretos.

**Solução**:
1. Verifique se as variáveis de ambiente estão configuradas no Vercel
2. Verifique se o redirect URI de produção está no Google Cloud Console
3. Faça um novo deploy após atualizar as variáveis

## Referências

- [Supabase Auth - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

## Arquivos Relacionados

- `src/contexts/AuthContext.tsx` (linhas 68-87): Implementação do `signInWithGoogle`
- `env.example` (linhas 23-24): Template de variáveis de ambiente
- `docs/deployment/VERCEL-DEPLOYMENT-GUIDE.md`: Guia de deployment


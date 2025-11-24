# Google OAuth - Referência Rápida

## Credenciais do Projeto

```
Client ID: 1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com
Client Secret: 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
```

## URLs Importantes

### Supabase
- **Project ID**: `qatxdwderitvxqvuonqs`
- **Project URL**: `https://qatxdwderitvxqvuonqs.supabase.co`
- **Auth Callback**: `https://qatxdwderitvxqvuonqs.supabase.co/auth/v1/callback`

### Vercel
- **Production URL**: `https://aegiswallet.vercel.app`

### Google Cloud Console
- **Redirect URIs Necessários**:
  - `https://qatxdwderitvxqvuonqs.supabase.co/auth/v1/callback`
  - `https://aegiswallet.vercel.app`
  - `http://localhost:5173` (desenvolvimento)

## Configuração Rápida

### 1. Supabase Dashboard
```
Authentication > Providers > Google
- Ativar provedor
- Client ID: [acima]
- Client Secret: [acima]
- Salvar
```

### 2. Google Cloud Console
```
APIs & Services > Credentials > OAuth 2.0 Client ID
- Adicionar redirect URIs: [acima]
- Salvar
```

### 3. Vercel Dashboard
```
Settings > Environment Variables
- VITE_GOOGLE_CLIENT_ID: [acima]
- GOOGLE_CLIENT_SECRET: [acima]
- Habilitar para: Production, Preview, Development
```

## Teste

1. Aguardar 2-3 minutos após configuração no Supabase
2. Acessar: `https://aegiswallet.vercel.app/login`
3. Clicar em "Entrar com Google"
4. Verificar redirecionamento e login bem-sucedido

## Documentação Completa

- [Guia Completo](./google-oauth-setup.md)
- [Checklist](./google-oauth-checklist.md)


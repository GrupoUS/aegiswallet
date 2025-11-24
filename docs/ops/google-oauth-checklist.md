# Google OAuth - Checklist Rápido

Use este checklist para verificar rapidamente se a configuração do Google OAuth está completa.

## ✅ Checklist de Configuração

### Supabase Dashboard
- [ ] Acessar: https://app.supabase.com
- [ ] Projeto: AegisWallet (qatxdwderitvxqvuonqs)
- [ ] Authentication > Providers > Google
- [ ] Provedor Google **ativado**
- [ ] Client ID configurado: `1068161308060-5052t66k66vcdmkngpnq43pjvm6j3ftq.apps.googleusercontent.com`
- [ ] Client Secret configurado: `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`
- [ ] Alterações salvas

### Google Cloud Console
- [ ] Acessar: https://console.cloud.google.com
- [ ] Projeto correto selecionado
- [ ] APIs & Services > Credentials
- [ ] OAuth 2.0 Client ID editado
- [ ] Redirect URI adicionado: `https://qatxdwderitvxqvuonqs.supabase.co/auth/v1/callback`
- [ ] Redirect URI adicionado: `https://aegiswallet.vercel.app`
- [ ] Redirect URI adicionado: `http://localhost:5173` (dev)
- [ ] Alterações salvas

### Vercel Dashboard
- [ ] Acessar: https://vercel.com/dashboard
- [ ] Projeto: aegiswallet
- [ ] Settings > Environment Variables
- [ ] `VITE_GOOGLE_CLIENT_ID` configurado para Production, Preview, Development
- [ ] `GOOGLE_CLIENT_SECRET` configurado para Production, Preview, Development

### Teste
- [ ] Aguardado 2-3 minutos após alterações no Supabase
- [ ] Deploy realizado no Vercel (ou aguardado deploy automático)
- [ ] Acessado: https://aegiswallet.vercel.app/login
- [ ] Clicado em "Entrar com Google"
- [ ] Redirecionamento para Google funcionando
- [ ] Login concluído com sucesso

## 🔍 Verificação Rápida

### Erro: "Invalid API key"
→ Verificar se credenciais estão no Supabase Dashboard (não apenas variáveis de ambiente)

### Erro: "redirect_uri_mismatch"
→ Verificar redirect URIs no Google Cloud Console correspondem exatamente aos esperados

### Login funciona local mas não em produção
→ Verificar variáveis de ambiente no Vercel e redirect URIs de produção

## 📚 Documentação Completa

Para instruções detalhadas, consulte: [docs/ops/google-oauth-setup.md](./google-oauth-setup.md)


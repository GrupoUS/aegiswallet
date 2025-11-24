# Correção do Problema de Redirecionamento OAuth

## Problema Identificado

Após configurar as credenciais do Google OAuth no Supabase Dashboard, o login ainda não estava funcionando porque a URL de produção (`https://aegiswallet.vercel.app`) não estava na lista de redirect URLs permitidas no Supabase.

## Causa Raiz

A migration `20251124_auth_config_hardening.sql` configurava apenas as seguintes URLs como redirect URLs permitidas:
- `https://app.aegiswallet.com`
- `https://staging.aegiswallet.com`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Mas a URL de produção real é `https://aegiswallet.vercel.app`, que não estava na lista. Quando o Supabase tentava redirecionar o usuário de volta após a autenticação com Google, ele rejeitava a requisição porque a URL não estava autorizada.

## Solução Aplicada

Foi criada e aplicada a migration `20250124_add_vercel_redirect_url.sql` que adiciona `https://aegiswallet.vercel.app` à lista de redirect URLs permitidas no Supabase.

### Migration Aplicada

```sql
-- Add Vercel production URL to allowed redirect URLs for OAuth
-- This fixes the Google OAuth redirect issue where users were not being redirected back to the app
DO $$
DECLARE
    instance_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
    current_config jsonb;
    target_config jsonb;
    current_urls text[];
    new_urls text[];
    vercel_url text := 'https://aegiswallet.vercel.app';
BEGIN
    -- ... código da migration ...
    -- Adiciona a URL do Vercel se não existir
END $$;
```

**Status**: ✅ Migration aplicada com sucesso no projeto `qatxdwderitvxqvuonqs`

## Verificação

Para verificar se a URL foi adicionada corretamente, execute no Supabase SQL Editor:

```sql
SELECT
    raw_base_config->'ADDITIONAL_REDIRECT_URLS' as redirect_urls
FROM auth.instances
WHERE id = '00000000-0000-0000-0000-000000000000';
```

A URL `https://aegiswallet.vercel.app` deve aparecer no array de redirect URLs.

## Próximos Passos

1. ✅ Migration aplicada
2. ⏳ Aguardar alguns minutos para propagação (se necessário)
3. ⏳ Testar o fluxo completo de login com Google:
   - Acessar `https://aegiswallet.vercel.app/login`
   - Clicar em "Entrar com Google"
   - Autorizar no Google
   - Verificar redirecionamento de volta para o app

## Notas Importantes

- O Supabase valida **rigorosamente** os redirect URLs. Qualquer URL que não esteja na lista será rejeitada.
- A URL deve corresponder **exatamente** (incluindo protocolo, domínio e porta se aplicável).
- Após adicionar uma nova URL, pode levar alguns minutos para a mudança ser propagada.

## Arquivos Relacionados

- `supabase/migrations/20250124_add_vercel_redirect_url.sql` - Migration criada
- `supabase/migrations/20251124_auth_config_hardening.sql` - Migration original que não incluía a URL do Vercel
- `docs/ops/google-oauth-setup.md` - Guia completo de configuração


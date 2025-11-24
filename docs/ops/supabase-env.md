# Supabase Environment Requirements

> Atualizado em 2025-11-24 após revisão de RLS/persistência.

## Variáveis obrigatórias

| Escopo | Variável | Descrição |
| --- | --- | --- |
| Frontend (Vite) | `VITE_SUPABASE_URL` | URL do projeto Supabase |
| Frontend (Vite) | `VITE_SUPABASE_ANON_KEY` | Chave anônima usada pelo browser; **nunca** use a service role aqui |
| Backend / Server | `SUPABASE_URL` | Mesmo valor do frontend |
| Backend / Server | `SUPABASE_ANON_KEY` | Usado apenas como fallback; operações privilegiadas não devem depender dele |
| Backend / Server | `SUPABASE_SERVICE_ROLE_KEY` | **Obrigatório** para Hono/tRPC processarem mutações legado. Configure no gerenciador de segredos da Vercel e em `.env` local (não commitado) |
| Ops / QA | `SUPABASE_QA_USER_ID` | UUID do usuário QA usado nos smoke tests automatizados |
| Ops / CLI | `SUPABASE_ACCESS_TOKEN` (opcional) | Token usado pelo MCP/CLI para migrations |

## Boas práticas

1. **Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY` ao bundle do cliente. Ele deve existir apenas em `process.env` no runtime servidor.
2. Use `.env.local` para credenciais reais e deixe `docs/ops/supabase-env.md` como referência comprometida.
3. Automatize a checagem: scripts/CI devem falhar se `SUPABASE_SERVICE_ROLE_KEY` não estiver definido quando `NODE_ENV=production`. Rode `bun run env:check` localmente para validar o `.env.local`.
4. Gere um `TOKENS_ENCRYPTION_KEY` (32 bytes) para Google Calendar/secret storage.

### Template oficial (`env.example`)

- Copie `env.example` para `.env.local` assim que clonar o repo: `cp env.example .env.local`.
- O arquivo já inclui placeholders para **todas** as variáveis críticas (frontend + backend). Complete cada valor seguindo a tabela abaixo e nunca commite o `.env.local`.
- O script `scripts/setup-vercel-env.sh` lê o `.env.local` gerado a partir do template para replicar as variáveis no Vercel.
- Use `bun run env:check` sempre que editar as variáveis; o script verifica `SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_QA_USER_ID`.

## Site URL e Redirect URLs oficiais

- `SITE_URL`: `https://app.aegiswallet.com`
- `additional_redirect_urls`:
  - `https://app.aegiswallet.com`
  - `https://staging.aegiswallet.com`
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

Esses valores vivem no registro único de `auth.instances` (`00000000-0000-0000-0000-000000000000`). Sempre que criar um branch Supabase/clonar o projeto local, replique o JSON de `raw_base_config` com o comando:

```sql
select raw_base_config from auth.instances where id = '00000000-0000-0000-0000-000000000000';
```

> Referência: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) e [CLI Config](https://supabase.com/docs/guides/cli/config) explicam por que apenas URLs validadas funcionam para magic links, redefinição de senha e provedores sociais.

## Usuário/Service Role de QA

- **Service role**: crie um token dedicado via `Settings ▸ API ▸ Service role`, nomeando-o `qa-smoke-tests`. Salve no 1Password do time e injete em `SUPABASE_SERVICE_ROLE_KEY`.
- **Usuário QA**: utilize o painel `Authentication ▸ Users` para criar `qa+smoke@aegiswallet.com`. Defina uma senha temporária, confirme o e-mail manualmente e copie o `id` UUID para o 1Password.
- Exponha o `id` em `SUPABASE_QA_USER_ID` (local + Vercel). Tanto `bun run env:check` quanto `bun run smoke:supabase` usam esse valor automaticamente (pode ser sobrescrito com `--user=<uuid>`).
- Após criar o usuário, execute o smoke test SQL (abaixo) substituindo `<USER_ID>` pelo `id` do usuário QA.
- Não compartilhe essas credenciais fora do time de engenharia. Rotacione a senha sempre que rodar smoke tests em ambientes compartilhados.

## Como configurar (Vercel)

```bash
vercel env add SUPABASE_URL https://qatxdwderitvxqvuonqs.supabase.co
vercel env add SUPABASE_ANON_KEY <anon-key>
vercel env add SUPABASE_SERVICE_ROLE_KEY <service-role-key>
```

## Smoke test de persistência

Utilize o MCP Supabase ou `supabase sql` para rodar o comando abaixo (substitua o `user_id` existente no ambiente):

```sql
insert into public.bank_accounts (
  user_id, belvo_account_id, institution_id, institution_name,
  account_type, account_mask, account_holder_name,
  balance, currency, is_primary, is_active, sync_status, available_balance
) values (
  '<USER_ID>',
  concat('manual_smoke_', gen_random_uuid()),
  'test_institution',
  'QA Smoke Bank',
  'checking',
  '**** 5678',
  'QA Smoke',
  123.45,
  'BRL',
  false,
  true,
  'manual',
  123.45
) returning id;
```

Finalize removendo o registro para manter o banco limpo.

### Script automatizado

- Rode `bun run smoke:supabase` para executar o fluxo acima. O script usa `SUPABASE_QA_USER_ID` por padrão; passe `--user=<UUID>` para sobrescrever e `--keep-data` para pular o cleanup.
- As variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_QA_USER_ID` são validadas antes de qualquer operação (o comando falha se alguma estiver ausente).
- Saída do script é pensada para CI: status `0` indica que inserts/deletes estão funcionando com as credenciais atuais.

## Status atual (2025-11-24)

- `.env` local **não** possui `SUPABASE_SERVICE_ROLE_KEY`; adicionar manualmente.
- `SUPABASE_ACCESS_TOKEN` presente apenas para MCP (não usado em produção).
- Scripts/routers principais já consomem `ctx.supabase`, portanto basta garantir que o service role esteja disponível para evitar erros de RLS em rotas legado enquanto migramos todo o backend.


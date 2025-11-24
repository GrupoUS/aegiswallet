# Active Context (2025-11-24)

## Current Focus
- Correções de persistência concluídas: RLS restaurado em `bank_accounts`/`transactions` e `user_id` NOT NULL; migrations recentes (`20251124_*` + `20251128_align_transactions_columns.sql`) alinham schema com o código (`transaction_date/transaction_type`).
- Supabase client por request continua ativo (`ctx.supabase`) e os routers legacy (`calendar`, `contacts`, `users`, `transactions`) finalmente abandonaram o import global para respeitar o JWT do usuário.
- `docs/ops/supabase-env.md` agora referencia o template `env.example` e o script `scripts/setup-vercel-env.sh` sincroniza também o `SUPABASE_SERVICE_ROLE_KEY`; falta apenas garantir que cada ambiente copiou o template.
- O smoke test manual virou script (`bun run smoke:supabase --user <UUID>`) com cleanup automático; pensado para CI e para validar se o service role realmente consegue realizar inserts/deletes.
- `auth.instances.raw_base_config` segue versionado e a leitura via MCP confirma `SITE_URL=https://aegiswallet.vercel.app`, `HIBP_ENABLED=true` e redirects cobrindo `app.aegiswallet.com`, localhost e curingas `aegiswallet-*.vercel.app`.
- Rodamos `bun run type-check` para obter a baseline dos erros legados (voz, segurança, testes) e limpamos as regressões introduzidas pelo refactor (`calendar`/`contacts`).

## Known Issues / Follow-ups
1. `bun run type-check` ainda retorna dezenas de erros antigos (voz, segurança, pix, testes) — precisamos priorizar a conversão gradual e gerar tipos Supabase atualizados (tabelas como `push_subscriptions`, `sms_logs`, `pix_transactions` não existem no `src/types/database.types.ts`).
2. `SUPABASE_SERVICE_ROLE_KEY` precisa estar definido no `.env.local` de todos (o template existe, mas ainda falta validar o rollout real e atualizar secrets na Vercel).
3. A suíte automatizada para criação/atualização de contas e transações ainda inexiste; o script de smoke test precisa entrar no CI e usar um usuário de QA fixo/documentado.
4. `auth.config` segue ausente como view oficial no schema `auth` — se o dashboard quebrar novamente, teremos de acionar o suporte Supabase para restaurar os objetos protegidos.
5. Advisories continuam listando tabelas legadas com RLS habilitado porém sem policies/índices; antes de abrir políticas novas, precisamos mapear quais tabelas realmente fazem parte do MVP.
6. Se novos domínios personalizados forem adicionados, lembrar de expandir `ADDITIONAL_REDIRECT_URLS`, já que Supabase não aceita curingas parciais (usamos `aegiswallet-*.vercel.app` / `aegiswallet-git-*.vercel.app` provisoriamente para cobrir os subdomínios gerados pela Vercel).

## Immediate Tasks
1. Validar rollout do `SUPABASE_SERVICE_ROLE_KEY` (local + Vercel) usando o template `env.example` e o script `scripts/setup-vercel-env.sh`.
2. Regenerar `src/types/database.types.ts` (ou adicionar tipos manuais) para incluir `push_subscriptions`, `push_logs`, `sms_logs`, `pix_transactions`, `pix_qr_codes` e demais tabelas que o tRPC usa — requisito para reduzir os erros do type-check.
3. Integrar `bun run smoke:supabase --user <QA_UUID>` ao pipeline (CI/manual) e documentar o usuário padrão que deve ser usado no script.
4. Priorizar o mutirão de `bun run type-check` (voz + segurança + testes) assim que os tipos estiverem alinhados; objetivo é zerar erros antes da próxima release.
5. Revalidar periodicamente `auth.instances.raw_base_config` via MCP após cada alteração de redirect/site, já que o dashboard do Supabase costuma cachear valores antigos.

## Risks / Unknowns
- Service role exposta no bundle client quebraria RLS; garantir que bundler nunca tenha acesso à variável.
- Schema divergente pode quebrar features quando a migration for aplicada; precisa de script de migração cuidadoso.
- Falta de testes automatizados significa que regressões de RLS/payload podem voltar facilmente.

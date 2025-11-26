# Progress Log

## Completed
- Releitura dos documentos centrais (`docs/brief.md`, PRD, arquitetura, épicos) e atualização completa da Memory Bank.
- RLS restaurado nos objetos críticos via migration `20251124120000_fix_account_transaction_policies.sql` (aplicada com MCP).
- Configuração Supabase documentada em `docs/ops/supabase-env.md`, incluindo exigência do `SUPABASE_SERVICE_ROLE_KEY`.
- Smoke test manual (insert/delete em `bank_accounts` e `transactions`) executado com sucesso usando o usuário de QA.
- Dashboard de Auth voltou a carregar após recriarmos o registro ausente em `auth.instances` (`id = 00000000-0000-0000-0000-000000000000`) e confirmarmos o endpoint `auth/v1/settings` via cURL.
- Fluxo de OAuth do Google corrigido: `SITE_URL` passou a apontar para `https://aegiswallet.vercel.app` e `ADDITIONAL_REDIRECT_URLS` agora cobrem `app.aegiswallet.com`, localhost e os padrões `aegiswallet-*.vercel.app`/`aegiswallet-git-*.vercel.app`, evitando o redirecionamento de volta para `/login`.
- Adicionamos curingas `/*` às URLs permitidas e o hook `useOAuthHandler` agora processa o fluxo PKCE (troca de `code` via `supabase.auth.exchangeCodeForSession`), impedindo que o usuário fique preso em `https://<project>.supabase.co` após o login social.
- `signInWithGoogle` agora usa `redirectTo = window.location.origin` e registra o destino em `sessionStorage`, permitindo que o SPA redirecione o usuário para `/dashboard` (ou outro caminho) sem depender de múltiplos redirects configurados no Supabase.
- Hardening Supabase (2025-11-24): migrations `20251124_auth_config_hardening.sql`, `20251124_rls_restoration.sql`, `20251124_audit_policy_cleanup.sql` e `20251124_function_hardening.sql` versionaram URLs/redirects/HIBP, reativaram RLS em `users/user_preferences/voice_*/financial_events`, consolidaram policies (evitando `auth.uid()` sem `SELECT`) e adicionaram `SET search_path = ''` às funções PL/pgSQL sensíveis.
- Template `env.example` foi revisado, `scripts/check-env.ts` criado (`bun run env:check`) e `scripts/setup-vercel-env.sh` passou a sincronizar o `SUPABASE_SERVICE_ROLE_KEY`, evitando ambientes sem a secret.
- Routers `calendar`, `contacts`, `users` e `transactions` migrados para `ctx.supabase`, garantindo que cada request use o client autenticado e eliminando dependência do singleton browser.
- Migration `20251128_align_transactions_columns.sql` aplicada (via MCP) renomeando `transactions.date/type` → `transaction_date/transaction_type`, alinhando o schema ao código e evitando divergências.
- Script `scripts/supabase-smoke-test.ts` virou comando oficial (`bun run smoke:supabase`) com suporte ao `SUPABASE_QA_USER_ID`/`--user`, cleanup automático e documentação em `docs/ops/supabase-env.md`.
- `src/types/database.types.ts` agora inclui `pix_transactions`, `pix_qr_codes`, `push_subscriptions`, `push_logs` e `sms_logs`, reduzindo os falsos positivos do `bun run type-check`.
- Rodamos `bun run type-check` para capturar a baseline atual das falhas e removemos as regressões causadas pelo refactor; erros remanescentes concentram-se em módulos legados (voz, segurança, pix, testes).

## In Flight
- Completar `src/types/database.types.ts` com as tabelas restantes consumidas pelos routers (`user_behavior_profiles`, `fraud_detection_logs`, etc.) e preferencialmente regenerar via Supabase CLI.
- Resolver falhas do `type-check` em módulos legados (voz, segurança, testes) agora que o schema e os routers estão alinhados.
- Conectar `env:check` + `smoke:supabase` ao pipeline (CI/manual) usando o usuário de QA documentado.

## Next
1. Garantir rollout real do `SUPABASE_SERVICE_ROLE_KEY` **e** do `SUPABASE_QA_USER_ID` (local + Vercel) usando o template/script + `bun run env:check`.
2. Criar migration `20251125_add_missing_financial_event_columns.sql` e atualizar `complete_database_schema.sql`.
3. Implementar/ativar validadores compartilhados nos routers e hooks restantes.
4. Ligar o smoke test automatizado na CI e documentar o usuário QA padrão.
5. Reconfigurar `site_url`/`additional_redirect_urls` direto no dashboard quando os segredos estiverem nos ambientes e monitorar os curingas `*-vercel.app`.
6. Validar se os curingas de domínio (`aegiswallet-*.vercel.app`) seguem aceitos; caso contrário, provisionar aliases dedicados na Vercel e manter o hook PKCE monitorado.

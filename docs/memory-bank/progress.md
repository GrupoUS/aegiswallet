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
- Template `env.example` criado + `scripts/setup-vercel-env.sh` agora sincroniza `SUPABASE_SERVICE_ROLE_KEY`; `docs/ops/supabase-env.md` ensina a copiar o template e manter o secret fora do bundle.
- Routers `calendar`, `contacts`, `users` e `transactions` migrados para `ctx.supabase`, garantindo que cada request use o client autenticado e eliminando dependência do singleton browser.
- Migration `20251128_align_transactions_columns.sql` aplicada (via MCP) renomeando `transactions.date/type` → `transaction_date/transaction_type`, alinhando o schema ao código e evitando divergências.
- Script `scripts/supabase-smoke-test.ts` automatiza o insert/delete (com cleanup) e foi exposto via `bun run smoke:supabase --user <UUID>`; doc de ops atualizado e pronto para CI.
- Rodamos `bun run type-check` para capturar a baseline atual das falhas e removemos as regressões causadas pelo refactor; erros remanescentes concentram-se em módulos legados (voz, segurança, pix, testes).

## In Flight
- Regenerar `src/types/database.types.ts` para incluir tabelas (`push_subscriptions`, `push_logs`, `sms_logs`, `pix_transactions`, `pix_qr_codes`) referenciadas pelos routers.
- Resolver falhas do `type-check` em módulos legados (voz, segurança, testes) agora que o schema e os routers estão alinhados.
- Conectar o script `smoke:supabase` ao pipeline (CI/manual) usando um usuário de QA documentado.

## Next
1. Garantir rollout real do `SUPABASE_SERVICE_ROLE_KEY` (local + Vercel) usando o novo template/script.
2. Criar migration `20251125_add_missing_financial_event_columns.sql` e atualizar `complete_database_schema.sql`.
3. Implementar/ativar validadores compartilhados nos routers e hooks restantes.
4. Ligar o smoke test automatizado na CI e documentar o usuário QA padrão.
5. Reconfigurar `site_url`/`additional_redirect_urls` direto no dashboard quando os segredos estiverem nos ambientes e monitorar os curingas `*-vercel.app`.
6. Validar se os curingas de domínio (`aegiswallet-*.vercel.app`) seguem aceitos; caso contrário, provisionar aliases dedicados na Vercel e manter o hook PKCE monitorado.

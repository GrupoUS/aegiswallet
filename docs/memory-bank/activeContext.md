# Active Context (2025-11-24)

## Current Focus
- Correções de persistência continuam estáveis: migrations `20251124_*` + `20251128_align_transactions_columns.sql` alinharam o schema (`transaction_date/transaction_type`) e o Supabase Advisors está sem alertas críticos.
- Todos os routers (`calendar`, `contacts`, `users`, `transactions`) agora usam `ctx.supabase`, respeitando o JWT por requisição.
- O onboarding de secrets ganhou o template `env.example`, o script `scripts/check-env.ts` (`bun run env:check`) e o update do `scripts/setup-vercel-env.sh` que replica também o `SUPABASE_SERVICE_ROLE_KEY`.
- O smoke test virou comando oficial (`bun run smoke:supabase`) com suporte ao env `SUPABASE_QA_USER_ID`/`--user` e cleanup automático; a doc de ops descreve o fluxo.
- `src/types/database.types.ts` foi atualizado com `pix_transactions`, `pix_qr_codes`, `push_subscriptions`, `push_logs` e `sms_logs`, reduzindo erros do tsc; ainda faltam tabelas como `user_behavior_profiles` e `fraud_detection_logs`.
- Continuamos rodando `bun run type-check` para inspecionar a dívida (voz, segurança, PIX, testes) e garantir que nenhuma regressão nova foi introduzida.

## Known Issues / Follow-ups
1. `bun run type-check` segue apontando dezenas de erros (voz, segurança, PIX, testes). Alguns são falta de tipos Supabase (`user_behavior_profiles`, `fraud_detection_logs`, etc.), outros são bugs reais (uso incorreto de Web APIs no ambiente SSR/teste).
2. Ainda precisamos validar o rollout real do `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_QA_USER_ID` nas Vercel envs; o script `env:check` existe, mas não está integrado à CI.
3. O smoke test automatizado precisa entrar na pipeline (GitHub/Vercel) usando o QA user dedicado para evitar regressões silenciosas no RLS.
4. `auth.config` continua ausente como view oficial; se o dashboard quebrar novamente teremos de abrir ticket com o suporte Supabase.
5. O Supabase Advisor ainda lista tabelas fora do MVP com RLS habilitado porém sem policies/índices — falta decidir se serão removidas ou atualizadas.
6. Novos domínios personalizados continuam exigindo atualização manual em `auth.instances.raw_base_config`; o time precisa manter a planilha de deploys em dia para evitar bloqueios em OAuth.

## Immediate Tasks
1. Integrar `bun run env:check` e `bun run smoke:supabase` nas pipelines (falhando o deploy se `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_QA_USER_ID` estiverem ausentes ou se o smoke test quebrar).
2. Completar `src/types/database.types.ts` com as tabelas restantes usadas pelo backend (`user_behavior_profiles`, `fraud_detection_logs`, `transaction_alerts`, etc.) e regenerar via Supabase CLI quando possível.
3. Atacar o lote crítico de erros do `type-check`:
   - `pushProvider`/`smsProvider` usam APIs de browser em arquivos compartilhados — precisamos extrair tipos/abstrações para SSR.
   - `fraudDetection` assume campos em `event.metadata` sem checar null e consome tabelas sem tipo.
   - `SpeechRecognitionService` precisa de shims para ambientes Node/Vitest.
4. Anexar o QA user (id + secrets) no 1Password e verificar se `SUPABASE_QA_USER_ID` já está populado nos ambientes (rodar `bun run env:check` em cada workspace).
5. Continuar auditando `auth.instances.raw_base_config` com MCP após qualquer alteração de redirect/site para garantir que o Supabase Dashboard reflita o JSON versionado.

## Risks / Unknowns
- Service role exposta no bundle client quebraria RLS; garantir que bundler nunca tenha acesso à variável.
- Schema divergente pode quebrar features quando a migration for aplicada; precisa de script de migração cuidadoso.
- Falta de testes automatizados significa que regressões de RLS/payload podem voltar facilmente.

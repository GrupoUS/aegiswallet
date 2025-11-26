# Tech Context

- **Runtime/Infra**: Bun + Hono edge server + tRPC. Frontend React 19 + TanStack Router + React Hook Form + Zod + Tailwind/shadcn. State via TanStack Query.
- **Database**: Supabase PostgreSQL (project `qatxdwderitvxqvuonqs`). RLS enforced per user (`auth.uid()`), real-time channels para `bank_accounts`, `transactions`, `pix_transactions`.
- **Environment vars**:
  - `VITE_SUPABASE_URL=https://qatxdwderitvxqvuonqs.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<jwt anon>`
  - `SUPABASE_ACCESS_TOKEN=sbp_...` para MCP.
  - API base `VITE_API_URL=http://localhost:3000/api` durante dev.
- **Supabase config**: `supabase/config.toml` linkado ao mesmo projeto; função edge `get_financial_summary` com JWT obrigatório.
- **Key libs**: Belvo/Open Banking connector, PIX API wrappers, voiceCommandProcessor, calendaring system, caching, logger.
- **Tooling**: Vitest, OXLint/Biome, Vercel deploy, Supabase CLI migrations (29 arquivos), docs em `.kilocode` + BMAD assets.
- **Security**: LGPD compliance, encryption at rest/in transit, multi-layer auth (biometric + password + JWT). RLS policies must gate every table.
- **Stack Versions (2025-11)**: Bun latest, Hono 4.9.9, tRPC 11.6, React 19, TanStack Router 1.114, TanStack Query 5.90, Tailwind 4.1, Zod 4.1; confirmar antes de deploy (ver `docs/architecture.md` checklist).
- **Pipelines & Testing**: Vitest para unit/integration, Playwright recomendado para E2E mobile-first, OXLint/Biome rodando em CI; migrations validadas com `supabase db diff/push` e scripts `supabase/verify_migration.sql`.
- **Version pinning (from architecture doc)**: Bun latest, Hono 4.9.9, tRPC 11.6, Supabase 2.58, React 19.2, TanStack Router 1.114, Query 5.90, Tailwind 4.1, RHF 7.55, Zod 4.1.
- **Voice stack**: Browser Web Speech API para STT/TTS + serviços próprios em `lib/speech`; integrações futuras com provedores cloud devem manter fallback local.
- **Integrations**: Belvo (Open Banking), OpenPix (Pix), CopilotKit para IA conversacional, Supabase storage/logs; roadmap prevê robo-advisor e integrações fiscais.
- **Ops expectations**: `bun dev` para Vite, `bun run lint` (Biome+OXLint), `bun test` (unit), `bun test --runInBand src/test/integration/*` para integrações reais; deploy alvo Vercel Edge.

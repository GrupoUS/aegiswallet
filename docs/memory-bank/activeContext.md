# Active Context (2025-11-24)

## Current Focus
- Executar o **Data Persistence Fix Plan (Phases 0-6)** aprovado: alinhar schema de `financial_events`, corrigir router de contas, reforçar validações/hooks e adicionar cobertura de testes + documentação.
- Atualizar este Memory Bank com insights recentes de `docs/brief.md`, PRD, arquitetura e épicos (fase 0 concluída com este commit).
- Garantir conectividade Supabase (`qatxdwderitvxqvuonqs`), mantendo logs detalhados (backend/front) para reproduzir falhas de persistência.

## Known Issues / Follow-ups
1. `bankAccounts` router cria dados inválidos porque gera UUIDs dummy para campos obrigatórios e não valida máscara/instituição.
2. `financial_events` está com drift vs migrations: campos esperados pelos types (`brazilian_event_type`, `installment_info`, `merchant_category`, `metadata`) não existem no banco → inserts falhando.
3. `complete_database_schema.sql` desatualizado; dificulta auditorias e gera decisões equivocadas.
4. Falta de validação compartilhada nos hooks/routers e ausência de logs ricos para entender falhas.
5. Testes de integração inexistentes para contas/eventos; regressões passam despercebidas.

## Immediate Tasks
1. **Phase 1**: Criar migration `20251125_add_missing_financial_event_columns.sql` com colunas novas + índices e sincronizar `complete_database_schema.sql`.
2. **Phase 2**: Atualizar `src/server/routers/bankAccounts.ts` com validações (manual vs Belvo), remoção de dummy IDs e erros mais claros.
3. **Phase 3**: Adicionar `financial-events-validator`, ajustar `useFinancialEvents` (`eventToRow`/`rowToEvent`, logging, tipos extras).
4. **Phase 4**: Criar `bank-accounts-validator` com regras de máscara, tipos permitidos, sanitização e geração de IDs manuais.
5. **Phase 5**: Escrever testes de integração (Supabase real) cobrindo CRUD/validações de eventos e contas; garantir teardown limpo.
6. **Phase 6**: Documentar correções em `docs/DATA_PERSISTENCE_FIX_SUMMARY.md` e definir passos de verificação manual/automática.

## Risks / Unknowns
- Migration será aplicada no banco real; necessário confirmar que não há dados produtivos impactados ou preparar backup.
- Testes de integração usarão Supabase remoto → risco de poluir dados; mitigação: usuários/contas de teste dedicados e limpeza rigorosa.
- Validações podem revelar novos campos faltantes ou dados corrompidos que exigirão scripts de saneamento adicionais.

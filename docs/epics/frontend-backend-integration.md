# Épico: Integração Frontend ↔ Backend AegisWallet

## Informações do Documento

- **Título do Épico**: Integração Completa Frontend ↔ Backend AegisWallet
- **Versão**: 0.1.0 (rascunho inicial)
- **Criado em**: 2025-10-04
- **Autor**: GitHub Copilot (PM assistente)
- **Status**: Rascunho para alinhamento
- **Ciclo de Revisão**: Quinzenal até go-live
- **Próxima Revisão Sugerida**: 2025-10-18

## Histórico de Mudanças

| Versão | Data | Alterações | Autor |
|--------|------|------------|-------|
| 0.1.0 | 2025-10-04 | Criação inicial do épico com base em design-specs e arquitetura | GitHub Copilot |

---

## 1. Executive Summary

### 1.1 Visão Geral

Este épico orquestra a entrega do frontend definitivo do AegisWallet totalmente integrado ao backend (Supabase + tRPC + Hono). Consolidamos as diretrizes de `docs/design-specs` e `docs/architecture/frontend-architecture.md` para garantir que voz, automações financeiras e transparência da IA funcionem ponta-a-ponta com dados reais e políticas de segurança brasileiras.

### 1.2 Problema & Oportunidade

- **Problema**: O frontend atual possui componentes e protótipos isolados que não estão conectados ao backend, impedindo validação de comandos de voz, fluxos PIX/boletos e visualização de autonomia.
- **Oportunidade**: Entregar uma experiência unificada voz-first com dados reais, elevando a confiança (LGPD), habilitando automação de 95% das tarefas financeiras e criando base para monetização.

### 1.3 Objetivos Estratégicos

1. Alinhar a implementação de UI/UX aos padrões do design system e voice patterns.
2. Garantir integrações confiáveis com Supabase/tRPC para operações financeiras (PIX, boletos, projeções).
3. Prover observabilidade (logs, auditoria, métricas) que conectam frontend e backend.
4. Cumprir requisitos de performance (LCP ≤ 2.5s, INP ≤ 200ms) e acessibilidade (WCAG 2.1 AA+).

### 1.4 KPIs & Resultados Esperados

| KPI | Meta |
|-----|------|
| Taxa de sucesso de comandos de voz (ponta-a-ponta) | ≥ 95% |
| Tempo de resposta de voz (frontend + backend) | ≤ 500 ms acknowledgement |
| LCP autenticado (4G, Moto G) | ≤ 2.5 s |
| Autonomia IA monitorada | 100% das ações registradas no timeline de auditoria |
| Erros críticos de integração | 0 durante UAT |
---

## 2. Contexto & Sistema Atual

### 2.1 Panorama Técnico Existente

- **Frontend**: React 19 + Vite + Tailwind + TanStack Router; componentes shadcn/ui disponíveis; hooks `useVoiceRecognition`, `use-transactions` iniciados.
- **Backend**: Supabase (Postgres + Auth + Functions), tRPC v11 exposto via Hono, procedimentos para auth/transactions/users.
- **Integrações Atuais**: Autenticação Supabase funcionando, fetching básico de transações, voice dashboard parcial sem persistência, ausência de integração real para PIX/boletos e autonomia IA.

### 2.2 Referências Obrigatórias

- `docs/design-specs/design-system.md`
- `docs/design-specs/voice-interface-patterns.md`
- `docs/design-specs/brazilian-financial-integration.md`
- `docs/design-specs/screen-designs-and-flows.md`
- `docs/design-specs/shadcn-ui-implementation-guide.md`
- `docs/architecture/frontend-architecture.md`

### 2.3 Stakeholders & Times

| Time | Responsabilidade |
|------|------------------|
| Frontend Guild | Implementação UI/UX, Voice UI, acessibilidade |
| Backend Guild | tRPC procedures, Supabase functions, segurança, auditoria |
| AI/ML Squad | Lógica de autonomia, recomendações e personalização |
| QA & Compliance | Validação WCAG, LGPD, automações financeiras |
| Produto & UX | Garantir aderência às personas e fluxos definidos |

---

## 3. Escopo

### 3.1 Incluído

1. Implementar todas as superfícies descritas em `frontend-spec.md` (home voz, dashboard, transactions, settings, estados de erro/offline).
2. Conectar cada interação crítica a procedimentos tRPC/Supabase (consultas, mutações, subscriptions, logs de auditoria).
3. Integrar IA Autonomy Meter com dados provenientes do backend (níveis, justificativas, histórico).
4. Habilitar fluxos PIX, boletos e TED/DOC com validações backoffice e confirmações seguras.
5. Orquestrar eventos de voz (wake word → ação) com pipeline completo `useVoiceRecognition` ↔ `voiceCommandProcessor` ↔ backend.
6. Implementar observabilidade (telemetria frontend + Supabase Edge Functions) para rastrear Core Web Vitals e operações financeiras.

### 3.2 Fora de Escopo

- Novas integrações bancárias externas além das mockadas / APIs já previstas.
- Evolução de schema Supabase não alinhada neste épico (depende de epics de dados).
- Aplicativos móveis (cobertos no roadmap Native).

---
## 4. Fluxos Prioritários e User Journeys

1. **Consulta de Saldo por Voz**
   - Usuário ativa assistente → comando "Como está meu saldo?" → pipeline voz reconhece intenção → tRPC retorna saldo + orçamento → UI responde (voz + visual) com dados e registra evento em auditoria.
2. **Pagamento de Boleto Guiado por IA**
   - Boleto listado em `UpcomingPayments` → sugestão de pagamento inteligente → confirmação voz/biometria → mutação Supabase registra pagamento, IA atualiza projeções, UI reflete status.
3. **Transferência PIX Autenticada**
   - Comando voz "Faz um PIX" → verificação de destinatário e validações → `SecurityPrompt` aciona backend para OTP/biometria → transação executada e logada.
4. **Ajuste de Autonomia**
   - Usuário ajusta slider 0-100% em Settings → preferências persistidas via tRPC → timeline exibe decisões tomadas automaticamente respeitando novo nível.
5. **Modo Offline / Recuperação**
   - Falha de rede detectada → Query cache mantém dados 24h → UI mostra aviso e oferece retomada manual; ao reconectar, operações pendentes sincronizam com backend.

---

## 5. Entregáveis & Blocos de Trabalho

### 5.1 Trilha A – Infraestrutura de Integração
- **A1. tRPC & Supabase Hardening**: Garantir endpoints para saldo, projeções, PIX, boletos, autonomia com contratos Zod alinhados ao frontend.
- **A2. Autenticação & Sessão**: Renovação de tokens, segurança de voz/biometria, permissões por perfil.
- **A3. Observabilidade**: Edge Functions para logging de voz, eventos financeiros, métricas Core Web Vitals.

### 5.2 Trilha B – Experiência Voz-First Conectada
- **B1. Voice Pipeline**: Sincronizar `useVoiceRecognition` com backend para confirmação, erros, fallback.
- **B2. Voice Feedback**: Implementar respostas padronizadas (`voice-interface-patterns.md`) com dados reais.
- **B3. Safety Net**: Tratamento de erros, rate limiting, prompts para reconfirmação.

### 5.3 Trilha C – Finance Experience
- **C1. PIX Flow**: Formulários, validações backend, motor IA sugestão.
- **C2. Boleto Flow**: Upload/leitura de código de barras, alternativas de pagamento, projeções.
- **C3. Projeções e Insights**: Dashboard conectado a cálculos Supabase/AI.

### 5.4 Trilha D – Transparência & Acessibilidade
- **D1. Autonomy Meter**: Sincronização de níveis, justificativas e histórico.
- **D2. Acessibilidade**: Garantir WCAG, suporte screen reader, gestos com alternativa por clique.
- **D3. Performance**: Budgets de bundles, lazy loading, monitoramento.

---
## 6. Backlog Inicial de Stories (Resumo)

### Story A1: Contratos tRPC Financeiros
- **Objetivo**: Implementar endpoints `trpc.financial.getSummary`, `trpc.financial.listBills`, `trpc.financial.executePix` com schemas Zod conforme design specs.
- **Acceptance Criteria**:
  - [ ] Retorna saldo, orçamento disponível e projeção mensal em milissegundos aceitáveis (≤ 200ms backend).
  - [ ] Mutação PIX aplica validação de chave (CPF/CNPJ/E-mail/telefone) e registra auditoria.
  - [ ] Todos os endpoints autenticados e respeitando RLS Supabase.

### Story B1: Pipeline Voz Conectado
- **Objetivo**: Completar o fluxo `wake → reconhecimento → intenção → resposta` utilizando `voiceCommandProcessor` e respostas do backend.
- **Acceptance Criteria**:
  - [ ] 6 comandos essenciais mapeados para endpoints, com fallback textual.
  - [ ] Erros de reconhecimento resultam em prompt "Não ouvi direito" e log no backend.
  - [ ] Telemetria registra tempo total de comando e identifica gargalos.

### Story C2: Pagamentos Brasileiros Integrados
- **Objetivo**: Entregar experiência PIX/Boleto com dados reais.
- **Acceptance Criteria**:
  - [ ] Tela `PixTransferForm` consome mutação `executePix` e exibe comprovante.
  - [ ] `BoletoList` mostra status puxado do backend, com IA sugerindo melhor horário.
  - [ ] Projeções financeiras recalculadas após cada pagamento.

### Story D1: Autonomia + Transparência
- **Objetivo**: Sincronizar Autonomy Meter e Action Timeline com backend.
- **Acceptance Criteria**:
  - [ ] Slider salva nível no backend e aplica limites (ex.: transferências > R$1.000 pedem confirmação).
  - [ ] Timeline lista cada ação autônoma com justificativa e botão "contestar" conectado ao backend.
  - [ ] Eventos exportáveis (CSV) respeitando LGPD.

### Story D2: Acessibilidade & Performance Holística
- **Objetivo**: Validar que cada fluxo atende WCAG e budgets.
- **Acceptance Criteria**:
  - [ ] axe-core sem violações críticas; navegação teclado completa.
  - [ ] LCP ≤ 2.5s e INP ≤ 200ms em build de produção.
  - [ ] Observabilidade reporta métricas via Supabase Edge.

---
## 7. Dependências & Pré-Requisitos

| Dependência | Detalhes | Status |
|-------------|----------|--------|
| Schema Supabase atualizado | Tabelas transactions, bills, autonomy com colunas exigidas | Em andamento pelo Backend Guild |
| Voice recognition provider | Seleção final do motor de STT com suporte pt-BR | Pendente decisão AI Squad |
| Segurança PIX/Boletos | Estratégia final de biometria/OTP | Pendente alinhamento com Security |
| Telemetria Edge | Infra para ingestão de logs de voz e web vitals | Planejado |

### Mapa de Dependências Entre Épicos

| Épico | Depende de | Desbloqueia | Observações |
| --- | --- | --- | --- |
| Integração Frontend ↔ Backend (este) | `voice-interface-foundation.md` para intents e UX de voz | `banking-integration-core.md` para fluxos PIX com dados reais | Validar intents com mocks antes de tocar produção. |
| `frontend-implementation.md` | Migração de layouts definidos no design system (`design-system.md`) | Testes de acessibilidade e performance (D2) | Sincronizar componentes shadcn/ui compartilhados. |
| `smart-payment-automation.md` | Procedimentos tRPC e auditoria deste épico | Automação de boletos e PIX sem intervenção humana | Liberar somente após métricas de erro <2%. |

- Reavalie o mapa em cada planejamento quinzenal; tratar bloqueios como riscos categoria A.
- Documente decisões de priorização diretamente nas histórias para manter rastreabilidade.

## 8. Roadmap & Marco de Entrega

| Fase | Período (estimado) | Objetivos |
|------|--------------------|-----------|
| F1 – Fundamentos (2 semanas) | S1–S2 | Fechar contratos tRPC, garantir autenticação e sessão, preparar observabilidade básica |
| F2 – Voz & Dashboard (2 semanas) | S3–S4 | Conectar pipeline voz, implementar home/dashboard integrados, validar dados reais |
| F3 – Finance Flows (3 semanas) | S5–S7 | PIX, boletos, projeções, segurança | 
| F4 – Transparência & Hardening (2 semanas) | S8–S9 | Autonomia + timeline, acessibilidade/performance, testes Playwright |
| Go/No-Go | S10 | Testes integrados, auditoria LGPD, sinal verde de stakeholders |

## 9. Métricas de Sucesso e Aceitação

- **Funcionalidade**: 100% dos fluxos críticos (voz saldo, PIX, boleto, autonomia) aprovados em UAT.
- **Qualidade**: Cobertura de testes crítica ≥ 95%, sem regressões em monitoramento.
- **Performance**: Orçamentos cumpridos em ambiente staging e monitoramento contínuo em produção.
- **Segurança/Compliance**: Auditoria LGPD concluída sem bloqueios.
- **Satisfação Usuário**: Pesquisa piloto (≥ 4.5/5) para clareza das respostas e confiança na IA.

## 10. Riscos & Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Latência Supabase nas operações PIX | Alto | Introduzir pré-validação local + filas, monitorar P95 continuamente |
| Falhas de reconhecimento de voz | Médio | Fallback manual instantâneo + melhoria de prompts, armazenar contexto |
| Inconsistência entre UI e dados | Alto | Contratos Zod compartilhados, testes de contrato e Storybook a11y |
| Compliance com LGPD | Alto | Consultar jurídico, manter logs auditáveis e consentimento granular |
| Dependência de AI Squad | Médio | Definir mocks estáveis e contratos mínimos desde F1 |

---
## 11. Histórico de Integração & Contexto

- **2024 Q4:** MVP de voz criado no épico `voice-interface-foundation.md`, fornecendo intents baseados em mocks de saldo.
- **2025 Q1:** Backend reforçou contratos tRPC no épico `banking-integration-core.md`, habilitando sincronização real com Supabase.
- **2025 Q3:** QA checklist revisada em `docs/qa/assessments/` apontou lacunas de rollback, motivando este plano consolidado.

Registre futuras mudanças relevantes aqui para evitar perda de contexto quando equipes trocarem.

## 12. Governança & Próximos Passos

1. Validar este épico com líderes de Frontend, Backend e AI na próxima cerimônia de planejamento.
2. Quebrar o backlog em stories detalhadas conforme prioridades e dependências.
3. Sincronizar com o épico `frontend-implementation.md` para evitar sobreposição e garantir sequenciamento.
4. Configurar painel de acompanhamento (Notion/Jira) refletindo fases e KPIs.
5. Preparar checklist de Go/No-Go (acessibilidade, performance, segurança) antes de release.

---

**Documentos Relacionados**: `docs/design-specs/frontend-spec.md`, `docs/epics/frontend-implementation.md`, `docs/epics/voice-interface-foundation.md`, `docs/epics/banking-integration-core.md`

**Contato Primário**: Frontend Guild Lead · **Co-responsáveis**: Backend Guild Lead, AI Squad Lead, QA Lead

**Última atualização**: 04/10/2025

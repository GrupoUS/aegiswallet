---
title: "AegisWallet Frontend Specification"
last_updated: 2025-10-04
form: front-end-spec
owner: Frontend Guild
status: draft
related:
  - ../architecture/frontend-architecture.md
  - ./design-system.md
  - ./voice-interface-patterns.md
  - ./screen-designs-and-flows.md
---

# 1. Purpose & Scope

AegisWallet delivers a voice-first autonomous financial assistant tailored to Brazilian users. This specification translates the product vision into actionable frontend requirements covering user experience, component architecture, interaction flows, accessibility, localization, performance, and validation. The scope includes all web surfaces delivered through React 19, TanStack Router v5, and Tailwind CSS running on Bun.

## 1.1 Success Criteria

- Voice command success rate ≥ 95% with < 500 ms acknowledgement.
- Lighthouse performance, accessibility, best-practice scores ≥ 90 on mid-tier Android hardware (Moto G-series).
- Median authenticated page TTI ≤ 1.8 s on 4G; INP ≤ 200 ms; CLS ≤ 0.1.
- 0 critical accessibility violations (axe-core) and full keyboard navigation coverage.
- 95%+ localization coverage for Brazilian Portuguese strings and currency formatting.
## 1.2 Out of Scope

- Supabase schema evolution and server-side orchestration (covered by backend specs).
- Native mobile clients (coordination via separate React Native roadmap).
- AI model training and financial automation algorithms beyond UI integration.

# 2. Target Users & Scenarios

## 2.1 Primary Personas

| Persona | Goals | Pain Points | Frontend Implications |
| --- | --- | --- | --- |
| Renata, 34, Analista Financeira | Delegar pagamentos recorrentes, acompanhar saldo rapidamente | Interfaces bancárias lentas, baixa confiança em automações | Priorizar voz + visual de transparência, dashboards resumidos, indicador de autonomia |
| Diego, 29, Empreendedor MEI | Controlar fluxo de caixa e PIX instantâneo | Falta de centralização de contas, excesso de apps | Fluxos otimizados para PIX, projeções instantâneas, recomendações em linguagem clara |
| Lúcia, 41, Coordenadora Familiar | Planejar orçamento doméstico, monitorar despesas | Esforço manual em boletos, pouca visibilidade futura | Alertas antecipados de boletos, projeções mensais acessíveis, acessibilidade reforçada |

## 2.2 Core Journeys

1. **Consulta de saldo por voz** → Feedback sonoro + cartão de saldo com indicador de saúde financeira.
2. **Automação de boletos** → Visualização de contas, confirmação por voz, timeline de pagamentos.
3. **Transferência via PIX** → Comando natural, checagem de segurança (voz + biometria), recibo visual.
4. **Projeção de fim de mês** → Voz retorna resumo; tela apresenta gráfico de tendência e recomendações.
5. **Configuração de autonomia** → Controle visual do nível (0-100%), histórico de ações e explicações contextuais.
# 3. Experience Principles

- **Voice-first, visual-support**: Voz inicia e confirma ações; UI fornece feedback imediato, históricos e emergência manual.
- **Transparência progressiva**: Mostrar claramente o que o assistente está fazendo, por que e qual o nível de autonomia aplicado.
- **Confiança brasileira**: Combinar linguagem natural, cores de referência bancária e indicadores de segurança (PIX verde, boletos azul).
- **Acessibilidade inegociável**: Todas as funcionalidades utilizáveis por teclado, screen reader e preferências de movimento/contraste.
- **KISS & YAGNI**: Implementações enxutas, sem sobrecarga visual ou lógica não validada por requisito.

# 4. Frontend Architecture Alignment

| Layer | Technology | Key Decisions |
| --- | --- | --- |
| Rendering | React 19 + Vite | CSR com hydration rápido, suspense para dados críticos |
| Routing | TanStack Router v5 | Roteamento baseado em arquivo (`src/routes`), layouts aninhados, loaders resilientes |
| Data | TanStack Query 5 + tRPC v11 | Stato server com cache otimizado, invalidações segmentadas por domínio financeira |
| Client State | Zustand (voz) + React Hook Form | Estado mínimo global; formulários com validação Zod |
| Styling | Tailwind CSS + shadcn/ui | Tokens do design system (`design-system.md`), componentes acessíveis reutilizáveis |
| Voice | Web Speech API + custom hooks | Pipeline descrito em `voice-interface-patterns.md`, fallback manual |

## 4.1 Module Map

```
src/
  components/
    voice/          # indicadores, dashboards, prompts
    financial/      # boletos, PIX, projeções
    accessibility/  # announcers, focus management
    ui/             # base shadcn/ui extendidos
  routes/
    index.tsx, dashboard.tsx, transactions.tsx, settings.tsx
  contexts/AuthContext.tsx
  hooks/useVoiceRecognition.ts
  lib/voiceCommandProcessor.ts
```
# 5. Key Surfaces & Content Requirements

## 5.1 Voice Home (`/`)
- Wake indicator (estado: `idle`, `listening`, `processing`, `responding`).
- Transcrição ao vivo com confidência.
- Cartão "O que posso fazer" com 6 comandos essenciais e variações.
- Feed transparente: últimas ações/autonomias executadas.

## 5.2 Dashboard (`/dashboard`)
- **BalanceCard**: saldo atual, disponível, projetado, `trustIndicator`.
- **AutonomyMeter**: progresso 0-100%, tooltip contextual.
- **UpcomingPayments**: lista de boletos (status, data, valor, CTA de confirmação).
- **InsightsCarousel**: recomendações em voz + texto com tonalidade semiformaal.
- Modo reduzido para telas < 375px com stack vertical e gestos.

## 5.3 Transactions (`/transactions`)
- Tabela responsiva com filtros por tipo (PIX, boleto, TED/DOC).
- Linha expandível exibindo justificativa da IA e confiança.
- Ações rápidas: repetir PIX, contestar, marcar como favorito.

## 5.4 Settings (`/settings`)
- Controle granular de autonomia (slider 0-100 com checkpoints: 25/50/75/95).
- Preferências de linguagem, velocidade de fala, notificações.
- Log de auditoria com busca e exportação (LGPD-ready).

## 5.5 Error / Offline States
- Mensagem em português natural, orientando ações (ex.: "Não consegui ouvir, pode repetir?").
- Offline: modo somente leitura com dados mais recentes cacheados.
- Estado de indisponibilidade PIX com fallback para agendamento manual.
# 6. Component Specifications

## 6.1 Foundation (shadcn/ui extensions)
- `Button`, `Card`, `Dialog`, `Sheet`, `Tooltip`: importar de `@/components/ui`, respeitando tokens de cor.
- Estados de foco obrigatórios (`focus-visible`), latência < 16 ms por interação.
- Suporte a `aria-live` quando usado para feedback de voz.

## 6.2 Voice Components
- `VoiceActivationIndicator`: props `state`, `confidence`, `onTapFallback`.
- `VoiceDashboard`: integra `useVoiceRecognition`, exibe transcrição, CTA "Falar novamente".
- `VoiceAnnouncement`: wrapper com `role="status"` e `aria-live="assertive"` para confirmações críticas.

## 6.3 Financial Components
- `PixTransferForm`: React Hook Form + Zod, máscaras BRL, validação de chave.
- `BoletoList`: agrupar por vencimento, badges de status (`success`, `warning`, `danger`).
- `ProjectionChart`: usar `@tanstack/react-charts` (ou fallback minimalista), destacar tendência com pesos de cor.

## 6.4 Autonomy & Transparency
- `AutonomyMeter`: barra semicircular com cores graduais (azul → verde), tooltips explicativos.
- `ActionTimeline`: lista cronológica com ícones (ação IA, aprovação, falha) e opção de "ver justificativa".
- `SecurityPrompt`: modal para confirmações sensíveis (voz + biometria/OTP).

## 6.5 Accessibility Utilities
- `AccessibilityProvider`: injeta preferências de contraste e movimento.
- `ScreenReaderAnnouncer`: utilizar para eventos críticos (ex.: transferência concluída).
- `KeyboardNavigation`: adicionar atalhos (Ctrl+K para comandos, Alt+1/2/3 para seções principais).
# 7. Interaction & Flow Requirements

## 7.1 Voice Command Pipeline
1. Wake word "Ok Assistente" ou botão microfone → `VoiceActivationIndicator` muda para `listening`.
2. `useVoiceRecognition` atualiza transcrição em tempo real (max 500 ms de atraso visual).
3. `voiceCommandProcessor` classifica intenção entre 6 comandos essenciais.
4. TanStack Query busca/atualiza dados necessários (staleTime padrão 30s).
5. UI apresenta confirmação visual + `VoiceAnnouncement` verbaliza resposta.
6. Feedback contextual: recomendações, próximos passos, pedir confirmação quando necessário.

## 7.2 Fallbacks & Erros
- Falha de reconhecimento: banner persistente "Não ouvi direito" com CTA "Tentar novamente".
- Transferências > R$ 1.000 exigem modal `SecurityPrompt` (voz + toque, 2FA Supabase quando disponível).
- Tempo excedido (> 2s) ativa skeleton + mensagem "Consultando suas informações...".

## 7.3 Autonomia Progressiva
- Níveis 0-25/26-50/51-75/76-95/96-100 conforme `voice-interface-patterns.md`.
- Cada nível altera texto de sugestão e permissões exibidas na UI.
- Histórico "Por que fiz isso?" acessível em `ActionTimeline`, com detalhamento per ação.

## 7.4 Mobile-First Gestures
- Swipe right em cards de boleto → ação "Agendar".
- Long press no `VoiceActivationIndicator` → alternar entre modos voz/touch.
- Pull-to-refresh em Dashboard para reenfileirar atualizações.
# 8. Accessibility & Localization

## 8.1 WCAG 2.1 AA+ Checklist
- Contraste mínimo 4.5:1, com opção de alto contraste via `AccessibilityProvider`.
- Todos os componentes interativos com `role`, `aria-*` adequados e foco visível.
- `aria-live` para notificações de voz; `aria-describedby` para mensagens de contexto financeiro.
- Suporte a `prefers-reduced-motion`: desabilitar animações `voice-listening` quando ativo.
- Touch targets ≥ 44px; gestos sempre acompanhados de alternativa por botão.

## 8.2 Localization
- Idioma padrão pt-BR; usar `lib/localization/ptBR.ts` como fonte de strings.
- Formatação monetária via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Datas no formato `DD/MM/YYYY` e uso de timezone `America/Sao_Paulo`.
- Conteúdo textual revisado para tom semiformaal, termos financeiros locais ("boleto", "saldo disponível").
- Mensagens de voz e texto devem manter consistência (ex.: "Vou transferir" vs "Transferência realizada").
# 9. Non-Functional Requirements

## 9.1 Performance Budgets
- Carregamento inicial (home autenticada) ≤ 170 KB gzipped JS crítico.
- LCP ≤ 2.5 s em 4G; fonts pré-carregadas.
- Resposta de voz renderizada ≤ 500 ms após intenção detectada.
- Interações críticas (botões, toggles) com resposta < 100 ms.
- Use `vite` code splitting para rotas protegidas; componentes pesados (charts) em lazy load.

## 9.2 Resiliência & Segurança
- Manter estado offline do dashboard (cache Query) por pelo menos 24 h.
- Nunca exibir chaves PIX completas sem mascarar; CPF/contas devem estar truncados.
- Logs de auditoria legíveis e exportáveis (CSV) respeitando LGPD.
- Políticas de sessão Supabase: renovar token silenciosamente e alertar usuário se expirar.

## 9.3 Observabilidade
- Instrumentar eventos chave (voz iniciada, comando reconhecido, ação IA executada) em `ActionTimeline` e analytics.
- Monitorar métricas de Core Web Vitals via `web-vitals` + Supabase Edge logging.
# 10. Testing & Validation

| Area | Tooling | Requirements |
| --- | --- | --- |
| Unit/Integration | Vitest + Testing Library | Cobertura ≥ 95% em voz, finanças, auth, acessibilidade. Mockar `useVoiceRecognition`. |
| Accessibility | `jest-axe`, Storybook a11y, manual com NVDA/VoiceOver | Zero violações críticas; foco sequencial validado por QA. |
| E2E | Playwright | Fluxos completos: consulta saldo, agendar boleto, transferir via PIX, ajustar autonomia. |
| Performance | Lighthouse CI, WebPageTest | Monitorar LCP, INP, CLS em devices reais. |
| Localization | Automated snapshot + revisão humana | Nenhum texto em inglês nas rotas públicas; valores em BRL. |

## 10.1 Definition of Done (Frontend)
- Todos os critérios acima satisfatórios.
- Documentação atualizada (`README-TESTING.md`, Storybook/MDX quando aplicável).
- Screenshots de estados críticos armazenados em QA docs.
- Sign-off do time de voz e de acessibilidade.

# 11. Implementation Roadmap (Frontend View)

| Sprint | Objetivos | Entregáveis |
| --- | --- | --- |
| S1 | Voice foundation + Home | `VoiceActivationIndicator`, pipeline inicial, UI home com feed de ações. |
| S2 | Financial dashboard & PIX flow | `BalanceCard`, `UpcomingPayments`, `PixTransferForm`, testes Vitest. |
| S3 | Autonomy & transparency | `AutonomyMeter`, `ActionTimeline`, logs auditáveis, ajustes de acessibilidade. |
| S4 | Hardening & performance | Otimizações (code splitting), Playwright E2E, Lighthouse ≥ 90, documentação final. |

# 12. Open Questions & Risks

- Definição final do provedor de biometria no fluxo PIX (depende de integração Supabase/3rd-party).
- Disponibilidade de dados históricos para projeções (necessário alinhamento com backend AI).
- Estratégia de fallback para usuários sem microfone ou com restrições de áudio.

---

**Última revisão:** 04/10/2025 · **Responsáveis:** Guilda Frontend & UX · **Próxima revisão:** +30 dias ou mediante alteração de requisitos.

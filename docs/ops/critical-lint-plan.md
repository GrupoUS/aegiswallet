# Critical Production Lint Remediation

## Objetivo
Garantir que apenas módulos críticos de produção atinjam conformidade com o lint (PortugueseVoiceAccessibility, serviços centrais, scripts operacionais), deixando componentes de exemplo/demonstração para um ciclo posterior.

## Escopo Prioritário
1. **Acessibilidade/voz** – `src/components/accessibility/PortugueseVoiceAccessibility.tsx`
2. **Serviços de aplicação** – `src/application/services/*.ts`
3. **Scripts operacionais** – `scripts/performance-benchmark.ts`
4. **Outros módulos core** – routers, hooks e providers usados em produção

## Plano de Execução

### A. Refatoração PortugueseVoiceAccessibility
- Extrair lógica de reconhecimento/fala para o hook `usePortugueseVoiceAccessibility`.
- Criar subcomponentes apresentacionais para status e histórico.
- Garantir funções abaixo de `max-lines-per-function` e uso consistente de acessibilidade (ARIA + announcer).

### B. Revisão do Service Layer
- Confirmar que `UserService` e `userValidation` continuam abaixo dos limites de lint (`max-lines`, `no-magic-numbers`).
- Centralizar constantes e utilitários extras se novos avisos surgirem.

### C. Scripts Operacionais
- Manter `scripts/performance-benchmark.ts` alinhado às regras (`sort-keys`, retornos explícitos, export padrão).
- Documentar comportamento (códigos de saída, logs) diretamente no script.

### D. Verificação Contínua
- Executar `bun lint` após cada módulo crítico.
- Registrar avisos remanescentes e classificá-los como “deferred”.

## Itens Postergados
- `src/components/examples/**`
- Componentes de playground/storybook
- Demos não conectadas a rotas de produção

## Passos de Validação
1. `bun lint` – esperado: falhas apenas em arquivos fora do escopo ou já documentados como “deferred”.
2. Revisão manual dos módulos críticos para garantir:
   - Comentários JSDoc presentes quando aplicável.
   - Tratamento de erros consistente (TRPCError/logs).
   - Conformidade com regras de acessibilidade.

## Responsáveis
- **Owner técnico:** Equipe Plataforma AegisWallet
- **Revisão:** Squad Accessibility & Automation

## Próximos Passos
- Registrar novos avisos críticos encontrados durante a execução.
- Planejar ciclo dedicado às demos após estabilizar os módulos core.


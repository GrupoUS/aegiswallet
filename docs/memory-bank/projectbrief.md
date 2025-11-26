# Project Brief

- **Product**: Assistente Financeiro Autônomo (AegisWallet) – agente financeiro “zero intervenção” para o mercado brasileiro.
- **Core Promise**: Recuperar ~40h/ano do usuário e otimizar 20-30% dos gastos via IA proativa + integrações bancárias (Open Banking, PIX, boletos) + interface conversacional (voz/mensagem) com 6 comandos críticos.
- **Primary Pain**: Brasileiros gastam 47 min/semana com finanças, apps atuais exigem categorização manual e entregam <15% de autonomia.
- **Target Users**: Profissional CLT/autônomo digital-savvy (28-45 anos, renda R$5k-20k) e MEIs que precisam separar finanças e reduzir estresse financeiro.
- **Business Goals**: 100k usuários em 12 meses, autonomia média ≥85%, economia real ≥20%, NPS ≥70, retenção 90%, ARR ≈ R$24M (R$19,90/mês).
- **Execution Snapshot (2025-11)**: Calendário financeiro semanal, PIX completo, voice interface base e realtime Supabase já entregues; Open Banking completo e motor de autonomia avançado ainda em progresso conforme `docs/architecture.md`.
- **MVP Scope**: Integração Open Banking (5 bancos), categorização automática 90%+, automação de pagamentos via Pix, voz como interface primária, dashboard mobile-first.
- **Constraints**: LGPD, BACEN/Open Banking compliance, orçamento inicial R$500k, timeline MVP 6 meses.
- **Key Risks**: RLS/security falhas, regulamentação de autonomia, dependência Belvo/OpenPix, adoção (confiança na IA).
- **Voice-First USP**: 6 comandos essenciais (“Como está meu saldo?”, “Quanto posso gastar?”, “Tem boleto/recebimento?”, “Como fica saldo final?”, “Faz transferência Pix?”) devem funcionar com 95% de acurácia e resposta <1s.
- **Trust Model**: Arquitetura “GPS + Smart Home” – usuário consulta assistente para contexto e delega automações com níveis de autonomia entre 50% e 95%, exigindo confirmações até confiança ≥75%.
- **Automation Targets**: 95% de pagamentos recorrentes executados automaticamente (Pix/boletos), categorização de transações ≥90%, alertas proativos sobre fluxo de caixa e oportunidades de economia.
- **Compliance & Security**: Obrigatório LGPD, criptografia end-to-end, RLS Supabase, auditoria e logs de voz; BACEN determina limites para transferências Pix autônomas.
- **Scaling Vision**: Após MVP, expandir para robo-advisor, otimização tributária, contas familiares e oferta para PMEs/white-label em bancos parceiros.

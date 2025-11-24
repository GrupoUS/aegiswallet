# Product Context

## Problema & Motivação
- Usuários precisam conciliar múltiplos apps/planilhas, esquecem boletos e não conseguem projetar caixa; 67% abandonam apps em 3 meses.
- Mercado atual oferece autonomia <30% e não cobre experiências conversacionais.

## Solução
- Motor proativo que sincroniza contas 24/7 via Open Banking, aprende padrões, toma decisões (pagamentos Pix, alertas, projeções) e conversa via 6 comandos de voz.
- Arquitetura híbrida “GPS + Smart Home”: usuário consulta o “GPS” por voz e delega automações ao “Smart Home” financeiro.
- Camadas principais documentadas no PRD: (1) Open Banking + Belvo/OpenPix para ingestão, (2) IA de categorização 90%+, (3) Voz/Voz+texto como interface primária, (4) Dashboards mobile-first apenas para confirmação/controle.

## Experiência Desejada
1. **Onboarding rápido** (≈15 minutos) conectando bancos e definindo nível de autonomia (50→95%).
2. **Voz-first**: comandos “Como está meu saldo?”, “Quanto posso gastar este mês?”, “Tem boleto/recebimento?”, “Como fica o saldo no fim do mês?”, “Faz transferência Pix?”.
3. **Autonomia progressiva**: confirmações obrigatórias até confiança ≥75%, depois fluxo sem fricção.
4. **Contexto brasileiro**: Pix, boletos, IRPF, voz PT-BR, LGPD.
5. **Fail-safes visuais**: interface mobile exibe métricas chave (saldo, contas, projeções) quando o usuário não puder usar voz.

## KPIs de Produto
- Autonomy rate ≥85%, voice success ≥95%, redução de tempo <5 min/mês, economia real ≥20%, pagamentos em dia ≥99%.
- Pagamentos Pix automatizados ≥98% sucesso, sincronização bancária 99.5% uptime, categorização automática ≥90%, satisfação da UI mobile >70%.

## Futuro
- Pós-MVP: robo-advisor, otimização tributária, contas familiares, crédito inteligente, expansão LatAm.

## Roadmap em Andamento
- **Epic 1 – Voice Interface Foundation**: reconhecimento PT-BR com 95%+ acurácia, síntese natural e confirmação de segurança por voz para comandos críticos.
- **Epic 2 – Banking Integration Core**: integrar 5 grandes bancos via Open Banking/Belvo, sincronizar transações em <5s e suportar PIX (envio/recebimento, QR Code, limites).
- **Epic 3 – Smart Payment Automation**: motor de pagamentos que identifica boletos (OCR/IA), agenda Pix automaticamente, monitora recorrências e mantém histórico/auditoria.
- **Epic 4 – Mobile Interface & Dashboard**: PWA responsiva com TanStack Router, dashboards em tempo real e feedback visual complementar ao fluxo por voz.
- Roadmap épicos (nov/2025): Voice Interface Foundation, Banking Integration Core, Smart Payment Automation e Mobile Interface Dashboard – todos alimentam os objetivos de autonomia e confiança.

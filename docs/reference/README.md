# 📖 Documentação de Referência AegisWallet

Documentação técnica completa e detalhada para desenvolvedores, arquitetos e equipes técnicas.

## 🏗️ Arquitetura e Design

### Arquitetura do Sistema
- **[Visão Geral da Arquitetura](architecture/architecture-overview.md)** - Design system completo
- **[Padrões Hono RPC](architecture/hono-rpc-patterns.md)** - API patterns e convenções
- **[Arquitetura Frontend](architecture/frontend-architecture.md)** - React 19 e TanStack Router
- **[Stack Tecnológico](architecture/tech-stack.md)** - Tecnologias e versões
- **[Estrutura de Fontes](architecture/source-tree.md)** - Organização de código

### Design System
- **[Especificações Frontend](frontend-spec.md)** - Componentes UI
- **[Padrões de Interface de Voz](voice-interface-patterns.md)** - Voice interaction patterns

## 🚀 API e Integrações

### API Reference
- **[Endpoints da API](api/api-endpoints.md)** - Todos os endpoints disponíveis
- **[Schema de Dados](api/database-schema.md)** - Modelos de dados PostgreSQL
- **[Autenticação](api/authentication.md)** - JWT e sessões
- **[WebSocket Events](api/websocket-events.md)** - Real-time subscriptions

### Integrações Externas
- **[Open Banking Brasil](api/open-banking.md)** - Integração com APIs bancárias
- **[PIX API](api/pix-api.md)** - Pagamentos instantâneos
- **[Supabase Client](api/supabase-client.md)** - Database client patterns

## ⚙️ Configuração e Setup

### Ambiente
- **[Variáveis de Ambiente](configuration/environment-variables.md)** - Todas as configurações
- **[Database Configuration](configuration/database-config.md)** - PostgreSQL settings
- **[Server Configuration](configuration/server-config.md)** - Hono server setup

### Deploy
- **[Vercel Configuration](configuration/vercel-config.md)** - Platform settings
- **[CI/CD Pipeline](configuration/cicd-pipeline.md)** - GitHub Actions e automação

## 🔧 Componentes Internos

### Frontend Components
- **[Calendar Components](components/calendar-components.md)** - Event calendar UI
- **[PIX Components](components/pix-components.md)** - Payment interface
- **[Voice Components](components/voice-components.md)** - Speech interface
- **[Financial Components](components/financial-components.md)** - Data visualization

### Backend Services
- **[Voice Processing](services/voice-processing.md)** - Speech recognition
- **[Transaction Engine](services/transaction-engine.md)** - Financial logic
- **[Security Services](services/security-services.md)** - Authentication & authorization

## 📊 Configuração

### Database
- **[Schema Completo](database/complete-schema.md)** - Todas as tabelas
- **[Indexes e Performance](database/indexes-performance.md)** - Otimizações
- **[RLS Policies](database/rls-policies.md)** - Row Level Security
- **[Migrations](database/migrations.md)** - Schema changes

### API Configuration
- **[Rate Limiting](api/rate-limiting.md)** - Controle de requisições
- **[Error Handling](api/error-handling.md)** - Tratamento de erros
- **[Logging](api/logging.md)** - Monitoramento e debug

## 🌐 Especificações Técnicas

### Performance
- **[Performance Targets](performance/targets.md)** - Métricas e benchmarks
- **[Monitoring Setup](performance/monitoring.md)** - Observabilidade
- **[Optimization Guide](performance/optimization.md)** - Melhores práticas

### Segurança
- **[Security Architecture](security/architecture.md)** - Design seguro
- **[Data Protection](security/data-protection.md)** - LGPD compliance
- **[Best Practices](security/best-practices.md)** - Guidelines

## 🔍 Pesquisa e Navegação

### Por Categoria
- **[API](api/)** - Todos os endpoints e schemas
- **[Components](components/)** - UI e backend components
- **[Configuration](configuration/)** - Setup e environment
- **[Database](database/)** - Schema e queries
- **[Security](security/)** - Segurança e compliance

### Por Tecnologia
- **[Hono RPC](architecture/hono-rpc-patterns.md)** - API framework
- **[React 19](architecture/frontend-architecture.md)** - Frontend framework
- **[Supabase](api/supabase-client.md)** - Database platform
- **[TypeScript](configuration/typescript-config.md)** - Type system

## 📋 Convenções

### Code Style
- **[TypeScript Guidelines](coding-standards/typescript.md)** - Type safety
- **[React Patterns](coding-standards/react.md)** - Component patterns
- **[API Standards](coding-standards/api.md)** - Endpoint design

### Version Control
- **[Git Workflow](coding-standards/git-workflow.md)** - Branch strategy
- **[Commit Standards](coding-standards/commits.md)** - Conventional commits

## 🔗 Integração com Outras Seções

- **[Tutoriais](../tutorials/)** - Para aprendizado prático
- **[Guias Práticos](../how-to/)** - Para implementação específica
- **[Explicações](../explanation/)** - Para contexto e decisões

## 📈 Conteúdo em Desenvolvimento

Esta seção está em constante atualização. Documentação adicionada recentemente:

- ✅ Hono RPC patterns v2.0.0
- ✅ Voice interface specifications
- 🔄 PIX API integration details
- 📋 Performance benchmarks
- 📋 Security audit results

---

**Formato**: Information-oriented (foco em informação completa)  
 **Público**: Desenvolvedores, arquitetos, equipes técnicas  
 **Nível**: Intermediário → Avançado

> **Procurando implementar algo específico? Veja nossos [Guias Práticos](../how-to/) para instruções diretas!** 🛠️

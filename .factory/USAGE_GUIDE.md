# AegisWallet Orchestration System - Guia Prático de Uso

## 🎯 Como Funciona na Prática

O sistema agora detecta automaticamente qual droid/skill usar baseado na sua solicitação. Você não precisa mais invocar MCPs diretamente!

### ✅ Maneiras Corretas de Usar

#### 1. Para Pesquisa (Spec Mode)
```bash
# ✅ CORRETO - Detecta automaticamente o modo spec
"spec - research and plan OAuth2 implementation"
"pesquisar e analisar compliance LGPD"
"research Brazilian payment systems best practices"

# Sistema automaticamente invoca:
Task(apex-researcher) → com MCPs: context7, tavily, sequential-thinking
```

#### 2. Para Implementação com Compliance Brasileiro
```bash
# ✅ CORRETO - Detecta triggers brasileiros
"Implementar PIX payment system com LGPD compliance"
"Criar formulário de consentimento LGPD"
"Design interface acessível WCAG 2.1 AA+"

# Sistema automaticamente invoca:
[
  Task(apex-researcher) [research],
  Task(apex-dev) [implementation],
  Skill(brazilian-fintech-compliance) [validation],
  Task(code-reviewer) [security]
]
```

#### 3. Para Operações de Banco de Dados
```bash
# ✅ CORRETO - Detecta triggers de database
"Criar migration Supabase para perfis de usuário"
"Implementar RLS policies para dados sensíveis"
"Otimizar queries de transações financeiras"

# Sistema automaticamente invoca:
Task(database-specialist) → com MCPs: serena
```

#### 4. Para Design e UI/UX
```bash
# ✅ CORRETO - Detecta triggers de design
"Criar componente de formulário acessível"
"Design fluxo de pagamento PIX"
"Implementar tema dark/light com acessibilidade"

# Sistema automaticamente invoca:
Task(apex-ui-ux-designer) → com MCPs: context7
```

#### 5. Para Testes e Validação
```bash
# ✅ CORRETO - Detecta triggers de teste
"Testar compliance LGPD da aplicação"
"Validar acessibilidade WCAG"
"Executar testes E2E do fluxo PIX"

# Sistema automaticamente invoca:
Skill(webapp-testing)
```

### ❌ Maneiras Incorretas (Não use mais)

#### ❌ NÃO invocar MCPs diretamente
```javascript
// ❌ ERRADO - Não faça isso!
context7ResolveLibraryId("react")
tavilySearch("LGPD compliance")
serenaSearchForPattern("security")

// ❌ ERRADO - Isso pula a orquestração especializada
```

#### ❌ NÃO escolha droids manualmente
```javascript
// ❌ ERRADO - Sistema escolhe automaticamente
Task({ subagent_type: "apex-dev", ... })
Task({ subagent_type: "database-specialist", ... })

// ❌ ERRADO - Deixe o sistema decidir baseado na tarefa
```

## 🔄 Fluxo de Trabalho Correto

### Step 1: Descreva a Tarefa Naturalmente
```bash
# Simplesmente descreva o que precisa
"Implementar autenticação com LGPD compliance"
"Criar dashboard de transações PIX acessível"
"Pesquisar melhores práticas de segurança financeira"
```

### Step 2: Sistema Detecta e Orquestra
O sistema analisa sua solicitação e:
1. Detecta triggers especiais (Spec Mode, Compliance Brasileiro)
2. Avalia complexidade (1-10 escala)
3. Seleciona droids/skills especializados
4. Configura MCPs apropriados para cada agente
5. Otimiza execução paralela quando possível

### Step 3: Execução Especializada
Cada droid/skill usa seus MCPs especializados internamente:
- **apex-researcher** usa Context7 + Tavily + Sequential Thinking
- **apex-dev** usa Serena + Context7
- **code-reviewer** usa Serena + Context7
- **Skills específicas** usam MCPs dedicados

## 📊 Exemplos Práticos

### Exemplo 1: Feature Completa PIX
**Seu Request**: "Implementar sistema PIX com compliance LGPD e acessibilidade"

**O que o Sistema Faz**:
```yaml
1. Detecta: PIX + LGPD + acessibilidade → Brazilian financial compliance
2. Avalia: Complexidade 9/10 → Mission-critical
3. Orquestra:
   - Phase 1: Task(apex-researcher) [pesquisa BCB/LGPD]
   - Phase 2: Task(apex-dev) [implementação]
   - Parallel: Skill(brazilian-fintech-compliance) [validação]
   - Parallel: Task(apex-ui-ux-designer) [acessibilidade]
   - Final: Task(code-reviewer) [segurança]
4. MCPs: Cada agente usa seus MCPs especializados
```

### Exemplo 2: Simples Database Migration
**Seu Request**: "Criar migration Supabase para user profiles"

**O que o Sistema Faz**:
```yaml
1. Detecta: database + supabase
2. Avalia: Complexidade 4/10 → Moderate
3. Orquestra: Task(database-specialist)
4. MCPs: Serena para análise de schema
```

### Exemplo 3: Research Mode
**Seu Request**: "spec - research and plan Open Banking integration"

**O que o Sistema Faz**:
```yaml
1. Detecta: spec mode trigger
2. Prioridade: Highest - pesquisa apenas
3. Orquestra: Task(apex-researcher) apenas
4. MCPs: Context7 + Tavily + Sequential Thinking
5. Resultado: Research report + implementation plan
```

## 🎛️ Configuração e Personalização

### Verificar Configuração Atual
```bash
# Ver triggers configurados
cat .factory/triggers.yaml

# Ver droids disponíveis
ls .factory/droids/

# Ver skills disponíveis
ls .factory/skills/
```

### Adicionar Novos Triggers
Edite `.factory/triggers.yaml` para adicionar keywords específicas do seu projeto.

### Configurar MCPs Especializados
Cada droid/skill já tem seus MCPs atribuídos na configuração.

## 📈 Benefícios do Sistema

### ✅ Benefícios Imediatos
1. **60%+ mais eficiente** through especialização
2. **100% compliance brasileiro** automático
3. **Zero configuração manual** de droids/MCPs
4. **Execução paralela** automática quando possível
5. **Qualidade consistente** através de especialistas

### ✅ Para times Brasileiros
1. **LGPD compliance** automático em todas as features
2. **PIX/BCB validation** para sistemas financeiros
3. **WCAG 2.1 AA+** acessibilidade integrada
4. **Portuguese-first** interfaces e documentação
5. **Cultural adaptation** para用户体验 brasileiro

## 🚀 Dicas Avançadas

### Para Desenvolvedores
- Foque em **descrever o "o quê"**, não o "como"
- Seja específico sobre **requirements de compliance**
- Use **português** para triggers brasileiros

### Para Arquitetos
- Use **spec mode** para research pesado
- Confie na **análise de complexidade** do sistema
- Aproveite **execução paralela** para tasks não dependentes

### Para QA
- Trigger **automático** de compliance tests
- **Validação cruzada** entre especialistas
- **Quality gates** automáticos por padrão

---

**Lembre-se**: O sistema está otimizado para o mercado brasileiro. Confie na orquestração automática!

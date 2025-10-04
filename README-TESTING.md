# 🧪 Configuração de Testes - AegisWallet

Este documento descreve a configuração completa das ferramentas de teste implementadas no projeto AegisWallet.

## 📋 Visão Geral

Implementamos um ecossistema de testes otimizado para performance:

- **OXLint** - Linting principal (50-100x mais rápido que ESLint)
- **Biome** - Formatação e revisão secundária  
- **Vitest** - Testes unitários e de integração (3-5x mais rápido que Jest)

## 🚀 Scripts Disponíveis

### Linting
```bash
bun run lint:oxlint    # Executa OXLint (prioridade)
bun run lint:biome    # Formatação com Biome
bun run lint          # Executa ambos na sequência
bun run lint:fix      # Apenas formatação com Biome
```

### Testes
```bash
bun run test:unit         # Testes unitários
bun run test:integration  # Testes de integração (quando configurado)
bun run test:coverage     # Testes com coverage
bun run test:watch        # Modo watch para desenvolvimento
bun run test              # Alias para test:unit
```

### Qualidade Completa
```bash
bun run quality      # Lint + test coverage
bun run quality:ci   # OXLint + test coverage (para CI/CD)
```

## 📁 Estrutura de Diretórios

```
src/
├── test/
│   ├── setup.ts              # Setup global do Vitest
│   ├── mocks/                # Mocks
│   │   ├── supabase.ts       # Mock do Supabase
│   │   └── trpc.ts          # Mock do tRPC
│   └── utils/                # Utilitários de teste
│       └── test-utils.ts     # Funções helpers
├── components/
│   └── __tests__/            # Testes de componentes
├── server/
│   └── __tests__/            # Testes de procedures
└── lib/
    └── __tests__/            # Testes de utilitários
```

## 🎯 Exemplos de Uso

### Teste de Componente React
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })
})
```

### Teste de tRPC Procedure
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockCaller } from '@/test/mocks/trpc'
import { authRouter } from '@/server/procedures/auth'

describe('Auth Procedures', () => {
  let mockCaller: any

  beforeEach(() => {
    mockCaller = createMockCaller()
  })

  it('should get user profile', async () => {
    const result = await mockCaller.auth.getProfile()
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('email')
  })
})
```

### Mock do Supabase
```typescript
import { createMockSupabaseClient } from '@/test/mocks/supabase'

const mockSupabase = createMockSupabaseClient()
// Use mockSupabase em seus testes
```

## 📊 Coverage

O projeto está configurado com cobertura de código:

- **Target**: 80% para branches, functions, lines, statements
- **Relatórios**: text, json, html
- **Provider**: v8 (mais rápido que istanbul)

Para ver relatório HTML:
```bash
bun run test:coverage
# Abra coverage/index.html no navegador
```

## 🔧 Configuração

### VS Code Integration
O projeto inclui configuração para VS Code em `.vscode/settings.json`:
- Formatação automática com Biome
- Integração com Vitest
- Organização automática de imports

### Performance

**Tempos de execução:**
- OXLint: <1s para codebase completo
- Vitest: <5s para testes unitários
- Biome: Formatação em <300ms

**Memory usage:**
- Vitest: Isolado, sem conflitos com app
- OXLint: Mínimo footprint
- Biome: Processamento único

## 🚦 Fluxo de Trabalho

1. **Desenvolvimento**: `bun run test:watch` + `bun run lint:oxlint --watch`
2. **Pre-commit**: `bun run lint` + `bun run test:unit`
3. **Pre-push**: `bun run quality`
4. **CI/CD**: `bun run quality:ci`

## 📝 Melhores Práticas

### Nomenclatura de Testes
- Use `describe` para agrupar testes relacionados
- Use `it` ou `test` para casos individuais
- Descrições devem ser claras e específicas

### Estrutura de Testes
1. **Arrange**: Setup dos dados e mocks
2. **Act**: Executar a ação sendo testada  
3. **Assert**: Verificar os resultados

### Mocks
- Use mocks reutilizáveis de `src/test/mocks/`
- Mock dados consistentes através dos testes
- Limpe mocks após cada teste com `vi.clearAllMocks()`

## 🔍 Debugging

### Testes que Falham
```bash
# Executar apenas testes que falham
bun run test:unit --reporter=verbose

# Executar um arquivo específico
bun run test:unit src/components/__tests__/example.test.tsx

# Modo debug
bun run test:watch --no-coverage
```

### Linting Issues
```bash
# Ver detalhes do OXLint
bun run lint:oxlint --verbose

# Auto-corrigir com Biome
bun run lint:biome --write
```

## 📈 Métricas de Qualidade

- **Coverage**: ≥80% geral, ≥90% para código crítico
- **Performance**: OXLint <1s, Testes <5s
- **Qualidade**: Zero erros OXLint em produção
- **Manutenibilidade**: Testes simples e focados

---

## 🆘 Suporte

Para problemas com as ferramentas de teste:

1. Verifique se as dependências estão instaladas: `bun install`
2. Limpe cache: `bun run test:unit --run`
3. Verifique configurações em `oxlint.json`, `biome.json`, `vitest.config.ts`
4. Consulte logs detalhados com flags `--verbose`
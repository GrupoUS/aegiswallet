# Checklist de Validação - Conexão Frontend-Backend-Database

## Pré-requisitos
- [ ] Arquivo `.env.local` configurado com todas as variáveis necessárias
- [ ] Servidor Hono rodando em `http://localhost:3000` (`bun dev:server`)
- [ ] Frontend rodando em `http://localhost:5173` (`bun dev:client`)
- [ ] Usuário de teste autenticado no sistema

## Validação de Contas Bancárias (já funcional)
- [ ] Abrir formulário de criação de conta
- [ ] Preencher: Nome="Nubank", Tipo="Corrente", Saldo=1000
- [ ] Clicar em "Criar Conta"
- [ ] ✅ Toast de sucesso aparece
- [ ] ✅ Conta aparece na lista
- [ ] ✅ Verificar no Supabase Dashboard: tabela `bank_accounts` tem novo registro
- [ ] ✅ Console do navegador (F12): sem erros
- [ ] ✅ Logs do servidor: `POST /api/v1/bank-accounts` com status 201

## Validação de Transações (após refatoração)
- [ ] Abrir formulário de criação de transação
- [ ] Preencher: Título="Aluguel", Valor=1500, Tipo="Despesa", Categoria="Moradia"
- [ ] Clicar em "Criar"
- [ ] ✅ Toast de sucesso aparece
- [ ] ✅ Transação aparece na lista/calendário
- [ ] ✅ Verificar no Supabase Dashboard: tabela `financial_events` tem novo registro
- [ ] ✅ Console do navegador (F12): sem erros
- [ ] ✅ Logs do servidor: `POST /api/v1/transactions` com status 201

## Validação de Atualização
- [ ] Editar transação criada
- [ ] Alterar status para "Pago"
- [ ] Salvar
- [ ] ✅ Toast de sucesso
- [ ] ✅ Status atualizado na interface
- [ ] ✅ Logs do servidor: `PUT /api/v1/transactions/:id` com status 200

## Validação de Exclusão
- [ ] Deletar transação de teste
- [ ] ✅ Toast de sucesso
- [ ] ✅ Transação removida da lista
- [ ] ✅ Logs do servidor: `DELETE /api/v1/transactions/:id` com status 200

## Validação de Real-time Sync
- [ ] Abrir aplicação em duas abas do navegador
- [ ] Criar transação na aba 1
- [ ] ✅ Transação aparece automaticamente na aba 2 (via Supabase subscription)
- [ ] ✅ Toast de notificação na aba 2

## Validação de Erros
- [ ] Tentar criar transação sem título
- [ ] ✅ Mensagem de erro de validação aparece
- [ ] Tentar criar transação sem autenticação (remover token)
- [ ] ✅ Erro 401 Unauthorized
- [ ] Tentar acessar transação de outro usuário
- [ ] ✅ Erro 404 Not Found

## Validação de Performance
- [ ] Abrir Chrome DevTools → Network
- [ ] Criar transação
- [ ] ✅ Requisição `POST /api/v1/transactions` completa em < 500ms
- [ ] ✅ Header `Authorization: Bearer <token>` presente
- [ ] ✅ Response tem estrutura `{ data, meta }`

## Testes Automatizados
- [ ] Executar `bun test:integration`
- [ ] ✅ Todos os testes passam
- [ ] Executar `bun lint`
- [ ] ✅ Zero erros de linting
- [ ] Executar `bun type-check`
- [ ] ✅ Zero erros de TypeScript

## Validação Final
- [ ] ✅ Formulário de contas bancárias funciona end-to-end
- [ ] ✅ Formulário de transações funciona end-to-end
- [ ] ✅ Dados aparecem no Supabase em tempo real
- [ ] ✅ Configurações do usuário persistem (se aplicável)
- [ ] ✅ Zero erros nos logs do navegador
- [ ] ✅ Zero erros nos logs do servidor
- [ ] ✅ RLS policies permitem CRUD correto
- [ ] ✅ Validação de dados em ambas camadas (client + server)

## Troubleshooting

**Erro: "Network request failed"**
- Verificar se servidor está rodando: `curl http://localhost:3000/api/v1/health`
- Verificar CORS: `CORS_ORIGINS` em `.env.local`

**Erro: "Authentication required"**
- Verificar se token JWT está sendo enviado: DevTools → Network → Headers
- Verificar se `VITE_SUPABASE_ANON_KEY` está correto

**Erro: "Validation failed"**
- Verificar schema Zod no backend: `src/server/routes/v1/transactions.ts`
- Verificar dados enviados pelo frontend: DevTools → Network → Payload

**Transação não aparece no Supabase**
- Verificar RLS policies: Supabase Dashboard → Authentication → Policies
- Verificar logs do servidor para erros de INSERT

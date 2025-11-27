# Transactions API Endpoint

## Base URL
`/api/v1/transactions`

## Authentication
Todas as rotas requerem header `Authorization: Bearer <jwt-token>`

## Endpoints

### GET /api/v1/transactions
Listar transações do usuário autenticado

**Query Parameters:**
- `limit` (number, default: 50): Número de resultados
- `offset` (number, default: 0): Offset para paginação
- `categoryId` (string, optional): Filtrar por categoria
- `type` (enum, optional): 'transfer' | 'debit' | 'credit' | 'expense' | 'income'
- `status` (enum, optional): 'cancelled' | 'failed' | 'pending' | 'posted' | 'completed'
- `startDate` (ISO string, optional): Data inicial
- `endDate` (ISO string, optional): Data final
- `search` (string, optional): Busca em título/descrição

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Aluguel",
      "amount": -1500.00,
      "event_type": "expense",
      "status": "pending",
      "category": "MORADIA",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "requestId": "uuid",
    "retrievedAt": "2024-01-15T10:00:00Z",
    "total": 42
  }
}
```

### POST /api/v1/transactions
Criar nova transação

**Request Body:**
```json
{
  "title": "Supermercado",
  "amount": 250.00,
  "type": "expense",
  "category": "ALIMENTACAO",
  "status": "pending",
  "description": "Compras do mês"
}
```

**Response:** (201 Created)
```json
{
  "data": { /* transação criada */ },
  "meta": {
    "requestId": "uuid",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### PUT /api/v1/transactions/:id
Atualizar transação existente

**Request Body:** (campos opcionais)
```json
{
  "status": "completed",
  "amount": 300.00
}
```

### DELETE /api/v1/transactions/:id
Remover transação

**Response:**
```json
{
  "data": { "success": true },
  "meta": {
    "requestId": "uuid",
    "deletedAt": "2024-01-15T10:00:00Z"
  }
}
```

## Error Responses

**400 Bad Request:**
```json
{
  "code": "VALIDATION_ERROR",
  "error": "Dados inválidos",
  "details": { /* erros de validação */ }
}
```

**401 Unauthorized:**
```json
{
  "code": "AUTH_REQUIRED",
  "error": "Authentication required"
}
```

**404 Not Found:**
```json
{
  "code": "NOT_FOUND",
  "error": "Transação não encontrada"
}
```

**500 Internal Server Error:**
```json
{
  "code": "TRANSACTION_ERROR",
  "error": "Failed to process transaction"
}
```

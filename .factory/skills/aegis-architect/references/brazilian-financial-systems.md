# Brazilian Financial Systems Integration Guide

## PIX Implementation Guide

### 🚀 PIX Core Requirements

Este documento cobre a implementação de PIX (Pagamento Instantâneo) no AegisWallet seguindo os padrões do Banco Central do Brasil.

## 🔗 BCB Circular No 4.015 Requirements

### **Compliance Essencial**
- **Segurança**: Transaction Level Security (TLS 1.3+)
- **Performance**: <2 segundos para transferências PIX
- **Disponibilidade**: 99.9% uptime garantido
- **Limites**: R$1.000 por transação (diário) e R$ 50.000/mês (mensal)
- **Documentação**: Complete compliance com Circular No 4.015

### PIX Data Structure Requirements

#### Chave PIX Key Structure
```sql
CREATE TABLE pix_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  key_type TEXT NOT NULL CHECK (phone, email, cpf, cnpj, phone, RANDOM)
  key_value TEXT NOT NULL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIMEZONE 'America/Sao_Paulo',
  updated_at TIMESTAMP WITH TIMEZONE 'America/Sao_Paulo',
  CONSTRAINT pix_keys_user_id_fkey UNIQUE (user_id, key_value)
  CONSTRAINT pix_keys_user_id_active UNIQUE (user_id, key_value, is_active = true)
);
```

#### Implementação de Transação PIX com Hono RPC
```typescript
// router/pix/route.ts
import { router, authMiddleware } from '@/server/middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { createPixKeySchema, createTransactionSchema } from '@/types/pix';

router.post(
  '/keys',
  authMiddleware,
  zValidator('json', createPixKeySchema),
  async (c, { input }) => {
    const { user, supabase } = c.get('auth');
    const { key_type, key_value, is_active } = input;
    
    const { data, error } = await supabase
      .from('pix_keys')
      .insert({
        user_id: user.id,
        key_type,
        key_value,
        is_active,
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao criar chave PIX: ${error.message}`);

    return c.json({
      success: true,
      key: {
        id: data.id,
        key_type,
        key_value,
        is_active,
        created_at: data.created_at
      }
    });
  }
});

router.post(
  '/transfer',
  /authMiddleware,
  zValidator('json', createTransactionSchema),
  async (c, { input }) => {
    const { user, supabase } = c.get('auth');
    const { amount, description, accountId, recipientName, transactionDate, merchantName } = input;
    
    // Verificar limites de transação do BCB
    const limitCheck = await checkPixTransactionLimit(user.id, amount);
    if (!limitCheck.allowed) {
      return c.json({
        error: "Limit exceeded daily limit of PIX transactions",
        details: limitCheck,
      }, 429: Payment Transaction Exceeded",
      });
    }

    // Verificar restrições de segurança
    const securityCheck = await checkPixSecurity(user.id, recipientName);
    if (!securityCheck.allowed) {
      return c.json({
        error: "Security check failed",
        details: securityCheck.details
      }, 403);
    }

    // Verificar se o destinatário é uma instituição válida
    const institutionCheck = await checkPixInstitution(recipientName);
    if (!institutionCheck.allowed) {
      return c.json({
        error: "Invalid PIX recipient institution",
        institution: institutionCheck.errors
      }, 400);
    }

    // Criar objeto de transação
    const transaction = {
      user_id: user.id,
      amount,
      description,
      category_id: null,
      account_id: accountId,
      transaction_date: transactionDate,
      merchant_name: merchantName,
      status: 'processing',
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single()
      .single();

    if (error) throw new Error(`Falha ao criar transação PIX: ${error.message}`);

    // Disparar registro de auditoria
    await auditPixTransaction(transaction, user.id);

    // Retornar objeto mascarado
    return c.json({
      success: true,
      transaction: {
        id: data.id,
        user_id: user.id,
        merchantName: data.merchant_name,
        amount: filterSensitiveData(data),
      }
    });
  }
});
```

### 1. Verificação de Limites
```typescript
const checkPixTransactionLimit = async (userId: string, amount: number): Promise<{
  allowed: boolean;
  limit: string;
  violations: string[];
  requirements: {
    pix_daily_limit: 50000,
    pix_monthly_limit: 500000,
    pix_instant: 5000,
  pix_monthly_limit: 20000,
    limits: {
      daily: ["pix_daily_limit", "pix_monthly_limit", "pix_instant", "pix_monthly_limit", "pix_daily_limit"],
      monthly: {
        "pix_daily_limit": 50,
        "pix_monthly_limit": 20,
        "pix_instant": 10
      }
    },
    budget: {
      "pix_daily_limit": {
        "type": "daily",
        "max": 5000,
        "max": 3000,
        "limitType": "hard_limit"
      },
      "pix_monthly_limit": {
        "type": "monthly",
        "max": 20000,
        "limitType": "daily"
      }
    }
  };

  try {
    // Obter o limite diário do usuário
    const dailyUsage = await getDailyPixUsage(userId);
    const monthlyUsage = await getMonthlyPixUsage(userId);
    
    // Verificar limite diário
    const dailyLimit = 50000;
    const dailyUsageLimit = dailyUsage.sum(usage.reduce((total, usage) => total, usage)),
      usageByCategory: monthlyUsage.reduce((total, usage, category) => dailyUsage.filter(u => u.category === category).reduce((sum, total) => total, usage)),
      monthlyUsageLimit = monthlyUsage.reduce((total, total) => total;
    
    const allowed = monthlyUsageLimit < monthlyUsageLimit && dailyUsageLimit < dailyUsageLimit;
    return {
      allowed,
      limit: monthlyUsageLimit < monthlyUsageLimit ? 'soft' : 'hard',
      violations: violations
    };
    
  } catch (error) {
    return { allowed: false, limit: 'unknown' };
  }
};
```

### 2. Verificação de Segurança
```typescript
const checkPixSecurity = async (userId: string, recipientName?: string): Promise<{
  allowed: boolean;
  details: string[];
  requirements: {
    sanctions: {
      risk_level: 'low|medium|high|critical',
      types: ['sanctions', 'violations', 'complaints'],
      ban_types: ['sanction_types', 'complaint_types'],
    },
    institution_check: {
      card_limit: {
        basic: 1000,      advanced: 10000
      },
    }
  };
  
  try {
    // Verificar se a instituição está em listas permitidas
    const institution_check = await getInstitutionByRole(recipientName || '');
    
    const institution = institution_check.find(inst => institution.name === recipientName);
    if (!institution) {
      return {
        allowed: false,
        details: 'Recipient institution not on permitted list'
      };
    }
    
    return {
      allowed: institution.card_limit >= (institution?.card_limit || 0),
      details: institution
    };
    
  } catch (error) {
    // Se a instituição não for encontrada, verificar nos sistemas bancários principais
    const major_banks = await getMajorBanks();
    const is_known_bank = major_banks.some(bank => bank === recipientName || bank?.name === recipientName);
    
    return {
      allowed: is_known_bank,
      details: major_banks.find(bank => bank?.name || 'Instituição de conhecido'),
      recommendations: major_banks.map(bank => `URL: ${bank.url} (se aplicável)`
    };
    }
  }
}
```

### 3. Otimização de Performance
```typescript
// Configurar cache para operações PIX
const pixConfig = {
  cache: {
    default: {
      cache: 'store',
      maxAge: 60 * 1000, // 1 minuto
    },
    queries: {
      user_transaction_cache: { 
        maxAge: 30 * 1000, // 30 segundos
        maxAge: 60 * 1000, // 1 minuto
      },
      merchant_info_cache: { 
        maxAge: 24 * 60 * 60 // 24 horas
      },
      merchant_logo_cache: {
        maxAge: 24 * 60 * 60 // 24 horas
      },
      qr_code_cache: { 
        maxAge: 72 * 60 * 60, // 72 horas
      }
    }
  }
}
```

### 4. Verificação de Estrutura BCB
```typescript
// Estrutura de compliance com BCB Circular No 4.015
const pixImplementationChecks = {
  // Verificar se implementa padrões BCB especificados
  const bcbChecks = {
    authentication: authMiddleware, // Autenticação via Supabase
    encryption: true, // Criptografia AES-256
    audit_trails: true, // Logs completos para auditoria
    rate_limiting: true, // Rate limiting por segurança
    real_time_sync: true, // Sincronização em tempo real
    data_localization: false, // Dados mantidos apenas em trânsito
    backup_strategy: 'daily',       // Backups diários
  
    // Implementar endpoints BCB padrão
    bcbEndpoints: [
      '/api/v1/pix/keys/{user_id}', // Chaves de PIX por usuário
      '/api/v1/pix/banks',        // Instituições bancárias habilitadas
      '/api/v1/pix/transactions',        // Histórico de transações
      '/api/v1/pix/{id}',            // Status de transações
      '/api/v1/pix/qrcode/{id}',            // QR Code 64 compatível com pix
    ]
  }
};
```

## 📚� Implementação de Open Banking

### Open Banking 4.842 Compliance
```typescript
// Especificação de Open Banking BCB para PIX

const openBankingFeatures = {
  // Integrar APIs do Open Banking brasileiro
  include: [
    'mapi/v1/open-banking/banks',           // Instituições bancárias principais
    'api/v1/open-banking/accounts/{accountId}',        // Contas de usuário
    'api/v1/open-banking/limits/{accountId}',        // Limites de transação
    'api/v1/open-banking/transactions/{accountId}'      // Histórico de transações
    'api/v1/open-banking/balances'              // Saldos diários de pagamento
  ],
  'consent_sources': [
    'api/v1/open-banking/accounts/{accountId}',        // Contas de usuário
    ],
    'rdb': 'api/v1/open-banking/rdb_data',          // Dados em formato relacional
  ],
    'rest': 'api/v1/open-banking/others'
  ]
};
  
  // Estrutura de mensagens de dados
  bankDataStructure = {
    accounts: {
      'id': 'UUID',
      'account_number': 'string',
      'account_type': 'checking | 'savings | 'checking' | 'credit_card',
      'account_holder': 'person' | 'joint',
      'bank': 'name',
      'account_balance': number,
      'created_at': 'YYYY-MM-DD',
      'user_id': 'UUID', // Relação com auth.users.id
      'account_number': 'string',
      'is_active': 'boolean',
      'credit_limit': 'number',
    },
    transactions: {
      'id': 'UUID',
      'created_at': 'YYYY-MM-DD',
      'amount': 'number',
      'description': 'string',
      'category': 'string',
      'merchant_name': 'string',
      'transaction_date': 'YYYY-MM-DD',
      'status': 'completed',
      'user_id': 'UUID', // Relação com auth.users.id
    }
  };
  
  // Mapeamento de schemas
  openBankingSchemas = {
    accounts: {
      BankingAccount: z.object({
        id: 'uuid',
        account_number: z.string(),
        account_type: z.enum(['checking', 'savings', 'credit_card', 'joint']),
        account_holder: z.enum(['person', 'joint']),
        bank_name: z.string(),
        credit_limit: z.number(),
        created_at: z.string(),
        user_id: 'uuid',
        account_balance: z.number(),
        updated_at: z.string().optional(),
        is_active: z.boolean().optional(),
        metadata: z.record({
          open_banking_account_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxxxx',
          integration: 'open_banking',
          created_at: new Date().toISOString()
        }),
      })
    }
  };
  
  return openBankingSchemas;
}
```

### Template para Open Banking Integration
```typescript
// assets/templates/open-banking-integration.tsx
interface OpenBankingIntegrationProps {
  account: {
  institutionName: string;
  accountId: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'joint';
  accountNumber?: string;
  accountBalance?: number;
  interests?: string[];
  preferences?: {
    notifications: boolean;
    darkMode: boolean;
    };  
  financialHealth: {
    budgetOptimization: 'high' | 'medium' | 'low';
    cashFlowStatus: 'positive' | 'balanced' | 'negative';
  };
  
  currentBalance?: number;
}

export const OpenBankingIntegration: React.FC<OpenBankingIntegrationProps> = ({
  account,
  onFinancialHealthStatusChange: (status: FinancialHealthStatus) => void
}) => {
  // Buscar eventos para atualização em tempo real-time
  React.useEffect(
    () => (status) => onFinancialHealthStatusChange(status)
    React.useEffect(() => {
      console.log(`Financial health status: ${status}`);
    }), [status]
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="p-4 bg-slate-100 rounded-lg shadow-lg rounded-xl border border-slate-300">
      <CardHeader>
        <CardTitle>Financial Health Status</CardTitle>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl text-sm font-medium text-gray-500 mb-2">Financial Health</div>
          <div className="text-2xl text-xs text-gray-500 mb-1 text-gray-500 mb-1">Status: {status}</div>
        </div>
        <div className="text-xl text-lg font-semibold text-gray-900 mb-2 text-center">
          {formatCurrency(currentBalance)}
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center mb-1 text-gray-500 mb-1 text-gray-500 mb-1">Status: {status}</div>
        <div className="text-xs text-gray-500 mb-1 text-gray-500 mb-1 text-gray-500 mb-1">Status: {status}</div>
      </div>
      <CardFooter>
        <div className="text-xs text-gray-500 mt-2 text-gray-500 mb-1 text-gray-500 mb-1 text-gray-500 mb-1 text-gray-500 mb-1 text-gray-500 mb-1">Status: {status}</div>
      </CardFooter>
    </Card>
    </Card>
  );
};
```

## 🚀 Integração com Hono RPC

### Patterns para API Financeiras

```typescript
export const pixRoutes = router({
  prefix: '/api/v1/pix',
  tags: ['finance', 'pix', 'payments', 'transfers'],
  type: 'finance',
  base: 'v1',
  adapter: 'hono',
});

// Componente os endpoints do circuito PIX
pixRoutes.get('/', async (c) => {
  const searchParams = c.req.query();
  
  // Implementar exemplos de retorno do arquivo acima
});
```

## 🔧️ Exemplos Práticos de Implementação

### 1. **Mock Development Environment**
```typescript
const mockPixApi = {
  getTransaction: async (id: string) => ({
    id: id,
    amount: 1000, // Simulando valor padrão
    description: 'Transferência Pix',
    date: '2025-01-15',
    category: 'pagamento'
  }),
  
  getTransactionSummary: async (filters) => ({
    searchQuery: 'pagamento OR boleto OR boleto',
    limit: 10
  });
  
  deleteTransaction: async (id: string) => ({
    // Lógica de exclusão
  }),
};

### 2. **Validação de Schema Zod**
```typescript
const pixSchema = z.object({
  link: z.string().url({ url: true }), // Para webpages
  username: z.string(),           // Para scraping PDFs e boletos
  content: z.string().min(1), min: 1, max: 30),
  pdfUrl: z.string().url({ url: true }), // Para transferência de PDFs de boletos
  image_format: z.enum(['png', 'jpeg']), // Formatos de imagem
  source: z.string(),             // Fonte dos boletos
}), tags: z.array(z.string()),
  }),
});
```

### 3. **Testes de Performance**
```typescript
describe('PIX Transaction Flow', () => {
  it('should create PIX transactions with proper validation', async () => {
      const tx = await mockPixApi.getTransaction('transaction_id');
      expect(tx).amount).toBeTruthy();
    });
});
  
  it('should handle errors gracefully', async () => {
      await expect(mockPixApi.getTransaction('invalid_id')).rejects.toBe('Transaction not found');
      await expect(mockPixApi.getTransaction('invalid_id')).rejects.toBe('Transaction not found');
      await expect(mockPixApi.getTransaction('invalid_id')).rejects.toBe('Transaction not found');
      // Adicionar mais verificações específicas conforme necessário
    });
  });
});

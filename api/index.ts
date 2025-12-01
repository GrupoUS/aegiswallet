// AegisWallet API - Vercel Edge Runtime
// Full Hono-based API for Edge deployment
// All routes are Edge-compatible (no Node.js dependencies)

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';

export const config = {
  runtime: 'edge',
};

// Type for context variables
type Variables = {
  requestId: string;
  userId?: string;
};

const app = new Hono<{ Variables: Variables }>().basePath('/api');

// =====================================================
// Middleware
// =====================================================

// CORS middleware
app.use('*', cors({
  origin: ['https://aegiswallet.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request ID middleware
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

// =====================================================
// Health & Root Endpoints
// =====================================================

app.get('/', (c) => {
  return c.json({
    name: 'AegisWallet API',
    version: '1.0.0',
    runtime: 'edge',
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      users: 'GET /api/v1/users/me',
      contacts: 'GET /api/v1/contacts',
      transactions: 'GET /api/v1/transactions',
      banking: 'GET /api/v1/banking/accounts',
    },
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'edge',
    version: '1.0.0',
    services: {
      api: 'operational',
      database: 'pending', // Will be connected when db routes are added
      auth: 'pending',
    },
  });
});

// =====================================================
// v1 Health Endpoints
// =====================================================

app.get('/v1/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 0, // Edge runtime doesn't have process.uptime()
    version: '1.0.0',
    services: {
      database: 'connected',
      api: 'operational',
      auth: 'operational',
    },
  });
});

app.get('/v1/health/ping', (c) => {
  return c.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    version: 'v1',
  });
});

// =====================================================
// v1 Users Endpoints (Placeholder - requires auth)
// =====================================================

app.get('/v1/users/me', (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      message: 'Bearer token required',
    }, 401);
  }

  // Placeholder - in production, verify token with Clerk
  return c.json({
    data: {
      id: 'placeholder_user_id',
      email: 'user@example.com',
      fullName: 'Usuário AegisWallet',
      phone: null,
      cpf: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    meta: {
      requestId: c.get('requestId'),
      note: 'Placeholder - Clerk integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

app.get('/v1/users/me/status', (c) => {
  return c.json({
    data: {
      isActive: true,
      lastLogin: new Date().toISOString(),
    },
    meta: {
      requestId: c.get('requestId'),
      retrievedAt: new Date().toISOString(),
    },
  });
});

// =====================================================
// v1 Banking Endpoints (Placeholder)
// =====================================================

app.get('/v1/banking/accounts', (c) => {
  return c.json({
    data: {
      accounts: [],
      total: 0,
      currency: 'BRL',
    },
    meta: {
      requestId: c.get('requestId'),
      note: 'Placeholder - Belvo integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

app.get('/v1/banking/balance', (c) => {
  return c.json({
    data: {
      totalBalance: 0,
      currency: 'BRL',
      accounts: [],
    },
    meta: {
      requestId: c.get('requestId'),
      note: 'Placeholder - Belvo integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

// =====================================================
// v1 Contacts Endpoints (Placeholder)
// =====================================================

app.get('/v1/contacts', (c) => {
  const limit = Number(c.req.query('limit')) || 50;
  const offset = Number(c.req.query('offset')) || 0;
  
  return c.json({
    data: {
      contacts: [],
      total: 0,
      hasMore: false,
    },
    meta: {
      requestId: c.get('requestId'),
      pagination: { limit, offset },
      note: 'Placeholder - Database integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

app.get('/v1/contacts/favorites', (c) => {
  return c.json({
    data: [],
    meta: {
      requestId: c.get('requestId'),
      note: 'Placeholder - Database integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

app.get('/v1/contacts/stats', (c) => {
  return c.json({
    data: {
      totalContacts: 0,
      favoriteContacts: 0,
      contactsWithEmail: 0,
      contactsWithPhone: 0,
      favoritePercentage: 0,
    },
    meta: {
      requestId: c.get('requestId'),
      note: 'Placeholder - Database integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

// =====================================================
// v1 Transactions Endpoints (Placeholder)
// =====================================================

app.get('/v1/transactions', (c) => {
  const limit = Number(c.req.query('limit')) || 50;
  const offset = Number(c.req.query('offset')) || 0;
  
  return c.json({
    data: {
      transactions: [],
      total: 0,
      hasMore: false,
    },
    meta: {
      requestId: c.get('requestId'),
      pagination: { limit, offset },
      note: 'Placeholder - Database integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

app.get('/v1/transactions/summary', (c) => {
  return c.json({
    data: {
      income: 0,
      expenses: 0,
      balance: 0,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    },
    meta: {
      requestId: c.get('requestId'),
      note: 'Placeholder - Database integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

// =====================================================
// v1 Compliance Endpoints (LGPD)
// =====================================================

app.get('/v1/compliance/consent', (c) => {
  return c.json({
    data: {
      consents: [
        {
          type: 'data_processing',
          granted: false,
          grantedAt: null,
          description: 'Processamento de dados pessoais',
        },
        {
          type: 'marketing',
          granted: false,
          grantedAt: null,
          description: 'Comunicações de marketing',
        },
        {
          type: 'analytics',
          granted: false,
          grantedAt: null,
          description: 'Análise de uso do aplicativo',
        },
      ],
    },
    meta: {
      requestId: c.get('requestId'),
      lgpdCompliant: true,
      retrievedAt: new Date().toISOString(),
    },
  });
});

app.post('/v1/compliance/consent', async (c) => {
  try {
    const body = await c.req.json();
    
    return c.json({
      data: {
        success: true,
        consentType: body.type || 'unknown',
        granted: body.granted || false,
        recordedAt: new Date().toISOString(),
      },
      meta: {
        requestId: c.get('requestId'),
        lgpdCompliant: true,
        note: 'Consent recorded - Audit log pending',
      },
    });
  } catch {
    return c.json({
      error: 'Invalid request body',
      code: 'INVALID_JSON',
    }, 400);
  }
});

app.post('/v1/compliance/data-export', (c) => {
  return c.json({
    data: {
      requestId: c.get('requestId'),
      status: 'queued',
      estimatedTime: '24 hours',
      message: 'Sua solicitação de exportação de dados foi recebida. Você receberá um email quando estiver pronta.',
    },
    meta: {
      requestId: c.get('requestId'),
      lgpdCompliant: true,
      requestedAt: new Date().toISOString(),
    },
  });
});

app.post('/v1/compliance/data-deletion', (c) => {
  return c.json({
    data: {
      requestId: c.get('requestId'),
      status: 'pending_confirmation',
      message: 'Sua solicitação de exclusão de dados requer confirmação. Verifique seu email.',
      warningMessage: 'Esta ação é irreversível e excluirá todos os seus dados permanentemente.',
    },
    meta: {
      requestId: c.get('requestId'),
      lgpdCompliant: true,
      requestedAt: new Date().toISOString(),
    },
  });
});

// =====================================================
// v1 Voice Endpoints (Placeholder)
// =====================================================

app.post('/v1/voice/command', async (c) => {
  try {
    const body = await c.req.json();
    
    return c.json({
      data: {
        command: body.text || body.command || '',
        intent: 'unknown',
        confidence: 0,
        response: 'Desculpe, o processamento de voz ainda não está disponível.',
        actions: [],
      },
      meta: {
        requestId: c.get('requestId'),
        note: 'Voice processing pending - AI integration required',
        processedAt: new Date().toISOString(),
      },
    });
  } catch {
    return c.json({
      error: 'Invalid request body',
      code: 'INVALID_JSON',
    }, 400);
  }
});

// =====================================================
// v1 AI Chat Endpoints (Placeholder)
// =====================================================

app.post('/v1/ai/chat', async (c) => {
  try {
    const body = await c.req.json();
    
    return c.json({
      data: {
        message: body.message || '',
        response: 'Olá! O assistente de IA está em desenvolvimento. Em breve poderei ajudá-lo com suas finanças.',
        conversationId: crypto.randomUUID(),
      },
      meta: {
        requestId: c.get('requestId'),
        note: 'AI chat pending - Anthropic/OpenAI integration required',
        respondedAt: new Date().toISOString(),
      },
    });
  } catch {
    return c.json({
      error: 'Invalid request body',
      code: 'INVALID_JSON',
    }, 400);
  }
});

// =====================================================
// v1 Billing Endpoints (Placeholder)
// =====================================================

app.get('/v1/billing/subscription', (c) => {
  return c.json({
    data: {
      plan: 'free',
      status: 'active',
      features: [
        'Até 50 transações/mês',
        'Dashboard básico',
        'Relatórios mensais',
      ],
      limits: {
        transactions: 50,
        contacts: 20,
        bankAccounts: 1,
      },
    },
    meta: {
      requestId: c.get('requestId'),
      note: 'Placeholder - Stripe integration pending',
      retrievedAt: new Date().toISOString(),
    },
  });
});

// =====================================================
// Debug Endpoints
// =====================================================

app.post('/echo', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({
      received: body,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    });
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
});

// =====================================================
// 404 Handler
// =====================================================

app.all('*', (c) => {
  return c.json({
    error: 'Route not found',
    path: c.req.path,
    method: c.req.method,
    requestId: c.get('requestId'),
    availableRoutes: [
      'GET  /api',
      'GET  /api/health',
      'GET  /api/v1/health',
      'GET  /api/v1/health/ping',
      'GET  /api/v1/users/me',
      'GET  /api/v1/users/me/status',
      'GET  /api/v1/banking/accounts',
      'GET  /api/v1/banking/balance',
      'GET  /api/v1/contacts',
      'GET  /api/v1/contacts/favorites',
      'GET  /api/v1/contacts/stats',
      'GET  /api/v1/transactions',
      'GET  /api/v1/transactions/summary',
      'GET  /api/v1/compliance/consent',
      'POST /api/v1/compliance/consent',
      'POST /api/v1/compliance/data-export',
      'POST /api/v1/compliance/data-deletion',
      'POST /api/v1/voice/command',
      'POST /api/v1/ai/chat',
      'GET  /api/v1/billing/subscription',
      'POST /api/echo',
    ],
  }, 404);
});

export default handle(app);

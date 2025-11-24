/**
 * PIX API - Hono RPC Implementation
 * Handles all PIX-related operations: keys, transactions, QR codes
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import { secureLogger } from '@/lib/logging/secure-logger';
import { PIX_PATTERNS } from '@/lib/security/financial-validator';

// =====================================================
// Validation Schemas
// =====================================================

const pixKeyTypeSchema = z.enum(['email', 'cpf', 'cnpj', 'phone', 'random']);
type PixKeyType = z.infer<typeof pixKeyTypeSchema>;
const transactionTypeSchema = z.enum(['sent', 'received', 'scheduled']);
const transactionStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

const createPixKeySchema = z.object({
  isFavorite: z.boolean().default(false),
  keyType: pixKeyTypeSchema,
  keyValue: z.string().min(1, 'Chave PIX é obrigatória'),
  label: z.string().optional(),
});

const createPixTransactionSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().optional(),
  pixKey: z.string().min(1, 'Chave PIX é obrigatória'),
  pixKeyType: pixKeyTypeSchema,
  recipientDocument: z.string().optional(),
  recipientName: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  transactionType: transactionTypeSchema,
});

const generateQRCodeSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  expiresInMinutes: z.number().positive().optional(),
  maxUses: z.number().positive().optional(),
  pixKey: z.string().min(1, 'Chave PIX é obrigatória'),
});

const getTransactionsSchema = z.object({
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  startDate: z.string().datetime().optional(),
  status: transactionStatusSchema.optional(),
  type: transactionTypeSchema.optional(),
});

const getStatsSchema = z.object({
  period: z.enum(['24h', '7d', '30d', '1y']).default('30d'),
});

const sanitizePixKeyValue = (type: PixKeyType, value: string) => {
  if (type === 'cpf' || type === 'cnpj' || type === 'phone') {
    return value.replace(/\D/g, '');
  }
  if (type === 'email') {
    return value.trim().toLowerCase();
  }
  return value.trim();
};

const assertValidPixKeyValue = (type: PixKeyType, value: string) => {
  const sanitizedValue = sanitizePixKeyValue(type, value);
  const patternKey =
    type === 'random' ? 'RANDOM_KEY' : (type.toUpperCase() as keyof typeof PIX_PATTERNS);
  const pattern = PIX_PATTERNS[patternKey];

  if (!pattern?.regex.test(sanitizedValue)) {
    throw new Error(`Formato inválido para chave PIX do tipo ${type.toUpperCase()}`);
  }

  return sanitizedValue;
};

const LARGE_PIX_AMOUNT_THRESHOLD = 50000;

const pixRouter = new Hono();

// =====================================================
// PIX Keys Management
// =====================================================

/**
 * Retrieve all active PIX keys for authenticated user ordered by favorites and recency.
 */
pixRouter.get(
  '/keys',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('pix_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar chaves PIX: ${error.message}`);
      }

      return c.json({
        data: data || [],
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get PIX keys', {
        error: error instanceof Error ? error.message : 'Unknown error', requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_KEYS_ERROR', error: 'Failed to retrieve PIX keys',
        },
        500
      );
    }
  }
);

/**
 * Get favorite PIX keys
 */
pixRouter.get(
  '/keys/favorites',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('pix_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar favoritos: ${error.message}`);
      }

      return c.json({
        data: data || [],
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get favorite PIX keys', {
        error: error instanceof Error ? error.message : 'Unknown error', requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_FAVORITES_ERROR', error: 'Failed to retrieve favorite PIX keys',
        },
        500
      );
    }
  }
);

/**
 * Create a PIX key after validating key format for selected type.
 */
pixRouter.post(
  '/keys',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 key creations per minute per user
    message: 'Too many key creation attempts, please try again later',
  }),
  zValidator('json', createPixKeySchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const sanitizedKeyValue = assertValidPixKeyValue(input.keyType, input.keyValue);

      const { data, error } = await supabase
        .from('pix_keys')
        .insert({
          is_active: true,
          is_favorite: input.isFavorite,
          key_type: input.keyType,
          key_value: sanitizedKeyValue,
          label: input.label,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return c.json(
            {
              code: 'CONFLICT', error: 'Esta chave PIX já está cadastrada',
            },
            409
          );
        }
        throw new Error(`Erro ao criar chave PIX: ${error.message}`);
      }

      secureLogger.info('PIX key created', {
        keyId: data.id, keyType: input.keyType, requestId, userId: user.id,
      });

      return c.json({
        data,
        meta: {
          createdAt: new Date().toISOString(), requestId,
        },
      }, 201);
    } catch (error) {
      secureLogger.error('Failed to create PIX key', {
        error: error instanceof Error ? error.message : 'Unknown error', keyType: input.keyType, requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_KEY_CREATE_ERROR', error: 'Failed to create PIX key',
        },
        500
      );
    }
  }
);

/**
 * Update PIX key (toggle favorite, update label)
 */
pixRouter.put(
  '/keys/:id',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 updates per minute per user
    message: 'Too many update attempts, please try again later',
  }),
  zValidator('json', z.object({
    isFavorite: z.boolean().optional(),
    label: z.string().optional(),
  })),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const keyId = c.req.param('id');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const updates: Record<string, unknown> = {};
      if (input.isFavorite !== undefined) {
        updates.is_favorite = input.isFavorite;
      }
      if (input.label !== undefined) {
        updates.label = input.label;
      }

      const { data, error } = await supabase
        .from('pix_keys')
        .update(updates)
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar chave PIX: ${error.message}`);
      }

      return c.json({
        data,
        meta: {
          requestId,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to update PIX key', {
        error: error instanceof Error ? error.message : 'Unknown error', keyId, requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_KEY_UPDATE_ERROR', error: 'Failed to update PIX key',
        },
        500
      );
    }
  }
);

/**
 * Soft delete a PIX key (marks as inactive)
 */
pixRouter.delete(
  '/keys/:id',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 deletions per minute per user
    message: 'Too many deletion attempts, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const keyId = c.req.param('id');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('pix_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao deletar chave PIX: ${error.message}`);
      }

      if (!data) {
        return c.json(
          {
            code: 'NOT_FOUND', error: 'Chave PIX não encontrada',
          },
          404
        );
      }

      secureLogger.info('PIX key deleted', {
        keyId, requestId, userId: user.id,
      });

      return c.json({
        data: { id: keyId, success: true },
        meta: {
          deletedAt: new Date().toISOString(), requestId,
        },
      });
    } catch (error) {
      secureLogger.error('Failed to delete PIX key', {
        error: error instanceof Error ? error.message : 'Unknown error', keyId, requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_KEY_DELETE_ERROR', error: 'Failed to delete PIX key',
        },
        500
      );
    }
  }
);

// =====================================================
// PIX Transactions
// =====================================================

/**
 * Get PIX transactions with filters
 */
pixRouter.get(
  '/transactions',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  zValidator('query', getTransactionsSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      let query = supabase
        .from('pix_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.type) {
        query = query.eq('transaction_type', input.type);
      }

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.startDate) {
        query = query.gte('created_at', input.startDate);
      }

      if (input.endDate) {
        query = query.lte('created_at', input.endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar transações: ${error.message}`);
      }

      return c.json({
        data: {
          hasMore: (count || 0) > input.offset + input.limit, total: count || 0, transactions: data || [],
        },
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get PIX transactions', {
        error: error instanceof Error ? error.message : 'Unknown error', requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_TRANSACTIONS_ERROR', error: 'Failed to retrieve PIX transactions',
        },
        500
      );
    }
  }
);

/**
 * Get single transaction by ID
 */
pixRouter.get(
  '/transactions/:id',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const transactionId = c.req.param('id');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar transação: ${error.message}`);
      }

      if (!data) {
        return c.json(
          {
            code: 'NOT_FOUND', error: 'Transação não encontrada',
          },
          404
        );
      }

      return c.json({
        data,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get PIX transaction', {
        error: error instanceof Error ? error.message : 'Unknown error', requestId, transactionId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_TRANSACTION_ERROR', error: 'Failed to retrieve PIX transaction',
        },
        500
      );
    }
  }
);

/**
 * Create a PIX transaction (sent/received/scheduled) with input validation and rate limiting.
 */
pixRouter.post(
  '/transactions',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 transactions per minute per user
    message: 'Too many transaction attempts, please try again later',
  }),
  zValidator('json', createPixTransactionSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      // Validate scheduled date
      if (input.transactionType === 'scheduled' && !input.scheduledDate) {
        return c.json(
          {
            code: 'BAD_REQUEST', error: 'Data de agendamento é obrigatória para transações agendadas',
          },
          400
        );
      }

      const sanitizedPixKey = assertValidPixKeyValue(input.pixKeyType, input.pixKey);

      const { data, error } = await supabase
        .from('pix_transactions')
        .insert({
          amount: input.amount,
          completed_at: input.transactionType !== 'scheduled' ? new Date().toISOString() : null,
          description: input.description,
          end_to_end_id: `E${Date.now()}${Math.random().toString(36).slice(2)}`,
          pix_key: sanitizedPixKey,
          pix_key_type: input.pixKeyType,
          recipient_document: input.recipientDocument,
          recipient_name: input.recipientName,
          scheduled_date: input.scheduledDate,
          status: input.transactionType === 'scheduled' ? 'pending' : 'processing',
          transaction_id: `TXN${Date.now()}`,
          transaction_type: input.transactionType,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar transação PIX: ${error.message}`);
      }

      // Log high-value transactions
      if (input.amount >= LARGE_PIX_AMOUNT_THRESHOLD) {
        secureLogger.warn('High-value PIX transaction', {
          amount: input.amount, requestId, transactionId: data.id, transactionType: input.transactionType, userId: user.id,
        });
      }

      // Simulate instant processing for non-scheduled transactions
      if (input.transactionType !== 'scheduled') {
        await supabase
          .from('pix_transactions')
          .update({ status: 'completed' })
          .eq('id', data.id);
      }

      secureLogger.info('PIX transaction created', {
        amount: input.amount, requestId, transactionId: data.id, transactionType: input.transactionType, userId: user.id,
      });

      return c.json({
        data,
        meta: {
          createdAt: new Date().toISOString(), requestId,
        },
      }, 201);
    } catch (error) {
      secureLogger.error('Failed to create PIX transaction', {
        amount: input.amount, error: error instanceof Error ? error.message : 'Unknown error', pixKeyType: input.pixKeyType, requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_TRANSACTION_CREATE_ERROR', error: 'Failed to create PIX transaction',
        },
        500
      );
    }
  }
);

// =====================================================
// PIX QR Codes
// =====================================================

/**
 * Generate a PIX QR Code with optional amount/expiration under rate limiting.
 */
pixRouter.post(
  '/qr-codes',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 QR codes per minute per user
    message: 'Too many QR code generation attempts, please try again later',
  }),
  zValidator('json', generateQRCodeSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const expiresAt = input.expiresInMinutes
        ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString()
        : null;

      const qrCodeData = `00020126580014br.gov.bcb.pix0136${input.pixKey}520400005303986${
        input.amount ? `540${input.amount.toFixed(2)}` : ''
      }5802BR5913${input.description || 'AegisWallet'}6009SAO PAULO62070503***6304XXXX`;

      const { data, error } = await supabase
        .from('pix_qr_codes')
        .insert({
          amount: input.amount,
          description: input.description,
          expires_at: expiresAt,
          is_active: true,
          max_uses: input.maxUses,
          pix_key: input.pixKey,
          qr_code_data: qrCodeData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao gerar QR Code: ${error.message}`);
      }

      secureLogger.info('PIX QR code created', {
        amount: input.amount, expiresAt, qrCodeId: data.id, requestId, userId: user.id,
      });

      return c.json({
        data,
        meta: {
          createdAt: new Date().toISOString(), requestId,
        },
      }, 201);
    } catch (error) {
      secureLogger.error('Failed to generate PIX QR code', {
        amount: input.amount, error: error instanceof Error ? error.message : 'Unknown error', requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_QR_CREATE_ERROR', error: 'Failed to generate PIX QR code',
        },
        500
      );
    }
  }
);

/**
 * Get user's QR codes
 */
pixRouter.get(
  '/qr-codes',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('pix_qr_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar QR Codes: ${error.message}`);
      }

      return c.json({
        data: data || [],
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get PIX QR codes', {
        error: error instanceof Error ? error.message : 'Unknown error', requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_QR_CODES_ERROR', error: 'Failed to retrieve PIX QR codes',
        },
        500
      );
    }
  }
);

/**
 * Deactivate QR Code
 */
pixRouter.delete(
  '/qr-codes/:id',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 deactivations per minute per user
    message: 'Too many deactivation attempts, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const qrCodeId = c.req.param('id');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('pix_qr_codes')
        .update({ is_active: false })
        .eq('id', qrCodeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao desativar QR Code: ${error.message}`);
      }

      if (!data) {
        return c.json(
          {
            code: 'NOT_FOUND', error: 'QR Code não encontrado',
          },
          404
        );
      }

      secureLogger.info('PIX QR code deactivated', {
        qrCodeId, requestId, userId: user.id,
      });

      return c.json({
        data: { id: qrCodeId, success: true },
        meta: {
          deactivatedAt: new Date().toISOString(), requestId,
        },
      });
    } catch (error) {
      secureLogger.error('Failed to deactivate PIX QR code', {
        error: error instanceof Error ? error.message : 'Unknown error', qrCodeId, requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_QR_DEACTIVATE_ERROR', error: 'Failed to deactivate PIX QR code',
        },
        500
      );
    }
  }
);

// =====================================================
// PIX Statistics
// =====================================================

/**
 * Get PIX statistics for a period
 */
pixRouter.get(
  '/stats',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  zValidator('query', getStatsSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .rpc('get_pix_stats', {
          p_period: input.period,
          p_user_id: user.id,
        })
        .single();

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      return c.json({
        data,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get PIX statistics', {
        error: error instanceof Error ? error.message : 'Unknown error', requestId, userId: user.id,
      });

      return c.json(
        {
          code: 'PIX_STATS_ERROR', error: 'Failed to retrieve PIX statistics',
        },
        500
      );
    }
  }
);

export default pixRouter;

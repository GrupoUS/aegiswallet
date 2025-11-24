/**
 * PIX tRPC Router
 * Handles all PIX-related operations: keys, transactions, QR codes
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { PIX_PATTERNS } from '@/lib/security/financial-validator';
import { logError, logOperation, logSecurityEvent } from '@/server/lib/logger';
import { transactionRateLimit } from '@/server/middleware/rateLimitMiddleware';
import { protectedProcedure, router } from '@/server/trpc-helpers';
import type { Database } from '@/types/database.types';

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
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Formato inválido para chave PIX do tipo ${type.toUpperCase()}.`,
    });
  }

  return sanitizedValue;
};

const LARGE_PIX_AMOUNT_THRESHOLD = 50000;

// =====================================================
// PIX Router
// =====================================================

export const pixRouter = router({
  // =====================================================
  // PIX Keys Management
  // =====================================================

  /**
   * Retrieve all active PIX keys for the authenticated user ordered by favorites and recency.
   *
   * @returns Array of PIX keys.
   */
  getKeys: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('pix_keys')
      .select('*')
      .eq('user_id', ctx.user.id)
      .eq('is_active', true)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erro ao buscar chaves PIX: ${error.message}`,
      });
    }

    return data as Database['public']['Tables']['pix_keys']['Row'][];
  }),

  /**
   * Get favorite PIX keys
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('pix_keys')
      .select('*')
      .eq('user_id', ctx.user.id)
      .eq('is_active', true)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erro ao buscar favoritos: ${error.message}`,
      });
    }

    return data as Database['public']['Tables']['pix_keys']['Row'][];
  }),

  /**
   * Create a PIX key after validating the key format for the selected type.
   *
   * Security:
   * - Sanitizes CPF/CNPJ/phone formats.
   * - Logs creation events for auditing.
   */
  createKey: protectedProcedure.input(createPixKeySchema).mutation(async ({ ctx, input }) => {
    try {
      const sanitizedKeyValue = assertValidPixKeyValue(input.keyType, input.keyValue);

      const { data, error } = await ctx.supabase
        .from('pix_keys')
        .insert({
          is_active: true,
          is_favorite: input.isFavorite,
          key_type: input.keyType,
          key_value: sanitizedKeyValue,
          label: input.label,
          user_id: ctx.user.id,
        })
        .select()
        .single();

      if (error) {
        logError('pix_key_create_failed', ctx.user.id, error, {
          keyType: input.keyType,
        });
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Esta chave PIX já está cadastrada',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar chave PIX',
        });
      }

      logOperation('pix_key_created', ctx.user.id, 'pix_keys', data.id, {
        isFavorite: input.isFavorite,
        keyType: input.keyType,
      });
      logSecurityEvent('pix_key_created', ctx.user.id, {
        keyType: input.keyType,
      });

      return data as Database['public']['Tables']['pix_keys']['Row'];
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      logError('pix_key_create_unexpected', ctx.user.id, error as Error, {
        keyType: input.keyType,
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao criar chave PIX',
      });
    }
  }),

  /**
   * Update PIX key (toggle favorite, update label)
   */
  updateKey: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isFavorite: z.boolean().optional(),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};
      if (input.isFavorite !== undefined) {
        updates.is_favorite = input.isFavorite;
      }
      if (input.label !== undefined) {
        updates.label = input.label;
      }

      const { data, error } = await ctx.supabase
        .from('pix_keys')
        .update(updates)
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao atualizar chave PIX: ${error.message}`,
        });
      }
      return data;
    }),

  /**
   * Soft delete a PIX key (marks as inactive) while logging the security event.
   */
  deleteKey: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await ctx.supabase
          .from('pix_keys')
          .update({ is_active: false })
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          logError('pix_key_delete_failed', ctx.user.id, error, {
            pixKeyId: input.id,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar chave PIX',
          });
        }

        if (!data) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Chave PIX não encontrada',
          });
        }

        logSecurityEvent('pix_key_deleted', ctx.user.id, {
          pixKeyId: input.id,
        });

        return { id: input.id, success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('pix_key_delete_unexpected', ctx.user.id, error as Error, {
          pixKeyId: input.id,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar chave PIX',
        });
      }
    }),

  // =====================================================
  // PIX Transactions
  // =====================================================

  /**
   * Get PIX transactions with filters
   */
  getTransactions: protectedProcedure.input(getTransactionsSchema).query(async ({ ctx, input }) => {
    let query = ctx.supabase
      .from('pix_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', ctx.user.id)
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
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erro ao buscar transações: ${error.message}`,
      });
    }

    return {
      hasMore: (count || 0) > input.offset + input.limit,
      total: count || 0,
      transactions: data as Database['public']['Tables']['pix_transactions']['Row'][],
    };
  }),

  /**
   * Get single transaction by ID
   */
  getTransaction: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('pix_transactions')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transação não encontrada',
        });
      }

      return data as Database['public']['Tables']['pix_transactions']['Row'];
    }),

  /**
   * Create a PIX transaction (sent/received/scheduled) with input validation and rate limiting.
   *
   * Security:
   * - Applies transaction rate limiting to mitigate abuse.
   * - Logs high-value transactions as security events.
   * - Validates scheduled date and PIX key format.
   */
  createTransaction: protectedProcedure
    .use(async ({ ctx, next }) => {
      await transactionRateLimit({ ctx, next: async () => {} });
      return next();
    })
    .input(createPixTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate scheduled date
        if (input.transactionType === 'scheduled' && !input.scheduledDate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Data de agendamento é obrigatória para transações agendadas',
          });
        }

        const sanitizedPixKey = assertValidPixKeyValue(input.pixKeyType, input.pixKey);

        const { data, error } = await ctx.supabase
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
            user_id: ctx.user.id,
          })
          .select()
          .single();

        if (error) {
          logError('pix_transaction_create_failed', ctx.user.id, error, {
            amount: input.amount,
            pixKeyType: input.pixKeyType,
          });
          logSecurityEvent('pix_transaction_failed', ctx.user.id, {
            amount: input.amount,
            pixKeyType: input.pixKeyType,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar transação PIX',
          });
        }

        if (input.amount >= LARGE_PIX_AMOUNT_THRESHOLD) {
          logSecurityEvent('pix_transaction_high_value', ctx.user.id, {
            amount: input.amount,
            transactionId: data.id,
            transactionType: input.transactionType,
          });
        }

        // Simulate instant processing for non-scheduled transactions
        if (input.transactionType !== 'scheduled') {
          await ctx.supabase
            .from('pix_transactions')
            .update({ status: 'completed' })
            .eq('id', data.id);
        }

        logOperation('pix_transaction_created', ctx.user.id, 'pix_transactions', data.id, {
          amount: input.amount,
          transactionType: input.transactionType,
        });

        return data as Database['public']['Tables']['pix_transactions']['Row'];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('pix_transaction_create_unexpected', ctx.user.id, error as Error, {
          amount: input.amount,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar transação PIX',
        });
      }
    }),

  /**
   * Get PIX statistics for a period
   */
  getStats: protectedProcedure.input(getStatsSchema).query(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .rpc('get_pix_stats', {
        p_period: input.period,
        p_user_id: ctx.user.id,
      })
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erro ao buscar estatísticas: ${error.message}`,
      });
    }

    return data;
  }),

  // =====================================================
  // PIX QR Codes
  // =====================================================

  /**
   * Generate a PIX QR Code with optional amount/expiration under rate limiting.
   *
   * Security:
   * - Applies transaction-specific rate limiting to avoid abuse.
   * - Logs QR code creation for auditing.
   */
  generateQRCode: protectedProcedure
    .use(async ({ ctx, next }) => {
      await transactionRateLimit({ ctx, next: async () => {} });
      return next();
    })
    .input(generateQRCodeSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const expiresAt = input.expiresInMinutes
          ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString()
          : null;

        const qrCodeData = `00020126580014br.gov.bcb.pix0136${input.pixKey}520400005303986${
          input.amount ? `540${input.amount.toFixed(2)}` : ''
        }5802BR5913${input.description || 'AegisWallet'}6009SAO PAULO62070503***6304XXXX`;

        const { data, error } = await ctx.supabase
          .from('pix_qr_codes')
          .insert({
            amount: input.amount,
            description: input.description,
            expires_at: expiresAt,
            is_active: true,
            max_uses: input.maxUses,
            pix_key: input.pixKey,
            qr_code_data: qrCodeData,
            user_id: ctx.user.id,
          })
          .select()
          .single();

        if (error) {
          logError('pix_qr_create_failed', ctx.user.id, error, {
            amount: input.amount,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao gerar QR Code',
          });
        }

        logOperation('pix_qr_created', ctx.user.id, 'pix_qr_codes', data.id, {
          amount: input.amount,
          expiresAt,
        });
        logSecurityEvent('pix_qr_created', ctx.user.id, {
          amount: input.amount,
          qrCodeId: data.id,
        });

        return data as Database['public']['Tables']['pix_qr_codes']['Row'];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logError('pix_qr_create_unexpected', ctx.user.id, error as Error, {
          amount: input.amount,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao gerar QR Code',
        });
      }
    }),

  /**
   * Get user's QR codes
   */
  getQRCodes: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('pix_qr_codes')
      .select('*')
      .eq('user_id', ctx.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erro ao buscar QR Codes: ${error.message}`,
      });
    }

    return data as Database['public']['Tables']['pix_qr_codes']['Row'][];
  }),

  /**
   * Deactivate QR Code
   */
  deactivateQRCode: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('pix_qr_codes')
        .update({ is_active: false })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao desativar QR Code: ${error.message}`,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'QR Code não encontrado',
        });
      }

      return { id: input.id, success: true };
    }),
});

export type PixRouter = typeof pixRouter;

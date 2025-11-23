/**
 * PIX tRPC Router
 * Handles all PIX-related operations: keys, transactions, QR codes
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '@/server/trpc-helpers';
import type { Database } from '@/types/database.types';

// =====================================================
// Validation Schemas
// =====================================================

const pixKeyTypeSchema = z.enum(['email', 'cpf', 'cnpj', 'phone', 'random']);
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

// =====================================================
// PIX Router
// =====================================================

export const pixRouter = router({
  // =====================================================
  // PIX Keys Management
  // =====================================================

  /**
   * Get all PIX keys for the authenticated user
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
   * Create a new PIX key
   */
  createKey: protectedProcedure.input(createPixKeySchema).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from('pix_keys')
      .insert({
        is_active: true,
        is_favorite: input.isFavorite,
        key_type: input.keyType,
        key_value: input.keyValue,
        label: input.label,
        user_id: ctx.user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Esta chave PIX já está cadastrada',
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Erro ao criar chave PIX: ${error.message}`,
      });
    }

    return data as Database['public']['Tables']['pix_keys']['Row'];
  }),

  /**
   * Update PIX key (toggle favorite, update label)
   */
  .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = {};,

  /**
   * Delete PIX key (soft delete)
   */
  deleteKey: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('pix_keys')
        .update({ is_active: false })
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao deletar chave PIX: ${error.message}`,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chave PIX não encontrada',
        });
      }

      return { id: input.id, success: true };
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
   * Create PIX transaction (send/receive/schedule)
   */
  createTransaction: protectedProcedure
    .input(createPixTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate scheduled date
      if (input.transactionType === 'scheduled' && !input.scheduledDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Data de agendamento é obrigatória para transações agendadas',
        });
      }

      const { data, error } = await ctx.supabase
        .from('pix_transactions')
        .insert({
          user_id: ctx.user.id,
          transaction_type: input.transactionType,
          status: input.transactionType === 'scheduled' ? 'pending' : 'processing',
          amount: input.amount,
          pix_key: input.pixKey,
          pix_key_type: input.pixKeyType,
          description: input.description,
          recipient_name: input.recipientName,
          recipient_document: input.recipientDocument,
          scheduled_date: input.scheduledDate,
          // In a real implementation, you'd call PIX API here
          transaction_id: `TXN${Date.now()}`,
          end_to_end_id: `E${Date.now()}${Math.random().toString(36).slice(2)}`,
          completed_at: input.transactionType !== 'scheduled' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao criar transação: ${error.message}`,
        });
      }

      // Simulate instant processing for non-scheduled transactions
      if (input.transactionType !== 'scheduled') {
        await ctx.supabase
          .from('pix_transactions')
          .update({ status: 'completed' })
          .eq('id', data.id);
      }

      return data as Database['public']['Tables']['pix_transactions']['Row'];
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
   * Generate PIX QR Code
   */
  generateQRCode: protectedProcedure
    .input(generateQRCodeSchema)
    .mutation(async ({ ctx, input }) => {
      // Calculate expiration
      const expiresAt = input.expiresInMinutes
        ? new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString()
        : null;

      // In a real implementation, you'd generate actual BR Code here
      const qrCodeData = `00020126580014br.gov.bcb.pix0136${input.pixKey}520400005303986${input.amount ? `540${input.amount.toFixed(2)}` : ''}5802BR5913${input.description || 'AegisWallet'}6009SAO PAULO62070503***6304XXXX`;

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
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Erro ao gerar QR Code: ${error.message}`,
        });
      }

      return data as Database['public']['Tables']['pix_qr_codes']['Row'];
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

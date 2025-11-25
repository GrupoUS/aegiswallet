/**
 * PIX router for Brazilian instant payment system
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

/**
 * PIX Transaction type
 */
interface PixTransaction {
  id: string;
  user_id: string;
  pix_key: string;
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
}

/**
 * PIX QR Code type
 */
interface PixQRCode {
  id: string;
  user_id: string;
  pix_key: string;
  amount?: number;
  description?: string;
  qr_code_url: string;
  expires_at: string;
  created_at: string;
}

export const pixRouter = createTRPCRouter({
  // List PIX keys
  listKeys: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { data, error } = await ctx.supabase.from('pix_keys').select('*').eq('user_id', userId);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch PIX keys',
      });
    }

    return data ?? [];
  }),

  // Get PIX key details
  getKey: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('pix_keys')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'PIX key not found',
        });
      }

      return data;
    }),

  // Create transfer
  transfer: protectedProcedure
    .input(
      z.object({
        pixKey: z.string(),
        amount: z.number().positive(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('pix_transactions')
        .insert({
          user_id: userId,
          pix_key: input.pixKey,
          amount: input.amount,
          description: input.description,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create PIX transaction',
        });
      }

      return data as PixTransaction;
    }),

  // Get PIX transactions
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('pix_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch PIX transactions',
        });
      }

      return data ?? [];
    }),

  // Generate QR Code
  generateQRCode: protectedProcedure
    .input(
      z.object({
        pixKey: z.string(),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        expiresInMinutes: z.number().optional().default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const qrCodeId = crypto.randomUUID();
      const qrCodeUrl = `https://pix.aegiswallet.com.br/pay/${qrCodeId}`;

      const { data, error } = await ctx.supabase
        .from('pix_qr_codes')
        .insert({
          id: qrCodeId,
          user_id: userId,
          pix_key: input.pixKey,
          amount: input.amount,
          description: input.description,
          expires_at: new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString(),
          qr_code_url: qrCodeUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate QR Code',
        });
      }

      return {
        qrCode: qrCodeId,
        qrCodeUrl,
        expiresAt: new Date(Date.now() + input.expiresInMinutes * 60 * 1000).toISOString(),
      };
    }),

  // Get QR codes
  getQRCodes: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { data, error } = await ctx.supabase
      .from('pix_qr_codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch QR codes',
      });
    }

    return data ?? [];
  }),

  // Deactivate QR code
  deactivateQRCode: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { error } = await ctx.supabase
        .from('pix_qr_codes')
        .update({ status: 'inactive' })
        .eq('id', input.id)
        .eq('user_id', userId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to deactivate QR code',
        });
      }

      return { success: true };
    }),

  // Update transaction status
  updateTransaction: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['pending', 'completed', 'failed']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { error } = await ctx.supabase
        .from('pix_transactions')
        .update({
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', userId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update transaction',
        });
      }

      return { success: true };
    }),
});

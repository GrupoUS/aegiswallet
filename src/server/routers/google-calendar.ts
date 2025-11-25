/**
 * Google Calendar tRPC Router
 * Handles Google Calendar sync operations, settings, and status
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { CalendarSyncSettings } from '@/types/google-calendar';
import { protectedProcedure, router } from '@/server/trpc-helpers';

export const googleCalendarRouter = router({
  /**
   * Get sync status for the authenticated user
   * Returns whether Google Calendar is connected and last sync information
   */
  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if user has Google Calendar tokens (indicates connection)
      const { data: tokens, error: tokensError } = await ctx.supabase
        .from('google_calendar_tokens')
        .select('id, google_user_email, updated_at')
        .eq('user_id', ctx.user.id)
        .maybeSingle();

      if (tokensError && tokensError.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao verificar status de conexão',
          cause: tokensError,
        });
      }

      const isConnected = !!tokens;

      // Get last sync information from settings
      const { data: settings, error: settingsError } = await ctx.supabase
        .from('calendar_sync_settings')
        .select('last_full_sync_at, sync_enabled')
        .eq('user_id', ctx.user.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar configurações de sincronização',
          cause: settingsError,
        });
      }

      return {
        isConnected,
        isEnabled: settings?.sync_enabled ?? false,
        lastSyncAt: settings?.last_full_sync_at ?? null,
        googleEmail: tokens?.google_user_email ?? null,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar status de sincronização',
        cause: error,
      });
    }
  }),

  /**
   * Get sync settings for the authenticated user
   * Returns user's Google Calendar sync preferences
   */
  getSyncSettings: protectedProcedure.query(async ({ ctx }): Promise<CalendarSyncSettings | null> => {
    try {
      const { data, error } = await ctx.supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', ctx.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar configurações de sincronização',
          cause: error,
        });
      }

      if (!data) {
        return null;
      }

      return {
        user_id: data.user_id,
        sync_enabled: data.sync_enabled ?? false,
        sync_direction: (data.sync_direction as CalendarSyncSettings['sync_direction']) ?? 'one_way_to_google',
        sync_financial_amounts: data.sync_financial_amounts ?? false,
        sync_categories: data.sync_categories,
        last_full_sync_at: data.last_full_sync_at,
        sync_token: data.sync_token,
        auto_sync_interval_minutes: data.auto_sync_interval_minutes ?? 15,
        created_at: data.created_at ?? new Date().toISOString(),
        updated_at: data.updated_at ?? new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar configurações de sincronização',
        cause: error,
      });
    }
  }),

  /**
   * Update sync settings for the authenticated user
   */
  updateSyncSettings: protectedProcedure
    .input(
      z.object({
        sync_enabled: z.boolean().optional(),
        sync_direction: z.enum(['one_way_to_google', 'one_way_from_google', 'bidirectional']).optional(),
        sync_financial_amounts: z.boolean().optional(),
        sync_categories: z.array(z.string()).nullable().optional(),
        auto_sync_interval_minutes: z.number().min(1).max(1440).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (input.sync_enabled !== undefined) {
          updateData.sync_enabled = input.sync_enabled;
        }
        if (input.sync_direction !== undefined) {
          updateData.sync_direction = input.sync_direction;
        }
        if (input.sync_financial_amounts !== undefined) {
          updateData.sync_financial_amounts = input.sync_financial_amounts;
        }
        if (input.sync_categories !== undefined) {
          updateData.sync_categories = input.sync_categories;
        }
        if (input.auto_sync_interval_minutes !== undefined) {
          updateData.auto_sync_interval_minutes = input.auto_sync_interval_minutes;
        }

        // Try to update existing settings
        const { data: existing } = await ctx.supabase
          .from('calendar_sync_settings')
          .select('user_id')
          .eq('user_id', ctx.user.id)
          .maybeSingle();

        let result;
        if (existing) {
          // Update existing
          const { data, error } = await ctx.supabase
            .from('calendar_sync_settings')
            .update(updateData)
            .eq('user_id', ctx.user.id)
            .select()
            .single();

          if (error) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Erro ao atualizar configurações',
              cause: error,
            });
          }
          result = data;
        } else {
          // Create new settings with defaults
          const { data, error } = await ctx.supabase
            .from('calendar_sync_settings')
            .insert({
              user_id: ctx.user.id,
              sync_enabled: input.sync_enabled ?? false,
              sync_direction: input.sync_direction ?? 'one_way_to_google',
              sync_financial_amounts: input.sync_financial_amounts ?? false,
              sync_categories: input.sync_categories ?? null,
              auto_sync_interval_minutes: input.auto_sync_interval_minutes ?? 15,
              ...updateData,
            })
            .select()
            .single();

          if (error) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Erro ao criar configurações',
              cause: error,
            });
          }
          result = data;
        }

        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar configurações de sincronização',
          cause: error,
        });
      }
    }),

  /**
   * Request a full sync with Google Calendar
   */
  requestFullSync: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // This would typically trigger an Edge Function or background job
      // For now, we'll just return a success response
      // The actual sync logic should be in the Edge Function
      return {
        success: true,
        message: 'Sincronização completa solicitada',
        processed: 0,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao solicitar sincronização completa',
        cause: error,
      });
    }
  }),

  /**
   * Request an incremental sync with Google Calendar
   */
  requestIncrementalSync: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // This would typically trigger an Edge Function or background job
      // For now, we'll just return a success response
      return {
        success: true,
        processed: 0,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao solicitar sincronização incremental',
        cause: error,
      });
    }
  }),

  /**
   * Sync a single event
   */
  syncEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        direction: z.enum(['to_google', 'from_google']).default('to_google'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // This would typically sync a single event
        // For now, we'll just return a success response
        return {
          success: true,
          eventId: input.eventId,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao sincronizar evento',
          cause: error,
        });
      }
    }),

  /**
   * Get sync history/audit logs
   */
  getSyncHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input?.limit ?? 50;

        const { data, error } = await ctx.supabase
          .from('calendar_sync_audit')
          .select('*')
          .eq('user_id', ctx.user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar histórico de sincronização',
            cause: error,
          });
        }

        return data ?? [];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar histórico de sincronização',
          cause: error,
        });
      }
    }),
});


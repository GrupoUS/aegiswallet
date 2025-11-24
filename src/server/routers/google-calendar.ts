import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from '@/server/context';
import { logError, logOperation } from '@/server/lib/logger';
import type { CalendarSyncSettings } from '../../types/google-calendar';
import { protectedProcedure, router } from '../trpc-helpers';

const MIN_SYNC_INTERVAL_MINUTES = 5;

const requireValidGoogleToken = async (ctx: Context) => {
  const { data, error } = await ctx.supabase
    .from('google_calendar_tokens')
    .select('id, google_user_email, expiry_timestamp')
    .eq('user_id', ctx.user.id)
    .single();

  if (error || !data) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Conecte sua conta do Google antes de sincronizar.',
    });
  }

  if (data.expiry_timestamp && new Date(data.expiry_timestamp) < new Date()) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token expirado. Refaça a autenticação com o Google Calendar.',
    });
  }

  return data;
};

export const googleCalendarRouter = router({
  /**
   * List audit events for Google Calendar sync activity (most recent first).
   *
   * @param limit Número máximo de registros (1-50).
   */
  getSyncHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const { data, error } = await ctx.supabase
          .from('calendar_sync_audit')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(input.limit);

        if (error) {
          logError('google_calendar_sync_history', userId, error, {
            limit: input.limit,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Não foi possível carregar o histórico de sincronização.',
          });
        }

        return data;
      } catch (error) {
        logError('google_calendar_sync_history_unexpected', ctx.user.id, error as Error, {
          limit: input.limit,
        });
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Não foi possível carregar o histórico de sincronização.',
            });
      }
    }),
  /**
   * Fetch the user's Google Calendar sync settings (direction, interval, categories).
   */
  getSyncSettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;
      const { data, error } = await ctx.supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logError('google_calendar_get_settings', userId, error, {});
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Não foi possível carregar as configurações de sincronização.',
        });
      }

      return (data as CalendarSyncSettings | null) ?? null;
    } catch (error) {
      logError('google_calendar_get_settings_unexpected', ctx.user.id, error as Error, {});
      throw error instanceof TRPCError
        ? error
        : new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Não foi possível carregar as configurações de sincronização.',
          });
    }
  }),
  /**
   * Return the user's Google Calendar connection status (token, settings, last sync).
   */
  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.user.id;

      const { data: settings } = await ctx.supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: tokens } = await ctx.supabase
        .from('google_calendar_tokens')
        .select('google_user_email, updated_at, expiry_timestamp')
        .eq('user_id', userId)
        .single();

      const { data: lastSync } = await ctx.supabase
        .from('calendar_sync_audit')
        .select('created_at, details')
        .eq('user_id', userId)
        .eq('action', 'sync_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        email: tokens?.google_user_email,
        isConnected: !!tokens,
        lastSync: lastSync?.created_at,
        settings: settings as CalendarSyncSettings | null,
        tokenExpiry: tokens?.expiry_timestamp,
      };
    } catch (error) {
      logError('google_calendar_sync_status', ctx.user.id, error as Error, {});
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Não foi possível carregar o status de sincronização.',
      });
    }
  }),
  /**
   * Trigger a full sync (pull + push) between Supabase and Google Calendar.
   *
   * Requer token Google válido e é indicado após invalidar o sync token incremental.
   */
  requestFullSync: protectedProcedure.mutation(async ({ ctx }) => {
    await requireValidGoogleToken(ctx);

    const { data, error } = await ctx.supabase.functions.invoke('google-calendar-sync', {
      body: { action: 'full_sync' },
    });

    if (error) {
      logError('google_calendar_full_sync', ctx.user.id, error, {});
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao iniciar sincronização completa.',
      });
    }
    if (data?.error) {
      logError('google_calendar_full_sync_response', ctx.user.id, new Error(data.error), {});
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: data.error,
      });
    }

    logOperation('google_calendar_full_sync_requested', ctx.user.id, 'calendar_sync', undefined, {});
    return data;
  }),
  /**
   * Trigger an incremental sync usando o último sync token válido.
   *
   * Caso o token esteja inválido, o erro orienta a iniciar uma sincronização completa.
   */
  requestIncrementalSync: protectedProcedure.mutation(async ({ ctx }) => {
    await requireValidGoogleToken(ctx);

    const { data, error } = await ctx.supabase.functions.invoke('google-calendar-sync', {
      body: { action: 'incremental_sync' },
    });

    if (error) {
      logError('google_calendar_incremental_sync', ctx.user.id, error, {});
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao iniciar sincronização incremental.',
      });
    }

    if (data?.error) {
      const isTokenError = data.error.toLowerCase().includes('token');
      logError('google_calendar_incremental_sync_response', ctx.user.id, new Error(data.error), {});
      throw new TRPCError({
        code: isTokenError ? 'FAILED_PRECONDITION' : 'BAD_REQUEST',
        message: isTokenError
          ? 'Token de sincronização inválido. Execute uma sincronização completa.'
          : data.error,
      });
    }

    return data;
  }),
  /**
   * Sync a single event either from Supabase → Google or the inverse.
   *
   * @param direction `to_google` envia alterações locais; `from_google` puxa atualizações remotas.
   */
  syncEvent: protectedProcedure
    .input(
      z.object({
        direction: z.enum(['to_google', 'from_google']).default('to_google'),
        eventId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireValidGoogleToken(ctx);

      const { data, error } = await ctx.supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: input.direction === 'to_google' ? 'sync_to_google' : 'sync_from_google',
          event_id: input.eventId,
        },
      });

      if (error) {
        logError('google_calendar_sync_event', ctx.user.id, error, {
          direction: input.direction,
          eventId: input.eventId,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao sincronizar o evento selecionado.',
        });
      }
      if (data.error) {
        logError('google_calendar_sync_event_response', ctx.user.id, new Error(data.error), {
          direction: input.direction,
          eventId: input.eventId,
        });
        throw new TRPCError({ code: 'BAD_REQUEST', message: data.error });
      }

      logOperation('google_calendar_event_synced', ctx.user.id, 'calendar_sync', input.eventId, {
        direction: input.direction,
      });
      return data;
    }),
  /**
   * Update Google Calendar sync settings (direção, categorias, intervalo automático).
   *
   * Validações:
   * - `auto_sync_interval_minutes` mínimo de 5 minutos.
   * - `sync_categories` deve conter UUIDs válidos ou ser `null` (todas as categorias).
   */
  updateSyncSettings: protectedProcedure
    .input(
      z
        .object({
          auto_sync_interval_minutes: z.number().min(MIN_SYNC_INTERVAL_MINUTES).optional(),
          sync_categories: z.array(z.string().uuid()).nullable().optional(),
          sync_direction: z
            .enum(['one_way_to_google', 'one_way_from_google', 'bidirectional'])
            .optional(),
          sync_enabled: z.boolean().optional(),
          sync_financial_amounts: z.boolean().optional(),
        })
        .superRefine((data, ctx) => {
          if (
            data.auto_sync_interval_minutes !== undefined &&
            data.auto_sync_interval_minutes < MIN_SYNC_INTERVAL_MINUTES
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `O intervalo mínimo é de ${MIN_SYNC_INTERVAL_MINUTES} minutos.`,
              path: ['auto_sync_interval_minutes'],
            });
          }

          if (data.sync_categories && data.sync_categories.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Selecione ao menos uma categoria ou deixe em branco para sincronizar todas.',
              path: ['sync_categories'],
            });
          }
        })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const timestamp = new Date().toISOString();
        const payload = {
          auto_sync_interval_minutes: input.auto_sync_interval_minutes,
          sync_categories: input.sync_categories ?? null,
          sync_direction: input.sync_direction,
          sync_enabled: input.sync_enabled,
          sync_financial_amounts: input.sync_financial_amounts,
          updated_at: timestamp,
          user_id: userId,
        };

        const { data, error } = await ctx.supabase
          .from('calendar_sync_settings')
          .upsert(payload, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) {
          logError('google_calendar_update_settings', userId, error, payload);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Não foi possível salvar as configurações de sincronização.',
          });
        }

        // Audit log (best effort)
        await ctx.supabase.from('calendar_sync_audit').insert({
          action: 'event_updated',
          details: {
            source: 'sync_settings',
            updatedAt: timestamp,
          },
          user_id: userId,
        });

        logOperation('google_calendar_settings_updated', userId, 'calendar_sync', undefined, {
          syncDirection: input.sync_direction,
        });

        return data as CalendarSyncSettings;
      } catch (error) {
        logError('google_calendar_update_settings_unexpected', ctx.user.id, error as Error, input);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Não foi possível salvar as configurações de sincronização.',
            });
      }
    }),
});

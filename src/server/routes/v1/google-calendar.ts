/**
 * Google Calendar Sync API - Hono RPC Implementation
 * Handles Google Calendar sync operations, settings, and status
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import type { CalendarSyncSettings } from '@/types/google-calendar';

const googleCalendarRouter = new Hono<AppEnv>();

// =====================================================
// Validation Schemas
// =====================================================

const updateSettingsSchema = z.object({
  auto_sync_interval_minutes: z.number().min(1).max(1440).optional(),
  sync_categories: z.array(z.string()).nullable().optional(),
  sync_direction: z.enum(['one_way_to_google', 'one_way_from_google', 'bidirectional']).optional(),
  sync_enabled: z.boolean().optional(),
  sync_financial_amounts: z.boolean().optional(),
});

const syncEventSchema = z.object({
  direction: z.enum(['to_google', 'from_google']).default('to_google'),
  eventId: z.string().uuid('ID do evento deve ser um UUID válido'),
});

const syncHistorySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
});

// =====================================================
// Query Endpoints
// =====================================================

/**
 * Get sync connection status
 * GET /v1/google-calendar/sync/status
 */
googleCalendarRouter.get(
  '/sync/status',
  authMiddleware,
  userRateLimitMiddleware({
    max: 30, // 30 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      // Check if user has Google Calendar tokens (indicates connection)
      const { data: tokens, error: tokensError } = await supabase
        .from('google_calendar_tokens')
        .select('id, google_user_email, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tokensError && tokensError.code !== 'PGRST116') {
        throw new Error(`Erro ao verificar status de conexão: ${tokensError.message}`);
      }

      const isConnected = !!tokens;

      // Get last sync information from settings
      const { data: settings, error: settingsError } = await supabase
        .from('calendar_sync_settings')
        .select('last_full_sync_at, sync_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar configurações: ${settingsError.message}`);
      }

      return c.json({
        data: {
          googleEmail: tokens?.google_user_email ?? null,
          isConnected,
          isEnabled: settings?.sync_enabled ?? false,
          lastSyncAt: settings?.last_full_sync_at ?? null,
        },
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get sync status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'SYNC_STATUS_ERROR',
          error: 'Erro ao buscar status de sincronização',
        },
        500
      );
    }
  }
);

/**
 * Get sync settings
 * GET /v1/google-calendar/sync/settings
 */
googleCalendarRouter.get(
  '/sync/settings',
  authMiddleware,
  userRateLimitMiddleware({
    max: 30, // 30 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar configurações: ${error.message}`);
      }

      if (!data) {
        return c.json({
          data: null,
          meta: {
            requestId,
            retrievedAt: new Date().toISOString(),
          },
        });
      }

      const settings: CalendarSyncSettings = {
        auto_sync_interval_minutes: data.auto_sync_interval_minutes ?? 15,
        created_at: data.created_at ?? new Date().toISOString(),
        last_full_sync_at: data.last_full_sync_at,
        sync_categories: data.sync_categories,
        sync_direction:
          (data.sync_direction as CalendarSyncSettings['sync_direction']) ?? 'one_way_to_google',
        sync_enabled: data.sync_enabled ?? false,
        sync_financial_amounts: data.sync_financial_amounts ?? false,
        sync_token: data.sync_token,
        updated_at: data.updated_at ?? new Date().toISOString(),
        user_id: data.user_id,
      };

      return c.json({
        data: settings,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get sync settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'SYNC_SETTINGS_ERROR',
          error: 'Erro ao buscar configurações de sincronização',
        },
        500
      );
    }
  }
);

/**
 * Get sync audit history
 * GET /v1/google-calendar/sync/history
 */
googleCalendarRouter.get(
  '/sync/history',
  authMiddleware,
  userRateLimitMiddleware({
    max: 30, // 30 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  zValidator('query', syncHistorySchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('calendar_sync_audit')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      return c.json({
        data: data ?? [],
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get sync history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'SYNC_HISTORY_ERROR',
          error: 'Erro ao buscar histórico de sincronização',
        },
        500
      );
    }
  }
);

// =====================================================
// Mutation Endpoints
// =====================================================

/**
 * Update sync settings
 * PUT /v1/google-calendar/sync/settings
 */
googleCalendarRouter.put(
  '/sync/settings',
  authMiddleware,
  userRateLimitMiddleware({
    max: 10, // 10 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  zValidator('json', updateSettingsSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

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
      const { data: existing } = await supabase
        .from('calendar_sync_settings')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('calendar_sync_settings')
          .update(updateData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Erro ao atualizar configurações: ${error.message}`);
        }
        result = data;
      } else {
        // Create new settings with defaults
        const { data, error } = await supabase
          .from('calendar_sync_settings')
          .insert({
            auto_sync_interval_minutes: input.auto_sync_interval_minutes ?? 15,
            sync_categories: input.sync_categories ?? null,
            sync_direction: input.sync_direction ?? 'one_way_to_google',
            sync_enabled: input.sync_enabled ?? false,
            sync_financial_amounts: input.sync_financial_amounts ?? false,
            user_id: user.id,
            ...updateData,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Erro ao criar configurações: ${error.message}`);
        }
        result = data;
      }

      secureLogger.info('Sync settings updated', {
        requestId,
        updatedFields: Object.keys(input),
        userId: user.id,
      });

      return c.json({
        data: result,
        meta: {
          requestId,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to update sync settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'SYNC_SETTINGS_UPDATE_ERROR',
          error: 'Erro ao atualizar configurações de sincronização',
        },
        500
      );
    }
  }
);

/**
 * Request full sync with Google Calendar
 * POST /v1/google-calendar/sync/full
 */
googleCalendarRouter.post(
  '/sync/full',
  authMiddleware,
  userRateLimitMiddleware({
    max: 10, // 10 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  async (c) => {
    const { user } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      // This would typically trigger an Edge Function or background job
      // For now, we'll just return a success response
      // TODO: Integrate with Edge Function for actual sync

      secureLogger.info('Full sync requested', {
        requestId,
        userId: user.id,
      });

      return c.json({
        data: {
          message: 'Sincronização completa solicitada',
          processed: 0,
          success: true,
        },
        meta: {
          requestId,
          requestedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to request full sync', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'FULL_SYNC_ERROR',
          error: 'Erro ao solicitar sincronização completa',
        },
        500
      );
    }
  }
);

/**
 * Request incremental sync with Google Calendar
 * POST /v1/google-calendar/sync/incremental
 */
googleCalendarRouter.post(
  '/sync/incremental',
  authMiddleware,
  userRateLimitMiddleware({
    max: 10, // 10 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  async (c) => {
    const { user } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      // This would typically trigger an Edge Function or background job
      // For now, we'll just return a success response
      // TODO: Integrate with Edge Function for actual sync

      secureLogger.info('Incremental sync requested', {
        requestId,
        userId: user.id,
      });

      return c.json({
        data: {
          processed: 0,
          success: true,
        },
        meta: {
          requestId,
          requestedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to request incremental sync', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'INCREMENTAL_SYNC_ERROR',
          error: 'Erro ao solicitar sincronização incremental',
        },
        500
      );
    }
  }
);

/**
 * Sync a single event
 * POST /v1/google-calendar/sync/event
 */
googleCalendarRouter.post(
  '/sync/event',
  authMiddleware,
  userRateLimitMiddleware({
    max: 10, // 10 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  zValidator('json', syncEventSchema),
  async (c) => {
    const { user } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      // This would typically sync a single event
      // For now, we'll just return a success response
      // TODO: Integrate with Edge Function for actual sync

      secureLogger.info('Event sync requested', {
        direction: input.direction,
        eventId: input.eventId,
        requestId,
        userId: user.id,
      });

      return c.json({
        data: {
          eventId: input.eventId,
          success: true,
        },
        meta: {
          requestId,
          requestedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to sync event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId: input.eventId,
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'EVENT_SYNC_ERROR',
          error: 'Erro ao sincronizar evento',
        },
        500
      );
    }
  }
);

export default googleCalendarRouter;


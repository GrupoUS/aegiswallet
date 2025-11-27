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
        google_channel_id: data.google_channel_id ?? null,
        google_resource_id: data.google_resource_id ?? null,
        channel_expiry_at: data.channel_expiry_at ?? null,
        webhook_secret: data.webhook_secret ?? null,
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

      let result: CalendarSyncSettings | null = null;

      // Helper to transform database row to CalendarSyncSettings
      // The database row has nullable fields, we need to provide defaults
      const transformToSettings = (data: {
        auto_sync_interval_minutes: number | null;
        channel_expiry_at: string | null;
        created_at: string | null;
        google_channel_id: string | null;
        google_resource_id: string | null;
        last_full_sync_at: string | null;
        sync_categories: string[] | null;
        sync_direction: string | null;
        sync_enabled: boolean | null;
        sync_financial_amounts: boolean | null;
        sync_token: string | null;
        updated_at: string | null;
        user_id: string;
        webhook_secret: string | null;
      }): CalendarSyncSettings => ({
        auto_sync_interval_minutes: data.auto_sync_interval_minutes ?? 15,
        channel_expiry_at: data.channel_expiry_at ?? null,
        created_at: data.created_at ?? new Date().toISOString(),
        google_channel_id: data.google_channel_id ?? null,
        google_resource_id: data.google_resource_id ?? null,
        last_full_sync_at: data.last_full_sync_at ?? null,
        sync_categories: data.sync_categories ?? null,
        sync_direction:
          (data.sync_direction as CalendarSyncSettings['sync_direction']) ?? 'one_way_to_google',
        sync_enabled: data.sync_enabled ?? false,
        sync_financial_amounts: data.sync_financial_amounts ?? false,
        sync_token: data.sync_token ?? null,
        updated_at: data.updated_at ?? new Date().toISOString(),
        user_id: data.user_id,
        webhook_secret: data.webhook_secret ?? null,
      });

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
        result = data ? transformToSettings(data) : null;
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
        result = data ? transformToSettings(data) : null;
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
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      // Get auth token for Edge Function call
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      // Invoke Edge Function for full sync
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'full_sync' },
        headers: {
          Authorization: authHeader,
        },
      });

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      // Update last_full_sync_at in settings
      await supabase
        .from('calendar_sync_settings')
        .update({ last_full_sync_at: new Date().toISOString() })
        .eq('user_id', user.id);

      secureLogger.info('Full sync completed', {
        processed: data.processed,
        errors: data.errors,
        requestId,
        userId: user.id,
      });

      return c.json({
        data: {
          message: 'Sincronização completa realizada',
          processed: data.processed || 0,
          errors: data.errors || 0,
          success: data.success,
        },
        meta: {
          requestId,
          completedAt: new Date().toISOString(),
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
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      // Get auth token for Edge Function call
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      // Invoke Edge Function for incremental sync
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'incremental_sync' },
        headers: {
          Authorization: authHeader,
        },
      });

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      secureLogger.info('Incremental sync completed', {
        processed: data.processed,
        errors: data.errors,
        requestId,
        userId: user.id,
      });

      return c.json({
        data: {
          processed: data.processed || 0,
          errors: data.errors || 0,
          success: data.success,
        },
        meta: {
          requestId,
          completedAt: new Date().toISOString(),
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
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      // Get auth token for Edge Function call
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      // Determine action based on direction
      const action = input.direction === 'to_google' ? 'sync_to_google' : 'sync_from_google';
      const bodyKey = input.direction === 'to_google' ? 'event_id' : 'google_event_id';

      // Invoke Edge Function for event sync
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action,
          [bodyKey]: input.eventId,
        },
        headers: {
          Authorization: authHeader,
        },
      });

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      secureLogger.info('Event sync completed', {
        direction: input.direction,
        eventId: input.eventId,
        requestId,
        success: data.success,
        userId: user.id,
      });

      return c.json({
        data: {
          eventId: input.eventId,
          google_id: data.google_id,
          success: data.success,
        },
        meta: {
          requestId,
          completedAt: new Date().toISOString(),
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

/**
 * Renew webhook channel
 * POST /v1/google-calendar/sync/channel/renew
 */
googleCalendarRouter.post(
  '/sync/channel/renew',
  authMiddleware,
  userRateLimitMiddleware({
    max: 5, // 5 requests per minute per user
    message: 'Muitas requisições, tente novamente mais tarde',
    windowMs: 60 * 1000, // 1 minute
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      // Check if channel is expiring soon
      const { data: settings } = await supabase
        .from('calendar_sync_settings')
        .select('channel_expiry_at')
        .eq('user_id', user.id)
        .single() as { data: { channel_expiry_at: string | null } | null };

      if (!settings?.channel_expiry_at) {
        throw new Error('No active channel found');
      }

      const expiryDate = new Date(settings.channel_expiry_at);
      const now = new Date();
      const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilExpiry > 24) {
        return c.json({
          data: {
            message: 'Channel does not need renewal yet',
            expiry_at: settings.channel_expiry_at,
            hours_until_expiry: hoursUntilExpiry,
          },
          meta: {
            requestId,
          },
        });
      }

      // Get auth token for Edge Function call
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }

      // Invoke Edge Function to renew channel
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'renew_channel' },
        headers: {
          Authorization: authHeader,
        },
      });

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      secureLogger.info('Channel renewed', {
        channel_id: data.channel_id,
        expiry_at: data.expiry_at,
        requestId,
        userId: user.id,
      });

      return c.json({
        data: {
          message: 'Channel renewed successfully',
          channel_id: data.channel_id,
          expiry_at: data.expiry_at,
        },
        meta: {
          requestId,
          renewedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to renew channel', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'CHANNEL_RENEWAL_ERROR',
          error: 'Erro ao renovar canal de webhook',
        },
        500
      );
    }
  }
);

/**
 * Get sync conflicts
 * GET /v1/google-calendar/sync/conflicts
 */
googleCalendarRouter.get(
  '/sync/conflicts',
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
      // Query audit log for conflict entries
      const { data, error } = await supabase
        .from('calendar_sync_audit')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'sync_failed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Erro ao buscar conflitos: ${error.message}`);
      }

      // Filter for actual conflicts (not just errors)
      const conflicts = (data || []).filter(
        (entry) => entry.details && typeof entry.details === 'object' && 'conflict' in entry.details
      );

      return c.json({
        data: conflicts,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get conflicts', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'CONFLICTS_ERROR',
          error: 'Erro ao buscar conflitos de sincronização',
        },
        500
      );
    }
  }
);

export default googleCalendarRouter;

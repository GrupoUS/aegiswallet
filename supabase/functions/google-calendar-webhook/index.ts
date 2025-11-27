import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-resource-uri',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract webhook headers
    const channelId = req.headers.get('X-Goog-Channel-ID');
    const channelToken = req.headers.get('X-Goog-Channel-Token');
    const resourceState = req.headers.get('X-Goog-Resource-State');
    const resourceId = req.headers.get('X-Goog-Resource-ID');

    console.log('Webhook received:', {
      channelId,
      resourceState,
      resourceId,
    });

    // Verify webhook token
    if (!channelId || !channelToken) {
      console.error('Missing channel ID or token');
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Look up user by channel ID
    const { data: settings, error: settingsError } = await supabase
      .from('calendar_sync_settings')
      .select('user_id, webhook_secret, channel_expiry_at, sync_enabled')
      .eq('google_channel_id', channelId)
      .single();

    if (settingsError || !settings) {
      console.error('Channel not found:', channelId);
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Verify webhook secret
    if (settings.webhook_secret !== channelToken) {
      console.error('Invalid webhook token');
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Check if sync is enabled
    if (!settings.sync_enabled) {
      console.log('Sync disabled for user:', settings.user_id);
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Check if channel is expired
    if (settings.channel_expiry_at && new Date(settings.channel_expiry_at) < new Date()) {
      console.error('Channel expired:', channelId);
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Handle different resource states
    if (resourceState === 'sync') {
      // Initial sync notification - ignore
      console.log('Initial sync notification, ignoring');
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    if (resourceState === 'exists') {
      // Event changed - trigger incremental sync
      console.log('Event changed, triggering incremental sync for user:', settings.user_id);

      // Trigger incremental sync via Edge Function with service-role and user_id
      try {
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/google-calendar-sync?action=incremental_sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: settings.user_id,
          }),
        });

        const syncResult = await syncResponse.json();
        console.log('Incremental sync result:', syncResult);

        // Audit log
        await supabase.from('calendar_sync_audit').insert({
          user_id: settings.user_id,
          action: 'webhook_triggered',
          details: {
            message: 'Webhook triggered incremental sync',
            resource_state: resourceState,
            sync_result: syncResult,
          }
        });
      } catch (syncError) {
        console.error('Error triggering incremental sync:', syncError);

        // Log error to audit
        await supabase.from('calendar_sync_audit').insert({
          user_id: settings.user_id,
          action: 'webhook_error',
          details: {
            message: 'Failed to trigger incremental sync',
            error: syncError instanceof Error ? syncError.message : 'Unknown error',
          }
        });
      }

      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    if (resourceState === 'not_exists') {
      // Event deleted - trigger incremental sync to handle deletion
      console.log('Event deleted, triggering incremental sync for user:', settings.user_id);

      try {
        await fetch(`${supabaseUrl}/functions/v1/google-calendar-sync?action=incremental_sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: settings.user_id,
          }),
        });

        // Audit log
        await supabase.from('calendar_sync_audit').insert({
          user_id: settings.user_id,
          action: 'webhook_triggered',
          details: {
            message: 'Webhook triggered incremental sync (deletion)',
            resource_state: resourceState,
          }
        });
      } catch (syncError) {
        console.error('Error triggering incremental sync:', syncError);
      }

      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }

    // Unknown resource state
    console.log('Unknown resource state:', resourceState);
    return new Response('OK', {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', errorMessage);

    // Always return 200 to prevent Google from stopping the channel
    return new Response('OK', {
      status: 200,
      headers: corsHeaders
    });
  }
});

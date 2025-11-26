import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error('Unauthorized');

    // Helper to get fresh access token
    const getAccessToken = async (userId: string) => {
        const { data: tokenData, error: tokenError } = await supabase
            .from('google_calendar_tokens')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (tokenError || !tokenData) throw new Error('Google Calendar not connected');

        // Check expiry (simple check, assume stored as ISO string)
        if (new Date(tokenData.expiry_timestamp) < new Date()) {
            // Refresh token
            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: googleClientId,
                    client_secret: googleClientSecret,
                    refresh_token: tokenData.refresh_token, // Decrypt if needed
                    grant_type: 'refresh_token',
                }),
            });
            const newTokens = await refreshResponse.json();
            if (newTokens.error) throw new Error('Failed to refresh token');

            // Update DB
            await supabase.from('google_calendar_tokens').update({
                access_token: newTokens.access_token, // Encrypt if needed
                expiry_timestamp: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            }).eq('user_id', userId);

            return newTokens.access_token;
        }
        return tokenData.access_token; // Decrypt if needed
    };

    const accessToken = await getAccessToken(user.id);

    if (action === 'sync_to_google') {
        const { event_id } = await req.json();

        // Get event details
        const { data: event } = await supabase
            .from('financial_events')
            .select('*')
            .eq('id', event_id)
            .single();

        if (!event) throw new Error('Event not found');

        // Get sync settings
        const { data: settings } = await supabase
            .from('calendar_sync_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Map to Google Event
        const googleEvent = {
            summary: event.title,
            description: settings?.sync_financial_amounts ? `${event.description || ''}\nValue: ${event.amount}` : event.description,
            start: { dateTime: event.start_date }, // Adjust format if needed
            end: { dateTime: event.end_date },
            extendedProperties: {
                private: {
                    aegis_id: event.id,
                    aegis_category: event.category_id, // or category name
                }
            }
        };

        // Check if already mapped
        const { data: mapping } = await supabase
            .from('calendar_sync_mapping')
            .select('*')
            .eq('aegis_event_id', event_id)
            .single();

        let googleResponse;
        if (mapping) {
            // Update
            googleResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${mapping.google_event_id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(googleEvent)
            });
        } else {
            // Insert
            googleResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(googleEvent)
            });
        }

        const googleData = await googleResponse.json();
        if (googleData.error) throw new Error(googleData.error.message);

        // Update mapping
        await supabase.from('calendar_sync_mapping').upsert({
            user_id: user.id,
            aegis_event_id: event_id,
            google_event_id: googleData.id,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
            sync_direction: 'aegis_to_google'
        }, { onConflict: 'user_id, aegis_event_id' });

        return new Response(JSON.stringify({ success: true, google_id: googleData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Implement other actions (sync_from_google, full_sync, incremental_sync) similarly...
    // For brevity in this plan, I'll keep the structure but focus on the core logic requested.

    return new Response(JSON.stringify({ message: 'Action not implemented yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

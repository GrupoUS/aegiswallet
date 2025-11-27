import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Decrypt token using AES-256-GCM
const decryptToken = async (encryptedText: string, encryptionKey: string): Promise<string> => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Decode base64
  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Derive key
  const keyMaterial = encoder.encode(encryptionKey);
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial.slice(0, 32),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
};

// Helper: Encrypt token using AES-256-GCM
const encryptToken = async (text: string, encryptionKey: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Derive key from encryption key string
  const keyMaterial = encoder.encode(encryptionKey);
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial.slice(0, 32),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
    const encryptionKey = Deno.env.get('TOKENS_ENCRYPTION_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body first to check for user_id and action (service-role calls)
    let requestBody: Record<string, unknown> = {};
    try {
      const clonedReq = req.clone();
      requestBody = await clonedReq.json();
    } catch {
      // Body parsing failed, might be empty or invalid - continue
    }

    // Get action from URL query params OR request body (for supabase.functions.invoke() calls)
    const action = url.searchParams.get('action') || (requestBody.action as string);

    // Authenticate: Support both user JWT and service-role with user_id
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    const token = authHeader.replace('Bearer ', '');

    let userId: string;

    // Check if this is a service-role call (token matches service key)
    if (token === supabaseServiceKey) {
      // Service-role call: user_id must be provided in the request body
      if (!requestBody.user_id || typeof requestBody.user_id !== 'string') {
        throw new Error('user_id is required for service-role calls');
      }
      userId = requestBody.user_id;
    } else {
      // User JWT call: get user from token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) throw new Error('Unauthorized');
      userId = user.id;
    }

    // Helper to get fresh access token with decryption
    const getAccessToken = async (userId: string) => {
      const { data: tokenData, error: tokenError } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (tokenError || !tokenData) throw new Error('Google Calendar not connected');

      // Decrypt access token
      const decryptedAccessToken = await decryptToken(tokenData.access_token, encryptionKey);

      // Check expiry
      if (new Date(tokenData.expiry_timestamp) < new Date()) {
        // Decrypt refresh token
        const decryptedRefreshToken = await decryptToken(tokenData.refresh_token, encryptionKey);

        // Refresh token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            refresh_token: decryptedRefreshToken,
            grant_type: 'refresh_token',
          }),
        });

        const newTokens = await refreshResponse.json();
        if (newTokens.error) throw new Error('Failed to refresh token');

        // Encrypt new access token
        const encryptedAccessToken = await encryptToken(newTokens.access_token, encryptionKey);

        // Update DB
        await supabase.from('google_calendar_tokens').update({
          access_token: encryptedAccessToken,
          expiry_timestamp: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        }).eq('user_id', userId);

        return newTokens.access_token;
      }

      return decryptedAccessToken;
    };

    const accessToken = await getAccessToken(userId);

    // ========================================
    // ACTION: sync_to_google (Outbound Sync)
    // ========================================
    if (action === 'sync_to_google') {
      const { event_id } = requestBody.event_id ? requestBody : await req.json();

      // Get event details
      const { data: event } = await supabase
        .from('financial_events')
        .select('*')
        .eq('id', event_id)
        .single();

      // If event is not found, it may have been deleted - handle outbound delete
      if (!event) {
        // Check if there's a mapping for this event
        const { data: mapping } = await supabase
          .from('calendar_sync_mapping')
          .select('google_event_id')
          .eq('financial_event_id', event_id)
          .single();

        if (mapping?.google_event_id) {
          // Delete the event from Google Calendar
          const deleteResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${mapping.google_event_id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              }
            }
          );

          // 404/410 means already deleted - treat as success
          if (!deleteResponse.ok && deleteResponse.status !== 404 && deleteResponse.status !== 410) {
            throw new Error(`Failed to delete event from Google: ${deleteResponse.statusText}`);
          }

          // Delete the mapping
          await supabase
            .from('calendar_sync_mapping')
            .delete()
            .eq('financial_event_id', event_id);

          // Audit log
          await supabase.from('calendar_sync_audit').insert({
            user_id: userId,
            action: 'event_deleted',
            details: {
              direction: 'to_google',
              event_id,
              google_id: mapping.google_event_id
            }
          });

          return new Response(JSON.stringify({
            success: true,
            deleted: true,
            google_id: mapping.google_event_id
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // No mapping exists - event was never synced
        return new Response(JSON.stringify({
          success: true,
          skipped: true,
          reason: 'Event not found and no mapping exists'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get sync settings
      const { data: settings } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Map to Google Event
      const googleEvent = {
        summary: event.title,
        description: settings?.sync_financial_amounts
          ? `${event.description || ''}\nValue: ${event.amount}`
          : event.description,
        start: { dateTime: event.start_date },
        end: { dateTime: event.end_date },
        extendedProperties: {
          private: {
            aegis_id: event.id,
            aegis_category: event.category_id,
          }
        }
      };

      // Check if already mapped
      const { data: mapping } = await supabase
        .from('calendar_sync_mapping')
        .select('*')
        .eq('financial_event_id', event_id)
        .single();

      let googleResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          if (mapping?.google_event_id) {
            // Check for conflicts
            if (mapping.sync_source === 'google' &&
                new Date(mapping.last_modified_at) > new Date(Date.now() - 5000)) {
              // Skip if recently synced from Google (prevent loop)
              return new Response(JSON.stringify({
                success: true,
                skipped: true,
                reason: 'Recently synced from Google'
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            // Update existing event
            googleResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events/${mapping.google_event_id}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(googleEvent)
              }
            );
          } else {
            // Create new event
            googleResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(googleEvent)
              }
            );
          }

          if (googleResponse.ok) break;

          const errorData = await googleResponse.json();

          // Handle specific errors
          if (googleResponse.status === 404 || googleResponse.status === 410) {
            // Event deleted in Google, create new one
            googleResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(googleEvent)
              }
            );
            break;
          }

          throw new Error(errorData.error?.message || 'Google API error');
        } catch (err) {
          retryCount++;
          if (retryCount >= maxRetries) throw err;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      const googleData = await googleResponse!.json();
      if (googleData.error) throw new Error(googleData.error.message);

      // Update mapping with loop prevention
      await supabase.from('calendar_sync_mapping').upsert({
        user_id: userId,
        financial_event_id: event_id,
        google_event_id: googleData.id,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        sync_direction: 'aegis_to_google',
        sync_source: 'aegis',
        last_modified_at: new Date().toISOString(),
        version: (mapping?.version || 0) + 1,
      }, { onConflict: 'user_id,financial_event_id' });

      // Audit log
      await supabase.from('calendar_sync_audit').insert({
        user_id: userId,
        action: 'event_synced',
        details: {
          direction: 'to_google',
          event_id,
          google_id: googleData.id
        }
      });

      return new Response(JSON.stringify({
        success: true,
        google_id: googleData.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // ACTION: sync_from_google (Inbound Sync)
    // ========================================
    if (action === 'sync_from_google') {
      const { google_event_id } = await req.json();

      // Fetch event from Google
      const googleResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!googleResponse.ok) {
        if (googleResponse.status === 404 || googleResponse.status === 410) {
          // Event deleted in Google, delete locally
          const { data: mapping } = await supabase
            .from('calendar_sync_mapping')
            .select('financial_event_id')
            .eq('google_event_id', google_event_id)
            .single();

          if (mapping) {
            await supabase
              .from('financial_events')
              .delete()
              .eq('id', mapping.financial_event_id);

            await supabase
              .from('calendar_sync_mapping')
              .delete()
              .eq('google_event_id', google_event_id);
          }

          return new Response(JSON.stringify({
            success: true,
            deleted: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`Failed to fetch Google event: ${googleResponse.statusText}`);
      }

      const googleEvent = await googleResponse.json();

      // Check if event exists in mapping
      const { data: mapping } = await supabase
        .from('calendar_sync_mapping')
        .select('*')
        .eq('google_event_id', google_event_id)
        .single();

      // Get sync settings
      const { data: settings } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Map Google event to AegisWallet format
      const financialEvent: any = {
        user_id: userId,
        title: googleEvent.summary || 'Untitled Event',
        description: googleEvent.description || '',
        start_date: googleEvent.start.dateTime || googleEvent.start.date,
        end_date: googleEvent.end.dateTime || googleEvent.end.date,
        category_id: googleEvent.extendedProperties?.private?.aegis_category || null,
      };

      // Parse amount from description if present
      if (settings?.sync_financial_amounts && googleEvent.description) {
        const amountMatch = googleEvent.description.match(/Value:\s*([0-9.,]+)/);
        if (amountMatch) {
          financialEvent.amount = parseFloat(amountMatch[1].replace(',', ''));
        }
      }

      if (mapping) {
        // Event exists - conflict resolution
        const { data: localEvent } = await supabase
          .from('financial_events')
          .select('*')
          .eq('id', mapping.financial_event_id)
          .single();

        if (localEvent) {
          // Compare timestamps for conflict resolution
          const googleModified = new Date(googleEvent.updated);
          const localModified = new Date(mapping.last_modified_at);

          if (googleModified > localModified) {
            // Google is newer, update local
            await supabase
              .from('financial_events')
              .update(financialEvent)
              .eq('id', mapping.financial_event_id);

            // Update mapping
            await supabase
              .from('calendar_sync_mapping')
              .update({
                sync_source: 'google',
                last_modified_at: new Date().toISOString(),
                last_synced_at: new Date().toISOString(),
                version: mapping.version + 1,
              })
              .eq('google_event_id', google_event_id);

            return new Response(JSON.stringify({
              success: true,
              updated: true,
              event_id: mapping.financial_event_id
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            // Local is newer or equal, skip
            return new Response(JSON.stringify({
              success: true,
              skipped: true,
              reason: 'Local version is newer'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }

      // New event - create locally
      const { data: newEvent, error: insertError } = await supabase
        .from('financial_events')
        .insert(financialEvent)
        .select()
        .single();

      if (insertError) throw insertError;

      // Create mapping
      await supabase.from('calendar_sync_mapping').insert({
        user_id: userId,
        financial_event_id: newEvent.id,
        google_event_id: google_event_id,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        sync_direction: 'google_to_aegis',
        sync_source: 'google',
        last_modified_at: new Date().toISOString(),
        version: 1,
      });

      // Audit log
      await supabase.from('calendar_sync_audit').insert({
        user_id: userId,
        action: 'event_synced',
        details: {
          direction: 'from_google',
          event_id: newEvent.id,
          google_id: google_event_id
        }
      });

      return new Response(JSON.stringify({
        success: true,
        created: true,
        event_id: newEvent.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // ACTION: incremental_sync
    // ========================================
    if (action === 'incremental_sync') {
      const { data: settings } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!settings) throw new Error('Sync settings not found');

      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      const params = new URLSearchParams();

      if (settings.sync_token) {
        params.append('syncToken', settings.sync_token);
      } else {
        // First sync - use timeMin
        params.append('timeMin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }

      const googleResponse = await fetch(`${url}?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!googleResponse.ok) {
        if (googleResponse.status === 410) {
          // Sync token invalid, do full sync
          await supabase
            .from('calendar_sync_settings')
            .update({ sync_token: null })
            .eq('user_id', userId);

          return new Response(JSON.stringify({
            success: false,
            error: 'Sync token invalid, please run full_sync'
          }), {
            status: 410,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`Google API error: ${googleResponse.statusText}`);
      }

      const data = await googleResponse.json();
      let processed = 0;
      let errors = 0;

      // Process each changed event
      for (const googleEvent of data.items || []) {
        try {
          if (googleEvent.status === 'cancelled') {
            // Handle deletion
            const { data: mapping } = await supabase
              .from('calendar_sync_mapping')
              .select('financial_event_id')
              .eq('google_event_id', googleEvent.id)
              .single();

            if (mapping) {
              await supabase
                .from('financial_events')
                .delete()
                .eq('id', mapping.financial_event_id);

              await supabase
                .from('calendar_sync_mapping')
                .delete()
                .eq('google_event_id', googleEvent.id);
            }
          } else {
            // Sync event from Google (reuse sync_from_google logic)
            const syncResponse = await fetch(`${supabaseUrl}/functions/v1/google-calendar-sync?action=sync_from_google`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ google_event_id: googleEvent.id }),
            });

            if (syncResponse.ok) processed++;
            else errors++;
          }
        } catch (err) {
          console.error('Error processing event:', err);
          errors++;
        }
      }

      // Store new sync token
      if (data.nextSyncToken) {
        await supabase
          .from('calendar_sync_settings')
          .update({
            sync_token: data.nextSyncToken,
            last_incremental_sync_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      return new Response(JSON.stringify({
        success: true,
        processed,
        errors,
        has_more: !!data.nextPageToken
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // ACTION: full_sync
    // ========================================
    if (action === 'full_sync') {
      const { data: settings } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!settings) throw new Error('Sync settings not found');

      // Fetch all events from Google (last 30 days)
      const googleResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!googleResponse.ok) {
        throw new Error(`Google API error: ${googleResponse.statusText}`);
      }

      const data = await googleResponse.json();
      let processed = 0;
      let errors = 0;
      let pushed = 0;

      // Process each event from Google based on sync direction
      for (const googleEvent of data.items || []) {
        try {
          if (settings.sync_direction === 'one_way_from_google' ||
              settings.sync_direction === 'bidirectional') {
            // Pull from Google
            const syncResponse = await fetch(`${supabaseUrl}/functions/v1/google-calendar-sync?action=sync_from_google`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ google_event_id: googleEvent.id, user_id: userId }),
            });

            if (syncResponse.ok) processed++;
            else errors++;
          }
        } catch (err) {
          console.error('Error processing event:', err);
          errors++;
        }
      }

      // ========================================
      // Push local-only events to Google (bidirectional + one_way_to_google)
      // ========================================
      if (settings.sync_direction === 'one_way_to_google' ||
          settings.sync_direction === 'bidirectional') {

        // Get all financial events for this user
        const { data: localEvents, error: localEventsError } = await supabase
          .from('financial_events')
          .select('id')
          .eq('user_id', userId);

        if (!localEventsError && localEvents) {
          // Get all existing mappings
          const { data: mappings } = await supabase
            .from('calendar_sync_mapping')
            .select('financial_event_id')
            .eq('user_id', userId);

          const mappedEventIds = new Set((mappings || []).map(m => m.financial_event_id));

          // Find events that don't have a mapping (not yet synced to Google)
          const unmappedEvents = localEvents.filter(e => !mappedEventIds.has(e.id));

          console.log(`Found ${unmappedEvents.length} local-only events to push to Google`);

          // Push each unmapped event to Google
          for (const event of unmappedEvents) {
            try {
              const pushResponse = await fetch(`${supabaseUrl}/functions/v1/google-calendar-sync?action=sync_to_google`, {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ event_id: event.id, user_id: userId }),
              });

              if (pushResponse.ok) {
                pushed++;
              } else {
                const errorText = await pushResponse.text();
                console.error(`Failed to push event ${event.id}:`, errorText);
                errors++;
              }
            } catch (err) {
              console.error(`Error pushing event ${event.id}:`, err);
              errors++;
            }
          }
        }
      }

      // Store sync token for future incremental syncs
      if (data.nextSyncToken) {
        await supabase
          .from('calendar_sync_settings')
          .update({
            sync_token: data.nextSyncToken,
            last_full_sync_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      return new Response(JSON.stringify({
        success: true,
        processed,
        pushed,
        errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

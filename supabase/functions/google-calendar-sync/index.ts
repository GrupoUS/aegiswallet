import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Origin': '*',
};

// --- CRYPTO HELPERS (Same as auth) ---
async function getCryptoKey(secret: string) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { hash: 'SHA-256', iterations: 100000, name: 'PBKDF2', salt: encoder.encode('aegiswallet_salt') },
    keyMaterial, { length: 256, name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  );
}

async function decrypt(encryptedText: string, keyString: string): Promise<string> {
  const key = await getCryptoKey(keyString);
  const combined = new Uint8Array(atob(encryptedText).split('').map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ iv, name: 'AES-GCM' }, key, data);
  return new TextDecoder().decode(decrypted);
}

async function encrypt(text: string, keyString: string): Promise<string> {
  const key = await getCryptoKey(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ iv, name: 'AES-GCM' }, key, encoded);
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);
  return btoa(String.fromCharCode(...combined));
}

// --- GOOGLE API HELPERS ---

async function refreshGoogleToken(refreshToken: string, clientId: string, clientSecret: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: refreshToken,
    }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, method: 'POST',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
  }
  return data; // { access_token, expires_in, scope, token_type }
}

async function getValidAccessToken(supabase: any, userId: string, encryptionKey: string, clientId: string, clientSecret: string) {
  const { data: tokens, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokens) {throw new Error('Google tokens not found. Please connect your account.');}

  const now = new Date();
  const expiry = new Date(tokens.expiry_timestamp);
  const buffer = 5 * 60 * 1000; // 5 minutes buffer

  if (expiry.getTime() - now.getTime() > buffer) {
    return await decrypt(tokens.access_token, encryptionKey);
  }

  // Refresh token
  console.log('Refreshing Google Access Token...');
  const decryptedRefreshToken = await decrypt(tokens.refresh_token, encryptionKey);
  const newTokens = await refreshGoogleToken(decryptedRefreshToken, clientId, clientSecret);

  const newEncryptedAccessToken = await encrypt(newTokens.access_token, encryptionKey);
  const newExpiry = new Date();
  newExpiry.setSeconds(newExpiry.getSeconds() + newTokens.expires_in);

  await supabase.from('google_calendar_tokens').update({
    access_token: newEncryptedAccessToken,
    expiry_timestamp: newExpiry.toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', tokens.id);

  return newTokens.access_token;
}

// --- MAIN HANDLER ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {return new Response('ok', { headers: corsHeaders });}

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const encryptionKey = Deno.env.get('TOKENS_ENCRYPTION_KEY') ?? '';
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';

    if (!encryptionKey) {throw new Error('Configuration Error: TOKENS_ENCRYPTION_KEY missing');}

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {throw new Error('Missing Authorization header');}
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {throw new Error('Invalid user token');}
    const userId = user.id;

    // 2. Get Settings
    const { data: settings } = await supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings || !settings.sync_enabled) {
       if (action !== 'full_sync' && action !== 'sync_to_google') { // Allow explicit manual sync even if disabled? Let's enforce enabled check generally, but maybe sync_to_google comes from manual action
         // strict check for now
         if (!settings?.sync_enabled) {throw new Error('Sync is disabled in settings');}
       }
    }

    // 3. Get Access Token
    const accessToken = await getValidAccessToken(supabase, userId, encryptionKey, googleClientId, googleClientSecret);

    // 4. Handle Actions

    // --- SYNC TO GOOGLE ---
    if (action === 'sync_to_google') {
      const { event_id } = await req.json();
      if (!event_id) {throw new Error('Missing event_id');}

      // Fetch Aegis Event
      const { data: event } = await supabase.from('financial_events').select('*').eq('id', event_id).single();
      if (!event) {throw new Error('Event not found');}

      // Fetch Mapping
      const { data: mapping } = await supabase
        .from('calendar_sync_mapping')
        .select('*')
        .eq('user_id', userId)
        .eq('aegis_event_id', event_id)
        .single();

      // Prepare Google Event Resource
      const startDate = event.start_date || event.start || event.created_at || new Date().toISOString();
      const endDate = event.end_date || event.end || startDate;
      const details = settings.sync_financial_amounts
        ? `${event.description || ''}\n\nValor: R$ ${event.amount ?? 0}\nCategoria: ${
            event.category_id || 'Geral'
          }`.trim()
        : event.description;

      const googleEvent: Record<string, unknown> = {
        description: details,
        end: { dateTime: new Date(endDate).toISOString() },
        extendedProperties: {
          private: {
            aegis_amount: settings.sync_financial_amounts ? String(event.amount ?? 0) : 'HIDDEN',
            aegis_event_id: event.id,
            aegis_type_id: event.event_type_id || 'unknown',
          },
        },
        start: { dateTime: new Date(startDate).toISOString() },
        summary: event.title,
      };

      // Update or Insert
      let result;
      let method = 'POST';
      let apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;

      if (mapping && mapping.google_event_id) {
        method = 'PUT';
        apiUrl = `${apiUrl}/${mapping.google_event_id}`;
      }

      const gRes = await fetch(apiUrl, {
        body: JSON.stringify(googleEvent), headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }, method
      });

      if (!gRes.ok) {
        const err = await gRes.json();
        throw new Error(`Google API Error: ${JSON.stringify(err)}`);
      }

      const gData = await gRes.json();

      // Update Mapping
      await supabase.from('calendar_sync_mapping').upsert({
        aegis_event_id: event.id, google_event_id: gData.id, last_synced_at: new Date().toISOString(), sync_direction: 'aegis_to_google', sync_status: 'synced', updated_at: new Date().toISOString(), user_id: userId
      }, { onConflict: 'user_id, aegis_event_id' });

      return new Response(JSON.stringify({ google_event: gData, success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- INCREMENTAL SYNC ---
    if (action === 'incremental_sync' || action === 'full_sync') {
      const syncToken = action === 'incremental_sync' ? settings.sync_token : null;
      let listUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=2500&singleEvents=true`;

      if (syncToken) {
        listUrl += `&syncToken=${syncToken}`;
      } else {
        // Full sync: fetch from 30 days ago to future
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 30);
        listUrl += `&timeMin=${timeMin.toISOString()}`;
      }

      const gRes = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (gRes.status === 410) {
        // Sync token expired, clear it and retry full sync
         await supabase.from('calendar_sync_settings').update({ sync_token: null }).eq('user_id', userId);
         throw new Error('Sync token invalidated. Please retry with full_sync');
      }

      if (!gRes.ok) {
         const err = await gRes.json();
         throw new Error(`Google List Error: ${JSON.stringify(err)}`);
      }

      const gData = await gRes.json();
      const items = gData.items || [];
      const nextSyncToken = gData.nextSyncToken;

      let processedCount = 0;

      for (const item of items) {
        // Check if it is an Aegis event (created by us) or external
        const isAegis = item.extendedProperties?.private?.aegis_event_id;
        const googleId = item.id;

        if (item.status === 'cancelled') {
             // Handle Deletion
             // Find mapping
             const { data: mapping } = await supabase.from('calendar_sync_mapping')
               .select('*').eq('user_id', userId).eq('google_event_id', googleId).single();

             if (mapping) {
                 // Delete local event if settings allow, or just unmap
                 // For now, let's unmap and maybe mark as deleted in DB?
                 // Let's just delete the mapping to avoid re-syncing dead event
                 await supabase.from('calendar_sync_mapping').delete().eq('id', mapping.id);
             }
        } else {
             // Handle Creation/Update
             const { data: mapping } = await supabase.from('calendar_sync_mapping')
               .select('*').eq('user_id', userId).eq('google_event_id', googleId).single();

             if (mapping) {
                 // Update existing
                 // Logic: compare timestamps? For now assume Google is truth for inbound sync
                 // Only update if direction allows
                 if (settings.sync_direction !== 'one_way_to_google') {
                      const inboundStart = item.start?.dateTime || item.start?.date || new Date().toISOString();
                      const inboundEnd = item.end?.dateTime || item.end?.date || inboundStart;
                      await supabase.from('financial_events').update({
                          end_date: inboundEnd,
                          start_date: inboundStart,
                          title: item.summary || 'Evento sincronizado',
                          // Description update? careful overwriting
                      }).eq('id', mapping.aegis_event_id);

                      await supabase.from('calendar_sync_mapping').update({
                          last_synced_at: new Date().toISOString(),
                          sync_status: 'synced'
                      }).eq('id', mapping.id);
                 }
             } else if (settings.sync_direction !== 'one_way_to_google') {
                 // New event from Google -> Create in Aegis?
                 // Only if it seems relevant or user wants ALL google events imported
                 // For now, let's skip auto-importing ALL google events unless specifically marked or user opted in.
                 // NOTE: Plan implies bidirectional sync. Let's be conservative:
                 // Only import if it looks like it might be relevant or just import as 'scheduled' type

                 // SKIP for now to avoid polluting financial calendar with "Dinner with mom"
                 // But if it HAS aegis_event_id property but no mapping, it means we lost the mapping.
                 if (isAegis) {
                     // Restore mapping
                      await supabase.from('calendar_sync_mapping').insert({
                        aegis_event_id: isAegis, google_event_id: googleId, sync_direction: 'bidirectional', sync_status: 'synced', user_id: userId
                      });
                 }
             }
        }
        processedCount++;
      }

      // Update sync token
      if (nextSyncToken) {
        await supabase.from('calendar_sync_settings').update({
          last_full_sync_at: new Date().toISOString(), sync_token: nextSyncToken
        }).eq('user_id', userId);
      }

      return new Response(JSON.stringify({ processed: processedCount, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    });
  }
});

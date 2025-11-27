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
    const googleRedirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')!;
    const encryptionKey = Deno.env.get('TOKENS_ENCRYPTION_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for service-role calls that may contain user_id and action
    let requestBody: Record<string, unknown> = {};
    try {
      if (req.method === 'POST') {
        const clonedReq = req.clone();
        requestBody = await clonedReq.json();
      }
    } catch {
      // Body parsing failed, might be empty or invalid - continue
    }

    // Get action from URL query params OR request body (for supabase.functions.invoke() calls)
    const action = url.searchParams.get('action') || (requestBody.action as string);

    // Authenticate: Support both user JWT and service-role with user_id
    let userId: string | undefined;

    if (action !== 'start') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Unauthorized');

      const token = authHeader.replace('Bearer ', '');

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
    }

    if (action === 'start') {
      const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(googleRedirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code');
      if (!code) throw new Error('No code provided');
      if (!userId) throw new Error('Unauthorized');

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: googleRedirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);

      // Get user email
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userData = await userResponse.json();

      const encryptedAccessToken = await encryptToken(tokens.access_token, encryptionKey);
      const encryptedRefreshToken = tokens.refresh_token ? await encryptToken(tokens.refresh_token, encryptionKey) : undefined;

      // Store tokens
      const { error: dbError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: userId,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken, // Only update if present (Google only sends refresh token on first consent)
          expiry_timestamp: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          scope: tokens.scope,
          google_user_email: userData.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      // Register webhook channel with Google Calendar
      const webhookUrl = `${supabaseUrl}/functions/v1/google-calendar-webhook`;
      const webhookSecret = crypto.randomUUID();
      const channelId = `aegis-${userId}-${Date.now()}`;

      try {
        const channelResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/watch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
            token: webhookSecret,
            expiration: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          }),
        });

        if (channelResponse.ok) {
          const channelData = await channelResponse.json();

          // Store channel info in settings
          await supabase
            .from('calendar_sync_settings')
            .upsert({
              user_id: userId,
              sync_enabled: true,
              google_channel_id: channelData.id,
              google_resource_id: channelData.resourceId,
              channel_expiry_at: new Date(parseInt(channelData.expiration)).toISOString(),
              webhook_secret: webhookSecret,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        } else {
          // Log channel registration failure but don't fail the entire auth flow
          console.error('Failed to register webhook channel:', await channelResponse.text());

          // Initialize settings without channel info
          await supabase
            .from('calendar_sync_settings')
            .upsert({
              user_id: userId,
              sync_enabled: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        }
      } catch (channelError) {
        console.error('Error registering webhook channel:', channelError);

        // Initialize settings without channel info
        await supabase
          .from('calendar_sync_settings')
          .upsert({
            user_id: userId,
            sync_enabled: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }

      // Audit log
      await supabase.from('calendar_sync_audit').insert({
        user_id: user.id,
        action: 'sync_started',
        details: { message: 'Google Calendar connected', email: userData.email }
      });

      // Redirect to frontend
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${req.headers.get('origin') || 'http://localhost:5173'}/calendario?status=success` },
      });
    }

    if (action === 'revoke') {
        if (!userId) throw new Error('Unauthorized');

        // Get token to revoke
        const { data: tokenData } = await supabase
            .from('google_calendar_tokens')
            .select('access_token')
            .eq('user_id', userId)
            .single();

        if (tokenData) {
            try {
                // Decrypt the access token before revoking
                const decryptedAccessToken = await decryptToken(tokenData.access_token, encryptionKey);
                await fetch(`https://oauth2.googleapis.com/revoke?token=${decryptedAccessToken}`, {
                    method: 'POST',
                    headers: { 'Content-type': 'application/x-www-form-urlencoded' }
                });
            } catch (decryptError) {
                console.error('Error decrypting token for revoke, proceeding with cleanup:', decryptError);
                // Continue with cleanup even if decryption fails
            }
        }

        // Remove from DB
        await supabase.from('google_calendar_tokens').delete().eq('user_id', userId);

        // Update settings
        await supabase.from('calendar_sync_settings').update({ sync_enabled: false }).eq('user_id', userId);

        // Audit
        await supabase.from('calendar_sync_audit').insert({
            user_id: userId,
            action: 'sync_completed', // 'disconnected'
            details: { message: 'Google Calendar disconnected' }
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'renew_channel') {
      if (!userId) throw new Error('Unauthorized');

      // Get current settings and tokens
      const { data: settings } = await supabase
        .from('calendar_sync_settings')
        .select('google_channel_id, google_resource_id, channel_expiry_at')
        .eq('user_id', userId)
        .single();

      const { data: tokenData } = await supabase
        .from('google_calendar_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .single();

      if (!tokenData) throw new Error('No tokens found');

      // Decrypt access token
      let decryptedAccessToken: string;
      try {
        decryptedAccessToken = await decryptToken(tokenData.access_token, encryptionKey);
      } catch (decryptError) {
        console.error('Error decrypting token:', decryptError);
        throw new Error('Token decryption failed. Please reconnect your Google Calendar.');
      }

      // Stop old channel if exists
      if (settings?.google_channel_id && settings?.google_resource_id) {
        try {
          await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${decryptedAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: settings.google_channel_id,
              resourceId: settings.google_resource_id,
            }),
          });
        } catch (stopError) {
          console.error('Error stopping old channel:', stopError);
        }
      }

      // Register new channel
      const webhookUrl = `${supabaseUrl}/functions/v1/google-calendar-webhook`;
      const webhookSecret = crypto.randomUUID();
      const channelId = `aegis-${userId}-${Date.now()}`;

      const channelResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/watch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${decryptedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          token: webhookSecret,
          expiration: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        }),
      });

      if (!channelResponse.ok) {
        throw new Error(`Failed to renew channel: ${await channelResponse.text()}`);
      }

      const channelData = await channelResponse.json();

      // Update settings with new channel info
      await supabase
        .from('calendar_sync_settings')
        .update({
          google_channel_id: channelData.id,
          google_resource_id: channelData.resourceId,
          channel_expiry_at: new Date(parseInt(channelData.expiration)).toISOString(),
          webhook_secret: webhookSecret,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Audit log
      await supabase.from('calendar_sync_audit').insert({
        user_id: userId,
        action: 'channel_renewed',
        details: {
          message: 'Webhook channel renewed',
          channel_id: channelData.id,
          expiry: new Date(parseInt(channelData.expiration)).toISOString()
        }
      });

      return new Response(JSON.stringify({
        success: true,
        channel_id: channelData.id,
        expiry_at: new Date(parseInt(channelData.expiration)).toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

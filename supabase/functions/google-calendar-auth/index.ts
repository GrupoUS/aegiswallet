import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Origin': '*',
};

// Encryption helpers
async function getCryptoKey(secret: string) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('aegiswallet_salt'), // In production, use random salt stored with data
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(text: string, keyString: string): Promise<string> {
  const key = await getCryptoKey(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { iv, name: 'AES-GCM' },
    key,
    encoded
  );

  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...combined));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const encryptionKey = Deno.env.get('TOKENS_ENCRYPTION_KEY') ?? '';
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
    const googleRedirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') ?? '';

    if (!encryptionKey) {throw new Error('Encryption key not configured');}

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {throw new Error('Missing Authorization header');}

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {throw new Error('Invalid user token');}

    if (action === 'start') {
      const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(googleRedirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${user.id}`;

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code');
      if (!code) {throw new Error('Missing code parameter');}

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        body: new URLSearchParams({
          client_id: googleClientId, client_secret: googleClientSecret, code, grant_type: 'authorization_code', redirect_uri: googleRedirectUri,
        }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, method: 'POST',
      });

      const tokens = await tokenResponse.json();
      if (tokens.error) {throw new Error(`Google Auth Error: ${tokens.error_description || tokens.error}`);}

      // Get user email
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userResponse.json();

      // Encrypt tokens
      const encryptedAccessToken = await encrypt(tokens.access_token, encryptionKey);
      const encryptedRefreshToken = await encrypt(tokens.refresh_token, encryptionKey);

      // Calculate expiry
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

      // Store tokens
      await supabase.from('google_calendar_tokens').upsert({
        access_token: encryptedAccessToken, expiry_timestamp: expiryDate.toISOString(), google_user_email: userInfo.email, refresh_token: encryptedRefreshToken, scope: tokens.scope, user_id: user.id,
      });

      // Initialize settings if not exists
      const { data: existingSettings } = await supabase
        .from('calendar_sync_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingSettings) {
        await supabase.from('calendar_sync_settings').insert({
          auto_sync_interval_minutes: 15, sync_direction: 'bidirectional', sync_enabled: true, user_id: user.id,
        });
      }

      // Audit log
      await supabase.from('calendar_sync_audit').insert({
        action: 'auth_granted', details: { email: userInfo.email }, user_id: user.id,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revoke') {
        // Get tokens to revoke (decryption would be needed if we sent the token to Google, but we just delete local)
        // Ideally we should revoke at Google too.
        // For now, we delete local data.

        // Optionally fetch token to revoke at Google
        /*
        const { data: tokenData } = await supabase
            .from('google_calendar_tokens')
            .select('access_token')
            .eq('user_id', user.id)
            .single();
        // Decrypt and call https://oauth2.googleapis.com/revoke?token=...
        */

        await supabase.from('google_calendar_tokens').delete().eq('user_id', user.id);

        // Disable sync
        await supabase.from('calendar_sync_settings').update({
            sync_enabled: false
        }).eq('user_id', user.id);

        // Audit log
        await supabase.from('calendar_sync_audit').insert({
            action: 'auth_revoked', details: {}, user_id: user.id,
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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


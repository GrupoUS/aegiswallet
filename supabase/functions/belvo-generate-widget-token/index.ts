
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WidgetTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Authorization required', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response('Invalid token', { status: 401, headers: corsHeaders });
    }

    console.log('Generating widget access token for user:', user.id);

    // Get Belvo credentials from environment variables
    const belvoSecretId = Deno.env.get('BELVO_SECRET_KEY');
    const belvoSecretPassword = Deno.env.get('BELVO_SECRET_PASSWORD');
    
    if (!belvoSecretId || !belvoSecretPassword) {
      console.error('Belvo credentials not configured');
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    // Generate widget access token from Belvo
    const credentials = btoa(`${belvoSecretId}:${belvoSecretPassword}`);
    
    const response = await fetch('https://api.belvo.com/api/token/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_mode: 'recurrent',
        scopes: 'read_institutions,read_accounts,read_transactions,read_balances',
        external_id: user.id, // AegisWallet's internal user ID
        widget: true
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Belvo API error:', response.status, errorText);
      return new Response('Failed to generate widget token', { status: 500, headers: corsHeaders });
    }
    
    const tokenData: WidgetTokenResponse = await response.json();
    
    console.log('Widget access token generated successfully');
    
    return new Response(JSON.stringify({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating widget token:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      success: false 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-USER-ACCESS-LEVEL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    // Call the database function to get access level
    const { data: accessData, error: accessError } = await supabaseClient
      .rpc('get_user_access_level', { user_uuid: user.id });

    if (accessError) {
      logStep("Error calling get_user_access_level function", { error: accessError });
      throw accessError;
    }

    const accessLevel = accessData as string;
    logStep("Access level determined", { accessLevel });

    let daysLeft = null;
    
    // If user is on trial, calculate days left
    if (accessLevel === 'trial') {
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('trial_ends_at')
        .eq('user_id', user.id)
        .single();

      if (!profileError && profileData?.trial_ends_at) {
        const trialEnd = new Date(profileData.trial_ends_at);
        const now = new Date();
        const diffTime = trialEnd.getTime() - now.getTime();
        daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        logStep("Trial days calculated", { daysLeft });
      }
    }

    return new Response(JSON.stringify({
      accessLevel,
      daysLeft
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-user-access-level", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

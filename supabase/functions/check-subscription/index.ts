
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const createErrorResponse = (error: string, errorCode: string, statusCode: number = 500) => {
  logStep("ERROR", { error, errorCode });
  return new Response(JSON.stringify({ 
    success: false, 
    error, 
    errorCode 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: statusCode,
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient;

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl) {
      return createErrorResponse("Configuração do Supabase não encontrada", "SUPABASE_CONFIG_MISSING", 500);
    }
    
    if (!supabaseServiceKey) {
      return createErrorResponse("Chave de serviço do Supabase não configurada", "SUPABASE_SERVICE_KEY_MISSING", 500);
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });
    logStep("Supabase client initialized");

    // Extract and validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("Token de autorização não fornecido", "AUTH_TOKEN_MISSING", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Authorization token extracted");

    // Get user from token
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("Authentication failed", { error: userError.message });
      return createErrorResponse("Erro de autenticação", "AUTH_FAILED", 401);
    }
    
    const user = userData.user;
    if (!user?.email) {
      return createErrorResponse("Usuário não autenticado ou email não disponível", "USER_NOT_AUTHENTICATED", 401);
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Validate Stripe configuration
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return createErrorResponse("Chave secreta do Stripe não configurada", "STRIPE_CONFIG_MISSING", 500);
    }

    if (!stripeKey.startsWith('sk_')) {
      return createErrorResponse("Chave do Stripe inválida - deve ser uma chave secreta", "STRIPE_INVALID_KEY", 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe client initialized");
    
    // Check for existing Stripe customer
    let customers;
    try {
      customers = await stripe.customers.list({ email: user.email, limit: 1 });
      logStep("Stripe customer lookup completed", { found: customers.data.length > 0 });
    } catch (stripeError: any) {
      logStep("Stripe API error", { error: stripeError.message });
      return createErrorResponse("Erro ao conectar com o Stripe", "STRIPE_API_ERROR", 500);
    }
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating inactive state");
      
      try {
        // Update user_subscriptions table with inactive status
        await supabaseClient.from("user_subscriptions").upsert({
          user_id: user.id,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          status: "inactive",
          current_period_start: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        
        logStep("Database updated with inactive status");
      } catch (dbError: any) {
        logStep("Database update error", { error: dbError.message });
        return createErrorResponse("Erro ao atualizar dados de assinatura", "DB_UPDATE_ERROR", 500);
      }
      
      return new Response(JSON.stringify({ 
        success: true,
        subscribed: false, 
        status: "inactive",
        current_period_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    let subscriptions;
    try {
      subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      logStep("Stripe subscriptions lookup completed", { activeSubscriptions: subscriptions.data.length });
    } catch (stripeError: any) {
      logStep("Stripe subscriptions lookup error", { error: stripeError.message });
      return createErrorResponse("Erro ao verificar assinaturas no Stripe", "STRIPE_SUBSCRIPTION_ERROR", 500);
    }

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionData = {
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
      stripe_plan_id: null,
      status: "inactive",
      current_period_start: null,
      current_period_end: null,
    };

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionData = {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_plan_id: subscription.items.data[0].price.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      };
      logStep("Active subscription found", subscriptionData);
    } else {
      logStep("No active subscription found");
    }

    // Update user_subscriptions table
    try {
      await supabaseClient.from("user_subscriptions").upsert({
        user_id: user.id,
        ...subscriptionData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      logStep("Updated database with subscription info", { subscribed: hasActiveSub, status: subscriptionData.status });
    } catch (dbError: any) {
      logStep("Database update error", { error: dbError.message });
      return createErrorResponse("Erro ao salvar dados de assinatura", "DB_UPDATE_ERROR", 500);
    }
    
    return new Response(JSON.stringify({
      success: true,
      subscribed: hasActiveSub,
      status: subscriptionData.status,
      current_period_end: subscriptionData.current_period_end
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Unexpected error in check-subscription", { message: errorMessage, stack: error.stack });
    
    return createErrorResponse("Erro interno do servidor", "INTERNAL_SERVER_ERROR", 500);
  }
});

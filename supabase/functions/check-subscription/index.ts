
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
    if (!authHeader) {
      logStep("ERROR: No authorization header provided");
      throw new Error("Token de autorização não fornecido");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("ERROR: Authentication failed", { error: userError.message });
      throw new Error(`Erro de autenticação: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated or email not available");
      throw new Error("Usuário não autenticado ou email não disponível");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Stripe secret key not configured");
      throw new Error("Chave secreta do Stripe não configurada");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating inactive state");
      
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
      
      return new Response(JSON.stringify({ 
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
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

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
    await supabaseClient.from("user_subscriptions").upsert({
      user_id: user.id,
      ...subscriptionData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, status: subscriptionData.status });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      status: subscriptionData.status,
      current_period_end: subscriptionData.current_period_end
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    // Return a more specific error message in Portuguese
    return new Response(JSON.stringify({ 
      error: errorMessage.includes("Stripe") ? "Erro ao verificar assinatura no Stripe" :
             errorMessage.includes("autenticação") || errorMessage.includes("Token") ? "Erro de autenticação" :
             "Erro interno do servidor"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

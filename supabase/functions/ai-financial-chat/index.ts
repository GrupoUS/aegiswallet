
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-FINANCIAL-CHAT] ${step}${detailsStr}`);
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

    const { message, model } = await req.json();
    if (!message) throw new Error("Message is required");

    // Get user access level
    const { data: accessLevel, error: accessError } = await supabaseClient
      .rpc('get_user_access_level', { user_uuid: user.id });

    if (accessError) {
      logStep("Error getting access level", { error: accessError });
      throw accessError;
    }

    logStep("User access level determined", { accessLevel });

    // Determine which model to use based on access level
    let modelToUse = model;
    const basicModel = "openai/gpt-3.5-turbo";
    
    if (accessLevel === 'free') {
      // Free users can only use the basic model
      modelToUse = basicModel;
      logStep("Free user - using basic model", { modelToUse });
    } else if (!model) {
      // If no model specified, use basic for all users as fallback
      modelToUse = basicModel;
    }

    logStep("Model selected", { modelToUse, requestedModel: model, accessLevel });

    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const systemPrompt = `Você é um assistente financeiro especializado em ajudar usuários brasileiros com questões relacionadas a finanças pessoais, investimentos, economia e planejamento financeiro. 

Suas características:
- Responda sempre em português brasileiro
- Seja didático e educativo
- Forneça conselhos práticos e aplicáveis ao contexto brasileiro
- Considere a realidade econômica e fiscal do Brasil
- Seja empático e compreensivo com diferentes situações financeiras
- Quando relevante, mencione instituições financeiras brasileiras, produtos financeiros disponíveis no país, e regulamentações da CVM, Bacen, etc.

Contexto do usuário: Este usuário está usando o AegisWallet, um aplicativo de controle financeiro pessoal.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aegiswallet.app",
        "X-Title": "AegisWallet Financial Assistant"
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("OpenRouter API error", { status: response.status, error: errorText });
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI model");
    }

    logStep("AI response received");

    // Store chat history
    const { error: historyError } = await supabaseClient
      .from("ai_chat_history")
      .insert({
        user_id: user.id,
        message: message,
        response: aiResponse,
        openrouter_model_used: modelToUse
      });

    if (historyError) {
      logStep("Error storing chat history", { error: historyError });
    } else {
      logStep("Chat history stored successfully");
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      model_used: modelToUse
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in ai-financial-chat", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

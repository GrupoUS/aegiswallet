
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

// Define which models are free vs premium
const FREE_MODELS = ["openai/gpt-3.5-turbo"];
const PREMIUM_MODELS = ["openai/gpt-4o-mini", "anthropic/claude-3-haiku", "google/gemini-pro"];

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

    // Validate model access based on user tier
    let modelToUse = model || "openai/gpt-3.5-turbo";
    
    if (accessLevel === 'free') {
      // Free users can only use free models
      if (PREMIUM_MODELS.includes(modelToUse)) {
        return new Response(JSON.stringify({
          error: "Este modelo de IA é exclusivo para usuários Pro. Por favor, faça um upgrade para acessar modelos avançados.",
          errorCode: "PREMIUM_MODEL_REQUIRED"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
      modelToUse = "openai/gpt-3.5-turbo";
      logStep("Free user - using basic model", { modelToUse });
    } else if (!FREE_MODELS.includes(modelToUse) && !PREMIUM_MODELS.includes(modelToUse)) {
      // Fallback to basic model for unknown models
      modelToUse = "openai/gpt-3.5-turbo";
    }

    logStep("Model selected", { modelToUse, requestedModel: model, accessLevel });

    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    // Enhanced system prompt with action capabilities for Pro/Trial users
    const canPerformActions = accessLevel === 'pro' || accessLevel === 'trial';
    
    const systemPrompt = `Você é um assistente financeiro especializado em ajudar usuários brasileiros com questões relacionadas a finanças pessoais, investimentos, economia e planejamento financeiro. 

Suas características:
- Responda sempre em português brasileiro
- Seja didático e educativo
- Forneça conselhos práticos e aplicáveis ao contexto brasileiro
- Considere a realidade econômica e fiscal do Brasil
- Seja empático e compreensivo com diferentes situações financeiras
- Quando relevante, mencione instituições financeiras brasileiras, produtos financeiros disponíveis no país, e regulamentações da CVM, Bacen, etc.

Contexto do usuário: Este usuário está usando o AegisWallet, um aplicativo de controle financeiro pessoal.

${canPerformActions ? `
CAPACIDADES DE AÇÃO DISPONÍVEIS:
Você pode executar ações no sistema do usuário quando solicitado. Para isso, inclua no final da sua resposta um bloco JSON com a seguinte estrutura:

**AÇÕES DISPONÍVEIS:**
1. Criar lembrete: {"action": "create_reminder", "params": {"description": "descrição", "due_date": "YYYY-MM-DD", "amount": valor_opcional}}
2. Adicionar despesa: {"action": "add_expense", "params": {"amount": valor, "description": "descrição", "category": "categoria", "date": "YYYY-MM-DD"}}
3. Adicionar receita: {"action": "add_income", "params": {"amount": valor, "description": "descrição", "category": "categoria", "date": "YYYY-MM-DD"}}

Exemplos de quando usar ações:
- "Crie um lembrete para pagar a conta de luz no dia 15" → criar lembrete
- "Registre um gasto de R$ 50 no supermercado hoje" → adicionar despesa
- "Adicione meu salário de R$ 3000 que recebi hoje" → adicionar receita

Quando executar uma ação, inclua o JSON da ação no final da sua resposta após explicar o que será feito.
` : `
USUÁRIO GRATUITO: Você pode fornecer conselhos e análises, mas não pode executar ações como criar lembretes ou registrar transações. Sugira que o usuário faça upgrade para o plano Pro para acessar essas funcionalidades.
`}`;

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

    // Parse and execute actions if user has access
    let actionExecuted = false;
    let actionResult = "";

    if (canPerformActions) {
      try {
        // Look for JSON action in the response
        const jsonMatch = aiResponse.match(/\{[^}]*"action"[^}]*\}/);
        if (jsonMatch) {
          const actionData = JSON.parse(jsonMatch[0]);
          logStep("Action detected", { action: actionData });

          switch (actionData.action) {
            case "create_reminder":
              const reminderParams = actionData.params;
              const { error: reminderError } = await supabaseClient
                .from("bill_reminders")
                .insert({
                  user_id: user.id,
                  name: reminderParams.description,
                  due_date: reminderParams.due_date,
                  amount: reminderParams.amount || null
                });

              if (reminderError) {
                logStep("Error creating reminder", { error: reminderError });
                actionResult = "Erro ao criar lembrete. ";
              } else {
                actionExecuted = true;
                actionResult = "✅ Lembrete criado com sucesso! ";
              }
              break;

            case "add_expense":
              const expenseParams = actionData.params;
              // Get or create category
              let categoryId;
              const { data: existingCategory } = await supabaseClient
                .from("categories")
                .select("id")
                .or(`name.ilike.${expenseParams.category},user_id.eq.${user.id}`)
                .single();

              if (existingCategory) {
                categoryId = existingCategory.id;
              } else {
                const { data: newCategory, error: categoryError } = await supabaseClient
                  .from("categories")
                  .insert({
                    name: expenseParams.category,
                    user_id: user.id
                  })
                  .select("id")
                  .single();

                if (categoryError || !newCategory) {
                  logStep("Error creating category", { error: categoryError });
                  actionResult = "Erro ao criar categoria. ";
                  break;
                }
                categoryId = newCategory.id;
              }

              const { error: expenseError } = await supabaseClient
                .from("transactions")
                .insert({
                  user_id: user.id,
                  amount: Math.abs(expenseParams.amount) * -1, // Ensure negative for expense
                  description: expenseParams.description,
                  category_id: categoryId,
                  date: expenseParams.date,
                  type: "expense"
                });

              if (expenseError) {
                logStep("Error creating expense", { error: expenseError });
                actionResult = "Erro ao registrar despesa. ";
              } else {
                actionExecuted = true;
                actionResult = "✅ Despesa registrada com sucesso! ";
              }
              break;

            case "add_income":
              const incomeParams = actionData.params;
              // Get or create category
              let incomeCategoryId;
              const { data: existingIncomeCategory } = await supabaseClient
                .from("categories")
                .select("id")
                .or(`name.ilike.${incomeParams.category},user_id.eq.${user.id}`)
                .single();

              if (existingIncomeCategory) {
                incomeCategoryId = existingIncomeCategory.id;
              } else {
                const { data: newIncomeCategory, error: incomeCategoryError } = await supabaseClient
                  .from("categories")
                  .insert({
                    name: incomeParams.category,
                    user_id: user.id
                  })
                  .select("id")
                  .single();

                if (incomeCategoryError || !newIncomeCategory) {
                  logStep("Error creating income category", { error: incomeCategoryError });
                  actionResult = "Erro ao criar categoria. ";
                  break;
                }
                incomeCategoryId = newIncomeCategory.id;
              }

              const { error: incomeError } = await supabaseClient
                .from("transactions")
                .insert({
                  user_id: user.id,
                  amount: Math.abs(incomeParams.amount), // Ensure positive for income
                  description: incomeParams.description,
                  category_id: incomeCategoryId,
                  date: incomeParams.date,
                  type: "income"
                });

              if (incomeError) {
                logStep("Error creating income", { error: incomeError });
                actionResult = "Erro ao registrar receita. ";
              } else {
                actionExecuted = true;
                actionResult = "✅ Receita registrada com sucesso! ";
              }
              break;
          }
        }
      } catch (actionError) {
        logStep("Error parsing/executing action", { error: actionError });
        actionResult = "Erro ao executar ação solicitada. ";
      }
    }

    // Clean response from action JSON if present
    const cleanResponse = aiResponse.replace(/\{[^}]*"action"[^}]*\}/, '').trim();
    const finalResponse = actionResult + cleanResponse;

    // Store chat history
    const { error: historyError } = await supabaseClient
      .from("ai_chat_history")
      .insert({
        user_id: user.id,
        message: message,
        response: finalResponse,
        openrouter_model_used: modelToUse
      });

    if (historyError) {
      logStep("Error storing chat history", { error: historyError });
    } else {
      logStep("Chat history stored successfully");
    }

    return new Response(JSON.stringify({
      response: finalResponse,
      model_used: modelToUse,
      action_executed: actionExecuted
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

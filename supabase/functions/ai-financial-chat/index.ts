
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = 'openai/gpt-3.5-turbo' } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing chat request for user:', user.id);

    // Fetch user's financial data
    const [transactionsResult, categoriesResult, billsResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20),
      supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_predefined.eq.true`),
      supabase
        .from('bill_reminders')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(10)
    ]);

    // Build financial context
    let financialContext = "Dados financeiros do usuário:\n";
    
    if (transactionsResult.data && transactionsResult.data.length > 0) {
      const totalIncome = transactionsResult.data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalExpenses = transactionsResult.data
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      financialContext += `\nResumo das últimas 20 transações:`;
      financialContext += `\n- Total de receitas: R$ ${totalIncome.toFixed(2)}`;
      financialContext += `\n- Total de despesas: R$ ${totalExpenses.toFixed(2)}`;
      financialContext += `\n- Saldo líquido: R$ ${(totalIncome - totalExpenses).toFixed(2)}`;
    }

    if (billsResult.data && billsResult.data.length > 0) {
      financialContext += `\n\nContas próximas do vencimento:`;
      billsResult.data.forEach(bill => {
        financialContext += `\n- ${bill.name}: R$ ${parseFloat(bill.amount || 0).toFixed(2)} (vence em ${bill.due_date})`;
      });
    }

    // Prepare messages for OpenRouter
    const messages = [
      {
        role: "system",
        content: "Você é um assistente financeiro pessoal e perspicaz para o aplicativo AegisWallet. Seu objetivo é ajudar os usuários a entenderem sua saúde financeira e fornecer conselhos práticos em Português do Brasil. Seja amigável, direto e útil. Sempre responda em português brasileiro."
      },
      {
        role: "system",
        content: financialContext
      },
      {
        role: "user",
        content: message
      }
    ];

    // Call OpenRouter API
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling OpenRouter with model:', model);

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aegiswallet.app',
        'X-Title': 'AegisWallet'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to get AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await openRouterResponse.json();
    const assistantMessage = aiResponse.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';

    // Save chat history
    await supabase
      .from('ai_chat_history')
      .insert({
        user_id: user.id,
        message: message,
        response: assistantMessage,
        openrouter_model_used: model
      });

    console.log('Chat completed successfully');

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      model_used: model 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-financial-chat function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

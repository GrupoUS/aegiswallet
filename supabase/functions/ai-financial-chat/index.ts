
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-FINANCIAL-CHAT] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  logStep("Function started");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar cliente Supabase com SERVICE ROLE KEY para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR: Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: 'Configuração do Supabase ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente com SERVICE ROLE para operações administrativas (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    logStep("Supabase admin client initialized with service role");

    // Cliente normal para autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      logStep("ERROR: User authentication failed", { error: userError });
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("User authenticated", { userId: user.id });

    const { message } = await req.json();
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Processing message", { messageLength: message.length });

    // Verificar se é uma solicitação para criar lembrete
    if (message.toLowerCase().includes('lembrete') || message.toLowerCase().includes('conta')) {
      logStep("Detected reminder creation request");
      
      // Exemplo de extração de dados do lembrete da mensagem
      const reminderMatch = message.match(/lembrete.*?(?:para|de)\s+(.+?)(?:\s+no dia|\s+em|\s+para o dia|\s+vencimento)\s+(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
      
      if (reminderMatch) {
        const reminderName = reminderMatch[1].trim();
        let dueDate = reminderMatch[2].trim();
        
        // Converter data para formato ISO se necessário
        if (dueDate.includes('/')) {
          const [day, month, year] = dueDate.split('/');
          dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        logStep("Attempting to create reminder", { name: reminderName, dueDate, userId: user.id });

        try {
          // Usar cliente admin para inserir lembrete (bypass RLS)
          const { data: reminderData, error: reminderError } = await supabaseAdmin
            .from('bill_reminders')
            .insert({
              user_id: user.id,
              name: reminderName,
              due_date: dueDate,
              is_paid: false
            })
            .select()
            .single();

          if (reminderError) {
            logStep("ERROR: Failed to create reminder", { error: reminderError });
            return new Response(
              JSON.stringify({ 
                response: `Desculpe, tive um problema ao criar o lembrete. Erro: ${reminderError.message}` 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          logStep("Reminder created successfully", { reminderId: reminderData.id });
          
          return new Response(
            JSON.stringify({ 
              response: `✅ Lembrete criado com sucesso! "${reminderName}" foi agendado para ${new Date(dueDate).toLocaleDateString('pt-BR')}.` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          logStep("ERROR: Exception during reminder creation", { error: error.message });
          return new Response(
            JSON.stringify({ 
              response: `Desculpe, houve um erro inesperado ao criar o lembrete: ${error.message}` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Verificar se é uma solicitação para criar transação
    if (message.toLowerCase().includes('receita') || message.toLowerCase().includes('despesa') || message.toLowerCase().includes('gasto')) {
      logStep("Detected transaction creation request");
      
      const isIncome = message.toLowerCase().includes('receita');
      const transactionType = isIncome ? 'income' : 'expense';
      
      // Tentar extrair valor da mensagem
      const valueMatch = message.match(/(?:R\$|valor|)\s*(\d+(?:[.,]\d{2})?)/i);
      const descriptionMatch = message.match(/(?:receita|despesa|gasto)\s+(?:de|para|com)\s+(.+?)(?:\s+de|\s+no valor|\s+R\$|$)/i);
      
      if (valueMatch && descriptionMatch) {
        const amount = parseFloat(valueMatch[1].replace(',', '.'));
        const description = descriptionMatch[1].trim();
        
        logStep("Attempting to create transaction", { 
          type: transactionType, 
          amount, 
          description, 
          userId: user.id 
        });

        try {
          // Buscar categoria padrão ou criar uma
          let categoryId = null;
          const { data: categories } = await supabaseAdmin
            .from('categories')
            .select('id')
            .eq('name', 'Geral')
            .limit(1);

          if (categories && categories.length > 0) {
            categoryId = categories[0].id;
          } else {
            // Criar categoria padrão
            const { data: newCategory } = await supabaseAdmin
              .from('categories')
              .insert({ name: 'Geral', is_predefined: true })
              .select('id')
              .single();
            categoryId = newCategory?.id;
          }

          if (!categoryId) {
            logStep("ERROR: Could not create or find category");
            return new Response(
              JSON.stringify({ 
                response: 'Desculpe, não consegui criar a categoria necessária para a transação.' 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Usar cliente admin para inserir transação (bypass RLS)
          const { data: transactionData, error: transactionError } = await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: user.id,
              type: transactionType,
              amount: amount,
              description: description,
              date: new Date().toISOString().split('T')[0],
              category_id: categoryId
            })
            .select()
            .single();

          if (transactionError) {
            logStep("ERROR: Failed to create transaction", { error: transactionError });
            return new Response(
              JSON.stringify({ 
                response: `Desculpe, tive um problema ao criar a transação. Erro: ${transactionError.message}` 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          logStep("Transaction created successfully", { transactionId: transactionData.id });
          
          const typeText = isIncome ? 'receita' : 'despesa';
          return new Response(
            JSON.stringify({ 
              response: `✅ ${typeText.charAt(0).toUpperCase() + typeText.slice(1)} registrada com sucesso! "${description}" no valor de R$ ${amount.toFixed(2)}.` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          logStep("ERROR: Exception during transaction creation", { error: error.message });
          return new Response(
            JSON.stringify({ 
              response: `Desculpe, houve um erro inesperado ao criar a transação: ${error.message}` 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Para outras mensagens, usar OpenRouter API
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterApiKey) {
      logStep("ERROR: OpenRouter API key not found");
      return new Response(
        JSON.stringify({ error: 'Chave da API OpenRouter não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do usuário para contexto
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const { data: recentTransactions } = await supabaseAdmin
      .from('transactions')
      .select('type, amount, description, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5);

    const { data: upcomingReminders } = await supabaseAdmin
      .from('bill_reminders')
      .select('name, due_date, amount, is_paid')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(3);

    const contextInfo = {
      userName: profileData?.full_name || 'usuário',
      recentTransactions: recentTransactions || [],
      upcomingReminders: upcomingReminders || []
    };

    logStep("Context data collected", { 
      transactionCount: contextInfo.recentTransactions.length,
      reminderCount: contextInfo.upcomingReminders.length 
    });

    const systemPrompt = `Você é um assistente financeiro inteligente especializado em ajudar ${contextInfo.userName} com suas finanças pessoais.

Contexto financeiro atual:
- Transações recentes: ${JSON.stringify(contextInfo.recentTransactions)}
- Lembretes pendentes: ${JSON.stringify(contextInfo.upcomingReminders)}

Você pode ajudar a:
1. Criar lembretes de contas (formato: "criar lembrete para [nome] no dia [data]")
2. Registrar receitas e despesas (formato: "receita/despesa de [descrição] no valor de R$ [valor]")
3. Analisar gastos e dar conselhos financeiros
4. Responder perguntas sobre finanças pessoais

Seja direto, útil e amigável. Use emojis quando apropriado. Sempre confirme quando criar lembretes ou transações.`;

    // Fazer chamada para OpenRouter API
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openrouterResponse.ok) {
      logStep("ERROR: OpenRouter API request failed", { status: openrouterResponse.status });
      throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
    }

    const openrouterData = await openrouterResponse.json();
    const aiResponse = openrouterData.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

    logStep("AI response generated", { responseLength: aiResponse.length });

    // Salvar conversa no histórico usando cliente admin
    try {
      await supabaseAdmin.from('ai_chat_history').insert({
        user_id: user.id,
        message: message,
        response: aiResponse,
        openrouter_model_used: 'anthropic/claude-3.5-sonnet'
      });
      logStep("Chat history saved");
    } catch (error) {
      logStep("WARNING: Failed to save chat history", { error: error.message });
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logStep("ERROR: Unexpected error", { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);

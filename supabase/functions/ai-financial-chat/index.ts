
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

// Sistema de parsing de datas relativas
const parseRelativeDate = (text: string): string | null => {
  const today = new Date();
  const patterns = [
    { regex: /(?:daqui|em)\s+(\d+)\s+dia[s]?/i, days: (match: string[]) => parseInt(match[1]) },
    { regex: /(?:daqui|em)\s+(\d+)\s+semana[s]?/i, days: (match: string[]) => parseInt(match[1]) * 7 },
    { regex: /(?:daqui|em)\s+(\d+)\s+(?:mês|mes|meses)/i, days: (match: string[]) => parseInt(match[1]) * 30 },
    { regex: /próxim[ao]\s+(?:mês|mes)/i, days: () => 30 },
    { regex: /próxim[ao]\s+semana/i, days: () => 7 },
    { regex: /amanhã/i, days: () => 1 },
    { regex: /depois\s+de\s+amanhã/i, days: () => 2 },
    { regex: /final\s+do\s+mês/i, days: () => {
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return Math.ceil((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }},
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const daysToAdd = pattern.days(match);
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);
      return targetDate.toISOString().split('T')[0];
    }
  }

  // Datas absolutas
  const absolutePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
  ];

  for (const pattern of absolutePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern.source.includes('de')) {
        const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const day = parseInt(match[1]);
        const month = monthNames.indexOf(match[2].toLowerCase()) + 1;
        const year = today.getFullYear();
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      } else if (pattern.source.includes('\\/')) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        return match[0];
      }
    }
  }

  return null;
};

// Sistema de extração de valores monetários
const extractMonetaryValue = (text: string): number | null => {
  const patterns = [
    /R\$\s*(\d+(?:[.,]\d{2})?)/i,
    /(\d+(?:[.,]\d{2})?)\s*reais?/i,
    /valor\s+(?:de\s+)?R?\$?\s*(\d+(?:[.,]\d{2})?)/i,
    /(\d+(?:[.,]\d{2})?)\s*(?:R\$|reais?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
  }

  return null;
};

// Sistema de análise contextual avançada
const analyzeContext = (message: string, chatHistory: any[], userFinancialData: any) => {
  logStep("Analyzing context", { 
    messageLength: message.length, 
    historyCount: chatHistory.length,
    hasTransactions: !!userFinancialData.recentTransactions?.length,
    hasReminders: !!userFinancialData.upcomingReminders?.length
  });

  const context = {
    isReminderRequest: false,
    isTransactionRequest: false,
    isEditRequest: false,
    isDeleteRequest: false,
    isAnalysisRequest: false,
    extractedData: {},
    confidence: 0,
    needsMoreInfo: [],
    suggestedActions: []
  };

  // Detectar tipo de solicitação
  const reminderKeywords = ['lembrete', 'conta', 'vencimento', 'pagar', 'aviso', 'notificação'];
  const transactionKeywords = ['receita', 'despesa', 'gasto', 'ganho', 'pagamento', 'compra', 'venda'];
  const editKeywords = ['alterar', 'modificar', 'editar', 'atualizar', 'mudar', 'corrigir'];
  const deleteKeywords = ['excluir', 'deletar', 'remover', 'cancelar', 'apagar'];
  const analysisKeywords = ['analise', 'relatório', 'gastos', 'resumo', 'balanço', 'situação'];

  context.isReminderRequest = reminderKeywords.some(keyword => message.toLowerCase().includes(keyword));
  context.isTransactionRequest = transactionKeywords.some(keyword => message.toLowerCase().includes(keyword));
  context.isEditRequest = editKeywords.some(keyword => message.toLowerCase().includes(keyword));
  context.isDeleteRequest = deleteKeywords.some(keyword => message.toLowerCase().includes(keyword));
  context.isAnalysisRequest = analysisKeywords.some(keyword => message.toLowerCase().includes(keyword));

  // Extrair dados da mensagem atual
  const extractedDate = parseRelativeDate(message);
  const extractedValue = extractMonetaryValue(message);

  if (extractedDate) context.extractedData.date = extractedDate;
  if (extractedValue) context.extractedData.amount = extractedValue;

  // Buscar descrição/nome
  if (context.isReminderRequest) {
    const reminderPatterns = [
      /lembrete\s+(?:para|de|da)\s+(.+?)(?:\s+(?:no\s+dia|em|para\s+o\s+dia|vencimento|daqui)|$)/i,
      /(?:conta|pagamento)\s+(?:de|da)\s+(.+?)(?:\s+(?:no\s+dia|em|para\s+o\s+dia|vencimento|daqui)|$)/i,
      /pagar\s+(.+?)(?:\s+(?:no\s+dia|em|para\s+o\s+dia|vencimento|daqui)|$)/i
    ];

    for (const pattern of reminderPatterns) {
      const match = message.match(pattern);
      if (match) {
        context.extractedData.name = match[1].trim();
        break;
      }
    }
  }

  if (context.isTransactionRequest) {
    const transactionPatterns = [
      /(?:receita|despesa|gasto)\s+(?:de|para|com)\s+(.+?)(?:\s+(?:no\s+valor|de\s+R\$|R\$)|$)/i,
      /(?:comprei|compra|paguei|pagamento)\s+(.+?)(?:\s+(?:no\s+valor|de\s+R\$|R\$)|$)/i,
      /(?:vendi|venda|recebi)\s+(.+?)(?:\s+(?:no\s+valor|de\s+R\$|R\$)|$)/i
    ];

    for (const pattern of transactionPatterns) {
      const match = message.match(pattern);
      if (match) {
        context.extractedData.description = match[1].trim();
        break;
      }
    }

    // Determinar tipo
    const incomeKeywords = ['receita', 'ganho', 'vendi', 'recebi', 'salário'];
    const expenseKeywords = ['despesa', 'gasto', 'comprei', 'paguei', 'conta'];
    
    if (incomeKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      context.extractedData.type = 'income';
    } else if (expenseKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      context.extractedData.type = 'expense';
    }
  }

  // Buscar informações em mensagens anteriores se faltarem dados
  if (chatHistory.length > 0) {
    const recentMessages = chatHistory.slice(-5);
    
    for (const historyItem of recentMessages) {
      if (!context.extractedData.amount && !extractedValue) {
        const historicalValue = extractMonetaryValue(historyItem.message);
        if (historicalValue) {
          context.extractedData.amount = historicalValue;
          context.suggestedActions.push(`Encontrei o valor R$ ${historicalValue} em mensagem anterior`);
        }
      }

      if (!context.extractedData.date && !extractedDate) {
        const historicalDate = parseRelativeDate(historyItem.message);
        if (historicalDate) {
          context.extractedData.date = historicalDate;
          context.suggestedActions.push(`Encontrei a data ${historicalDate} em mensagem anterior`);
        }
      }
    }
  }

  // Validar dados necessários
  if (context.isReminderRequest) {
    if (!context.extractedData.name) context.needsMoreInfo.push('nome da conta');
    if (!context.extractedData.date) context.needsMoreInfo.push('data de vencimento');
    context.confidence = context.needsMoreInfo.length === 0 ? 0.9 : 0.6;
  }

  if (context.isTransactionRequest) {
    if (!context.extractedData.description) context.needsMoreInfo.push('descrição');
    if (!context.extractedData.amount) context.needsMoreInfo.push('valor');
    if (!context.extractedData.type) context.needsMoreInfo.push('tipo (receita ou despesa)');
    context.confidence = context.needsMoreInfo.length === 0 ? 0.9 : 0.6;
  }

  logStep("Context analysis complete", {
    type: Object.keys(context).filter(key => key.endsWith('Request') && context[key]),
    extractedData: context.extractedData,
    confidence: context.confidence,
    needsMoreInfo: context.needsMoreInfo
  });

  return context;
};

const handler = async (req: Request): Promise<Response> => {
  logStep("Function started");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("ERROR: Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: 'Configuração do Supabase ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    logStep("Supabase admin client initialized with service role");

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

    const { message, model } = await req.json();
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Processing message", { messageLength: message.length, model: model || 'default' });

    // CARREGAR MEMÓRIA COMPLETA DO CHAT
    const { data: chatHistory } = await supabaseAdmin
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);

    logStep("Chat history loaded", { historyCount: chatHistory?.length || 0 });

    // CARREGAR CONTEXTO FINANCEIRO COMPLETO
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const { data: recentTransactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);

    const { data: upcomingReminders } = await supabaseAdmin
      .from('bill_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(5);

    const { data: allCategories } = await supabaseAdmin
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`);

    const userFinancialData = {
      userName: profileData?.full_name || 'usuário',
      recentTransactions: recentTransactions || [],
      upcomingReminders: upcomingReminders || [],
      categories: allCategories || [],
      totalBalance: recentTransactions?.reduce((sum, t) => 
        sum + (t.type === 'income' ? t.amount : -t.amount), 0) || 0
    };

    logStep("Financial context loaded", { 
      transactionCount: userFinancialData.recentTransactions.length,
      reminderCount: userFinancialData.upcomingReminders.length,
      categoryCount: userFinancialData.categories.length,
      totalBalance: userFinancialData.totalBalance
    });

    // ANÁLISE CONTEXTUAL INTELIGENTE
    const context = analyzeContext(message, chatHistory || [], userFinancialData);
    
    let actionExecuted = false;
    let actionResult = '';

    // EXECUÇÃO DE AÇÕES BASEADA NA ANÁLISE
    if (context.confidence > 0.8) {
      if (context.isReminderRequest && context.extractedData.name && context.extractedData.date) {
        logStep("Executing reminder creation", context.extractedData);
        
        try {
          const { data: reminderData, error: reminderError } = await supabaseAdmin
            .from('bill_reminders')
            .insert({
              user_id: user.id,
              name: context.extractedData.name,
              due_date: context.extractedData.date,
              amount: context.extractedData.amount || null,
              is_paid: false
            })
            .select()
            .single();

          if (reminderError) {
            logStep("ERROR: Failed to create reminder", { error: reminderError });
            actionResult = `❌ Erro ao criar lembrete: ${reminderError.message}`;
          } else {
            logStep("Reminder created successfully", { reminderId: reminderData.id });
            actionExecuted = true;
            const formattedDate = new Date(context.extractedData.date).toLocaleDateString('pt-BR');
            actionResult = `✅ Lembrete criado com sucesso! "${context.extractedData.name}" agendado para ${formattedDate}.`;
            if (context.extractedData.amount) {
              actionResult += ` Valor: R$ ${context.extractedData.amount.toFixed(2)}`;
            }
          }
        } catch (error) {
          logStep("ERROR: Exception during reminder creation", { error: error.message });
          actionResult = `❌ Erro inesperado ao criar lembrete: ${error.message}`;
        }
      }

      if (context.isTransactionRequest && context.extractedData.description && 
          context.extractedData.amount && context.extractedData.type) {
        logStep("Executing transaction creation", context.extractedData);
        
        try {
          // Buscar ou criar categoria
          let categoryId = userFinancialData.categories.find(c => c.name === 'Geral')?.id;
          
          if (!categoryId) {
            const { data: newCategory } = await supabaseAdmin
              .from('categories')
              .insert({ name: 'Geral', is_predefined: true })
              .select('id')
              .single();
            categoryId = newCategory?.id;
          }

          if (!categoryId) {
            actionResult = `❌ Não consegui criar categoria para a transação.`;
          } else {
            const { data: transactionData, error: transactionError } = await supabaseAdmin
              .from('transactions')
              .insert({
                user_id: user.id,
                type: context.extractedData.type,
                amount: context.extractedData.amount,
                description: context.extractedData.description,
                date: context.extractedData.date || new Date().toISOString().split('T')[0],
                category_id: categoryId
              })
              .select()
              .single();

            if (transactionError) {
              logStep("ERROR: Failed to create transaction", { error: transactionError });
              actionResult = `❌ Erro ao criar transação: ${transactionError.message}`;
            } else {
              logStep("Transaction created successfully", { transactionId: transactionData.id });
              actionExecuted = true;
              const typeText = context.extractedData.type === 'income' ? 'Receita' : 'Despesa';
              actionResult = `✅ ${typeText} registrada! "${context.extractedData.description}" - R$ ${context.extractedData.amount.toFixed(2)}`;
            }
          }
        } catch (error) {
          logStep("ERROR: Exception during transaction creation", { error: error.message });
          actionResult = `❌ Erro inesperado ao criar transação: ${error.message}`;
        }
      }
    }

    // Se não executou ação ou precisa de mais informações, usar IA
    if (!actionExecuted) {
      const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!openrouterApiKey) {
        logStep("ERROR: OpenRouter API key not found");
        return new Response(
          JSON.stringify({ error: 'Chave da API OpenRouter não configurada' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar prompt contextual inteligente
      const conversationContext = (chatHistory || [])
        .slice(0, 10)
        .reverse()
        .map(h => `Usuário: ${h.message}\nAssistente: ${h.response}`)
        .join('\n\n');

      const systemPrompt = `Você é um assistente financeiro inteligente para ${userFinancialData.userName}.

MEMÓRIA DA CONVERSA:
${conversationContext}

CONTEXTO FINANCEIRO ATUAL:
- Saldo atual: R$ ${userFinancialData.totalBalance.toFixed(2)}
- Transações recentes: ${JSON.stringify(userFinancialData.recentTransactions.slice(0, 5))}
- Lembretes pendentes: ${JSON.stringify(userFinancialData.upcomingReminders)}
- Categorias disponíveis: ${userFinancialData.categories.map(c => c.name).join(', ')}

ANÁLISE DA MENSAGEM ATUAL:
${context.needsMoreInfo.length > 0 ? 
  `⚠️ INFORMAÇÕES FALTANTES: ${context.needsMoreInfo.join(', ')}` : 
  '✅ Informações completas detectadas'}

${context.extractedData ? `DADOS EXTRAÍDOS: ${JSON.stringify(context.extractedData)}` : ''}

${context.suggestedActions.length > 0 ? 
  `AÇÕES SUGERIDAS: ${context.suggestedActions.join('; ')}` : ''}

${actionResult ? `RESULTADO DA AÇÃO: ${actionResult}` : ''}

CAPACIDADES:
✅ Criar lembretes e transações automaticamente
✅ Processar datas relativas (daqui 1 semana, próximo mês)
✅ Extrair valores e descrições
✅ Analisar padrões financeiros
✅ Conectar informações entre mensagens

Seja proativo e inteligente. Se faltarem informações, pergunte especificamente o que precisa. 
Use emojis e seja conversacional. Sempre confirme ações executadas.`;

      const selectedModel = model || 'anthropic/claude-3-haiku';
      
      logStep("Calling OpenRouter API", { model: selectedModel });

      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1500,
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

      actionResult = aiResponse;
    }

    // Salvar conversa no histórico
    try {
      await supabaseAdmin.from('ai_chat_history').insert({
        user_id: user.id,
        message: message,
        response: actionResult,
        openrouter_model_used: model || 'internal-logic'
      });
      logStep("Chat history saved");
    } catch (error) {
      logStep("WARNING: Failed to save chat history", { error: error.message });
    }

    return new Response(
      JSON.stringify({ 
        response: actionResult,
        action_executed: actionExecuted,
        model_used: model || 'internal-logic',
        context_info: {
          extracted_data: context.extractedData,
          confidence: context.confidence,
          needs_more_info: context.needsMoreInfo
        }
      }),
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

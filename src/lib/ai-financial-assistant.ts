import { 
  aiDataService, 
  transactionService, 
  categoryService, 
  billReminderService, 
  analyticsService,
  type TransactionInsert,
  type CategoryInsert,
  type BillReminderInsert
} from './financial-services';

// Tipos para as ações que o AI pode executar
export interface AIAction {
  type: 'create_transaction' | 'update_transaction' | 'delete_transaction' | 
        'create_category' | 'update_category' | 'delete_category' |
        'create_bill_reminder' | 'update_bill_reminder' | 'delete_bill_reminder' |
        'analyze_spending' | 'get_insights' | 'categorize_transaction';
  data: any;
}

export interface AIResponse {
  message: string;
  actions?: AIAction[];
  data?: any;
  suggestions?: string[];
}

// Classe principal do Assistente Financeiro AI
export class FinancialAIAssistant {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Método principal para processar mensagens do usuário
  async processMessage(message: string): Promise<AIResponse> {
    try {
      // Obter contexto financeiro completo do usuário
      const context = await aiDataService.getUserFinancialContext(this.userId);
      
      // Analisar a intenção da mensagem
      const intent = this.analyzeIntent(message);
      
      // Processar baseado na intenção
      switch (intent.type) {
        case 'add_transaction':
          return await this.handleAddTransaction(message, intent.data);
        
        case 'categorize_transaction':
          return await this.handleGeneralQuery(message, context);
        
        case 'analyze_spending':
          return await this.handleAnalyzeSpending(message, context);
        
        case 'create_budget_suggestion':
          return await this.handleBudgetSuggestion(context);
        
        case 'bill_reminder':
          return await this.handleBillReminder(message, intent.data);
        
        case 'financial_insights':
          return await this.handleFinancialInsights(context);
        
        case 'expense_categorization':
          return await this.handleGeneralQuery(message, context);
        
        default:
          return await this.handleGeneralQuery(message, context);
      }
    } catch (error) {
      console.error('Erro no processamento da mensagem:', error);
      return {
        message: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        suggestions: [
          'Analise meus gastos do mês',
          'Adicione uma transação',
          'Mostre minhas contas a vencer'
        ]
      };
    }
  }

  // Analisar a intenção da mensagem do usuário
  private analyzeIntent(message: string): { type: string; data?: any } {
    const lowerMessage = message.toLowerCase();

    // Padrões para adicionar transação
    if (lowerMessage.includes('adicionar') || lowerMessage.includes('registrar') || 
        lowerMessage.includes('gastei') || lowerMessage.includes('comprei')) {
      return { type: 'add_transaction' };
    }

    // Padrões para categorização
    if (lowerMessage.includes('categorizar') || lowerMessage.includes('categoria')) {
      return { type: 'categorize_transaction' };
    }

    // Padrões para análise de gastos
    if (lowerMessage.includes('analise') || lowerMessage.includes('gastos') || 
        lowerMessage.includes('quanto gastei') || lowerMessage.includes('resumo')) {
      return { type: 'analyze_spending' };
    }

    // Padrões para orçamento
    if (lowerMessage.includes('orçamento') || lowerMessage.includes('economizar') || 
        lowerMessage.includes('sugestão')) {
      return { type: 'create_budget_suggestion' };
    }

    // Padrões para lembretes de contas
    if (lowerMessage.includes('conta') || lowerMessage.includes('vencimento') || 
        lowerMessage.includes('lembrete')) {
      return { type: 'bill_reminder' };
    }

    // Padrões para insights financeiros
    if (lowerMessage.includes('insight') || lowerMessage.includes('dica') || 
        lowerMessage.includes('conselho')) {
      return { type: 'financial_insights' };
    }

    return { type: 'general_query' };
  }

  // Lidar com adição de transações
  private async handleAddTransaction(message: string, data?: any): Promise<AIResponse> {
    // Extrair informações da mensagem usando regex e NLP simples
    const amountMatch = message.match(/(\d+(?:,\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

    if (!amount) {
      return {
        message: 'Para adicionar uma transação, preciso do valor. Por exemplo: "Gastei R$ 50,00 no supermercado"',
        suggestions: [
          'Gastei R$ 50,00 no supermercado',
          'Recebi R$ 1000,00 de salário',
          'Paguei R$ 200,00 de conta de luz'
        ]
      };
    }

    // Tentar extrair descrição e categoria
    const description = this.extractDescription(message);
    const suggestedCategory = await this.suggestCategory(description);

    // Criar a transação
    const transaction: TransactionInsert = {
      user_id: this.userId,
      amount: amount,
      description: description,
      date: new Date().toISOString().split('T')[0],
      type: 'expense', // Por padrão, assumir gasto
      category_id: suggestedCategory?.id || '', // Usar categoria sugerida ou padrão
    };

    try {
      const result = await transactionService.create(transaction);
      
      return {
        message: `✅ Transação adicionada com sucesso!\n\n💰 Valor: R$ ${amount.toFixed(2)}\n📝 Descrição: ${description}\n🏷️ Categoria: ${suggestedCategory?.name || 'Sem categoria'}\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}`,
        actions: [{
          type: 'create_transaction',
          data: result.data
        }],
        suggestions: [
          'Analise meus gastos de hoje',
          'Categorize esta transação diferente',
          'Adicione outra transação'
        ]
      };
    } catch (error) {
      return {
        message: 'Erro ao adicionar a transação. Tente novamente.',
        suggestions: ['Tente adicionar novamente']
      };
    }
  }

  // Lidar com análise de gastos
  private async handleAnalyzeSpending(message: string, context: any): Promise<AIResponse> {
    const { summary, transactions } = context;

    if (!summary || !transactions.length) {
      return {
        message: 'Você ainda não possui transações registradas. Que tal adicionar algumas para começar a análise?',
        suggestions: [
          'Adicionar uma transação',
          'Conectar conta bancária',
          'Ver categorias disponíveis'
        ]
      };
    }

    // Análise dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const categoryAnalysis = await analyticsService.getExpensesByCategory(
      this.userId,
      thirtyDaysAgo.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const topCategories = categoryAnalysis
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    let analysisMessage = `📊 **Análise dos seus gastos (últimos 30 dias)**\n\n`;
    analysisMessage += `💰 **Resumo Financeiro:**\n`;
    analysisMessage += `• Receitas: R$ ${summary.income.toFixed(2)}\n`;
    analysisMessage += `• Gastos: R$ ${summary.expenses.toFixed(2)}\n`;
    analysisMessage += `• Saldo: R$ ${summary.balance.toFixed(2)}\n`;
    analysisMessage += `• Total de transações: ${summary.transactionCount}\n\n`;

    if (topCategories.length > 0) {
      analysisMessage += `🏷️ **Principais categorias de gasto:**\n`;
      topCategories.forEach((cat, index) => {
        const percentage = (cat.amount / summary.expenses * 100).toFixed(1);
        analysisMessage += `${index + 1}. ${cat.category}: R$ ${cat.amount.toFixed(2)} (${percentage}%)\n`;
      });
    }

    // Adicionar insights baseados nos dados
    const insights = this.generateSpendingInsights(summary, categoryAnalysis);
    if (insights.length > 0) {
      analysisMessage += `\n💡 **Insights:**\n`;
      insights.forEach(insight => {
        analysisMessage += `• ${insight}\n`;
      });
    }

    return {
      message: analysisMessage,
      data: { summary, categoryAnalysis },
      suggestions: [
        'Como posso economizar mais?',
        'Mostre gastos por categoria',
        'Crie um orçamento para mim'
      ]
    };
  }

  // Lidar com sugestões de orçamento
  private async handleBudgetSuggestion(context: any): Promise<AIResponse> {
    const { summary, transactions } = context;

    if (!summary || summary.transactionCount === 0) {
      return {
        message: 'Para criar sugestões de orçamento, preciso de mais dados sobre seus gastos. Adicione algumas transações primeiro.',
        suggestions: [
          'Adicionar transações',
          'Conectar conta bancária',
          'Ver categorias de gastos'
        ]
      };
    }

    const categoryAnalysis = await analyticsService.getExpensesByCategory(
      this.userId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    let budgetMessage = `💰 **Sugestões de Orçamento Personalizado**\n\n`;
    budgetMessage += `Com base nos seus gastos dos últimos 30 dias, aqui estão minhas sugestões:\n\n`;

    // Regra 50/30/20
    const monthlyIncome = summary.income;
    const needs = monthlyIncome * 0.5; // 50% necessidades
    const wants = monthlyIncome * 0.3; // 30% desejos
    const savings = monthlyIncome * 0.2; // 20% poupança

    budgetMessage += `📋 **Regra 50/30/20 baseada na sua renda:**\n`;
    budgetMessage += `• Necessidades (50%): R$ ${needs.toFixed(2)}\n`;
    budgetMessage += `• Desejos (30%): R$ ${wants.toFixed(2)}\n`;
    budgetMessage += `• Poupança (20%): R$ ${savings.toFixed(2)}\n\n`;

    // Sugestões específicas por categoria
    if (categoryAnalysis.length > 0) {
      budgetMessage += `🎯 **Sugestões por categoria:**\n`;
      categoryAnalysis.forEach(cat => {
        const suggestedBudget = cat.amount * 0.9; // Sugerir 10% de redução
        budgetMessage += `• ${cat.category}: R$ ${suggestedBudget.toFixed(2)} (atual: R$ ${cat.amount.toFixed(2)})\n`;
      });
    }

    // Dicas de economia
    const economyTips = this.generateEconomyTips(categoryAnalysis);
    if (economyTips.length > 0) {
      budgetMessage += `\n💡 **Dicas para economizar:**\n`;
      economyTips.forEach(tip => {
        budgetMessage += `• ${tip}\n`;
      });
    }

    return {
      message: budgetMessage,
      suggestions: [
        'Crie lembretes para essas metas',
        'Analise meus gastos atuais',
        'Como posso economizar mais?'
      ]
    };
  }

  // Lidar com lembretes de contas
  private async handleBillReminder(message: string, data?: any): Promise<AIResponse> {
    const upcomingBills = await billReminderService.getUpcoming(this.userId, 7);

    if (upcomingBills.data && upcomingBills.data.length > 0) {
      let reminderMessage = `📅 **Contas próximas ao vencimento:**\n\n`;
      
      upcomingBills.data.forEach(bill => {
        const dueDate = new Date(bill.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        reminderMessage += `• ${bill.name}: R$ ${bill.amount?.toFixed(2) || '0,00'}\n`;
        reminderMessage += `  📅 Vence em ${daysUntilDue} dias (${dueDate.toLocaleDateString('pt-BR')})\n\n`;
      });

      return {
        message: reminderMessage,
        data: upcomingBills.data,
        suggestions: [
          'Marcar conta como paga',
          'Adicionar novo lembrete',
          'Ver todas as contas'
        ]
      };
    } else {
      return {
        message: '✅ Você não tem contas próximas ao vencimento nos próximos 7 dias!',
        suggestions: [
          'Adicionar novo lembrete de conta',
          'Ver todas as contas',
          'Analisar gastos do mês'
        ]
      };
    }
  }

  // Lidar com insights financeiros gerais
  private async handleFinancialInsights(context: any): Promise<AIResponse> {
    const { summary, transactions, categories } = context;

    let insightsMessage = `🔍 **Insights Financeiros Personalizados**\n\n`;

    // Análise de padrões de gasto
    const spendingPatterns = this.analyzeSpendingPatterns(transactions);
    
    if (spendingPatterns.length > 0) {
      insightsMessage += `📈 **Padrões identificados:**\n`;
      spendingPatterns.forEach(pattern => {
        insightsMessage += `• ${pattern}\n`;
      });
      insightsMessage += `\n`;
    }

    // Saúde financeira
    const healthScore = this.calculateFinancialHealth(summary);
    insightsMessage += `💚 **Pontuação de Saúde Financeira: ${healthScore}/100**\n\n`;

    // Recomendações personalizadas
    const recommendations = this.generatePersonalizedRecommendations(summary, transactions);
    if (recommendations.length > 0) {
      insightsMessage += `🎯 **Recomendações personalizadas:**\n`;
      recommendations.forEach(rec => {
        insightsMessage += `• ${rec}\n`;
      });
    }

    return {
      message: insightsMessage,
      suggestions: [
        'Como melhorar minha saúde financeira?',
        'Crie um plano de economia',
        'Analise meus gastos por categoria'
      ]
    };
  }

  // Lidar com consultas gerais
  private async handleGeneralQuery(message: string, context: any): Promise<AIResponse> {
    const { summary, transactions } = context;

    // Resposta padrão com informações úteis
    let response = `Olá! Sou seu assistente financeiro pessoal. 🤖💰\n\n`;
    
    if (summary && summary.transactionCount > 0) {
      response += `📊 **Resumo rápido:**\n`;
      response += `• Você tem ${summary.transactionCount} transações registradas\n`;
      response += `• Saldo atual: R$ ${summary.balance.toFixed(2)}\n\n`;
    }

    response += `💡 **Posso te ajudar com:**\n`;
    response += `• Adicionar e categorizar transações\n`;
    response += `• Analisar seus gastos e padrões\n`;
    response += `• Criar orçamentos personalizados\n`;
    response += `• Gerenciar lembretes de contas\n`;
    response += `• Dar insights sobre sua saúde financeira\n\n`;
    response += `Como posso te ajudar hoje?`;

    return {
      message: response,
      suggestions: [
        'Analise meus gastos do mês',
        'Adicione uma transação',
        'Crie um orçamento para mim',
        'Mostre minhas contas a vencer'
      ]
    };
  }

  // Métodos auxiliares
  private extractDescription(message: string): string {
    // Remover valores monetários e palavras-chave para extrair descrição
    let description = message
      .replace(/r\$?\s*\d+(?:,\d{2})?/gi, '')
      .replace(/\b(gastei|comprei|paguei|recebi|adicion\w*|registr\w*)\b/gi, '')
      .trim();

    return description || 'Transação';
  }

  private async suggestCategory(description: string): Promise<{ id: string; name: string } | null> {
    // Lógica simples de sugestão de categoria baseada em palavras-chave
    const categories = await categoryService.getAll(this.userId);
    
    if (!categories.data) return null;

    const lowerDescription = description.toLowerCase();
    
    // Mapeamento de palavras-chave para categorias
    const categoryKeywords = {
      'alimentação': ['supermercado', 'restaurante', 'comida', 'lanche', 'mercado'],
      'transporte': ['uber', 'gasolina', 'ônibus', 'metro', 'taxi'],
      'saúde': ['farmácia', 'médico', 'hospital', 'remédio'],
      'lazer': ['cinema', 'show', 'festa', 'viagem', 'diversão'],
      'casa': ['luz', 'água', 'gás', 'internet', 'aluguel']
    };

    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerDescription.includes(keyword))) {
        const category = categories.data.find(cat => 
          cat.name.toLowerCase().includes(categoryName)
        );
        if (category) {
          return { id: category.id, name: category.name };
        }
      }
    }

    return null;
  }

  private generateSpendingInsights(summary: any, categoryAnalysis: any[]): string[] {
    const insights: string[] = [];

    // Insight sobre saldo
    if (summary.balance < 0) {
      insights.push('Atenção: Seus gastos estão superando sua renda. Considere revisar seu orçamento.');
    } else if (summary.balance > summary.income * 0.2) {
      insights.push('Parabéns! Você está conseguindo poupar mais de 20% da sua renda.');
    }

    // Insight sobre categoria dominante
    if (categoryAnalysis.length > 0) {
      const topCategory = categoryAnalysis[0];
      const percentage = (topCategory.amount / summary.expenses * 100);
      if (percentage > 40) {
        insights.push(`${topCategory.category} representa ${percentage.toFixed(1)}% dos seus gastos. Considere revisar esta categoria.`);
      }
    }

    return insights;
  }

  private generateEconomyTips(categoryAnalysis: any[]): string[] {
    const tips: string[] = [];

    categoryAnalysis.forEach(cat => {
      switch (cat.category.toLowerCase()) {
        case 'alimentação':
          tips.push('Considere cozinhar mais em casa para economizar em alimentação');
          break;
        case 'transporte':
          tips.push('Avalie usar transporte público ou caronas para reduzir custos');
          break;
        case 'lazer':
          tips.push('Procure atividades gratuitas ou mais baratas para entretenimento');
          break;
      }
    });

    return tips;
  }

  private analyzeSpendingPatterns(transactions: any[]): string[] {
    const patterns: string[] = [];

    // Analisar frequência de gastos
    const dailyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const date = t.date;
        acc[date] = (acc[date] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const expenseValues = Object.values(dailyExpenses);
    if (expenseValues.length > 0) {
      const avgDailyExpense = expenseValues.reduce((a: number, b: number) => a + b, 0) / expenseValues.length;

      if (avgDailyExpense > 100) {
        patterns.push('Você tem uma média de gastos diários alta (R$ ' + avgDailyExpense.toFixed(2) + ')');
      }
    }

    return patterns;
  }

  private calculateFinancialHealth(summary: any): number {
    let score = 50; // Base score

    // Positive balance
    if (summary.balance > 0) score += 20;
    
    // Savings rate
    const savingsRate = summary.balance / summary.income;
    if (savingsRate > 0.2) score += 20;
    else if (savingsRate > 0.1) score += 10;

    // Expense control
    if (summary.expenses < summary.income * 0.8) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private generatePersonalizedRecommendations(summary: any, transactions: any[]): string[] {
    const recommendations: string[] = [];

    if (summary.balance < summary.income * 0.1) {
      recommendations.push('Tente poupar pelo menos 10% da sua renda mensal');
    }

    if (transactions.length < 10) {
      recommendations.push('Registre mais transações para análises mais precisas');
    }

    recommendations.push('Configure lembretes para suas contas fixas');
    recommendations.push('Revise seus gastos semanalmente para manter o controle');

    return recommendations;
  }
}

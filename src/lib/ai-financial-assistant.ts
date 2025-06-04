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

// Tipos específicos para dados das ações
interface TransactionData {
  id?: string;
  amount?: number;
  description?: string;
  category_id?: string;
  date?: string;
  type?: string;
  bank_connection_id?: string;
  belvo_account_id?: string;
  created_at?: string;
  is_imported?: boolean;
  source_transaction_id?: string;
  updated_at?: string;
  user_id?: string;
  categories?: { name: string };
}

interface CategoryData {
  id?: string;
  name?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_predefined?: boolean;
}

interface BillReminderData {
  id?: string;
  name?: string;
  amount?: number;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_paid?: boolean;
}

interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
}

interface CategoryAnalysis {
  category: string;
  amount: number;
}

// Importar tipos de financial-services
import type { Profile, BankConnection } from './financial-services';

interface FinancialContext {
  profile: Profile | null; // Usar o tipo Profile
  transactions: TransactionData[];
  categories: CategoryData[];
  bankConnections: BankConnection[]; // Usar o tipo BankConnection
  billReminders: BillReminderData[];
  summary: FinancialSummary;
}

interface IntentData {
  type: string;
  data?: Record<string, unknown>;
}

type ActionData = TransactionData | CategoryData | BillReminderData | Record<string, unknown>;

// Tipos para as ações que o AI pode executar
export interface AIAction {
  type: 'create_transaction' | 'update_transaction' | 'delete_transaction' | 
        'create_category' | 'update_category' | 'delete_category' |
        'create_bill_reminder' | 'update_bill_reminder' | 'delete_bill_reminder' |
        'analyze_spending' | 'get_insights' | 'categorize_transaction' |
        'list_bill_reminders' | 'list_transactions' | 'list_categories';
  data: ActionData;
}

export interface AIResponse {
  message: string;
  actions?: AIAction[];
  data?: Record<string, unknown> | unknown[];
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
        case 'delete_transaction':
          return await this.handleDeleteTransaction(message, intent.data);
        case 'create_category':
          return await this.handleCreateCategory(message, intent.data);
        case 'delete_category':
          return await this.handleDeleteCategory(message, intent.data);
        case 'create_bill_reminder':
          return await this.handleCreateBillReminder(message, intent.data);
        case 'delete_bill_reminder':
          return await this.handleDeleteBillReminder(message, intent.data);
        case 'list_bill_reminders':
          return await this.handleListBillReminders(message, context);
        case 'list_transactions':
          return await this.handleListTransactions(message, context);
        case 'list_categories':
          return await this.handleListCategories(message, context);
        case 'analyze_spending':
          return await this.handleAnalyzeSpending(message, context);
        case 'create_budget_suggestion':
          return await this.handleBudgetSuggestion(context);
        case 'financial_insights':
          return await this.handleFinancialInsights(context);
        case 'categorize_transaction':
        case 'expense_categorization':
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
  private analyzeIntent(message: string): IntentData {
    const lowerMessage = message.toLowerCase();

    // Padrões para adicionar transação
    if (lowerMessage.includes('adicionar transação') || lowerMessage.includes('registrar gasto') || 
        lowerMessage.includes('gastei') || lowerMessage.includes('comprei') || lowerMessage.includes('recebi')) {
      return { type: 'add_transaction' };
    }

    // Padrões para deletar transação
    if (lowerMessage.includes('apagar transação') || lowerMessage.includes('excluir transação') || 
        lowerMessage.includes('remover transação')) {
      return { type: 'delete_transaction' };
    }

    // Padrões para criar categoria
    if (lowerMessage.includes('criar categoria') || lowerMessage.includes('nova categoria')) {
      return { type: 'create_category' };
    }

    // Padrões para deletar categoria
    if (lowerMessage.includes('apagar categoria') || lowerMessage.includes('excluir categoria') || 
        lowerMessage.includes('remover categoria')) {
      return { type: 'delete_category' };
    }

    // Padrões para criar lembrete de conta
    if (lowerMessage.includes('criar lembrete') || lowerMessage.includes('novo lembrete') || 
        lowerMessage.includes('adicionar conta a pagar')) {
      return { type: 'create_bill_reminder' };
    }

    // Padrões para deletar lembrete de conta
    if (lowerMessage.includes('apagar lembrete') || lowerMessage.includes('excluir lembrete') || 
        lowerMessage.includes('remover lembrete') || lowerMessage.includes('apague todos os lembretes')) {
      return { type: 'delete_bill_reminder' };
    }

    // Padrões para listar lembretes
    if (lowerMessage.includes('mostrar lembretes') || lowerMessage.includes('ver contas a vencer') ||
        lowerMessage.includes('quais minhas contas')) {
      return { type: 'list_bill_reminders' };
    }

    // Padrões para listar transações
    if (lowerMessage.includes('mostrar transações') || lowerMessage.includes('ver transações') ||
        lowerMessage.includes('listar transações')) {
      return { type: 'list_transactions' };
    }

    // Padrões para listar categorias
    if (lowerMessage.includes('mostrar categorias') || lowerMessage.includes('ver categorias') ||
        lowerMessage.includes('listar categorias')) {
      return { type: 'list_categories' };
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

    // Padrões para insights financeiros
    if (lowerMessage.includes('insight') || lowerMessage.includes('dica') || 
        lowerMessage.includes('conselho')) {
      return { type: 'financial_insights' };
    }

    return { type: 'general_query' };
  }

  // Extrair descrição da mensagem
  private extractDescription(message: string): string {
    // Remove valores monetários e palavras comuns
    let description = message
      .replace(/r\$?\s*\d+(?:[.,]\d{2})?/gi, '')
      .replace(/\b(gastei|comprei|paguei|recebi|ganhei)\b/gi, '')
      .replace(/\b(no|na|de|do|da|com|para|em)\b/gi, '')
      .trim();

    // Se a descrição ficou muito curta, usar a mensagem original
    if (description.length < 3) {
      description = message;
    }

    return description || 'Transação';
  }

  // Sugerir categoria baseada na descrição
  private async suggestCategory(description: string): Promise<CategoryData | null> {
    try {
      const categories = await categoryService.getAll(this.userId);
      if (!categories.data) return null;

      const lowerDescription = description.toLowerCase();
      
      // Mapeamento de palavras-chave para categorias
      const categoryKeywords: Record<string, string[]> = {
        'alimentação': ['comida', 'restaurante', 'supermercado', 'lanche', 'pizza', 'hambúrguer', 'café'],
        'transporte': ['uber', 'taxi', 'ônibus', 'metro', 'gasolina', 'combustível', 'estacionamento'],
        'saúde': ['médico', 'farmácia', 'hospital', 'dentista', 'remédio', 'consulta'],
        'lazer': ['cinema', 'teatro', 'show', 'festa', 'bar', 'diversão', 'entretenimento'],
        'educação': ['curso', 'livro', 'escola', 'faculdade', 'universidade', 'aula'],
        'casa': ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'telefone'],
        'roupas': ['roupa', 'sapato', 'calça', 'camisa', 'vestido', 'tênis', 'moda']
      };

      // Procurar categoria que melhor corresponde
      for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerDescription.includes(keyword))) {
          const category = categories.data.find(cat => 
            cat.name.toLowerCase().includes(categoryName.toLowerCase())
          );
          if (category) return category;
        }
      }

      // Retornar categoria padrão se disponível
      return categories.data.find(cat => cat.name.toLowerCase() === 'outros') || categories.data[0] || null;
    } catch (error) {
      console.error('Erro ao sugerir categoria:', error);
      return null;
    }
  }

  // Lidar com adição de transações
  private async handleAddTransaction(message: string, data?: Record<string, unknown>): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    const amountMatch = message.match(/(\d+(?:[.,]\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

    if (amount === null) {
      return {
        message: 'Para adicionar uma transação, preciso do valor. Por exemplo: "Gastei R$ 50,00 no supermercado"',
        suggestions: [
          'Gastei R$ 50,00 no supermercado',
          'Recebi R$ 1000,00 de salário',
          'Paguei R$ 200,00 de conta de luz'
        ]
      };
    }

    const description = this.extractDescription(message);
    const type = lowerMessage.includes('recebi') || lowerMessage.includes('ganhei') ? 'income' : 'expense';
    const suggestedCategory = await this.suggestCategory(description);

    const transaction: TransactionInsert = {
      user_id: this.userId,
      amount: amount,
      description: description,
      date: new Date().toISOString().split('T')[0],
      type: type,
      category_id: suggestedCategory?.id || '',
    };

    try {
      const result = await transactionService.create(transaction);
      
      return {
        message: `✅ Transação adicionada com sucesso!\n\n💰 Valor: R$ ${amount.toFixed(2)}\n📝 Descrição: ${description}\n🏷️ Categoria: ${suggestedCategory?.name || 'Sem categoria'}\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}`,
        actions: [{
          type: 'create_transaction',
          data: result.data as TransactionData
        }],
        suggestions: [
          'Analise meus gastos de hoje',
          'Adicione outra transação',
          'Mostre minhas transações'
        ]
      };
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      return {
        message: 'Erro ao adicionar a transação. Tente novamente.',
        suggestions: ['Tente adicionar novamente']
      };
    }
  }

  // Lidar com exclusão de transações
  private async handleDeleteTransaction(message: string, data?: Record<string, unknown>): Promise<AIResponse> {
    const idMatch = message.match(/id\s*(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/i);
    const id = idMatch ? idMatch[1] : null;

    if (!id) {
      return {
        message: 'Para apagar uma transação, preciso do ID dela. Você pode encontrá-lo na lista de transações.',
        suggestions: [
          'Mostrar minhas transações',
          'Apagar transação com ID [ID_DA_TRANSACAO]'
        ]
      };
    }

    try {
      await transactionService.delete(id);
      return {
        message: `✅ Transação com ID ${id} apagada com sucesso!`,
        actions: [{
          type: 'delete_transaction',
          data: { id }
        }],
        suggestions: [
          'Mostrar minhas transações',
          'Adicionar nova transação'
        ]
      };
    } catch (error) {
      console.error('Erro ao apagar transação:', error);
      return {
        message: `Erro ao apagar a transação com ID ${id}. Verifique se o ID está correto e tente novamente.`,
        suggestions: ['Tente apagar novamente']
      };
    }
  }

  // Lidar com criação de categorias
  private async handleCreateCategory(message: string, data?: Record<string, unknown>): Promise<AIResponse> {
    const nameMatch = message.match(/(?:criar categoria|nova categoria)\s*(.+)/i);
    const name = nameMatch ? nameMatch[1].trim() : null;

    if (!name) {
      return {
        message: 'Para criar uma categoria, preciso do nome dela. Por exemplo: "Criar categoria Lazer"',
        suggestions: [
          'Criar categoria Viagem',
          'Criar categoria Educação'
        ]
      };
    }

    const category: CategoryInsert = {
      user_id: this.userId,
      name: name,
    };

    try {
      const result = await categoryService.create(category);
      return {
        message: `✅ Categoria "${name}" criada com sucesso!`,
        actions: [{
          type: 'create_category',
          data: result.data as CategoryData
        }],
        suggestions: [
          'Mostrar minhas categorias',
          'Adicionar transação com esta categoria'
        ]
      };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return {
        message: `Erro ao criar a categoria "${name}". Tente novamente.`,
        suggestions: ['Tente criar novamente']
      };
    }
  }

  // Lidar com exclusão de categorias
  private async handleDeleteCategory(message: string, data?: Record<string, unknown>): Promise<AIResponse> {
    const nameMatch = message.match(/(?:apagar categoria|excluir categoria|remover categoria)\s*(.+)/i);
    const name = nameMatch ? nameMatch[1].trim() : null;

    if (!name) {
      return {
        message: 'Para apagar uma categoria, preciso do nome dela. Por exemplo: "Apagar categoria Lazer"',
        suggestions: [
          'Mostrar minhas categorias',
          'Apagar categoria Viagem'
        ]
      };
    }

    try {
      const categories = await categoryService.getAll(this.userId);
      const categoryToDelete = categories.data?.find(cat => cat.name.toLowerCase() === name.toLowerCase());

      if (!categoryToDelete) {
        return {
          message: `Categoria "${name}" não encontrada. Verifique o nome e tente novamente.`,
          suggestions: ['Mostrar minhas categorias']
        };
      }

      await categoryService.delete(categoryToDelete.id, this.userId);
      return {
        message: `✅ Categoria "${name}" apagada com sucesso!`,
        actions: [{
          type: 'delete_category',
          data: { id: categoryToDelete.id }
        }],
        suggestions: [
          'Mostrar minhas categorias',
          'Criar nova categoria'
        ]
      };
    } catch (error) {
      console.error('Erro ao apagar categoria:', error);
      return {
        message: `Erro ao apagar a categoria "${name}". Categorias predefinidas não podem ser apagadas.`,
        suggestions: ['Tente apagar novamente']
      };
    }
  }

  // Lidar com criação de lembretes de contas
  private async handleCreateBillReminder(message: string, data?: Record<string, unknown>): Promise<AIResponse> {
    const nameMatch = message.match(/(?:criar lembrete|novo lembrete|adicionar conta a pagar)\s*(.+?)(?: no valor de| de R\$)\s*(\d+(?:[.,]\d{2})?)(?: para| em| com vencimento em)\s*(\d{2}\/\d{2}\/\d{4})/i);
    
    if (!nameMatch) {
      return {
        message: 'Para criar um lembrete, preciso do nome, valor e data de vencimento. Ex: "Criar lembrete de aluguel no valor de R$ 1200,00 para 05/07/2025"',
        suggestions: [
          'Criar lembrete de internet R$ 100,00 para 15/06/2025',
          'Adicionar conta de luz R$ 80,00 com vencimento em 20/07/2025'
        ]
      };
    }

    const name = nameMatch[1].trim();
    const amount = parseFloat(nameMatch[2].replace(',', '.'));
    const dueDateParts = nameMatch[3].split('/');
    const dueDate = `${dueDateParts[2]}-${dueDateParts[1]}-${dueDateParts[0]}`;

    const reminder: BillReminderInsert = {
      user_id: this.userId,
      name: name,
      amount: amount,
      due_date: dueDate,
      is_paid: false,
    };

    try {
      const result = await billReminderService.create(reminder);
      return {
        message: `✅ Lembrete "${name}" no valor de R$ ${amount.toFixed(2)} com vencimento em ${nameMatch[3]} criado com sucesso!`,
        actions: [{
          type: 'create_bill_reminder',
          data: result.data as BillReminderData
        }],
        suggestions: [
          'Mostrar minhas contas a vencer',
          'Adicionar outro lembrete'
        ]
      };
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      return {
        message: `Erro ao criar o lembrete "${name}". Tente novamente.`,
        suggestions: ['Tente criar novamente']
      };
    }
  }

  // Lidar com exclusão de lembretes de contas
  private async handleDeleteBillReminder(message: string, data?: Record<string, unknown>): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    
    // Verificar se é para apagar todos os lembretes
    if (lowerMessage.includes('apague todos os lembretes') || lowerMessage.includes('apagar todos os lembretes')) {
      try {
        const reminders = await billReminderService.getAll(this.userId);
        
        if (!reminders.data || reminders.data.length === 0) {
          return {
            message: 'Você não tem lembretes para apagar.',
            suggestions: [
              'Criar novo lembrete',
              'Ver minhas transações'
            ]
          };
        }

        // Apagar todos os lembretes
        const deletePromises = reminders.data.map(reminder =>
          billReminderService.delete(reminder.id).then(response => ({
            id: reminder.id,
            status: response.error ? 'failed' : 'fulfilled',
            error: response.error,
          }))
        );

        const results = await Promise.allSettled(deletePromises);

        let successfulDeletes = 0;
        const failedDeletes: { id: string, error: unknown }[] = []; // Alterado de any para unknown

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.status === 'fulfilled') {
            successfulDeletes++;
          } else if (result.status === 'fulfilled' && result.value.status === 'failed') {
            failedDeletes.push({ id: result.value.id, error: result.value.error });
            console.error(`Erro ao apagar lembrete ${result.value.id}:`, result.value.error);
          } else if (result.status === 'rejected') {
            // Isso não deveria acontecer com a forma como deletePromises está estruturado agora,
            // mas é bom ter um log caso aconteça.
            console.error('Promessa de exclusão rejeitada inesperadamente:', result.reason);
          }
        });

        let responseMessage = '';
        if (successfulDeletes === reminders.data.length) {
          responseMessage = `✅ Todos os ${successfulDeletes} lembretes foram apagados com sucesso!`;
        } else if (successfulDeletes > 0) {
          responseMessage = `✅ ${successfulDeletes} lembretes foram apagados com sucesso. Falha ao apagar ${failedDeletes.length} lembretes.`;
        } else {
          responseMessage = `❌ Falha ao apagar todos os ${reminders.data.length} lembretes.`;
        }
        
        if (failedDeletes.length > 0) {
          responseMessage += "\nDetalhes dos erros podem ser encontrados no console do servidor.";
        }

        return {
          message: responseMessage,
          actions: reminders.data
            .filter(reminder => failedDeletes.every(fd => fd.id !== reminder.id)) // Apenas ações para os bem-sucedidos
            .map(reminder => ({
              type: 'delete_bill_reminder' as const,
              data: { id: reminder.id }
          })), // Fechamento do parêntese do map
          suggestions: [
            'Criar novo lembrete',
            'Ver minhas transações',
            'Analise meus gastos'
          ]
        };
      } catch (error) {
        console.error('Erro ao apagar todos os lembretes:', error);
        return {
          message: 'Erro ao apagar os lembretes. Tente novamente.',
          suggestions: ['Tente apagar novamente']
        };
      }
    }

    // Lógica para apagar lembrete específico
    const idMatch = message.match(/id\s*(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/i);
    const nameMatch = message.match(/(?:apagar lembrete|excluir lembrete|remover lembrete)\s*(.+)/i);
    
    let id: string | null = null;
    let name: string | null = null;

    if (idMatch) {
      id = idMatch[1];
    } else if (nameMatch) {
      name = nameMatch[1].trim();
    }

    if (!id && !name) {
      return {
        message: 'Para apagar um lembrete, preciso do ID ou do nome dele. Por exemplo: "Apagar lembrete de água" ou "Apagar lembrete com ID [ID_DO_LEMBRETE]"',
        suggestions: [
          'Mostrar minhas contas a vencer',
          'Apagar lembrete de aluguel',
          'Apague todos os lembretes'
        ]
      };
    }

    try {
      let reminderToDeleteId: string | undefined;

      if (id) {
        reminderToDeleteId = id;
      } else if (name) {
        const reminders = await billReminderService.getAll(this.userId);
        const reminder = reminders.data?.find(r => r.name.toLowerCase() === name?.toLowerCase());
        if (reminder) {
          reminderToDeleteId = reminder.id;
        } else {
          return {
            message: `Lembrete "${name}" não encontrado. Verifique o nome e tente novamente.`,
            suggestions: ['Mostrar minhas contas a vencer']
          };
        }
      }

      if (!reminderToDeleteId) {
        return {
          message: 'Não foi possível identificar o lembrete para apagar. Por favor, forneça um ID ou nome válido.',
          suggestions: ['Mostrar minhas contas a vencer']
        };
      }

      await billReminderService.delete(reminderToDeleteId);
      return {
        message: `✅ Lembrete apagado com sucesso!`,
        actions: [{
          type: 'delete_bill_reminder',
          data: { id: reminderToDeleteId }
        }],
        suggestions: [
          'Mostrar minhas contas a vencer',
          'Adicionar novo lembrete'
        ]
      };
    } catch (error) {
      console.error('Erro ao apagar lembrete:', error);
      return {
        message: `Erro ao apagar o lembrete. Tente novamente.`,
        suggestions: ['Tente apagar novamente']
      };
    }
  }

  // Lidar com listagem de lembretes
  private async handleListBillReminders(message: string, context: FinancialContext): Promise<AIResponse> {
    const { billReminders } = context;

    if (!billReminders || billReminders.length === 0) {
      return {
        message: 'Você não tem lembretes de contas registrados. Que tal adicionar um?',
        suggestions: [
          'Adicionar novo lembrete',
          'Analisar meus gastos'
        ]
      };
    }

    let responseMessage = '📅 **Seus lembretes de contas:**\n\n';
    billReminders.forEach(reminder => {
      responseMessage += `• **${reminder.name}** (ID: ${reminder.id})\n`;
      responseMessage += `  Valor: R$ ${reminder.amount?.toFixed(2) || '0,00'}\n`;
      responseMessage += `  Vencimento: ${new Date(reminder.due_date || '').toLocaleDateString('pt-BR')}\n`;
      responseMessage += `  Status: ${reminder.is_paid ? 'Pago' : 'Pendente'}\n\n`;
    });

    return {
      message: responseMessage,
      data: billReminders,
      suggestions: [
        'Adicionar novo lembrete',
        'Apagar um lembrete',
        'Apague todos os lembretes'
      ]
    };
  }

  // Lidar com listagem de transações
  private async handleListTransactions(message: string, context: FinancialContext): Promise<AIResponse> {
    const { transactions } = context;

    if (!transactions || transactions.length === 0) {
      return {
        message: 'Você não tem transações registradas. Que tal adicionar uma?',
        suggestions: [
          'Adicionar uma transação',
          'Analisar meus gastos'
        ]
      };
    }

    let responseMessage = '💸 **Suas últimas transações:**\n\n';
    transactions.slice(0, 5).forEach(transaction => {
      responseMessage += `• **${transaction.description}** (ID: ${transaction.id})\n`;
      responseMessage += `  Valor: R$ ${(transaction.amount || 0).toFixed(2)}\n`;
      responseMessage += `  Tipo: ${transaction.type === 'income' ? 'Receita' : 'Despesa'}\n`;
      responseMessage += `  Categoria: ${transaction.categories?.name || 'Sem Categoria'}\n`;
      responseMessage += `  Data: ${new Date(transaction.date || '').toLocaleDateString('pt-BR')}\n\n`;
    });

    if (transactions.length > 5) {
      responseMessage += `...e mais ${transactions.length - 5} transações.`;
    }

    return {
      message: responseMessage,
      data: transactions,
      suggestions: [
        'Adicionar nova transação',
        'Apagar uma transação',
        'Analise meus gastos do mês'
      ]
    };
  }

  // Lidar com listagem de categorias
  private async handleListCategories(message: string, context: FinancialContext): Promise<AIResponse> {
    const { categories } = context;

    if (!categories || categories.length === 0) {
      return {
        message: 'Você não tem categorias registradas. Que tal criar uma?',
        suggestions: [
          'Criar nova categoria',
          'Adicionar uma transação'
        ]
      };
    }

    let responseMessage = '🏷️ **Suas categorias:**\n\n';
    categories.forEach(category => {
      responseMessage += `• **${category.name}** (ID: ${category.id})\n`;
      responseMessage += `  ${category.is_predefined ? 'Predefinida' : 'Criada por você'}\n\n`;
    });

    return {
      message: responseMessage,
      data: categories,
      suggestions: [
        'Criar nova categoria',
        'Apagar uma categoria',
        'Adicionar transação com categoria'
      ]
    };
  }

  // Gerar insights de gastos
  private generateSpendingInsights(summary: FinancialSummary, categoryAnalysis: CategoryAnalysis[]): string[] {
    const insights: string[] = [];

    // Insight sobre saldo
    if (summary.balance > 0) {
      insights.push(`Parabéns! Você tem um saldo positivo de R$ ${summary.balance.toFixed(2)}.`);
    } else if (summary.balance < 0) {
      insights.push(`Atenção: Seus gastos superaram suas receitas em R$ ${Math.abs(summary.balance).toFixed(2)}.`);
    }

    // Insight sobre categoria principal
    if (categoryAnalysis.length > 0) {
      const topCategory = categoryAnalysis[0];
      const percentage = (topCategory.amount / summary.expenses * 100).toFixed(1);
      insights.push(`Sua maior categoria de gasto é "${topCategory.category}" com ${percentage}% dos gastos totais.`);
    }

    // Insight sobre número de transações
    if (summary.transactionCount < 5) {
      insights.push('Registre mais transações para obter análises mais precisas.');
    }

    return insights;
  }

  // Lidar com análise de gastos
  private async handleAnalyzeSpending(message: string, context: FinancialContext): Promise<AIResponse> {
    const { summary, transactions } = context;

    if (!summary || !transactions.length) {
      return {
        message: 'Você ainda não possui transações registradas. Que tal adicionar algumas para começar a análise?',
        suggestions: [
          'Adicionar uma transação',
          'Conectar conta bancária',
        ]
      };
    }

    // Esta é uma implementação de placeholder. A lógica real de análise de gastos deve ser mais elaborada.
    const analysisMessage = `Análise de gastos:\n- Total de Receitas: R$ ${summary.income.toFixed(2)}\n- Total de Despesas: R$ ${summary.expenses.toFixed(2)}\n- Saldo: R$ ${summary.balance.toFixed(2)}\n- Número de Transações: ${summary.transactionCount}`;
    
    return {
      message: analysisMessage,
      data: { summary },
      suggestions: [
        'Quais minhas maiores despesas?',
        'Como posso economizar mais?'
      ]
    };
  }

  // Placeholder para sugestão de orçamento
  private async handleBudgetSuggestion(context: FinancialContext): Promise<AIResponse> {
    // Lógica para gerar sugestões de orçamento baseada no contexto
    return {
      message: 'Aqui está uma sugestão de orçamento baseada nos seus dados... (funcionalidade em desenvolvimento)',
      suggestions: ['Me mostre meus gastos por categoria', 'Como posso ajustar este orçamento?']
    };
  }

  // Placeholder para insights financeiros
  private async handleFinancialInsights(context: FinancialContext): Promise<AIResponse> {
    // Lógica para gerar insights financeiros
    const insights = this.generateSpendingInsights(context.summary, []); // Passar análise de categoria real aqui
    return {
      message: 'Aqui estão alguns insights sobre suas finanças:\n\n' + insights.join('\n') + '\n\n(funcionalidade em desenvolvimento)',
      suggestions: ['Como posso melhorar meu saldo?', 'Quais são meus hábitos de consumo?']
    };
  }

  // Placeholder para consultas gerais
  private async handleGeneralQuery(message: string, context: FinancialContext): Promise<AIResponse> {
    // Lógica para responder a perguntas gerais ou quando a intenção não é clara
    return {
      message: 'Entendi sua pergunta. No momento, posso te ajudar com as seguintes ações: adicionar transações, analisar gastos, criar lembretes, etc. Como posso te ajudar especificamente?',
      suggestions: [
        'Analise meus gastos do mês',
        'Adicione uma transação de R$50 em alimentação',
        'Crie um lembrete para a conta de luz'
      ]
    };
  }
}

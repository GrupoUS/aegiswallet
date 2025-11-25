import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FinancialContext } from './ContextRetriever';

export class ContextFormatter {
  /**
   * Format complete financial context for AI consumption
   */
  static formatForAI(context: FinancialContext): string {
    const sections: string[] = [];

    // Summary section
    sections.push(this.formatSummary(context));

    // Accounts section
    if (context.accountBalances.length > 0) {
      sections.push(this.formatAccounts(context.accountBalances));
    }

    // Transactions section
    if (context.recentTransactions.length > 0) {
      sections.push(this.formatTransactions(context.recentTransactions));
    }

    // Events section
    if (context.upcomingEvents.length > 0) {
      sections.push(this.formatEvents(context.upcomingEvents));
    }

    return sections.join('\n\n');
  }

  /**
   * Format summary
   */
  private static formatSummary(context: FinancialContext): string {
    const { summary, userPreferences } = context;
    const currency = userPreferences.currency || 'BRL';

    return `
## Resumo Financeiro do Usuário

- Saldo Total: ${this.formatCurrency(summary.totalBalance, currency)}
- Receita Mensal: ${this.formatCurrency(summary.monthlyIncome, currency)}
- Despesas Mensais: ${this.formatCurrency(summary.monthlyExpenses, currency)}
- Saldo Líquido: ${this.formatCurrency(summary.monthlyIncome - summary.monthlyExpenses, currency)}
- Contas Pendentes: ${summary.upcomingBillsCount} conta(s)
`.trim();
  }

  /**
   * Format account balances
   */
  private static formatAccounts(accounts: any[]): string {
    const accountList = accounts
      .map((acc) => `  - ${acc.accountName}: ${this.formatCurrency(acc.balance, acc.currency)}`)
      .join('\n');

    return `
## Contas Bancárias

${accountList}
`.trim();
  }

  /**
   * Format transactions
   */
  private static formatTransactions(transactions: any[]): string {
    // Group by category
    const byCategory = transactions.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {} as Record<string, any[]>);

    const categoryStats = Object.entries(byCategory)
      .map(([category, txs]) => {
        const total = txs.reduce((sum, t) => sum + t.amount, 0);
        return `  - ${this.getCategoryName(category)}: ${txs.length} transações, total de ${this.formatCurrency(total, 'BRL')}`;
      })
      .join('\n');

    // Recent 5 transactions
    const recentList = transactions
      .slice(0, 5)
      .map((t) => {
        const date = format(new Date(t.date), 'dd/MM', { locale: ptBR });
        const type = t.type === 'income' ? '+' : '-';
        return `  - ${date}: ${type}${this.formatCurrency(Math.abs(t.amount), 'BRL')} - ${t.description}`;
      })
      .join('\n');

    return `
## Transações Recentes (últimos 30 dias)

### Por Categoria:
${categoryStats}

### Últimas 5 Transações:
${recentList}
`.trim();
  }

  /**
   * Format financial events
   */
  private static formatEvents(events: any[]): string {
    const eventList = events
      .slice(0, 10)
      .map((e) => {
        const date = format(new Date(e.date), 'dd/MM/yyyy', { locale: ptBR });
        const status = e.status === 'pending' ? '⏳' : '✅';
        return `  - ${status} ${date}: ${e.title} - ${this.formatCurrency(e.amount, 'BRL')}`;
      })
      .join('\n');

    return `
## Próximas Contas e Eventos

${eventList}
`.trim();
  }

  /**
   * Format currency
   */
  private static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(amount);
  }

  /**
   * Get friendly category name
   */
  private static getCategoryName(category: string): string {
    const categoryMap: Record<string, string> = {
      food: 'Alimentação',
      transport: 'Transporte',
      housing: 'Moradia',
      health: 'Saúde',
      entertainment: 'Entretenimento',
      education: 'Educação',
      shopping: 'Compras',
      utilities: 'Utilidades',
      investment: 'Investimentos',
      salary: 'Salário',
      other: 'Outros',
    };

    return categoryMap[category] || category;
  }

  /**
   * Format for conversation history
   */
  static formatForHistory(context: FinancialContext): string {
    return `Contexto capturado: ${context.recentTransactions.length} transações, ${context.accountBalances.length} contas, ${context.upcomingEvents.length} eventos futuros.`;
  }
}

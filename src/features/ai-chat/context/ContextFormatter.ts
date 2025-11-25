import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FinancialContext, Transaction } from './ContextRetriever';

export class ContextFormatter {
  /**
   * Format complete financial context for AI consumption
   */
  static formatForAI(context: FinancialContext): string {
    const sections: string[] = [];

    // Summary section
    sections.push(ContextFormatter.formatSummary(context));

    // Accounts section
    if (context.accountBalances.length > 0) {
      sections.push(ContextFormatter.formatAccounts(context.accountBalances));
    }

    // Transactions section
    if (context.recentTransactions.length > 0) {
      sections.push(ContextFormatter.formatTransactions(context.recentTransactions));
    }

    // Events section
    if (context.upcomingEvents.length > 0) {
      sections.push(ContextFormatter.formatEvents(context.upcomingEvents));
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

- Saldo Total: ${ContextFormatter.formatCurrency(summary.totalBalance, currency)}
- Receita Mensal: ${ContextFormatter.formatCurrency(summary.monthlyIncome, currency)}
- Despesas Mensais: ${ContextFormatter.formatCurrency(summary.monthlyExpenses, currency)}
- Saldo Líquido: ${ContextFormatter.formatCurrency(summary.monthlyIncome - summary.monthlyExpenses, currency)}
- Contas Pendentes: ${summary.upcomingBillsCount} conta(s)
`.trim();
  }

  /**
   * Format account balances
   */
  private static formatAccounts(accounts: any[]): string {
    const accountList = accounts
      .map(
        (acc) =>
          `  - ${acc.accountName}: ${ContextFormatter.formatCurrency(acc.balance, acc.currency)}`
      )
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
    const byCategory = transactions.reduce(
      (acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      },
      {} as Record<string, Transaction[]>
    );

    const categoryStats = (Object.entries(byCategory) as [string, Transaction[]][])
      .map(([category, txs]) => {
        const total = txs.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        return `  - ${ContextFormatter.getCategoryName(category)}: ${txs.length} transações, total de ${ContextFormatter.formatCurrency(total, 'BRL')}`;
      })
      .join('\n');

    // Recent 5 transactions
    const recentList = transactions
      .slice(0, 5)
      .map((t) => {
        const date = format(new Date(t.date), 'dd/MM', { locale: ptBR });
        const type = t.type === 'income' ? '+' : '-';
        return `  - ${date}: ${type}${ContextFormatter.formatCurrency(Math.abs(t.amount), 'BRL')} - ${t.description}`;
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
        return `  - ${status} ${date}: ${e.title} - ${ContextFormatter.formatCurrency(e.amount, 'BRL')}`;
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

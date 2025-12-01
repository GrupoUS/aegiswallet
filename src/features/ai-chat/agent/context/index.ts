/**
 * Financial Agent Context
 * Context building and management for financial AI interactions
 */

import type { FinancialContext } from '../types';
import { FinancialContextService } from './FinancialContextService';

// Re-export the service class
export { FinancialContextService } from './FinancialContextService';

/**
 * Build financial context for AI prompting
 * Uses the FinancialContextService with caching
 *
 * @param userId - User ID to fetch context for
 * @returns Financial context object
 */
export async function buildFinancialContext(userId: string): Promise<FinancialContext> {
	const service = new FinancialContextService(userId);
	return service.getContext();
}

/**
 * Format financial context for system prompt injection
 *
 * @param context - Financial context to format
 * @returns Formatted string for system prompt
 */
export function formatContextForPrompt(context: FinancialContext): string {
	const lines: string[] = [
		'## Contexto Financeiro do Usuário',
		'',
		`**Saldo Total:** R$ ${context.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
		`**Saldo Disponível:** R$ ${context.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
		`**Receitas do Mês:** R$ ${context.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
		`**Despesas do Mês:** R$ ${context.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
	];

	if (context.topCategories.length > 0) {
		lines.push('', '### Top Categorias de Gastos:');
		for (const cat of context.topCategories.slice(0, 5)) {
			lines.push(
				`- ${cat.categoryName}: R$ ${cat.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cat.percentage}%)`,
			);
		}
	}

	if (context.pendingAlerts.length > 0) {
		lines.push('', '### Alertas Pendentes:');
		for (const alert of context.pendingAlerts) {
			const severityIcon =
				alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢';
			lines.push(`- ${severityIcon} ${alert.message}`);
		}
	}

	if (context.upcomingPayments.length > 0) {
		lines.push('', '### Próximos Pagamentos:');
		for (const payment of context.upcomingPayments.slice(0, 5)) {
			const dateStr = payment.dueDate.toLocaleDateString('pt-BR');
			const recurringStr = payment.isRecurring ? ' (recorrente)' : '';
			lines.push(
				`- ${payment.description}: R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${dateStr}${recurringStr}`,
			);
		}
	}

	lines.push('', `*Última atualização: ${context.lastUpdated.toLocaleString('pt-BR')}*`);

	return lines.join('\n');
}

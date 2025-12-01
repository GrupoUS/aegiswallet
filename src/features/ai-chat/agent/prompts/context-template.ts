import type { CategorySummary, FinancialAlert, FinancialContext, UpcomingPayment } from '../types';

/**
 * Formata número como moeda brasileira
 */
function formatBRL(value: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value);
}

/**
 * Formata data no padrão brasileiro
 */
function formatDateBR(date: Date): string {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

/**
 * Traduz trend para português
 */
function translateTrend(trend: 'up' | 'down' | 'stable'): string {
	const translations = {
		up: '↑ aumentando',
		down: '↓ diminuindo',
		stable: '→ estável',
	};
	return translations[trend];
}

/**
 * Gera o bloco de contexto financeiro para injeção no system prompt
 */
export function buildFinancialContextBlock(context: FinancialContext): string {
	const { totalBalance, availableBalance, monthlyIncome, monthlyExpenses, topCategories } = context;

	const savings = monthlyIncome - monthlyExpenses;
	const savingsPercentage = monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0;

	const topCategoriesText = topCategories
		.slice(0, 5)
		.map(
			(cat: CategorySummary, i: number) =>
				`${i + 1}. **${cat.categoryName}**: ${formatBRL(cat.amount)} (${cat.percentage}% do total, ${translateTrend(cat.trend)})`,
		)
		.join('\n');

	return `
### Resumo Financeiro
- **Saldo Total**: ${formatBRL(totalBalance)}
- **Saldo Disponível**: ${formatBRL(availableBalance)}
- **Renda do Mês**: ${formatBRL(monthlyIncome)}
- **Gastos do Mês**: ${formatBRL(monthlyExpenses)}
- **Economia do Mês**: ${formatBRL(savings)} (${savingsPercentage}% da renda)

### Top 5 Categorias de Gasto (Mês Atual)
${topCategoriesText || 'Nenhuma transação registrada este mês.'}

### Última Atualização
${formatDateBR(context.lastUpdated)}
`.trim();
}

/**
 * Gera o bloco de alertas ativos para o system prompt
 */
export function buildAlertsBlock(alerts: FinancialAlert[]): string {
	if (alerts.length === 0) {
		return '✅ Nenhum alerta ativo no momento.';
	}

	const severityEmoji = {
		low: 'ℹ️',
		medium: '⚠️',
		high: '🚨',
	};

	return alerts
		.map(
			(alert: FinancialAlert) =>
				`${severityEmoji[alert.severity]} [${alert.severity.toUpperCase()}] ${alert.message}`,
		)
		.join('\n');
}

/**
 * Gera bloco de pagamentos próximos
 */
export function buildUpcomingPaymentsBlock(payments: UpcomingPayment[]): string {
	if (payments.length === 0) {
		return 'Nenhum pagamento agendado nos próximos dias.';
	}

	return payments
		.slice(0, 5)
		.map((payment: UpcomingPayment) => {
			const dueDate = new Intl.DateTimeFormat('pt-BR', {
				day: '2-digit',
				month: '2-digit',
			}).format(payment.dueDate);
			const recurring = payment.isRecurring ? ' (recorrente)' : '';
			return `- ${payment.description}: ${formatBRL(payment.amount)} em ${dueDate}${recurring}`;
		})
		.join('\n');
}

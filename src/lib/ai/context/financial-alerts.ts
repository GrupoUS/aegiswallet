/**
 * Financial Alert Types
 *
 * Alerts generated from financial data analysis for AI context
 */

export interface FinancialAlert {
	type:
		| 'budget_warning'
		| 'goal_overdue'
		| 'low_balance'
		| 'spending_anomaly'
		| 'payment_due'
		| 'goal_progress';
	severity: 'high' | 'medium' | 'low';
	message: string;
	data?: Record<string, unknown>;
}

interface BudgetStatus {
	categoryName: string;
	categoryId: string | null;
	monthlyLimit: number;
	currentSpent: number;
	usagePercent: number;
	remaining: number;
}

interface GoalProgress {
	name: string;
	id: string;
	targetAmount: number;
	currentAmount: number;
	progressPercent: number;
	targetDate: Date | null;
	status: 'overdue' | 'urgent' | 'on_track' | 'completed';
	daysRemaining: number | null;
}

interface AccountSummary {
	totalBalance: number;
	availableBalance: number;
}

/**
 * Generate financial alerts based on user's financial data
 */
export function generateFinancialAlerts(
	summary: AccountSummary,
	budgets: BudgetStatus[],
	goals: GoalProgress[],
): FinancialAlert[] {
	const alerts: FinancialAlert[] = [];

	// Budget alerts - High priority
	budgets.forEach((b) => {
		if (b.usagePercent >= 100) {
			alerts.push({
				type: 'budget_warning',
				severity: 'high',
				message: `Orçamento de ${b.categoryName} estourado: ${b.usagePercent.toFixed(0)}% utilizado`,
				data: {
					categoryId: b.categoryId,
					limit: b.monthlyLimit,
					spent: b.currentSpent,
				},
			});
		} else if (b.usagePercent >= 90) {
			alerts.push({
				type: 'budget_warning',
				severity: 'medium',
				message: `Orçamento de ${b.categoryName}: ${b.usagePercent.toFixed(0)}% utilizado`,
				data: {
					categoryId: b.categoryId,
					remaining: b.remaining,
				},
			});
		}
	});

	// Goal alerts
	goals.forEach((g) => {
		if (g.status === 'overdue') {
			alerts.push({
				type: 'goal_overdue',
				severity: 'high',
				message: `Meta "${g.name}" passou da data limite`,
				data: {
					goalId: g.id,
					remaining: g.targetAmount - g.currentAmount,
				},
			});
		} else if (g.status === 'urgent') {
			alerts.push({
				type: 'goal_progress',
				severity: 'medium',
				message: `Meta "${g.name}" vence em menos de 30 dias (${g.progressPercent.toFixed(0)}% concluída)`,
				data: {
					goalId: g.id,
					progress: g.progressPercent,
				},
			});
		} else if (g.status === 'completed') {
			alerts.push({
				type: 'goal_progress',
				severity: 'low',
				message: `🎉 Meta "${g.name}" concluída!`,
				data: { goalId: g.id },
			});
		}
	});

	// Low balance alert
	if (summary.totalBalance < 500) {
		alerts.push({
			type: 'low_balance',
			severity: 'high',
			message: `Saldo baixo: R$ ${summary.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
			data: {
				balance: summary.totalBalance,
				available: summary.availableBalance,
			},
		});
	} else if (summary.availableBalance < 1000) {
		alerts.push({
			type: 'low_balance',
			severity: 'medium',
			message: `Saldo disponível baixo: R$ ${summary.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
			data: {
				available: summary.availableBalance,
			},
		});
	}

	// Sort by severity (high first)
	const severityOrder = { high: 0, medium: 1, low: 2 };
	alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

	return alerts;
}

/**
 * Detect spending anomalies compared to historical patterns
 */
export function detectSpendingAnomalies(
	currentCategorySpending: { categoryName: string; total: number }[],
	historicalAverages: { categoryName: string; average: number }[],
): FinancialAlert[] {
	const alerts: FinancialAlert[] = [];
	const avgMap = new Map(historicalAverages.map((h) => [h.categoryName, h.average]));

	currentCategorySpending.forEach((current) => {
		const historical = avgMap.get(current.categoryName);
		if (historical && historical > 0) {
			const percentIncrease = ((current.total - historical) / historical) * 100;

			if (percentIncrease > 50) {
				alerts.push({
					type: 'spending_anomaly',
					severity: percentIncrease > 100 ? 'high' : 'medium',
					message: `Gastos em ${current.categoryName} ${percentIncrease.toFixed(0)}% acima da média`,
					data: {
						category: current.categoryName,
						current: current.total,
						average: historical,
						increase: percentIncrease,
					},
				});
			}
		}
	});

	return alerts;
}

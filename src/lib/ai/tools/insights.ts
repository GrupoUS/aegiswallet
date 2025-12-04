/**
 * AI Insights Tools
 *
 * Tools for AI to query financial insights, budgets, and recommendations.
 * All queries are scoped to the authenticated user.
 */

import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

import { filterSensitiveData } from '../security/filter';
import type { DbClient } from '@/server/hono-types';
import {
	aiInsights,
	bankAccounts,
	budgetCategories,
	financialEvents,
	spendingPatterns,
	transactionCategories,
	transactions,
} from '@/db/schema';

export function createInsightTools(userId: string, db: DbClient) {
	// ========================================
	// FINANCIAL SUMMARY
	// ========================================

	const getFinancialSummarySchema = z.object({});

	// ========================================
	// BUDGET STATUS
	// ========================================

	const getBudgetStatusSchema = z.object({
		categoryId: z.string().uuid().optional().describe('ID da categoria (omitir para todos)'),
	});

	// ========================================
	// SPENDING ANALYSIS
	// ========================================

	const getSpendingAnalysisSchema = z.object({
		period: z.enum(['week', 'month', 'quarter', 'year']).default('month').describe('Período'),
		compareWithPrevious: z.boolean().default(true).describe('Comparar com período anterior'),
	});

	// ========================================
	// UPCOMING PAYMENTS
	// ========================================

	const getUpcomingPaymentsSchema = z.object({
		days: z.number().min(1).max(90).default(30).describe('Dias à frente'),
	});

	// ========================================
	// SAVINGS SUGGESTIONS
	// ========================================

	const getSavingsSuggestionsSchema = z.object({});

	return {
		getFinancialSummary: {
			description:
				'Obtém resumo financeiro completo: saldos, patrimônio líquido, distribuição por tipo de conta.',
			parameters: getFinancialSummarySchema,
			execute: async (_args: z.infer<typeof getFinancialSummarySchema>) => {
				const accounts = await db
					.select({
						accountType: bankAccounts.accountType,
						balance: bankAccounts.balance,
						availableBalance: bankAccounts.availableBalance,
						institutionName: bankAccounts.institutionName,
					})
					.from(bankAccounts)
					.where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)));

				const summary = {
					checking: 0,
					savings: 0,
					credit: 0,
					investment: 0,
				};
				let totalBalance = 0;
				let totalAvailable = 0;

				const accountDetails = accounts.map((acc) => {
					const balance = Number(acc.balance ?? 0);
					const available = Number(acc.availableBalance ?? 0);
					totalBalance += balance;
					totalAvailable += available;

					const type = acc.accountType?.toLowerCase() as keyof typeof summary;
					if (type in summary) {
						summary[type] += balance;
					}

					return {
						institution: acc.institutionName,
						type: acc.accountType,
						balance,
						available,
					};
				});

				const netWorth = summary.checking + summary.savings + summary.investment - summary.credit;

				return {
					totalBalance,
					totalAvailable,
					netWorth,
					accountsByType: summary,
					accounts: accountDetails,
					healthIndicators: {
						hasEmergencyFund: summary.savings >= summary.checking * 0.5,
						debtRatio: totalBalance > 0 ? (summary.credit / totalBalance) * 100 : 0,
						savingsRate: totalBalance > 0 ? (summary.savings / totalBalance) * 100 : 0,
					},
				};
			},
		},

		getBudgetStatus: {
			description: 'Verifica status dos orçamentos do mês atual: limite, gasto, percentual de uso.',
			parameters: getBudgetStatusSchema,
			execute: async (args: z.infer<typeof getBudgetStatusSchema>) => {
				const { categoryId } = args;
				const now = new Date();
				const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

				// Get budgets
				const budgetConditions = [
					eq(budgetCategories.userId, userId),
					eq(budgetCategories.isActive, true),
				];
				if (categoryId) {
					budgetConditions.push(eq(budgetCategories.categoryId, categoryId));
				}

				const budgets = await db
					.select({
						categoryId: budgetCategories.categoryId,
						budgetAmount: budgetCategories.budgetAmount,
						alertThreshold: budgetCategories.alertThreshold,
					})
					.from(budgetCategories)
					.where(and(...budgetConditions));

				if (budgets.length === 0) {
					return {
						message: 'Nenhum orçamento configurado.',
						budgets: [],
					};
				}

				// Get category names
				const categoryIds = budgets.map((b) => b.categoryId).filter(Boolean) as string[];
				const categories =
					categoryIds.length > 0
						? await db
								.select({ id: transactionCategories.id, name: transactionCategories.name })
								.from(transactionCategories)
								.where(eq(transactionCategories.userId, userId))
						: [];

				const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

				// Get spending per category this month
				const monthlySpending = await db
					.select({
						categoryId: transactions.categoryId,
						total: sql<string>`SUM(ABS(${transactions.amount}))`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.userId, userId),
							gte(transactions.transactionDate, startOfMonth),
							lte(transactions.transactionDate, endOfMonth),
							lte(transactions.amount, '0'),
						),
					)
					.groupBy(transactions.categoryId);

				const spendingMap = new Map(monthlySpending.map((s) => [s.categoryId, Number(s.total)]));

				const budgetStatus = budgets.map((b) => {
					const limit = Number(b.budgetAmount);
					const spent = spendingMap.get(b.categoryId) ?? 0;
					const remaining = limit - spent;
					const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;
					const threshold = Number(b.alertThreshold ?? 80);

					return {
						categoryId: b.categoryId,
						categoryName: categoryMap.get(b.categoryId ?? '') ?? 'Orçamento Geral',
						limit,
						spent,
						remaining,
						usagePercent: Math.round(usagePercent * 10) / 10,
						status: usagePercent >= 100 ? 'exceeded' : usagePercent >= threshold ? 'warning' : 'ok',
					};
				});

				const exceededCount = budgetStatus.filter((b) => b.status === 'exceeded').length;
				const warningCount = budgetStatus.filter((b) => b.status === 'warning').length;

				return {
					month: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
					summary: {
						total: budgetStatus.length,
						exceeded: exceededCount,
						warning: warningCount,
						ok: budgetStatus.length - exceededCount - warningCount,
					},
					budgets: budgetStatus.sort((a, b) => b.usagePercent - a.usagePercent),
				};
			},
		},

		getSpendingAnalysis: {
			description:
				'Analisa gastos por categoria em um período, com comparação ao período anterior.',
			parameters: getSpendingAnalysisSchema,
			execute: async (args: z.infer<typeof getSpendingAnalysisSchema>) => {
				const { period, compareWithPrevious } = args;
				const now = new Date();

				// Calculate date ranges
				let currentStart: Date;
				let currentEnd: Date;
				let previousStart: Date;
				let previousEnd: Date;

				switch (period) {
					case 'week':
						currentEnd = now;
						currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
						previousEnd = new Date(currentStart.getTime() - 1);
						previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
						break;
					case 'quarter':
						currentEnd = now;
						currentStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
						previousEnd = new Date(currentStart.getTime() - 1);
						previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth() - 3, 1);
						break;
					case 'year':
						currentEnd = now;
						currentStart = new Date(now.getFullYear(), 0, 1);
						previousEnd = new Date(currentStart.getTime() - 1);
						previousStart = new Date(previousEnd.getFullYear(), 0, 1);
						break;
					default: // month
						currentEnd = now;
						currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
						previousEnd = new Date(currentStart.getTime() - 1);
						previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
				}

				// Get current period spending
				const currentSpending = await db
					.select({
						categoryId: transactions.categoryId,
						total: sql<string>`SUM(ABS(${transactions.amount}))`,
						count: sql<number>`COUNT(*)`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.userId, userId),
							gte(transactions.transactionDate, currentStart),
							lte(transactions.transactionDate, currentEnd),
							lte(transactions.amount, '0'),
						),
					)
					.groupBy(transactions.categoryId);

				// Get previous period if requested
				let previousSpending: typeof currentSpending = [];
				if (compareWithPrevious) {
					previousSpending = await db
						.select({
							categoryId: transactions.categoryId,
							total: sql<string>`SUM(ABS(${transactions.amount}))`,
							count: sql<number>`COUNT(*)`,
						})
						.from(transactions)
						.where(
							and(
								eq(transactions.userId, userId),
								gte(transactions.transactionDate, previousStart),
								lte(transactions.transactionDate, previousEnd),
								lte(transactions.amount, '0'),
							),
						)
						.groupBy(transactions.categoryId);
				}

				// Get category names
				const categories = await db
					.select({ id: transactionCategories.id, name: transactionCategories.name })
					.from(transactionCategories)
					.where(eq(transactionCategories.userId, userId));

				const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
				const previousMap = new Map(previousSpending.map((p) => [p.categoryId, Number(p.total)]));

				const analysis = currentSpending
					.map((curr) => {
						const current = Number(curr.total);
						const previous = previousMap.get(curr.categoryId) ?? 0;
						const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

						return {
							categoryId: curr.categoryId,
							categoryName: categoryMap.get(curr.categoryId ?? '') ?? 'Sem categoria',
							currentTotal: current,
							previousTotal: previous,
							changePercent: Math.round(change * 10) / 10,
							transactionCount: curr.count,
							trend: change > 10 ? 'up' : change < -10 ? 'down' : 'stable',
						};
					})
					.sort((a, b) => b.currentTotal - a.currentTotal);

				const totalCurrent = analysis.reduce((sum, a) => sum + a.currentTotal, 0);
				const totalPrevious = analysis.reduce((sum, a) => sum + a.previousTotal, 0);
				const overallChange =
					totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;

				return {
					period: {
						current: {
							start: currentStart.toLocaleDateString('pt-BR'),
							end: currentEnd.toLocaleDateString('pt-BR'),
						},
						previous: compareWithPrevious
							? {
									start: previousStart.toLocaleDateString('pt-BR'),
									end: previousEnd.toLocaleDateString('pt-BR'),
								}
							: null,
					},
					totals: {
						current: totalCurrent,
						previous: totalPrevious,
						changePercent: Math.round(overallChange * 10) / 10,
					},
					topCategories: analysis.slice(0, 5),
					allCategories: analysis,
				};
			},
		},

		getUpcomingPayments: {
			description: 'Lista pagamentos e eventos financeiros futuros (boletos, contas, etc).',
			parameters: getUpcomingPaymentsSchema,
			execute: async (args: z.infer<typeof getUpcomingPaymentsSchema>) => {
				const { days } = args;
				const now = new Date();
				const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

				const events = await db
					.select({
						id: financialEvents.id,
						title: financialEvents.title,
						amount: financialEvents.amount,
						startDate: financialEvents.startDate,
						eventTypeId: financialEvents.eventTypeId,
						isRecurring: financialEvents.isRecurring,
					})
					.from(financialEvents)
					.where(
						and(
							eq(financialEvents.userId, userId),
							gte(financialEvents.startDate, now),
							lte(financialEvents.startDate, futureDate),
						),
					)
					.orderBy(financialEvents.startDate)
					.limit(20);

				const payments = events.map((e) => {
					const eventDate = e.startDate;
					const daysUntil = Math.ceil(
						(eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
					);

					return filterSensitiveData({
						id: e.id,
						description: e.title,
						amount: Number(e.amount ?? 0),
						dueDate: eventDate.toLocaleDateString('pt-BR'),
						daysUntil,
						type: e.eventTypeId,
						isRecurring: e.isRecurring,
						urgency: daysUntil <= 3 ? 'urgent' : daysUntil <= 7 ? 'soon' : 'normal',
					});
				});

				const totalDue = payments.reduce((sum, p) => sum + (p.amount as number), 0);
				const urgentCount = payments.filter((p) => p.urgency === 'urgent').length;

				return {
					period: `Próximos ${days} dias`,
					summary: {
						total: payments.length,
						totalAmount: totalDue,
						urgent: urgentCount,
					},
					payments,
				};
			},
		},

		getSavingsSuggestions: {
			description:
				'Gera sugestões de economia baseadas no histórico de gastos e padrões do usuário.',
			parameters: getSavingsSuggestionsSchema,
			execute: async (_args: z.infer<typeof getSavingsSuggestionsSchema>) => {
				// Get recent insights from AI
				const insights = await db
					.select({
						title: aiInsights.title,
						description: aiInsights.description,
						recommendation: aiInsights.recommendation,
						impactLevel: aiInsights.impactLevel,
					})
					.from(aiInsights)
					.where(
						and(
							eq(aiInsights.userId, userId),
							eq(aiInsights.isActioned, false),
							eq(aiInsights.insightType, 'opportunity'),
						),
					)
					.orderBy(desc(aiInsights.createdAt))
					.limit(5);

				// Get spending patterns for analysis
				const patterns = await db
					.select({
						categoryId: spendingPatterns.categoryId,
						periodType: spendingPatterns.periodType,
						totalAmount: spendingPatterns.totalAmount,
						trendPercentage: spendingPatterns.trendPercentage,
					})
					.from(spendingPatterns)
					.where(eq(spendingPatterns.userId, userId))
					.orderBy(desc(spendingPatterns.createdAt))
					.limit(10);

				// Generate suggestions based on patterns
				const suggestions: {
					category: string;
					suggestion: string;
					potentialSavings: string;
					priority: 'high' | 'medium' | 'low';
				}[] = [];

				// Add existing insights as suggestions
				insights.forEach((insight) => {
					suggestions.push({
						category: 'Oportunidade',
						suggestion: insight.recommendation ?? insight.description,
						potentialSavings: 'Variável',
						priority: (insight.impactLevel as 'high' | 'medium' | 'low') ?? 'medium',
					});
				});

				// Analyze patterns for growing categories
				patterns.forEach((pattern) => {
					const trend = Number(pattern.trendPercentage ?? 0);
					if (trend > 20) {
						suggestions.push({
							category: pattern.categoryId ?? 'Geral',
							suggestion: `Gastos em crescimento (${trend.toFixed(0)}% acima da média). Considere revisar.`,
							potentialSavings: `~R$ ${(Number(pattern.totalAmount) * 0.1).toFixed(2)}/mês`,
							priority: trend > 50 ? 'high' : 'medium',
						});
					}
				});

				// Default suggestions if none found
				if (suggestions.length === 0) {
					suggestions.push({
						category: 'Geral',
						suggestion:
							'Continue monitorando seus gastos. Defina orçamentos para categorias principais.',
						potentialSavings: 'Variável',
						priority: 'low',
					});
				}

				return {
					totalSuggestions: suggestions.length,
					suggestions: suggestions.sort((a, b) => {
						const priority = { high: 0, medium: 1, low: 2 };
						return priority[a.priority] - priority[b.priority];
					}),
				};
			},
		},
	};
}

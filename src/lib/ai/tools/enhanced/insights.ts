import { tool } from 'ai';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

import { secureLogger } from '../../../logging/secure-logger';
import type {
	AnomalyDetection,
	CashFlowForecast,
	CategorySpending,
	FinancialAnomaly,
	MonthlyCashFlow,
	SpendingAnalysis,
	SpendingTrend,
} from './types';
import { db } from '@/db/client';
import { financialEvents, transactionCategories, transactions } from '@/db/schema';

export function createInsightsTools(userId: string) {
	return {
		getSpendingAnalysis: tool({
			description:
				'Analisa detalhadamente os gastos do usuário por categoria, tendências e padrões.',
			inputSchema: z.object({
				startDate: z.string().datetime().describe('Data inicial da análise'),
				endDate: z.string().datetime().describe('Data final da análise'),
			}),
			execute: async ({ startDate, endDate }) => {
				try {
					const start = new Date(startDate);
					const end = new Date(endDate);

					// Build conditions
					const conditions = [
						eq(transactions.userId, userId),
						lte(transactions.amount, '0'), // Apenas despesas
						gte(transactions.transactionDate, new Date(startDate)),
						lte(transactions.transactionDate, new Date(endDate)),
					];

					// Buscar transações do período
					const data = await db
						.select({
							amount: transactions.amount,
							transactionDate: transactions.transactionDate,
							description: transactions.description,
							merchantName: transactions.merchantName,
							categoryId: transactions.categoryId,
						})
						.from(transactions)
						.where(and(...conditions));

					// Fetch categories separately
					const categoryData = await db
						.select()
						.from(transactionCategories)
						.where(eq(transactionCategories.userId, userId));

					const categoryMap = new Map(categoryData.map((c) => [c.id, c]));

					// Map transactions with category info
					const transactionsList = data.map((tx) => ({
						amount: Number(tx.amount),
						transactionDate: tx.transactionDate?.toISOString(),
						category: tx.categoryId
							? [
									{
										id: tx.categoryId,
										name: categoryMap.get(tx.categoryId)?.name || 'Sem categoria',
										color: categoryMap.get(tx.categoryId)?.color,
										icon: categoryMap.get(tx.categoryId)?.icon,
									},
								]
							: [],
						description: tx.description,
						merchantName: tx.merchantName,
					}));
					const totalSpending = transactionsList.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

					// Análise por categoria
					const categorySpendingMap = new Map<string, CategorySpending>();

					transactionsList.forEach((tx) => {
						// Drizzle joins return arrays, so access first element
						const txCategory = Array.isArray(tx.category) ? tx.category[0] : tx.category;
						const catId = txCategory?.id || 'uncategorized';
						const catName = txCategory?.name || 'Sem categoria';

						if (!categorySpendingMap.has(catId)) {
							categorySpendingMap.set(catId, {
								categoryId: catId,
								categoryName: catName,
								amount: 0,
								percentage: 0,
								transactionCount: 0,
								trend: 'stable',
							});
						}

						const catData = categorySpendingMap.get(catId);
						if (catData) {
							catData.amount += Math.abs(tx.amount);
							catData.transactionCount += 1;
						}
					});

					// Calcular percentuais
					const categoryBreakdown = Array.from(categorySpendingMap.values()).map((cat) => ({
						...cat,
						percentage: totalSpending > 0 ? (cat.amount / totalSpending) * 100 : 0,
					}));

					// Ordenar por valor
					categoryBreakdown.sort((a, b) => b.amount - a.amount);

					// Análise de tendências (comparar com período anterior)
					const trends = await analyzeSpendingTrends(userId, start, end);

					// Adicionar informações de tendência às categorias
					categoryBreakdown.forEach((cat) => {
						const trend = trends.find((t) => t.categoryId === cat.categoryId);
						if (trend?.direction) {
							cat.trend = trend.direction;
							cat.trendPercentage = trend.percentageChange;
						}
					});

					// Gerar insights
					const insights = generateSpendingInsights(categoryBreakdown, totalSpending);

					// Gerar recomendações
					const recommendations = generateSpendingRecommendations(categoryBreakdown, trends);

					const analysis: SpendingAnalysis = {
						period: { startDate, endDate },
						totalSpending,
						categoryBreakdown,
						trends,
						insights,
						recommendations,
					};

					return {
						analysis,
						summary: {
							totalTransactions: transactionsList.length,
							averageTransaction:
								transactionsList.length > 0 ? totalSpending / transactionsList.length : 0,
							topCategory: categoryBreakdown[0]?.categoryName || 'Nenhuma',
							topCategoryPercentage: categoryBreakdown[0]?.percentage || 0,
						},
						message: `Análise completa do período: gastos totais de R$ ${totalSpending.toFixed(2)} em ${transactionsList.length} transações, distribuídos em ${categoryBreakdown.length} categorias.`,
					};
				} catch (error) {
					secureLogger.error('Falha na análise de gastos', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						period: { startDate, endDate },
					});
					throw error;
				}
			},
		}),

		getCashFlowForecast: tool({
			description: 'Prevê o fluxo de caixa futuro baseado no histórico e eventos agendados.',
			inputSchema: z.object({
				forecastMonths: z.number().min(1).max(12).default(3).describe('Meses para previsão'),
				includeScheduledEvents: z.boolean().default(true).describe('Incluir eventos agendados'),
				confidenceLevel: z
					.number()
					.min(0.5)
					.max(0.95)
					.default(0.8)
					.describe('Nível de confiança da previsão'),
			}),
			execute: async ({ forecastMonths, includeScheduledEvents, confidenceLevel }) => {
				try {
					const { txList, futureEvents } = await fetchCashFlowData(
						userId,
						forecastMonths,
						includeScheduledEvents,
					);
					const monthlyPatterns = analyzeMonthlyPatterns(txList as TransactionRecord[]);
					const monthlyBreakdown = generateMonthlyBreakdown(
						forecastMonths,
						monthlyPatterns,
						futureEvents,
						confidenceLevel,
					);
					const { totalPredictedIncome, totalPredictedExpenses } =
						calculateTotals(monthlyBreakdown);
					const netCashFlow = totalPredictedIncome - totalPredictedExpenses;
					const forecast = buildCashFlowForecast(
						forecastMonths,
						totalPredictedIncome,
						totalPredictedExpenses,
						netCashFlow,
						confidenceLevel,
						monthlyBreakdown,
						monthlyPatterns,
					);

					return buildCashFlowResponse(
						forecast,
						forecastMonths,
						totalPredictedIncome,
						totalPredictedExpenses,
						netCashFlow,
						monthlyBreakdown,
					);
				} catch (error) {
					secureLogger.error('Falha na previsão de fluxo de caixa', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						forecastMonths,
					});
					throw error;
				}
			},
		}),

		getAnomalyDetection: tool({
			description:
				'Detecta padrões anômalos de gastos que possam indicar fraudes ou problemas financeiros.',
			inputSchema: z.object({
				analysisPeriod: z.enum(['7d', '30d', '90d']).default('30d').describe('Período de análise'),
				severityThreshold: z
					.enum(['low', 'medium', 'high', 'critical'])
					.default('medium')
					.describe('Nível mínimo de severidade'),
				includeRecommendations: z.boolean().default(true).describe('Incluir recomendações de ação'),
			}),
			execute: async ({ analysisPeriod, severityThreshold, includeRecommendations }) => {
				try {
					const { startDate, endDate } = calculateAnalysisPeriod(analysisPeriod);
					const txRecords = await fetchAnomalyTransactions(userId, startDate, endDate);
					const anomalies = detectAllAnomalies(txRecords, severityThreshold);
					const riskScore = calculateOverallRiskScore(anomalies);
					const riskLevel = getRiskLevel(riskScore);
					const recommendations = includeRecommendations
						? generateAnomalyRecommendations(anomalies, riskLevel)
						: [];

					return buildAnomalyDetectionResponse(
						anomalies,
						riskScore,
						recommendations,
						startDate,
						endDate,
					);
				} catch (error) {
					secureLogger.error('Falha na detecção de anomalias', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						analysisPeriod,
					});
					throw error;
				}
			},
		}),

		getBudgetRecommendations: tool({
			description: 'Gera recomendações de orçamento baseado nos padrões de gastos históricos.',
			inputSchema: z.object({
				targetSavingsRate: z
					.number()
					.min(0.05)
					.max(0.5)
					.default(0.2)
					.describe('Taxa de economia desejada (5-50%)'),
				analysisMonths: z
					.number()
					.min(3)
					.max(12)
					.default(6)
					.describe('Meses de histórico para análise'),
				prioritizeEssential: z.boolean().default(true).describe('Priorizar categorias essenciais'),
			}),
			execute: async ({ targetSavingsRate, analysisMonths, prioritizeEssential }) => {
				try {
					const { txList } = await fetchBudgetTransactions(userId, analysisMonths);
					const spendingAnalysis = analyzeSpendingPatterns(txList, analysisMonths);
					const budgetAllocations = calculateBudgetAllocations(
						spendingAnalysis,
						targetSavingsRate,
						prioritizeEssential,
					);
					const projections = calculateBudgetProjections(
						spendingAnalysis,
						budgetAllocations,
						targetSavingsRate,
					);

					return buildBudgetResponse(
						spendingAnalysis,
						budgetAllocations,
						projections,
						targetSavingsRate,
					);
				} catch (error) {
					secureLogger.error('Falha ao gerar recomendações de orçamento', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						targetSavingsRate,
					});
					throw error;
				}
			},
		}),
	};
}

// Helper functions
function analyzeSpendingTrends(
	_userId: string,
	_startDate: Date,
	_endDate: Date,
): SpendingTrend[] {
	// Simplificação - implementar análise comparativa real
	// Em produção, comparar com período anterior e calcular tendências
	return [];
}

function generateSpendingInsights(
	categories: CategorySpending[],
	_totalSpending: number,
): string[] {
	const insights: string[] = [];

	if (categories.length === 0) return insights;

	const topCategory = categories[0];

	// Insight sobre categoria principal
	insights.push(
		`${topCategory.categoryName} representa ${topCategory.percentage.toFixed(1)}% dos gastos totais`,
	);

	// Insight sobre concentração
	const top3Percentage = categories.slice(0, 3).reduce((sum, cat) => sum + cat.percentage, 0);
	if (top3Percentage > 70) {
		insights.push('Seus gastos estão muito concentrados em poucas categorias');
	}

	// Insight sobre variação
	const highVarianceCategories = categories.filter(
		(cat) => cat.trendPercentage && Math.abs(cat.trendPercentage) > 20,
	);

	if (highVarianceCategories.length > 0) {
		insights.push(
			`${highVarianceCategories.map((cat) => cat.categoryName).join(', ')} mostraram variação significativa`,
		);
	}

	return insights;
}

function generateSpendingRecommendations(
	categories: CategorySpending[],
	_trends: SpendingTrend[],
): string[] {
	const recommendations: string[] = [];

	if (categories.length === 0) return recommendations;

	// Recomendações baseadas em percentuais
	const highExpenseCategories = categories.filter((cat) => cat.percentage > 25);
	highExpenseCategories.forEach((cat) => {
		recommendations.push(
			`Considere revisar gastos em ${cat.categoryName} (${cat.percentage.toFixed(1)}% do total)`,
		);
	});

	// Recomendações baseadas em tendências
	const increasingCategories = categories.filter((cat) => cat.trend === 'increasing');
	if (increasingCategories.length > 0) {
		recommendations.push(
			`Atenção: ${increasingCategories.map((cat) => cat.categoryName).join(', ')} estão em alta`,
		);
	}

	return recommendations;
}

interface TransactionRecord {
	amount: number;
	transactionDate: string;
	category?: { id: string; name: string } | { id: string; name: string }[];
	merchantName?: string;
	description?: string;
}

interface MonthlyPattern {
	averageIncome: number;
	averageExpenses: number;
	dataPoints: number;
}

// Helper function to extract category name from Drizzle join result (array or object)
function getCategoryName(category: TransactionRecord['category']): string | undefined {
	if (!category) return undefined;
	if (Array.isArray(category)) return category[0]?.name;
	return category.name;
}

function analyzeMonthlyPatterns(txRecords: TransactionRecord[]): Record<string, MonthlyPattern> {
	const patterns: Record<string, MonthlyPattern> = {};

	// Agrupar por mês
	const monthlyData = new Map<string, number[]>();

	txRecords.forEach((tx) => {
		const date = new Date(tx.transactionDate);
		const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

		if (!monthlyData.has(monthKey)) {
			monthlyData.set(monthKey, []);
		}

		monthlyData.get(monthKey)?.push(tx.amount);
	});

	// Calcular estatísticas para cada mês
	monthlyData.forEach((amounts, monthKey) => {
		const income = amounts.filter((a) => a > 0).reduce((sum, a) => sum + a, 0);
		const expenses = Math.abs(amounts.filter((a) => a < 0).reduce((sum, a) => sum + a, 0));

		patterns[monthKey] = {
			averageIncome: income,
			averageExpenses: expenses,
			dataPoints: amounts.length,
		};
	});

	return patterns;
}

function identifyCashFlowFactors(
	monthlyBreakdown: MonthlyCashFlow[],
	_patterns: Record<string, MonthlyPattern>,
): string[] {
	const factors: string[] = [];

	// Analisar tendências positivas
	const positiveTrendMonths = monthlyBreakdown.filter((month) => month.netFlow > 0).length;
	if (positiveTrendMonths > monthlyBreakdown.length / 2) {
		factors.push('Tendência positiva de fluxo de caixa na maioria dos meses');
	}

	// Analisar volatilidade
	const expensesVariance = calculateVariance(monthlyBreakdown.map((m) => m.expenses));
	if (expensesVariance > 1000) {
		// Threshold arbitrário
		factors.push('Alta volatilidade nos gastos mensais');
	}

	return factors;
}

function generateCashFlowWarnings(
	monthlyBreakdown: MonthlyCashFlow[],
	netCashFlow: number,
): string[] {
	const warnings = [];

	// Aviso sobre fluxo negativo
	if (netCashFlow < 0) {
		warnings.push('Fluxo de caixa projetado negativo - risco de descumprimento financeiro');
	}

	// Aviso sobre meses específicos
	const negativeMonths = monthlyBreakdown.filter((month) => month.netFlow < 0);
	if (negativeMonths.length > 0) {
		warnings.push(`${negativeMonths.length} meses com fluxo de caixa negativo previsto`);
	}

	return warnings;
}

function calculateAmountStatistics(txRecords: TransactionRecord[]): {
	mean: number;
	stdDev: number;
} {
	const amounts = txRecords.map((tx) => Math.abs(tx.amount));
	const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

	const variance =
		amounts.reduce((sum, amount) => {
			return sum + (amount - mean) ** 2;
		}, 0) / amounts.length;

	const stdDev = Math.sqrt(variance);

	return { mean, stdDev };
}

function findPotentialDuplicates(txRecords: TransactionRecord[]): TransactionRecord[][] {
	const groups: TransactionRecord[][] = [];

	// Simplificação - em produção usar algoritmo mais sofisticado
	const amountGroups = new Map<number, TransactionRecord[]>();

	txRecords.forEach((tx) => {
		const amount = Math.abs(tx.amount);
		if (!amountGroups.has(amount)) {
			amountGroups.set(amount, []);
		}
		amountGroups.get(amount)?.push(tx);
	});

	amountGroups.forEach((group) => {
		if (group.length >= 2) {
			// Verificar se são do mesmo período curto
			const dates = group.map((tx) => new Date(tx.transactionDate).getTime());
			const maxDate = Math.max(...dates);
			const minDate = Math.min(...dates);
			const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);

			if (daysDiff <= 3) {
				// Mesmo dia ou até 3 dias de diferença
				groups.push(group);
			}
		}
	});

	return groups;
}

function analyzeCategoryPatterns(_transactions: unknown[]): FinancialAnomaly[] {
	const anomalies: FinancialAnomaly[] = [];

	// Implementar análise de padrões suspeitos por categoria
	// Por exemplo, múltiplas transações pequenas que somam um valor grande

	return anomalies;
}

function detectExcessiveTransactionPattern(
	txRecords: TransactionRecord[],
): FinancialAnomaly | null {
	// Detectar padrão excessivo de transações em curto período
	const transactionsPerDay = new Map<string, number>();

	txRecords.forEach((tx) => {
		const date = tx.transactionDate.split('T')[0];
		transactionsPerDay.set(date, (transactionsPerDay.get(date) || 0) + 1);
	});

	const maxTransactions = Math.max(...transactionsPerDay.values());

	if (maxTransactions > 20) {
		// Threshold arbitrário
		return {
			type: 'potential_fraud',
			severity: 'high',
			description: 'Padrão suspeito: número excessivo de transações em um único dia',
			recommendedAction: 'Verificar todas as transações do dia e confirmar autorização',
			date: new Date().toISOString(),
		};
	}

	return null;
}

function calculateOverallRiskScore(anomalies: FinancialAnomaly[]): number {
	const severityScores: Record<FinancialAnomaly['severity'], number> = {
		low: 1,
		medium: 2,
		high: 3,
		critical: 4,
	};

	const totalScore = anomalies.reduce((sum, anomaly) => {
		return sum + severityScores[anomaly.severity];
	}, 0);

	// Normalizar para 0-100
	return Math.min((totalScore / (anomalies.length || 1)) * 25, 100);
}

function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
	if (riskScore < 25) return 'low';
	if (riskScore < 50) return 'medium';
	if (riskScore < 75) return 'high';
	return 'critical';
}

function meetsSeverityThreshold(anomalySeverity: string, threshold: string): boolean {
	const levels: Record<string, number> = {
		low: 1,
		medium: 2,
		high: 3,
		critical: 4,
	};
	return (levels[anomalySeverity] ?? 0) >= (levels[threshold] ?? 0);
}

function generateAnomalyRecommendations(
	anomalies: FinancialAnomaly[],
	riskLevel: string,
): string[] {
	const recommendations = [];

	if (riskLevel === 'high' || riskLevel === 'critical') {
		recommendations.push('Recomenda-se revisão imediata de todas as transações suspeitas');
		recommendations.push('Considere alterar senhas e ativar autenticação em duas etapas');
	}

	if (anomalies.some((a) => a.type === 'duplicate_transaction')) {
		recommendations.push(
			'Verifique extratos bancários para confirmar duplicidade e conteste se necessário',
		);
	}

	if (anomalies.some((a) => a.type === 'unusual_spending')) {
		recommendations.push('Monitore gastos próximos ao limite ou fora do padrão habitual');
	}

	return recommendations;
}

function groupAnomaliesByType(anomalies: FinancialAnomaly[]): Record<string, number> {
	const grouped = anomalies.reduce(
		(acc, anomaly) => {
			acc[anomaly.type] = (acc[anomaly.type] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return grouped;
}

function calculateVariance(values: number[]): number {
	const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
	return values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
}

// Helper functions for getCashFlowForecast
async function fetchCashFlowData(
	userId: string,
	forecastMonths: number,
	includeScheduledEvents: boolean,
) {
	const endDate = new Date();
	const startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate()); // 12 meses de histórico

	// Buscar dados históricos
	const historicalData = await db
		.select({
			amount: transactions.amount,
			transactionDate: transactions.transactionDate,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				gte(transactions.transactionDate, startDate),
				lte(transactions.transactionDate, endDate),
			),
		);

	const transactionsList = historicalData.map((tx) => ({
		amount: Number(tx.amount),
		transactionDate: tx.transactionDate?.toISOString(),
	}));

	// Buscar eventos futuros agendados
	interface FutureEvent {
		amount: number;
		startDate: string;
		isIncome: boolean;
		brazilianEventType: string;
	}
	let futureEvents: FutureEvent[] = [];
	if (includeScheduledEvents) {
		const futureStart = new Date();
		const futureEnd = new Date();
		futureEnd.setMonth(futureEnd.getMonth() + forecastMonths);

		const events = await db
			.select({
				amount: financialEvents.amount,
				startDate: financialEvents.startDate,
				isIncome: financialEvents.isIncome,
				brazilianEventType: financialEvents.brazilianEventType,
			})
			.from(financialEvents)
			.where(
				and(
					eq(financialEvents.userId, userId),
					gte(financialEvents.startDate, futureStart),
					lte(financialEvents.startDate, futureEnd),
				),
			);

		futureEvents = events.map((e) => ({
			amount: Number(e.amount),
			startDate: e.startDate?.toISOString() || new Date().toISOString(),
			isIncome: e.isIncome ?? false,
			brazilianEventType: e.brazilianEventType ?? '',
		}));
	}

	return { txList: transactionsList, futureEvents };
}

function generateMonthlyBreakdown(
	forecastMonths: number,
	monthlyPatterns: Record<string, MonthlyPattern>,
	futureEvents: { amount: number; startDate: string; isIncome: boolean }[],
	confidenceLevel: number,
): MonthlyCashFlow[] {
	const monthlyBreakdown: MonthlyCashFlow[] = [];

	for (let i = 0; i < forecastMonths; i++) {
		const forecastDate = new Date();
		forecastDate.setMonth(forecastDate.getMonth() + i + 1);

		const monthKey = `${forecastDate.getFullYear()}-${forecastDate.getMonth() + 1}`;
		const pattern = monthlyPatterns[monthKey];

		let predictedIncome = pattern?.averageIncome || 0;
		let predictedExpenses = pattern?.averageExpenses || 0;

		// Adicionar eventos futuros do mês
		const monthEvents = futureEvents.filter((event) => {
			const eventDate = new Date(event.startDate);
			return (
				eventDate.getMonth() === forecastDate.getMonth() &&
				eventDate.getFullYear() === forecastDate.getFullYear()
			);
		});

		monthEvents.forEach((event) => {
			if (event.isIncome) {
				predictedIncome += Math.abs(event.amount);
			} else {
				predictedExpenses += Math.abs(event.amount);
			}
		});

		// Aplicar fator de confiança
		const confidence = pattern?.dataPoints
			? Math.min(pattern.dataPoints / 12, confidenceLevel)
			: confidenceLevel;
		predictedIncome *= confidence;
		predictedExpenses *= confidence;

		const netFlow = predictedIncome - predictedExpenses;

		monthlyBreakdown.push({
			month: forecastDate.toLocaleDateString('pt-BR', {
				month: 'long',
				year: 'numeric',
			}),
			income: predictedIncome,
			expenses: predictedExpenses,
			netFlow,
			confidence,
		});
	}

	return monthlyBreakdown;
}

function calculateTotals(monthlyBreakdown: MonthlyCashFlow[]) {
	let totalPredictedIncome = 0;
	let totalPredictedExpenses = 0;

	monthlyBreakdown.forEach((month) => {
		totalPredictedIncome += month.income;
		totalPredictedExpenses += month.expenses;
	});

	return { totalPredictedIncome, totalPredictedExpenses };
}

function buildCashFlowForecast(
	forecastMonths: number,
	totalPredictedIncome: number,
	totalPredictedExpenses: number,
	netCashFlow: number,
	confidenceLevel: number,
	monthlyBreakdown: MonthlyCashFlow[],
	monthlyPatterns: Record<string, MonthlyPattern>,
): CashFlowForecast {
	// Identificar fatores chave e avisos
	const keyFactors = identifyCashFlowFactors(monthlyBreakdown, monthlyPatterns);
	const warnings = generateCashFlowWarnings(monthlyBreakdown, netCashFlow);

	return {
		forecastPeriod: {
			startDate: new Date().toISOString(),
			endDate: new Date(Date.now() + forecastMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
		},
		predictedIncome: totalPredictedIncome,
		predictedExpenses: totalPredictedExpenses,
		netCashFlow,
		confidence: confidenceLevel,
		keyFactors,
		warnings,
		monthlyBreakdown,
	};
}

function buildCashFlowResponse(
	forecast: CashFlowForecast,
	forecastMonths: number,
	totalPredictedIncome: number,
	totalPredictedExpenses: number,
	netCashFlow: number,
	monthlyBreakdown: MonthlyCashFlow[],
) {
	return {
		forecast,
		summary: {
			netCashFlowStatus:
				netCashFlow > 0 ? 'positivo' : netCashFlow < 0 ? 'negativo' : 'equilibrado',
			averageMonthlyIncome: totalPredictedIncome / forecastMonths,
			averageMonthlyExpenses: totalPredictedExpenses / forecastMonths,
			highestExpenseMonth: monthlyBreakdown.reduce(
				(max, month) => (month.expenses > max.expenses ? month : max),
				monthlyBreakdown[0],
			)?.month,
		},
		message: `Previsão de fluxo de caixa para ${forecastMonths} meses: receita prevista de R$ ${totalPredictedIncome.toFixed(2)}, despesas de R$ ${totalPredictedExpenses.toFixed(2)}, resultando em fluxo ${netCashFlow >= 0 ? 'positivo' : 'negativo'} de R$ ${Math.abs(netCashFlow).toFixed(2)}.`,
	};
}

// Helper functions for getAnomalyDetection
function calculateAnalysisPeriod(analysisPeriod: string): {
	startDate: Date;
	endDate: Date;
} {
	const endDate = new Date();
	const startDate = new Date();

	switch (analysisPeriod) {
		case '7d':
			startDate.setDate(endDate.getDate() - 7);
			break;
		case '30d':
			startDate.setDate(endDate.getDate() - 30);
			break;
		case '90d':
			startDate.setDate(endDate.getDate() - 90);
			break;
	}

	return { startDate, endDate };
}

async function fetchAnomalyTransactions(
	userId: string,
	startDate: Date,
	endDate: Date,
): Promise<TransactionRecord[]> {
	const data = await db
		.select({
			amount: transactions.amount,
			transactionDate: transactions.transactionDate,
			description: transactions.description,
			merchantName: transactions.merchantName,
			categoryId: transactions.categoryId,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				gte(transactions.transactionDate, startDate),
				lte(transactions.transactionDate, endDate),
			),
		)
		.orderBy(desc(transactions.transactionDate));

	// Fetch categories separately
	const categoryData = await db
		.select()
		.from(transactionCategories)
		.where(eq(transactionCategories.userId, userId));

	const categoryMap = new Map(categoryData.map((c) => [c.id, c]));

	return data.map((tx) => ({
		amount: Number(tx.amount),
		transactionDate: tx.transactionDate?.toISOString() ?? '',
		description: tx.description,
		merchantName: tx.merchantName ?? undefined,
		category: tx.categoryId
			? [
					{
						id: tx.categoryId,
						name: categoryMap.get(tx.categoryId)?.name || 'Sem categoria',
					},
				]
			: [],
	}));
}

function detectAllAnomalies(
	txRecords: TransactionRecord[],
	severityThreshold: string,
): FinancialAnomaly[] {
	const anomalies: FinancialAnomaly[] = [];

	// 1. Transações de valor异常mente alto
	const amountStats = calculateAmountStatistics(txRecords);
	const highValueTransactions = txRecords.filter(
		(tx) => Math.abs(tx.amount) > amountStats.mean + 3 * amountStats.stdDev,
	);

	highValueTransactions.forEach((tx) => {
		const severity =
			Math.abs(tx.amount) > amountStats.mean + 5 * amountStats.stdDev ? 'high' : 'medium';
		if (meetsSeverityThreshold(severity, severityThreshold)) {
			anomalies.push({
				type: 'unusual_spending',
				severity,
				description: `Transação de valor异常mente alto: R$ ${Math.abs(tx.amount).toFixed(2)} em ${tx.merchantName || tx.description}`,
				amount: Math.abs(tx.amount),
				date: tx.transactionDate,
				category: getCategoryName(tx.category),
				recommendedAction: 'Verificar se esta transação foi autorizada por você',
			});
		}
	});

	// 2. Possíveis transações duplicadas
	const duplicateGroups = findPotentialDuplicates(txRecords);
	duplicateGroups.forEach((group) => {
		if (meetsSeverityThreshold('medium', severityThreshold)) {
			anomalies.push({
				type: 'duplicate_transaction',
				severity: 'medium',
				description: `Possíveis transações duplicadas: ${group.length} transações similares`,
				amount: group.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
				date: group[0].transactionDate,
				category: getCategoryName(group[0].category),
				recommendedAction: 'Verificar se houve cobrança duplicada e contestar se necessário',
			});
		}
	});

	// 3. Padrões suspeitos por categoria
	const categoryAnomalies = analyzeCategoryPatterns(txRecords);
	categoryAnomalies.forEach((anomaly) => {
		if (meetsSeverityThreshold(anomaly.severity, severityThreshold)) {
			anomalies.push(anomaly);
		}
	});

	// 4. Excesso de transações em curto período
	const excessiveTransactions = detectExcessiveTransactionPattern(txRecords);
	if (
		excessiveTransactions &&
		meetsSeverityThreshold(excessiveTransactions.severity, severityThreshold)
	) {
		anomalies.push(excessiveTransactions);
	}

	return anomalies;
}

function buildAnomalyDetectionResponse(
	anomalies: FinancialAnomaly[],
	riskScore: number,
	recommendations: string[],
	startDate: Date,
	endDate: Date,
): {
	detection: AnomalyDetection;
	summary: {
		totalAnomalies: number;
		anomaliesByType: Record<string, number>;
		riskLevel: string;
		analysisPeriod: { startDate: string; endDate: string; days: number };
	};
	message: string;
} {
	const riskLevel = getRiskLevel(riskScore);

	const detection: AnomalyDetection = {
		anomalies,
		riskScore,
		recommendations,
		lastAnalyzed: new Date().toISOString(),
	};

	return {
		detection,
		summary: {
			totalAnomalies: anomalies.length,
			anomaliesByType: groupAnomaliesByType(anomalies),
			riskLevel,
			analysisPeriod: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
			},
		},
		message:
			anomalies.length > 0
				? `Detectadas ${anomalies.length} anomalias no período de análise com nível de risco ${riskLevel}.`
				: 'Nenhuma anomalia significativa detectada no período analisado.',
	};
}

// Helper functions for getBudgetRecommendations
async function fetchBudgetTransactions(userId: string, analysisMonths: number) {
	const endDate = new Date();
	const startDate = new Date();
	startDate.setMonth(startDate.getMonth() - analysisMonths);

	const data = await db
		.select({
			amount: transactions.amount,
			categoryId: transactions.categoryId,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.userId, userId),
				gte(transactions.transactionDate, startDate),
				lte(transactions.transactionDate, endDate),
			),
		);

	// Fetch categories separately
	const categoryData = await db
		.select()
		.from(transactionCategories)
		.where(eq(transactionCategories.userId, userId));

	const categoryMap = new Map(categoryData.map((c) => [c.id, c]));

	const transactionsList = data.map((tx) => ({
		amount: Number(tx.amount),
		category: tx.categoryId
			? [
					{
						id: tx.categoryId,
						name: categoryMap.get(tx.categoryId)?.name || 'Sem categoria',
						color: categoryMap.get(tx.categoryId)?.color,
						icon: categoryMap.get(tx.categoryId)?.icon,
						isSystem: categoryMap.get(tx.categoryId)?.isSystem,
					},
				]
			: [],
	}));

	return { txList: transactionsList, startDate, endDate };
}

function analyzeSpendingPatterns(
	// biome-ignore lint/suspicious/noExplicitAny: Transaction data has dynamic structure from database
	txRecords: any[],
	analysisMonths: number,
) {
	const totalIncome = txRecords
		.filter((tx) => tx.amount > 0)
		.reduce((sum, tx) => sum + tx.amount, 0);

	const totalExpenses = txRecords
		.filter((tx) => tx.amount < 0)
		.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

	const averageMonthlyIncome = totalIncome / analysisMonths;
	const averageMonthlyExpenses = totalExpenses / analysisMonths;

	// Analisar gastos por categoria
	const categoryExpenses = new Map<
		string,
		{
			categoryName: string;
			categoryId: string;
			totalAmount: number;
			averageMonthly: number;
			percentage: number;
			isEssential: boolean;
			color: string;
			icon: string;
		}
	>();

	txRecords
		.filter((tx) => tx.amount < 0 && tx.category)
		.forEach((tx) => {
			const cat = Array.isArray(tx.category) ? tx.category[0] : tx.category;
			if (!cat) return;
			const catId = cat.id;

			if (!categoryExpenses.has(catId)) {
				categoryExpenses.set(catId, {
					categoryName: cat.name,
					categoryId: catId,
					totalAmount: 0,
					averageMonthly: 0,
					percentage: 0,
					isEssential: cat.isSystem,
					color: cat.color || '#6B7280',
					icon: cat.icon || 'circle',
				});
			}

			const categoryData = categoryExpenses.get(catId);
			if (categoryData) {
				categoryData.totalAmount += Math.abs(tx.amount);
			}
		});

	// Calcular médias e percentuais
	categoryExpenses.forEach((category) => {
		category.averageMonthly = category.totalAmount / analysisMonths;
		category.percentage =
			averageMonthlyExpenses > 0 ? (category.averageMonthly / averageMonthlyExpenses) * 100 : 0;
	});

	return {
		totalIncome,
		totalExpenses,
		averageMonthlyIncome,
		averageMonthlyExpenses,
		categoryExpenses: Array.from(categoryExpenses.values()),
	};
}

// Internal types for budget calculations
interface CategoryExpenseInternal {
	categoryId: string;
	categoryName: string;
	totalAmount: number;
	averageMonthly: number;
	percentage: number;
	isEssential: boolean;
	color?: string;
	icon?: string;
}

interface BudgetRecommendation {
	categoryId: string;
	categoryName: string;
	currentMonthlyAverage: number;
	recommendedMonthlyBudget: number;
	reductionPercentage: number;
	priority: 'essential' | 'non_essential';
	reasoning: string;
	color?: string;
	icon?: string;
}

interface InternalSpendingAnalysis {
	totalIncome: number;
	totalExpenses: number;
	averageMonthlyIncome: number;
	averageMonthlyExpenses: number;
	categoryExpenses: CategoryExpenseInternal[];
}

function calculateBudgetAllocations(
	spendingAnalysis: InternalSpendingAnalysis,
	targetSavingsRate: number,
	prioritizeEssential: boolean,
) {
	const { averageMonthlyIncome, categoryExpenses } = spendingAnalysis;

	// Calcular orçamento-alvo
	const targetMonthlySavings = averageMonthlyIncome * targetSavingsRate;
	const targetBudget = averageMonthlyIncome - targetMonthlySavings;

	// Atualizar categorias essenciais baseado na configuração
	const updatedCategories = categoryExpenses.map((cat) => ({
		...cat,
		isEssential:
			cat.isEssential ||
			(prioritizeEssential &&
				['Alimentação', 'Moradia', 'Transporte', 'Saúde'].includes(cat.categoryName)),
	}));

	// Gerar recomendações de orçamento
	const budgetRecommendations: BudgetRecommendation[] = [];
	const categories = updatedCategories;
	let allocatedBudget = 0;

	// Alocar orçamento para categorias essenciais primeiro
	const essentialCategories = categories
		.filter((cat) => cat.isEssential)
		.sort((a, b) => b.averageMonthly - a.averageMonthly);
	const nonEssentialCategories = categories
		.filter((cat) => !cat.isEssential)
		.sort((a, b) => b.averageMonthly - a.averageMonthly);

	// Orçamento para essenciais (manter ou reduzir modestamente)
	essentialCategories.forEach((category) => {
		const recommendedBudget = category.averageMonthly * 0.9; // Redução de 10%
		allocatedBudget += recommendedBudget;

		budgetRecommendations.push({
			categoryId: category.categoryId,
			categoryName: category.categoryName,
			currentMonthlyAverage: category.averageMonthly,
			recommendedMonthlyBudget: recommendedBudget,
			reductionPercentage: 10,
			priority: 'essential',
			reasoning: 'Categoria essencial, recomenda-se redução moderada',
			color: category.color,
			icon: category.icon,
		});
	});

	// Orçamento para não essenciais (reduções mais agressivas)
	const remainingBudget = targetBudget - allocatedBudget;
	const totalNonEssentialExpenses = nonEssentialCategories.reduce(
		(sum, cat) => sum + cat.averageMonthly,
		0,
	);

	if (remainingBudget > 0 && totalNonEssentialExpenses > 0) {
		const reductionFactor = remainingBudget / totalNonEssentialExpenses;

		nonEssentialCategories.forEach((category) => {
			const recommendedBudget = category.averageMonthly * reductionFactor;
			const reductionPercentage =
				((category.averageMonthly - recommendedBudget) / category.averageMonthly) * 100;

			budgetRecommendations.push({
				categoryId: category.categoryId,
				categoryName: category.categoryName,
				currentMonthlyAverage: category.averageMonthly,
				recommendedMonthlyBudget: recommendedBudget,
				reductionPercentage,
				priority: 'non_essential',
				reasoning:
					reductionPercentage > 30
						? 'Redução significativa recomendada para atingir meta de economia'
						: 'Redução moderada para equilibrar orçamento',
				color: category.color,
				icon: category.icon,
			});
		});
	}

	return {
		targetMonthlySavings,
		targetBudget,
		budgetRecommendations: budgetRecommendations.sort(
			(a, b) => b.reductionPercentage - a.reductionPercentage,
		),
	};
}

interface BudgetAllocationsResult {
	targetMonthlySavings: number;
	targetBudget: number;
	budgetRecommendations: BudgetRecommendation[];
}

function calculateBudgetProjections(
	spendingAnalysis: InternalSpendingAnalysis,
	budgetAllocations: BudgetAllocationsResult,
	targetSavingsRate: number,
) {
	const { averageMonthlyIncome } = spendingAnalysis;
	const { budgetRecommendations } = budgetAllocations;

	const projectedMonthlyExpenses = budgetRecommendations.reduce(
		(sum, rec) => sum + rec.recommendedMonthlyBudget,
		0,
	);
	const projectedMonthlySavings = averageMonthlyIncome - projectedMonthlyExpenses;
	const projectedSavingsRate =
		averageMonthlyIncome > 0 ? projectedMonthlySavings / averageMonthlyIncome : 0;

	return {
		projectedMonthlyExpenses,
		projectedMonthlySavings,
		projectedSavingsRate,
		canAchieveTarget: projectedSavingsRate >= targetSavingsRate,
	};
}

function buildBudgetResponse(
	// biome-ignore lint/suspicious/noExplicitAny: Analysis data has dynamic structure
	spendingAnalysis: any,
	// biome-ignore lint/suspicious/noExplicitAny: Budget allocations have dynamic structure
	budgetAllocations: any,
	// biome-ignore lint/suspicious/noExplicitAny: Projections have dynamic structure
	projections: any,
	targetSavingsRate: number,
) {
	const { averageMonthlyIncome, averageMonthlyExpenses } = spendingAnalysis;
	const { targetMonthlySavings, targetBudget, budgetRecommendations } = budgetAllocations;
	const {
		projectedMonthlyExpenses,
		projectedMonthlySavings,
		projectedSavingsRate,
		canAchieveTarget,
	} = projections;

	return {
		currentAnalysis: {
			averageMonthlyIncome,
			averageMonthlyExpenses,
			currentSavingsRate: (averageMonthlyIncome - averageMonthlyExpenses) / averageMonthlyIncome,
		},
		targetAnalysis: {
			targetSavingsRate,
			targetMonthlySavings,
			targetBudget,
		},
		budgetRecommendations,
		projections: {
			projectedMonthlyExpenses,
			projectedMonthlySavings,
			projectedSavingsRate,
			canAchieveTarget,
		},
		message:
			projectedSavingsRate >= targetSavingsRate
				? `Meta de economia de ${(targetSavingsRate * 100).toFixed(1)}% atingível com orçamento recomendado! Projeção: ${(projectedSavingsRate * 100).toFixed(1)}% de economia mensal.`
				: `Meta de ${(targetSavingsRate * 100).toFixed(1)}% desafiadora. Projeção atual: ${(projectedSavingsRate * 100).toFixed(1)}%. Considere reduções adicionais.`,
	};
}

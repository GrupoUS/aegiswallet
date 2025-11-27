import { createClient } from '@supabase/supabase-js';
import { tool } from 'ai';
import { z } from 'zod';
import { secureLogger } from '../../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import type {
  AnomalyDetection,
  CashFlowForecast,
  CategorySpending,
  FinancialAnomaly,
  MonthlyCashFlow,
  SpendingAnalysis,
  SpendingTrend,
} from './types';

export function createInsightsTools(userId: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    getSpendingAnalysis: tool({
      description:
        'Analisa detalhadamente os gastos do usuário por categoria, tendências e padrões.',
      inputSchema: z.object({
        startDate: z.string().datetime().describe('Data inicial da análise'),
        endDate: z.string().datetime().describe('Data final da análise'),
        categoryIds: z
          .array(z.string().uuid())
          .optional()
          .describe('Analisar categorias específicas'),
        includePredictions: z.boolean().default(true).describe('Incluir previsões e insights'),
      }),
      execute: async ({ startDate, endDate, categoryIds, includePredictions }) => {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);

          // Buscar transações do período
          let query = supabase
            .from('transactions')
            .select(`
              amount,
              transaction_date,
              category:transaction_categories(id, name, color, icon),
              description,
              merchant_name
            `)
            .eq('user_id', userId)
            .lt('amount', 0) // Apenas despesas
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate);

          if (categoryIds && categoryIds.length > 0) {
            query = query.in('category_id', categoryIds);
          }

          const { data, error } = await query;

          if (error) {
            secureLogger.error('Erro ao buscar transações para análise', {
              error: error.message,
              userId,
            });
            throw new Error(`Erro ao analisar gastos: ${error.message}`);
          }

          const transactions = data ?? [];
          const totalSpending = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

          // Análise por categoria
          const categoryMap = new Map<string, CategorySpending>();

          transactions.forEach((tx) => {
            const catId = tx.category?.id || 'uncategorized';
            const catName = tx.category?.name || 'Sem categoria';
            const catColor = tx.category?.color || '#6B7280';

            if (!categoryMap.has(catId)) {
              categoryMap.set(catId, {
                categoryId: catId,
                categoryName: catName,
                amount: 0,
                percentage: 0,
                transactionCount: 0,
                trend: 'stable',
              });
            }

            const category = categoryMap.get(catId)!;
            category.amount += Math.abs(tx.amount);
            category.transactionCount += 1;
          });

          // Calcular percentuais
          const categoryBreakdown = Array.from(categoryMap.values()).map((cat) => ({
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
            if (trend) {
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
              totalTransactions: transactions.length,
              averageTransaction: transactions.length > 0 ? totalSpending / transactions.length : 0,
              topCategory: categoryBreakdown[0]?.categoryName || 'Nenhuma',
              topCategoryPercentage: categoryBreakdown[0]?.percentage || 0,
            },
            message: `Análise completa do período: gastos totais de R$ ${totalSpending.toFixed(2)} em ${transactions.length} transações, distribuídos em ${categoryBreakdown.length} categorias.`,
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
          const endDate = new Date();
          const startDate = new Date(
            endDate.getFullYear() - 1,
            endDate.getMonth(),
            endDate.getDate()
          ); // 12 meses de histórico

          // Buscar dados históricos
          const { data: historicalData, error } = await supabase
            .from('transactions')
            .select('amount, transaction_date')
            .eq('user_id', userId)
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', endDate.toISOString());

          if (error) {
            throw new Error(`Erro ao buscar dados históricos: ${error.message}`);
          }

          const transactions = historicalData ?? [];

          // Buscar eventos futuros agendados
          let futureEvents = [];
          if (includeScheduledEvents) {
            const futureStart = new Date();
            const futureEnd = new Date();
            futureEnd.setMonth(futureEnd.getMonth() + forecastMonths);

            const { data: events } = await supabase
              .from('financial_events')
              .select('amount, start_date, is_income, brazilian_event_type')
              .eq('user_id', userId)
              .gte('start_date', futureStart.toISOString())
              .lte('start_date', futureEnd.toISOString());

            futureEvents = events ?? [];
          }

          // Analisar padrões mensais
          const monthlyPatterns = analyzeMonthlyPatterns(transactions);

          // Gerar previsão mensal
          const monthlyBreakdown: MonthlyCashFlow[] = [];
          let totalPredictedIncome = 0;
          let totalPredictedExpenses = 0;

          for (let i = 0; i < forecastMonths; i++) {
            const forecastDate = new Date();
            forecastDate.setMonth(forecastDate.getMonth() + i + 1);

            const monthKey = `${forecastDate.getFullYear()}-${forecastDate.getMonth() + 1}`;
            const pattern = monthlyPatterns[monthKey];

            let predictedIncome = pattern?.averageIncome || 0;
            let predictedExpenses = pattern?.averageExpenses || 0;

            // Adicionar eventos futuros do mês
            const monthEvents = futureEvents.filter((event) => {
              const eventDate = new Date(event.start_date);
              return (
                eventDate.getMonth() === forecastDate.getMonth() &&
                eventDate.getFullYear() === forecastDate.getFullYear()
              );
            });

            monthEvents.forEach((event) => {
              if (event.is_income) {
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

            totalPredictedIncome += predictedIncome;
            totalPredictedExpenses += predictedExpenses;

            monthlyBreakdown.push({
              month: forecastDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
              income: predictedIncome,
              expenses: predictedExpenses,
              netFlow,
              confidence,
            });
          }

          const netCashFlow = totalPredictedIncome - totalPredictedExpenses;

          // Identificar fatores chave e avisos
          const keyFactors = identifyCashFlowFactors(monthlyBreakdown, monthlyPatterns);
          const warnings = generateCashFlowWarnings(monthlyBreakdown, netCashFlow);

          const forecast: CashFlowForecast = {
            forecastPeriod: {
              startDate: new Date().toISOString(),
              endDate: new Date(
                Date.now() + forecastMonths * 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            predictedIncome: totalPredictedIncome,
            predictedExpenses: totalPredictedExpenses,
            netCashFlow,
            confidence: confidenceLevel,
            keyFactors,
            warnings,
            monthlyBreakdown,
          };

          return {
            forecast,
            summary: {
              netCashFlowStatus:
                netCashFlow > 0 ? 'positivo' : netCashFlow < 0 ? 'negativo' : 'equilibrado',
              averageMonthlyIncome: totalPredictedIncome / forecastMonths,
              averageMonthlyExpenses: totalPredictedExpenses / forecastMonths,
              highestExpenseMonth: monthlyBreakdown.reduce(
                (max, month) => (month.expenses > max.expenses ? month : max),
                monthlyBreakdown[0]
              )?.month,
            },
            message: `Previsão de fluxo de caixa para ${forecastMonths} meses: receita prevista de R$ ${totalPredictedIncome.toFixed(2)}, despesas de R$ ${totalPredictedExpenses.toFixed(2)}, resultando em fluxo ${netCashFlow >= 0 ? 'positivo' : 'negativo'} de R$ ${Math.abs(netCashFlow).toFixed(2)}.`,
          };
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
          // Calcular período de análise
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

          // Buscar transações do período
          const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
              amount,
              transaction_date,
              category:transaction_categories(id, name),
              description,
              merchant_name
            `)
            .eq('user_id', userId)
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', endDate.toISOString())
            .order('transaction_date', { ascending: false });

          if (error) {
            throw new Error(`Erro ao buscar transações: ${error.message}`);
          }

          const txList = transactions ?? [];
          const anomalies: FinancialAnomaly[] = [];

          // Detectar anomalias

          // 1. Transações de valor异常mente alto
          const amountStats = calculateAmountStatistics(txList);
          const highValueTransactions = txList.filter(
            (tx) => Math.abs(tx.amount) > amountStats.mean + 3 * amountStats.stdDev
          );

          highValueTransactions.forEach((tx) => {
            const severity =
              Math.abs(tx.amount) > amountStats.mean + 5 * amountStats.stdDev ? 'high' : 'medium';
            if (meetsSeverityThreshold(severity, severityThreshold)) {
              anomalies.push({
                type: 'unusual_spending',
                severity,
                description: `Transação de valor异常mente alto: R$ ${Math.abs(tx.amount).toFixed(2)} em ${tx.merchant_name || tx.description}`,
                amount: Math.abs(tx.amount),
                date: tx.transaction_date,
                category: tx.category?.name,
                recommendedAction: 'Verificar se esta transação foi autorizada por você',
              });
            }
          });

          // 2. Possíveis transações duplicadas
          const duplicateGroups = findPotentialDuplicates(txList);
          duplicateGroups.forEach((group) => {
            if (meetsSeverityThreshold('medium', severityThreshold)) {
              anomalies.push({
                type: 'duplicate_transaction',
                severity: 'medium',
                description: `Possíveis transações duplicadas: ${group.length} transações similares`,
                amount: group.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
                date: group[0].transaction_date,
                category: group[0].category?.name,
                recommendedAction:
                  'Verificar se houve cobrança duplicada e contestar se necessário',
              });
            }
          });

          // 3. Padrões suspeitos por categoria
          const categoryAnomalies = analyzeCategoryPatterns(txList);
          categoryAnomalies.forEach((anomaly) => {
            if (meetsSeverityThreshold(anomaly.severity, severityThreshold)) {
              anomalies.push(anomaly);
            }
          });

          // 4. Excesso de transações em curto período
          const excessiveTransactions = detectExcessiveTransactionPattern(txList);
          if (
            excessiveTransactions &&
            meetsSeverityThreshold(excessiveTransactions.severity, severityThreshold)
          ) {
            anomalies.push(excessiveTransactions);
          }

          // Calcular risco geral
          const riskScore = calculateOverallRiskScore(anomalies);
          const riskLevel = getRiskLevel(riskScore);

          // Gerar recomendações
          const recommendations = includeRecommendations
            ? generateAnomalyRecommendations(anomalies, riskLevel)
            : [];

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
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - analysisMonths);

          // Buscar dados de transações
          const { data: transactions, error } = await supabase
            .from('transactions')
            .select(`
              amount,
              category:transaction_categories(id, name, color, icon, is_system)
            `)
            .eq('user_id', userId)
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', endDate.toISOString());

          if (error) {
            throw new Error(`Erro ao buscar transações: ${error.message}`);
          }

          const txList = transactions ?? [];

          // Analisar padrões de gastos
          const totalIncome = txList
            .filter((tx) => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);

          const totalExpenses = txList
            .filter((tx) => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

          const averageMonthlyIncome = totalIncome / analysisMonths;
          const averageMonthlyExpenses = totalExpenses / analysisMonths;

          // Calcular orçamento-alvo
          const targetMonthlySavings = averageMonthlyIncome * targetSavingsRate;
          const targetBudget = averageMonthlyIncome - targetMonthlySavings;

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

          txList
            .filter((tx) => tx.amount < 0 && tx.category)
            .forEach((tx) => {
              const cat = tx.category!;
              const catId = cat.id;

              if (!categoryExpenses.has(catId)) {
                categoryExpenses.set(catId, {
                  categoryName: cat.name,
                  categoryId: catId,
                  totalAmount: 0,
                  averageMonthly: 0,
                  percentage: 0,
                  isEssential:
                    cat.is_system ||
                    (prioritizeEssential &&
                      ['Alimentação', 'Moradia', 'Transporte', 'Saúde'].includes(cat.name)),
                  color: cat.color || '#6B7280',
                  icon: cat.icon || 'circle',
                });
              }

              const category = categoryExpenses.get(catId)!;
              category.totalAmount += Math.abs(tx.amount);
            });

          // Calcular médias e percentuais
          categoryExpenses.forEach((category) => {
            category.averageMonthly = category.totalAmount / analysisMonths;
            category.percentage =
              averageMonthlyExpenses > 0
                ? (category.averageMonthly / averageMonthlyExpenses) * 100
                : 0;
          });

          // Gerar recomendações de orçamento
          const budgetRecommendations = [];
          const categories = Array.from(categoryExpenses.values());
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
            0
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
                priority: reductionPercentage > 30 ? 'high' : 'medium',
                reasoning:
                  reductionPercentage > 30
                    ? 'Redução significativa recomendada para atingir meta de economia'
                    : 'Redução moderada para equilibrar orçamento',
                color: category.color,
                icon: category.icon,
              });
            });
          }

          // Calcular projeções
          const projectedMonthlyExpenses = budgetRecommendations.reduce(
            (sum, rec) => sum + rec.recommendedMonthlyBudget,
            0
          );
          const projectedMonthlySavings = averageMonthlyIncome - projectedMonthlyExpenses;
          const projectedSavingsRate =
            averageMonthlyIncome > 0 ? projectedMonthlySavings / averageMonthlyIncome : 0;

          return {
            currentAnalysis: {
              averageMonthlyIncome,
              averageMonthlyExpenses,
              currentSavingsRate:
                (averageMonthlyIncome - averageMonthlyExpenses) / averageMonthlyIncome,
            },
            targetAnalysis: {
              targetSavingsRate,
              targetMonthlySavings,
              targetBudget,
            },
            budgetRecommendations: budgetRecommendations.sort(
              (a, b) => b.reductionPercentage - a.reductionPercentage
            ),
            projections: {
              projectedMonthlyExpenses,
              projectedMonthlySavings,
              projectedSavingsRate,
              canAchieveTarget: projectedSavingsRate >= targetSavingsRate,
            },
            message:
              projectedSavingsRate >= targetSavingsRate
                ? `Meta de economia de ${(targetSavingsRate * 100).toFixed(1)}% atingível com orçamento recomendado! Projeção: ${(projectedSavingsRate * 100).toFixed(1)}% de economia mensal.`
                : `Meta de ${(targetSavingsRate * 100).toFixed(1)}% desafiadora. Projeção atual: ${(projectedSavingsRate * 100).toFixed(1)}%. Considere reduções adicionais.`,
          };
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
async function analyzeSpendingTrends(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  // Simplificação - implementar análise comparativa real
  // Em produção, comparar com período anterior e calcular tendências
  return [];
}

function generateSpendingInsights(categories: CategorySpending[], totalSpending: number): string[] {
  const insights = [];

  if (categories.length === 0) return insights;

  const topCategory = categories[0];
  const secondCategory = categories[1];

  // Insight sobre categoria principal
  insights.push(
    `${topCategory.categoryName} representa ${topCategory.percentage.toFixed(1)}% dos gastos totais`
  );

  // Insight sobre concentração
  const top3Percentage = categories.slice(0, 3).reduce((sum, cat) => sum + cat.percentage, 0);
  if (top3Percentage > 70) {
    insights.push('Seus gastos estão muito concentrados em poucas categorias');
  }

  // Insight sobre variação
  const highVarianceCategories = categories.filter(
    (cat) => cat.trendPercentage && Math.abs(cat.trendPercentage) > 20
  );

  if (highVarianceCategories.length > 0) {
    insights.push(
      `${highVarianceCategories.map((cat) => cat.categoryName).join(', ')} mostraram variação significativa`
    );
  }

  return insights;
}

function generateSpendingRecommendations(categories: CategorySpending[], trends: any[]): string[] {
  const recommendations = [];

  if (categories.length === 0) return recommendations;

  // Recomendações baseadas em percentuais
  const highExpenseCategories = categories.filter((cat) => cat.percentage > 25);
  highExpenseCategories.forEach((cat) => {
    recommendations.push(
      `Considere revisar gastos em ${cat.categoryName} (${cat.percentage.toFixed(1)}% do total)`
    );
  });

  // Recomendações baseadas em tendências
  const increasingCategories = categories.filter((cat) => cat.trend === 'increasing');
  if (increasingCategories.length > 0) {
    recommendations.push(
      `Atenção: ${increasingCategories.map((cat) => cat.categoryName).join(', ')} estão em alta`
    );
  }

  return recommendations;
}

function analyzeMonthlyPatterns(transactions: any[]): Record<string, any> {
  const patterns: Record<string, any> = {};

  // Agrupar por mês
  const monthlyData = new Map<string, number[]>();

  transactions.forEach((tx) => {
    const date = new Date(tx.transaction_date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, []);
    }

    monthlyData.get(monthKey)!.push(tx.amount);
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

function identifyCashFlowFactors(monthlyBreakdown: MonthlyCashFlow[], patterns: any[]): string[] {
  const factors = [];

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
  netCashFlow: number
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

function calculateAmountStatistics(transactions: any[]): { mean: number; stdDev: number } {
  const amounts = transactions.map((tx) => Math.abs(tx.amount));
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

  const variance =
    amounts.reduce((sum, amount) => {
      return sum + (amount - mean) ** 2;
    }, 0) / amounts.length;

  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

function findPotentialDuplicates(transactions: any[]): any[][] {
  const groups = [];

  // Simplificação - em produção usar algoritmo mais sofisticado
  const amountGroups = new Map<number, any[]>();

  transactions.forEach((tx) => {
    const amount = Math.abs(tx.amount);
    if (!amountGroups.has(amount)) {
      amountGroups.set(amount, []);
    }
    amountGroups.get(amount)!.push(tx);
  });

  amountGroups.forEach((group) => {
    if (group.length >= 2) {
      // Verificar se são do mesmo período curto
      const dates = group.map((tx) => new Date(tx.transaction_date).getTime());
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

function analyzeCategoryPatterns(transactions: any[]): FinancialAnomaly[] {
  const anomalies: FinancialAnomaly[] = [];

  // Implementar análise de padrões suspeitos por categoria
  // Por exemplo, múltiplas transações pequenas que somam um valor grande

  return anomalies;
}

function detectExcessiveTransactionPattern(transactions: any[]): FinancialAnomaly | null {
  // Detectar padrão excessivo de transações em curto período
  const transactionsPerDay = new Map<string, number>();

  transactions.forEach((tx) => {
    const date = tx.transaction_date.split('T')[0];
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
    };
  }

  return null;
}

function calculateOverallRiskScore(anomalies: FinancialAnomaly[]): number {
  const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };

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
  const levels = { low: 1, medium: 2, high: 3, critical: 4 };
  return levels[anomalySeverity] >= levels[threshold];
}

function generateAnomalyRecommendations(
  anomalies: FinancialAnomaly[],
  riskLevel: string
): string[] {
  const recommendations = [];

  if (riskLevel === 'high' || riskLevel === 'critical') {
    recommendations.push('Recomenda-se revisão imediata de todas as transações suspeitas');
    recommendations.push('Considere alterar senhas e ativar autenticação em duas etapas');
  }

  if (anomalies.some((a) => a.type === 'duplicate_transaction')) {
    recommendations.push(
      'Verifique extratos bancários para confirmar duplicidade e conteste se necessário'
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
    {} as Record<string, number>
  );

  return grouped;
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  return values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
}

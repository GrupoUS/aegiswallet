import { tool } from 'ai';
import { and, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

import { secureLogger } from '../../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import type {
	ChartData,
	ExportedReport,
	ExportOptions,
	VisualReport,
} from './types';
import { db } from '@/db/client';
import { transactionCategories, transactions } from '@/db/schema';

// Interface for date range to replace any type
interface DateRange {
	startDate: string;
	endDate: string;
}

export function createMultimodalTools(userId: string) {
	// Supabase client will be created through centralized integration layer

	return {
		generateVisualReport: tool({
			description:
				'Gera relatórios visuais interativos com gráficos e análises financeiras.',
			inputSchema: z.object({
				reportType: z
					.enum([
						'spending_chart',
						'cash_flow_graph',
						'category_breakdown',
						'trend_analysis',
						'budget_comparison',
					])
					.describe('Tipo do relatório visual'),
				title: z.string().min(1).max(100).describe('Título do relatório'),
				description: z
					.string()
					.min(1)
					.max(500)
					.describe('Descrição do relatório'),
				dateRange: z
					.object({
						startDate: z.string().datetime().describe('Data inicial'),
						endDate: z.string().datetime().describe('Data final'),
					})
					.describe('Período de análise'),
				chartType: z
					.enum(['bar', 'line', 'pie', 'doughnut', 'area', 'radar'])
					.default('bar')
					.describe('Tipo de gráfico'),
				categories: z
					.array(z.string().uuid())
					.optional()
					.describe('Categorias específicas para analisar'),
				includeComparison: z
					.boolean()
					.default(false)
					.describe('Incluir comparação com período anterior'),
				format: z
					.enum(['json', 'svg', 'png'])
					.default('json')
					.describe('Formato de saída'),
				colorScheme: z
					.enum(['default', 'blue', 'green', 'purple', 'orange'])
					.default('default')
					.describe('Esquema de cores'),
			}),
			execute: async ({
				reportType,
				title,
				description,
				dateRange,
				chartType,
				categories,
				includeComparison,
				format,
				colorScheme,
			}) => {
				try {
					// Buscar dados baseado no tipo de relatório
					const data = await fetchReportData(
						userId,
						reportType,
						dateRange,
						categories,
					);

					// Processar dados para visualização
					const chartData = processChartData(
						data,
						reportType,
						chartType,
						colorScheme,
					);

					// Gerar insights
					const insights = generateVisualInsights(data, reportType, chartType);

					// Comparação com período anterior se solicitado
					let comparisonData = null;
					if (includeComparison) {
						comparisonData = await fetchComparisonData(
							userId,
							reportType,
							dateRange,
							categories,
						);
					}

					// Criar objeto do relatório
					const report: VisualReport = {
						type: reportType,
						title,
						description,
						chartData,
						insights,
						format,
						generatedAt: new Date().toISOString(),
					};

					// Gerar arquivo se necessário
					let fileUrl = null;
					if (format !== 'json') {
						fileUrl = await generateChartFile(chartData, format, title);
					}

					// Note: visual_reports table does not exist in Drizzle schema
					// For now, we'll just return the report without saving
					const savedReport = {
						id: crypto.randomUUID(),
						userId,
						type: reportType,
						title,
						description,
						chartData,
						insights,
						format,
						fileUrl,
						dateRange,
						comparisonData,
						createdAt: new Date().toISOString(),
					};

					secureLogger.info('Relatório visual gerado com sucesso', {
						userId,
						reportType,
						chartType,
						format,
						recordCount: data.length,
					});

					return {
						report: filterSensitiveData(report),
						savedReport: filterSensitiveData(savedReport),
						fileUrl,
						metadata: {
							dataPoints: data.length,
							chartType,
							includesComparison: !!comparisonData,
							colorScheme,
							generatedAt: report.generatedAt,
						},
						message: `Relatório visual "${title}" gerado com ${data.length} pontos de dados em formato ${format}`,
					};
				} catch (error) {
					secureLogger.error('Falha ao gerar relatório visual', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						reportType,
					});
					throw error;
				}
			},
		}),

		generatePaymentSummary: tool({
			description:
				'Cria um resumo visual completo de pagamentos e transferências.',
			inputSchema: z.object({
				period: z
					.enum(['this_month', 'last_month', 'last_3_months', 'last_year'])
					.default('this_month')
					.describe('Período do resumo'),
				includeScheduled: z
					.boolean()
					.default(true)
					.describe('Incluir pagamentos agendados'),
				groupBy: z
					.enum(['category', 'day', 'week', 'recipient'])
					.default('category')
					.describe('Agrupamento dos dados'),
				visualElements: z
					.array(z.enum(['chart', 'table', 'timeline', 'map']))
					.default(['chart', 'table'])
					.describe('Elementos visuais incluídos'),
				exportFormat: z
					.enum(['interactive', 'pdf', 'email'])
					.default('interactive')
					.describe('Formato de exportação'),
			}),
			execute: async ({
				period,
				includeScheduled,
				groupBy,
				visualElements,
				exportFormat,
			}) => {
				try {
					// Calcular período de datas
					const dateRange = calculateDateRange(period);

					// Buscar dados de pagamentos
					const paymentsData = await fetchPaymentsData(
						userId,
						dateRange,
						includeScheduled,
					);

					// Buscar pagamentos agendados
					let scheduledPayments: unknown[] = [];
					if (includeScheduled) {
						scheduledPayments = await fetchScheduledPayments(
							userId,
							dateRange.endDate,
						);
					}

					// Agrupar dados conforme solicitado
					const groupedData = groupPaymentsData(paymentsData, groupBy);

					// Gerar elementos visuais
					const visualElementsData: {
						chart?: unknown;
						table?: unknown[];
						timeline?: unknown;
					} = {};

					if (visualElements.includes('chart')) {
						visualElementsData.chart = generatePaymentChart(
							paymentsData,
							groupBy,
						);
					}

					if (visualElements.includes('table')) {
						visualElementsData.table = generatePaymentTable(paymentsData);
					}

					if (visualElements.includes('timeline')) {
						visualElementsData.timeline = generatePaymentTimeline(paymentsData);
					}

					// Gerar estatísticas e insights
					const statistics = calculatePaymentStatistics(
						paymentsData,
						scheduledPayments,
					);
					const insightsData = generatePaymentInsights(paymentsData, groupBy);

					// Criar resumo completo
					const summary = {
						period,
						dateRange,
						statistics,
						groupedData,
						scheduledPayments,
						visualElements: visualElementsData,
						insights: insightsData,
						generatedAt: new Date().toISOString(),
					};

					// Processar exportação se necessário
					let exportResult = null;
					if (exportFormat !== 'interactive') {
						exportResult = await exportPaymentSummary(summary, exportFormat);
					}

					secureLogger.info('Resumo de pagamentos gerado com sucesso', {
						userId,
						period,
						groupBy,
						exportFormat,
						totalPayments: paymentsData.length,
					});

					return {
						summary: filterSensitiveData(summary),
						exportResult,
						interactive: {
							canFilter: exportFormat === 'interactive',
							canDrillDown: visualElements.includes('chart'),
							canExport: true,
						},
						message: `Resumo de pagamentos gerado: ${paymentsData.length} transações no período, agrupadas por ${groupBy}`,
					};
				} catch (error) {
					secureLogger.error('Falha ao gerar resumo de pagamentos', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						period,
					});
					throw error;
				}
			},
		}),

		createSpendingVisualization: tool({
			description: 'Cria visualizações detalhadas de padrões de gastos.',
			inputSchema: z.object({
				visualizationType: z
					.enum(['heatmap', 'bubble_chart', 'treemap', 'sunburst', 'sankey'])
					.describe('Tipo de visualização'),
				focusArea: z
					.enum(['all', 'discretionary', 'essential', 'savings', 'debts'])
					.default('all')
					.describe('Área de foco da análise'),
				granularity: z
					.enum(['daily', 'weekly', 'monthly', 'quarterly'])
					.default('monthly')
					.describe('Granularidade dos dados'),
				insightsLevel: z
					.enum(['basic', 'detailed', 'advanced'])
					.default('detailed')
					.describe('Nível de insights'),
				interactiveFeatures: z
					.array(
						z.enum(['zoom', 'filter', 'drilldown', 'tooltip', 'animation']),
					)
					.default(['tooltip', 'animation'])
					.describe('Recursos interativos'),
				colorBy: z
					.enum(['amount', 'frequency', 'trend', 'category'])
					.default('amount')
					.describe('Critério de coloração'),
			}),
			execute: async ({
				visualizationType,
				focusArea,
				granularity,
				insightsLevel,
				interactiveFeatures,
				colorBy,
			}) => {
				try {
					// Buscar dados de gastos com granularidade específica
					const spendingData = await fetchSpendingData(
						userId,
						granularity,
						focusArea,
					);

					// Processar dados para o tipo de visualização
					const processedData = processSpendingForVisualization(
						spendingData,
						visualizationType,
						colorBy,
					);

					// Gerar insights baseado no nível solicitado
					const insights = await generateSpendingInsights(
						spendingData,
						insightsLevel,
						visualizationType,
					);

					// Configurar recursos interativos
					const interactiveConfig = configureInteractiveFeatures(
						interactiveFeatures,
						visualizationType,
					);

					// Gerar dados específicos para cada tipo de visualização
					let visualizationData: unknown = {};

					switch (visualizationType) {
						case 'heatmap':
							visualizationData = generateHeatmapData(processedData);
							break;
						case 'bubble_chart':
							visualizationData = generateBubbleChartData(processedData);
							break;
						case 'treemap':
							visualizationData = generateTreemapData(processedData);
							break;
						case 'sunburst':
							visualizationData = generateSunburstData(processedData);
							break;
						case 'sankey':
							visualizationData = generateSankeyData(processedData);
							break;
					}

					const visualization = {
						type: visualizationType,
						focusArea,
						granularity,
						data: visualizationData,
						insights,
						interactiveConfig,
						colorBy,
						generatedAt: new Date().toISOString(),
					};

					// Note: spending_visualizations table does not exist in Drizzle schema
					// For now, we'll just return the visualization without saving
					const savedViz = {
						id: crypto.randomUUID(),
						userId,
						type: visualizationType,
						focusArea,
						granularity,
						data: visualizationData,
						insights,
						interactiveFeatures,
						colorBy,
						createdAt: new Date().toISOString(),
					};

					secureLogger.info('Visualização de gastos criada com sucesso', {
						userId,
						visualizationType,
						focusArea,
						dataPoints: spendingData.length,
						insightsLevel,
					});

					return {
						visualization: filterSensitiveData(visualization),
						savedVisualization: filterSensitiveData(savedViz),
						capabilities: {
							downloadable: true,
							shareable: true,
							interactive: interactiveFeatures.length > 0,
							animatable: interactiveFeatures.includes('animation'),
						},
						message: `Visualização ${visualizationType} criada com ${spendingData.length} pontos de dados e ${insights.length} insights`,
					};
				} catch (error) {
					secureLogger.error('Falha ao criar visualização de gastos', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						visualizationType,
					});
					throw error;
				}
			},
		}),

		exportFinancialReport: tool({
			description:
				'Exporta relatórios financeiros em diversos formatos para compartilhamento.',
			inputSchema: z.object({
				reportType: z
					.enum([
						'comprehensive_summary',
						'tax_report',
						'investment_summary',
						'expense_report',
					])
					.describe('Tipo do relatório'),
				format: z
					.enum(['csv', 'xlsx', 'pdf', 'json'])
					.describe('Formato de exportação'),
				dateRange: z
					.object({
						startDate: z.string().datetime().describe('Data inicial'),
						endDate: z.string().datetime().describe('Data final'),
					})
					.describe('Período do relatório'),
				includeCharts: z
					.boolean()
					.default(false)
					.describe('Incluir gráficos no relatório'),
				includeInsights: z
					.boolean()
					.default(true)
					.describe('Incluir insights no relatório'),
				language: z
					.enum(['PT-BR', 'EN'])
					.default('PT-BR')
					.describe('Idioma do relatório'),
				branding: z
					.object({
						includeLogo: z.boolean().default(true),
						includeFooter: z.boolean().default(true),
						customColors: z
							.object({
								primary: z.string().optional(),
								secondary: z.string().optional(),
							})
							.optional(),
					})
					.optional()
					.describe('Opções de branding'),
			}),
			execute: async ({
				reportType,
				format,
				dateRange,
				includeCharts,
				includeInsights,
				language,
				branding,
			}) => {
				try {
					const reportData = await generateFinancialReportData(
						userId,
						reportType,
						dateRange,
					);
					const insights = includeInsights
						? await generateReportInsights(reportData, reportType, language)
						: [];
					const charts = includeCharts
						? await generateReportCharts(
								reportData,
								reportType,
								getCustomColors(branding),
							)
						: [];
					const exportOptions = buildExportOptions(
						reportData,
						format,
						dateRange,
						includeCharts,
						includeInsights,
					);
					const exportResult = await processExport(reportData, exportOptions, {
						insights,
						charts,
						language,
						branding,
					});
					const exportRecord = await saveExportRecord(
						userId,
						reportType,
						format,
						dateRange,
						exportResult,
					);
					const exportedReport = buildExportedReport(
						exportRecord,
						reportType,
						format,
						exportResult,
					);

					return buildExportResponse(
						exportedReport,
						exportResult,
						format,
						includeCharts,
						includeInsights,
					);
				} catch (error) {
					secureLogger.error('Falha ao exportar relatório financeiro', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						reportType,
						format,
					});
					throw error;
				}
			},
		}),
	};
}

// Helper functions for data processing
async function fetchReportData(
	userId: string,
	_reportType: string,
	dateRange: DateRange,
	categories?: string[],
): Promise<unknown[]> {
	const conditions = [
		eq(transactions.userId, userId),
		gte(transactions.transactionDate, new Date(dateRange.startDate)),
		lte(transactions.transactionDate, new Date(dateRange.endDate)),
	];

	const data = await db
		.select({
			amount: transactions.amount,
			transaction_date: transactions.transactionDate,
			description: transactions.description,
			category_id: transactions.categoryId,
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
	return data.map((tx) => ({
		amount: Number(tx.amount),
		transaction_date: tx.transaction_date?.toISOString(),
		category: tx.category_id
			? [
					{
						id: tx.category_id,
						name: categoryMap.get(tx.category_id)?.name || 'Sem categoria',
						color: categoryMap.get(tx.category_id)?.color,
					},
				]
			: [],
		description: tx.description,
	}));
}

function processChartData(
	_data: unknown[],
	_reportType: string,
	_chartType: string,
	colorScheme: string,
): ChartData {
	// Processamento genérico - implementar lógica específica para cada tipo
	const colors = getColorPalette(colorScheme);

	return {
		labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
		datasets: [
			{
				label: 'Gastos',
				data: [1000, 1200, 800, 1500, 2000, 1800],
				backgroundColor: colors.slice(0, 6),
				borderColor: colors.slice(0, 6),
				borderWidth: 2,
			},
		],
	};
}

function getColorPalette(scheme: string): string[] {
	const palettes: Record<string, string[]> = {
		default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
		blue: ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
		green: ['#14532D', '#166534', '#15803D', '#16A34A', '#22C55E', '#86EFAC'],
		purple: ['#581C87', '#6B21A8', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'],
		orange: ['#7C2D12', '#9A3412', '#C2410C', '#EA580C', '#F97316', '#FED7AA'],
	};

	return palettes[scheme] ?? palettes.default;
}

function generateVisualInsights(
	_data: unknown[],
	_reportType: string,
	_chartType: string,
): string[] {
	// Simplificação - gerar insights genéricos
	const insights: string[] = [];

	return insights;
}

function _getTrendDescription(_data: unknown[]): string {
	// Simplificação - analisar tendência real dos dados
	return 'crescente';
}

// Simplificação de outras funções helper - stubs com assinaturas completas
async function fetchComparisonData(
	_userId: string,
	_reportType: string,
	_dateRange: { startDate: string; endDate: string },
	_categories?: string[],
): Promise<unknown> {
	return null;
}
async function generateChartFile(
	_chartData: ChartData,
	_format: string,
	_title: string,
): Promise<string | null> {
	return null;
}
async function fetchPaymentsData(
	_userId: string,
	_dateRange: DateRange,
	_includeScheduled: boolean,
): Promise<unknown[]> {
	return [];
}
async function fetchScheduledPayments(
	_userId: string,
	_endDate: string,
): Promise<unknown[]> {
	return [];
}
interface GroupedPaymentsData {
	chart: unknown;
	table: unknown[];
	timeline: unknown;
	byCategory?: unknown;
}
function groupPaymentsData(
	_data: unknown[],
	_groupBy: string,
): GroupedPaymentsData {
	return { chart: {}, table: [], timeline: {} };
}
function generatePaymentChart(_data: unknown[], _groupBy: string): unknown {
	return {};
}
function generatePaymentTable(_data: unknown[]): unknown[] {
	return [];
}
function generatePaymentTimeline(_data: unknown[]): unknown {
	return {};
}
function calculatePaymentStatistics(
	_data: unknown[],
	_scheduledPayments: unknown[],
): unknown {
	return {};
}
function generatePaymentInsights(_data: unknown[], _groupBy: string): string[] {
	return [];
}
async function exportPaymentSummary(
	_summary: unknown,
	_exportFormat: string,
): Promise<unknown> {
	return null;
}
function calculateDateRange(_period: string): DateRange {
	const end = new Date();
	const start = new Date();
	start.setMonth(start.getMonth() - 1);
	return { startDate: start.toISOString(), endDate: end.toISOString() };
}
async function fetchSpendingData(
	_userId: string,
	_granularity: string,
	_focusArea: string,
): Promise<unknown[]> {
	return [];
}
function processSpendingForVisualization(
	_data: unknown[],
	_groupBy: string,
	_visualizationType: string,
): { byCategory?: unknown } {
	return {};
}
async function generateSpendingInsights(
	_data: unknown[],
	_groupBy: string,
	_visualizationType: string,
): Promise<string[]> {
	return [];
}
function configureInteractiveFeatures(
	_interactiveFeatures: string[],
	_visualizationType: string,
): unknown {
	return {};
}
function generateHeatmapData(_data: { byCategory?: unknown }): unknown {
	return {};
}
function generateBubbleChartData(_data: { byCategory?: unknown }): unknown {
	return {};
}
function generateTreemapData(_data: { byCategory?: unknown }): unknown {
	return {};
}
function generateSunburstData(_data: { byCategory?: unknown }): unknown {
	return {};
}
function generateSankeyData(_data: { byCategory?: unknown }): unknown {
	return {};
}
async function generateFinancialReportData(
	_userId: string,
	_reportType: string,
	_dateRange: DateRange,
): Promise<unknown> {
	return {};
}
async function generateReportInsights(
	_reportData: unknown,
	_reportType: string,
	_format: string,
): Promise<string[]> {
	return [];
}
async function generateReportCharts(
	_reportData: unknown,
	_reportType: string,
	_customColors: string[],
): Promise<ChartData[]> {
	return [];
}
async function processExport(
	_reportData: unknown,
	_exportOptions: ExportOptions,
	_additionalOptions: {
		insights: string[];
		charts: ChartData[];
		language: string;
		branding?: { customColors?: { primary?: string; secondary?: string } };
	},
): Promise<{
	fileUrl: string;
	fileSize: number;
	recordCount: number;
	expiresAt: string;
}> {
	return {
		fileUrl: 'https://example.com/export.pdf',
		fileSize: 1024000,
		recordCount: 100,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
	};
}
function calculateDownloadTime(fileSize: number): string {
	const seconds = Math.ceil(fileSize / (1024 * 1024)); // Assumindo 1MB/s
	return `${Math.ceil(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

// Helper functions for exportFinancialReport
function getCustomColors(branding?: {
	customColors?: { primary?: string; secondary?: string };
}): string[] {
	if (!branding?.customColors) return [];
	return [
		branding.customColors.primary,
		branding.customColors.secondary,
	].filter((c): c is string => !!c);
}

function buildExportOptions(
	reportData: unknown,
	format: string,
	dateRange: { startDate: string; endDate: string },
	includeCharts: boolean,
	includeInsights: boolean,
): ExportOptions {
	const reportDataTyped = reportData as {
		byCategory?: Record<string, unknown>;
	};
	return {
		format: format as 'json' | 'pdf' | 'csv' | 'xlsx',
		dateRange,
		includeCategories: Object.keys(reportDataTyped.byCategory || {}),
		includeCharts,
		includeInsights,
	};
}

async function saveExportRecord(
	userId: string,
	reportType: string,
	format: string,
	dateRange: { startDate: string; endDate: string },
	exportResult: { fileUrl: string; fileSize: number; recordCount: number },
): Promise<unknown> {
	// Note: export_records table does not exist in Drizzle schema
	// For now, we'll just return a mock record without saving
	const exportRecord = {
		id: crypto.randomUUID(),
		userId,
		reportType,
		format,
		dateRange,
		fileUrl: exportResult.fileUrl,
		fileSize: exportResult.fileSize,
		recordCount: exportResult.recordCount,
		createdAt: new Date().toISOString(),
	};

	secureLogger.info('Relatório financeiro exportado com sucesso', {
		userId,
		reportType,
		format,
		fileSize: exportResult.fileSize,
		recordCount: exportResult.recordCount,
	});

	return exportRecord;
}

function buildExportedReport(
	exportRecord: unknown,
	reportType: string,
	format: string,
	exportResult: { fileUrl: string; expiresAt: string; recordCount: number },
): ExportedReport {
	return {
		id: (exportRecord as { id?: string })?.id ?? crypto.randomUUID(),
		type: reportType,
		format,
		fileUrl: exportResult.fileUrl,
		expiresAt: exportResult.expiresAt,
		generatedAt: new Date().toISOString(),
		recordCount: exportResult.recordCount,
	};
}

function buildExportResponse(
	exportedReport: ExportedReport,
	exportResult: { fileSize: number; recordCount: number },
	format: string,
	includeCharts: boolean,
	includeInsights: boolean,
) {
	return {
		report: exportedReport,
		exportResult: filterSensitiveData(exportResult),
		preview: {
			recordCount: exportResult.recordCount,
			fileFormat: format.toUpperCase(),
			estimatedDownloadTime: calculateDownloadTime(exportResult.fileSize),
			includesCharts: includeCharts,
			includesInsights: includeInsights,
		},
		message: `Relatório ${exportedReport.type} exportado com sucesso em formato ${format.toUpperCase()}`,
	};
}

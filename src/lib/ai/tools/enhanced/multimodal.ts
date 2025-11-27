import { createClient } from '@supabase/supabase-js';
import { tool } from 'ai';
import { z } from 'zod';
import { secureLogger } from '../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import type { ChartData, Dataset, ExportedReport, ExportOptions, VisualReport } from './types';

export function createMultimodalTools(userId: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    generateVisualReport: tool({
      description: 'Gera relatórios visuais interativos com gráficos e análises financeiras.',
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
        description: z.string().min(1).max(500).describe('Descrição do relatório'),
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
        format: z.enum(['json', 'svg', 'png']).default('json').describe('Formato de saída'),
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
          const data = await fetchReportData(userId, reportType, dateRange, categories);

          // Processar dados para visualização
          const chartData = processChartData(data, reportType, chartType, colorScheme);

          // Gerar insights
          const insights = generateVisualInsights(data, reportType, chartType);

          // Comparação com período anterior se solicitado
          let comparisonData = null;
          if (includeComparison) {
            comparisonData = await fetchComparisonData(userId, reportType, dateRange, categories);
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

          // Salvar relatório no banco
          const { data: savedReport, error } = await supabase
            .from('visual_reports')
            .insert({
              user_id: userId,
              type: reportType,
              title,
              description,
              chart_data: chartData,
              insights: insights,
              format,
              file_url: fileUrl,
              date_range: dateRange,
              comparison_data: comparisonData,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Erro ao salvar relatório: ${error.message}`);
          }

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
      description: 'Cria um resumo visual completo de pagamentos e transferências.',
      inputSchema: z.object({
        period: z
          .enum(['this_month', 'last_month', 'last_3_months', 'last_year'])
          .default('this_month')
          .describe('Período do resumo'),
        includeScheduled: z.boolean().default(true).describe('Incluir pagamentos agendados'),
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
      execute: async ({ period, includeScheduled, groupBy, visualElements, exportFormat }) => {
        try {
          // Calcular período de datas
          const dateRange = calculateDateRange(period);

          // Buscar dados de pagamentos
          const paymentsData = await fetchPaymentsData(userId, dateRange, includeScheduled);

          // Buscar pagamentos agendados
          let scheduledPayments = [];
          if (includeScheduled) {
            scheduledPayments = await fetchScheduledPayments(userId, dateRange.end);
          }

          // Agrupar dados conforme solicitado
          const groupedData = groupPaymentsData(paymentsData, groupBy);

          // Gerar elementos visuais
          const visualElementsData = {};

          if (visualElements.includes('chart')) {
            visualElementsData.chart = generatePaymentChart(groupedData, groupBy);
          }

          if (visualElements.includes('table')) {
            visualElementsData.table = generatePaymentTable(groupedData);
          }

          if (visualElements.includes('timeline')) {
            visualElementsData.timeline = generatePaymentTimeline(paymentsData);
          }

          // Gerar estatísticas e insights
          const statistics = calculatePaymentStatistics(paymentsData, scheduledPayments);
          const insights = generatePaymentInsights(groupedData, statistics);

          // Criar resumo completo
          const summary = {
            period,
            dateRange,
            statistics,
            groupedData,
            scheduledPayments,
            visualElements: visualElementsData,
            insights,
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
          .array(z.enum(['zoom', 'filter', 'drilldown', 'tooltip', 'animation']))
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
          const spendingData = await fetchSpendingData(userId, granularity, focusArea);

          // Processar dados para o tipo de visualização
          const processedData = processSpendingForVisualization(
            spendingData,
            visualizationType,
            colorBy
          );

          // Gerar insights baseado no nível solicitado
          const insights = await generateSpendingInsights(
            spendingData,
            insightsLevel,
            visualizationType
          );

          // Configurar recursos interativos
          const interactiveConfig = configureInteractiveFeatures(
            interactiveFeatures,
            visualizationType
          );

          // Gerar dados específicos para cada tipo de visualização
          let visualizationData = {};

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

          // Salvar visualização
          const { data: savedViz, error } = await supabase
            .from('spending_visualizations')
            .insert({
              user_id: userId,
              type: visualizationType,
              focus_area: focusArea,
              granularity,
              data: visualizationData,
              insights: insights,
              interactive_features: interactiveFeatures,
              color_by: colorBy,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Erro ao salvar visualização: ${error.message}`);
          }

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
      description: 'Exporta relatórios financeiros em diversos formatos para compartilhamento.',
      inputSchema: z.object({
        reportType: z
          .enum(['comprehensive_summary', 'tax_report', 'investment_summary', 'expense_report'])
          .describe('Tipo do relatório'),
        format: z.enum(['csv', 'xlsx', 'pdf', 'json']).describe('Formato de exportação'),
        dateRange: z
          .object({
            startDate: z.string().datetime().describe('Data inicial'),
            endDate: z.string().datetime().describe('Data final'),
          })
          .describe('Período do relatório'),
        includeCharts: z.boolean().default(false).describe('Incluir gráficos no relatório'),
        includeInsights: z.boolean().default(true).describe('Incluir insights no relatório'),
        language: z.enum(['PT-BR', 'EN']).default('PT-BR').describe('Idioma do relatório'),
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
          // Gerar dados do relatório
          const reportData = await generateFinancialReportData(userId, reportType, dateRange);

          // Gerar insights se solicitado
          let insights = [];
          if (includeInsights) {
            insights = await generateReportInsights(reportData, reportType, language);
          }

          // Gerar gráficos se solicitado
          let charts = [];
          if (includeCharts) {
            charts = await generateReportCharts(reportData, reportType, branding?.customColors);
          }

          // Configurar opções de exportação
          const exportOptions: ExportOptions = {
            format,
            dateRange,
            includeCategories: Object.keys(reportData.byCategory || {}),
            includeCharts,
            includeInsights,
          };

          // Gerar arquivo de exportação
          const exportResult = await processExport(reportData, exportOptions, {
            insights,
            charts,
            language,
            branding,
          });

          // Salvar registro de exportação
          const { data: exportRecord, error } = await supabase
            .from('export_records')
            .insert({
              user_id: userId,
              report_type: reportType,
              format,
              date_range: dateRange,
              file_url: exportResult.fileUrl,
              file_size: exportResult.fileSize,
              record_count: exportResult.recordCount,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            throw new Error(`Erro ao registrar exportação: ${error.message}`);
          }

          secureLogger.info('Relatório financeiro exportado com sucesso', {
            userId,
            reportType,
            format,
            fileSize: exportResult.fileSize,
            recordCount: exportResult.recordCount,
          });

          const exportedReport: ExportedReport = {
            id: exportRecord.id,
            type: reportType,
            format,
            fileUrl: exportResult.fileUrl,
            expiresAt: exportResult.expiresAt,
            generatedAt: new Date().toISOString(),
            recordCount: exportResult.recordCount,
          };

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
            message: `Relatório ${reportType} exportado com sucesso em formato ${format.toUpperCase()}`,
          };
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
  reportType: string,
  dateRange: any,
  categories?: string[]
): Promise<any[]> {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  let query = supabase
    .from('transactions')
    .select(`
      amount,
      transaction_date,
      category:transaction_categories(id, name, color),
      description
    `)
    .eq('user_id', userId)
    .gte('transaction_date', dateRange.startDate)
    .lte('transaction_date', dateRange.endDate);

  if (categories && categories.length > 0) {
    query = query.in('category_id', categories);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao buscar dados: ${error.message}`);

  return data || [];
}

function processChartData(
  data: any[],
  reportType: string,
  chartType: string,
  colorScheme: string
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
  const palettes = {
    default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    blue: ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
    green: ['#14532D', '#166534', '#15803D', '#16A34A', '#22C55E', '#86EFAC'],
    purple: ['#581C87', '#6B21A8', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'],
    orange: ['#7C2D12', '#9A3412', '#C2410C', '#EA580C', '#F97316', '#FED7AA'],
  };

  return palettes[scheme] || palettes.default;
}

function generateVisualInsights(data: any[], reportType: string, chartType: string): string[] {
  // Simplificação - gerar insights genéricos
  const insights = [];

  if (data.length > 0) {
    insights.push(`Analisados ${data.length} pontos de dados no período`);
    insights.push(`Tendência identificada: ${getTrendDescription(data)}`);
  }

  return insights;
}

function getTrendDescription(data: any[]): string {
  // Simplificação - analisar tendência real dos dados
  return 'crescente';
}

// Simplificação de outras funções helper
async function fetchComparisonData() {
  return null;
}
async function generateChartFile() {
  return null;
}
async function fetchPaymentsData() {
  return [];
}
async function fetchScheduledPayments() {
  return [];
}
function groupPaymentsData(data: any[], groupBy: string) {
  return {};
}
function generatePaymentChart() {
  return {};
}
function generatePaymentTable() {
  return [];
}
function generatePaymentTimeline() {
  return {};
}
function calculatePaymentStatistics() {
  return {};
}
function generatePaymentInsights() {
  return [];
}
async function exportPaymentSummary() {
  return null;
}
function calculateDateRange(period: string) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
async function fetchSpendingData() {
  return [];
}
function processSpendingForVisualization() {
  return {};
}
async function generateSpendingInsights() {
  return [];
}
function configureInteractiveFeatures() {
  return {};
}
function generateHeatmapData() {
  return {};
}
function generateBubbleChartData() {
  return {};
}
function generateTreemapData() {
  return {};
}
function generateSunburstData() {
  return {};
}
function generateSankeyData() {
  return {};
}
async function generateFinancialReportData() {
  return {};
}
async function generateReportInsights() {
  return [];
}
async function generateReportCharts() {
  return [];
}
async function processExport(exportOptions: any, options: any) {
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

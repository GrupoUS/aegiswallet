import { type FunctionDeclaration, SchemaType } from '@google/generative-ai';

/**
 * Gemini Function Calling Tool Definitions
 * Descriptions in Portuguese for better Brazilian user experience
 *
 * These definitions follow the OpenAPI 3.0 specification format
 * required by Gemini's Function Calling feature.
 */
export const financialToolDefinitions: FunctionDeclaration[] = [
	{
		name: 'get_account_balances',
		description:
			'Obtém os saldos atuais de todas as contas bancárias do usuário. Use quando o usuário perguntar sobre saldo, quanto tem disponível, ou situação das contas.',
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				includeInactive: {
					type: SchemaType.BOOLEAN,
					description: 'Se true, inclui contas inativas. Default: false',
				},
			},
		},
	},
	{
		name: 'get_recent_transactions',
		description:
			'Busca transações recentes do usuário com filtros opcionais. Use para perguntas sobre gastos específicos, histórico de compras, ou movimentações.',
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				startDate: {
					type: SchemaType.STRING,
					description: 'Data inicial no formato ISO 8601 (ex: 2024-01-01T00:00:00Z)',
				},
				endDate: {
					type: SchemaType.STRING,
					description: 'Data final no formato ISO 8601',
				},
				categoryId: {
					type: SchemaType.STRING,
					description: 'UUID da categoria para filtrar',
				},
				type: {
					type: SchemaType.STRING,
					format: 'enum',
					enum: ['debit', 'credit', 'transfer', 'pix', 'boleto'],
					description: 'Tipo de transação para filtrar',
				},
				limit: {
					type: SchemaType.NUMBER,
					description: 'Quantidade máxima de resultados (1-100). Default: 20',
				},
			},
		},
	},
	{
		name: 'get_spending_by_category',
		description:
			'Retorna um resumo de gastos agrupados por categoria. Use para análises de onde o dinheiro está sendo gasto, distribuição de despesas.',
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				period: {
					type: SchemaType.STRING,
					format: 'enum',
					enum: ['week', 'month', 'quarter', 'year'],
					description: 'Período de análise. Default: month',
				},
				compareWithPrevious: {
					type: SchemaType.BOOLEAN,
					description: 'Se true, inclui comparação com período anterior para mostrar tendências',
				},
			},
		},
	},
	{
		name: 'get_upcoming_payments',
		description:
			'Lista pagamentos futuros agendados (boletos, contas recorrentes, PIX agendado). Use para perguntas sobre contas a pagar, vencimentos próximos.',
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				daysAhead: {
					type: SchemaType.NUMBER,
					description: 'Quantidade de dias à frente para buscar (1-90). Default: 30',
				},
			},
		},
	},
	{
		name: 'get_budget_status',
		description:
			'Retorna o status dos orçamentos definidos pelo usuário por categoria. Use para perguntas sobre metas, limites de gastos, se está dentro do orçamento.',
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				categoryId: {
					type: SchemaType.STRING,
					description:
						'UUID da categoria específica. Se omitido, retorna status de todos os orçamentos ativos.',
				},
			},
		},
	},
	{
		name: 'get_financial_insights',
		description:
			'Busca insights e recomendações gerados pela IA sobre as finanças do usuário. Use para sugestões de melhoria, alertas de gastos, oportunidades de economia.',
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				type: {
					type: SchemaType.STRING,
					format: 'enum',
					enum: ['spending_pattern', 'budget_alert', 'opportunity', 'warning'],
					description: 'Tipo específico de insight para filtrar',
				},
				onlyUnread: {
					type: SchemaType.BOOLEAN,
					description: 'Se true, retorna apenas insights não lidos. Default: true',
				},
				limit: {
					type: SchemaType.NUMBER,
					description: 'Quantidade máxima de insights (1-20). Default: 5',
				},
			},
		},
	},
	{
		name: 'get_spending_trends',
		description:
			'Analisa tendências de gastos ao longo do tempo, comparando múltiplos períodos. Use para perguntas sobre evolução de gastos, comparações mês a mês, padrões.',
		parameters: {
			type: SchemaType.OBJECT,
			properties: {
				categoryId: {
					type: SchemaType.STRING,
					description: 'UUID da categoria. Se omitido, analisa gastos totais.',
				},
				periods: {
					type: SchemaType.NUMBER,
					description: 'Quantidade de períodos para comparar (2-12). Default: 3',
				},
				periodType: {
					type: SchemaType.STRING,
					format: 'enum',
					enum: ['month', 'week'],
					description: 'Tipo de período para comparação. Default: month',
				},
			},
		},
	},
];

/**
 * AI Chat Prompt Configuration
 *
 * Configuração centralizada do sistema de prompt para análise e sugestões
 * de aprimoramento financeiro. Baseado em arquitetura RAG com compliance LGPD.
 *
 * @module lib/ai/config/prompt-config
 * @version 1.0.0
 */

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface PromptLayerConfig {
	/** Tipo da camada - determina nível de confiança e fonte */
	type: 'IMMUTABLE' | 'SESSION_SCOPED' | 'QUERY_SCOPED' | 'UNTRUSTED';
	/** Fonte dos dados */
	source: string;
	/** Descrição do conteúdo */
	contains: string;
	/** Nível de risco de injection */
	injectionRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface FinancialAnalysisConfig {
	/** Nome do tipo de análise */
	name: string;
	/** Descrição do que a análise faz */
	description: string;
	/** Categorias de dados necessárias */
	requiredDataCategories: string[];
	/** Prompt específico para este tipo de análise */
	analysisPrompt: string;
	/** Métricas alvo para esta análise */
	targetMetrics?: string[];
}

export interface AlertConfig {
	type: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	thresholds: Record<string, number>;
	message: string;
}

export interface PromptConfig {
	/** Versão da configuração */
	version: string;
	/** Idioma padrão */
	defaultLanguage: 'pt-BR';
	/** Configuração das camadas de contexto */
	contextLayers: Record<string, PromptLayerConfig>;
	/** Configurações de análises disponíveis */
	analysisTypes: FinancialAnalysisConfig[];
	/** Configurações de alertas */
	alertConfigs: AlertConfig[];
	/** Limites de segurança */
	securityLimits: {
		maxContextTokens: number;
		maxResponseTokens: number;
		maxConversationHistory: number;
		rateLimitPerHour: number;
	};
	/** Configuração de compliance */
	compliance: {
		lgpdRequired: boolean;
		auditLogging: boolean;
		dataRetentionDays: number;
		sensitiveDataPatterns: RegExp[];
	};
}

// ============================================================================
// CONFIGURAÇÃO DE CAMADAS DE CONTEXTO
// ============================================================================

export const CONTEXT_LAYERS: Record<string, PromptLayerConfig> = {
	system: {
		type: 'IMMUTABLE',
		source: 'Backend hardcoded',
		contains: 'Personalidade, regras, capacidades, restrições',
		injectionRisk: 'NONE',
	},
	userProfile: {
		type: 'SESSION_SCOPED',
		source: 'Database via RLS',
		contains: 'Nome, preferências, perfil financeiro',
		injectionRisk: 'LOW',
	},
	financialData: {
		type: 'QUERY_SCOPED',
		source: 'Database via RLS + API',
		contains: 'Transações, saldos, metas, orçamentos',
		injectionRisk: 'LOW',
	},
	userMessage: {
		type: 'UNTRUSTED',
		source: 'Input do usuário',
		contains: 'Pergunta/solicitação',
		injectionRisk: 'HIGH',
	},
};

// ============================================================================
// TIPOS DE ANÁLISE FINANCEIRA
// ============================================================================

export const FINANCIAL_ANALYSIS_TYPES: FinancialAnalysisConfig[] = [
	{
		name: 'spending_analysis',
		description: 'Análise detalhada de padrões de gastos',
		requiredDataCategories: ['transactions', 'budgets', 'categories'],
		targetMetrics: ['gastos_por_categoria', 'tendencia_mensal', 'anomalias'],
		analysisPrompt: `
Analise os gastos do usuário considerando:
1. Distribuição por categoria (top 5)
2. Comparação com meses anteriores
3. Identificação de gastos recorrentes
4. Detecção de anomalias (valores fora do padrão)
5. Sugestões específicas de economia

Formate valores em R$ e use linguagem acessível.
`.trim(),
	},
	{
		name: 'budget_tracking',
		description: 'Acompanhamento de orçamentos definidos',
		requiredDataCategories: ['budgets', 'transactions'],
		targetMetrics: ['aderencia_orcamento', 'categorias_estouro', 'margem_disponivel'],
		analysisPrompt: `
Avalie a aderência aos orçamentos:
1. Percentual utilizado de cada categoria
2. Categorias com risco de estouro (>80%)
3. Categorias com folga para realocação
4. Projeção até fim do mês
5. Recomendações de ajuste

Priorize alertas por severidade.
`.trim(),
	},
	{
		name: 'goal_progress',
		description: 'Progresso das metas financeiras',
		requiredDataCategories: ['goals', 'accounts', 'transactions'],
		targetMetrics: ['progresso_percentual', 'ritmo_atual', 'projecao_alcance'],
		analysisPrompt: `
Analise o progresso das metas financeiras:
1. Percentual atual de cada meta
2. Ritmo de contribuição atual vs necessário
3. Data projetada de alcance no ritmo atual
4. Metas em risco (< 50% do esperado)
5. Estratégias para acelerar conquistas

Celebre progressos positivos!
`.trim(),
	},
	{
		name: 'financial_health',
		description: 'Avaliação geral da saúde financeira',
		requiredDataCategories: ['accounts', 'transactions', 'budgets', 'goals'],
		targetMetrics: ['score_saude', 'reserva_emergencia', 'razao_divida_patrimonio'],
		analysisPrompt: `
Avalie a saúde financeira geral:
1. Score de saúde financeira (1-10)
2. Reserva de emergência (ideal: 6 meses de gastos)
3. Proporção dívida/patrimônio
4. Diversificação de receitas
5. Top 3 ações prioritárias para melhoria

Seja encorajador mas realista.
`.trim(),
	},
	{
		name: 'savings_opportunities',
		description: 'Identificação de oportunidades de economia',
		requiredDataCategories: ['transactions', 'categories', 'budgets'],
		targetMetrics: ['economia_potencial', 'gastos_otimizaveis', 'assinaturas_revisaveis'],
		analysisPrompt: `
Identifique oportunidades de economia:
1. Gastos recorrentes que podem ser renegociados
2. Assinaturas com baixa utilização
3. Categorias com gastos acima da média brasileira
4. Compras por impulso (baseado em padrões)
5. Economia estimada com cada otimização

Apresente valores concretos de economia.
`.trim(),
	},
	{
		name: 'investment_readiness',
		description: 'Avaliação de prontidão para investimentos',
		requiredDataCategories: ['accounts', 'transactions', 'goals', 'budgets'],
		targetMetrics: ['capacidade_poupanca', 'estabilidade_fluxo', 'perfil_risco'],
		analysisPrompt: `
Avalie a prontidão para investimentos:
1. Capacidade de poupança mensal (excedente)
2. Estabilidade do fluxo de caixa
3. Reserva de emergência adequada?
4. Dívidas de alto custo quitadas?
5. Próximos passos recomendados

Não dê conselhos de investimento específicos - sugira procurar um profissional certificado.
`.trim(),
	},
];

// ============================================================================
// CONFIGURAÇÃO DE ALERTAS FINANCEIROS
// ============================================================================

export const ALERT_CONFIGS: AlertConfig[] = [
	{
		type: 'low_balance',
		severity: 'high',
		thresholds: { checking_balance: 500, savings_balance: 1000 },
		message: 'Saldo em conta está abaixo do mínimo recomendado',
	},
	{
		type: 'budget_warning',
		severity: 'medium',
		thresholds: { usage_percent: 80 },
		message: 'Orçamento de {category} está em {usage_percent}%',
	},
	{
		type: 'budget_exceeded',
		severity: 'high',
		thresholds: { usage_percent: 100 },
		message: 'Orçamento de {category} foi excedido',
	},
	{
		type: 'goal_overdue',
		severity: 'high',
		thresholds: { days_overdue: 0 },
		message: 'Meta "{name}" passou da data limite',
	},
	{
		type: 'goal_at_risk',
		severity: 'medium',
		thresholds: { progress_percent: 50, days_remaining: 30 },
		message:
			'Meta "{name}" está em risco - apenas {progress_percent}% com {days_remaining} dias restantes',
	},
	{
		type: 'unusual_spending',
		severity: 'medium',
		thresholds: { deviation_percent: 150 },
		message: 'Gasto incomum detectado em {category}: {deviation_percent}% acima do normal',
	},
	{
		type: 'recurring_payment_due',
		severity: 'low',
		thresholds: { days_until_due: 3 },
		message: 'Pagamento recorrente de {description} vence em {days_until_due} dias',
	},
	{
		type: 'negative_balance',
		severity: 'critical',
		thresholds: { balance: 0 },
		message: 'ATENÇÃO: Saldo negativo detectado em {account_name}',
	},
];

// ============================================================================
// TEMPLATES DE FORMATAÇÃO DE CONTEXTO
// ============================================================================

export const CONTEXT_FORMAT_TEMPLATES = {
	/**
	 * Template XML para dados financeiros estruturados
	 * Formato otimizado para parsing por LLMs
	 */
	financialDataXml: `
<user_financial_data>
  <profile>
    <name>{userName}</name>
    <net_worth>R$ {netWorth}</net_worth>
  </profile>

  <accounts>
    <checking>R$ {checkingBalance}</checking>
    <savings>R$ {savingsBalance}</savings>
    <credit_debt>R$ {creditBalance}</credit_debt>
    <investments>R$ {investmentBalance}</investments>
  </accounts>

  <monthly_spending>
    {spendingCategories}
  </monthly_spending>

  <budgets>
    {budgetStatus}
  </budgets>

  <financial_goals>
    {goalsProgress}
  </financial_goals>

  <alerts>
    {activeAlerts}
  </alerts>

  <recent_transactions>
    {recentTransactions}
  </recent_transactions>
</user_financial_data>
`.trim(),

	/**
	 * Template para categoria de gasto
	 */
	spendingCategory: `<category name="{category}" total="R$ {total}" count="{count}"/>`,

	/**
	 * Template para status de orçamento
	 */
	budgetStatus: `<budget category="{category}" limit="R$ {limit}" spent="R$ {spent}" usage="{usagePercent}%"/>`,

	/**
	 * Template para progresso de meta
	 */
	goalProgress: `<goal name="{name}" target="R$ {target}" current="R$ {current}" progress="{progress}%" status="{status}"/>`,

	/**
	 * Template para alerta
	 */
	alert: `<alert type="{type}" severity="{severity}">{message}</alert>`,

	/**
	 * Template para transação recente
	 */
	transaction: `<transaction date="{date}" category="{category}" amount="R$ {amount}" description="{description}"/>`,
};

// ============================================================================
// PROMPT DE SUGESTÕES DE APRIMORAMENTO
// ============================================================================

export const FINANCIAL_IMPROVEMENT_PROMPT = `
## MODO: SUGESTÕES DE APRIMORAMENTO FINANCEIRO

Você está analisando os dados financeiros do usuário para fornecer sugestões práticas e personalizadas de melhoria. Siga estas diretrizes:

### Estrutura de Análise

1. **Diagnóstico Rápido** (máx. 2 frases)
   - Resumo do estado financeiro atual
   - Principal ponto de atenção

2. **Oportunidades Identificadas** (3-5 itens)
   - Liste ações específicas e acionáveis
   - Inclua estimativa de impacto quando possível
   - Priorize por facilidade de implementação

3. **Próximo Passo Recomendado** (1 item)
   - Ação mais impactante que o usuário pode tomar HOJE
   - Seja específico (ex: "Reduza alimentação fora de casa de R$ 800 para R$ 600")

### Categorias de Sugestão

**Controle de Gastos**
- Identificar categorias com maior potencial de economia
- Sugerir limites orçamentários realistas
- Detectar gastos recorrentes dispensáveis

**Ajustes de Contas**
- Realocar recursos entre contas
- Sugerir consolidação de dívidas se aplicável
- Otimizar uso de diferentes tipos de conta

**Metas Financeiras**
- Avaliar viabilidade das metas atuais
- Sugerir novos marcos intermediários
- Propor estratégias de aceleração

**Reserva de Emergência**
- Calcular valor ideal (6 meses de gastos essenciais)
- Propor plano de construção gradual
- Sugerir onde manter a reserva

### Regras de Comunicação

1. **Seja Específico**: Use valores do contexto, não genéricos
2. **Seja Realista**: Considere a realidade financeira brasileira
3. **Seja Encorajador**: Celebre progressos, não apenas critique
4. **Seja Prático**: Foque em ações imediatas possíveis
5. **Seja Respeitoso**: Finanças são assunto sensível

### Formato de Resposta

\`\`\`
📊 **Sua Situação Atual**
[Diagnóstico em 1-2 frases]

💡 **Oportunidades de Melhoria**
1. [Sugestão específica com impacto estimado]
2. [Sugestão específica com impacto estimado]
3. [Sugestão específica com impacto estimado]

🎯 **Comece Por Aqui**
[Ação específica para hoje]

💬 Quer que eu detalhe alguma dessas sugestões?
\`\`\`

### Limitações

- NÃO recomende produtos de investimento específicos
- NÃO sugira ações que requeiram conhecimento técnico avançado
- NÃO faça julgamentos morais sobre hábitos de consumo
- SEMPRE sugira consultar profissional para decisões complexas
`.trim();

// ============================================================================
// CONFIGURAÇÃO COMPLETA DO PROMPT
// ============================================================================

export const PROMPT_CONFIG: PromptConfig = {
	version: '1.0.0',
	defaultLanguage: 'pt-BR',
	contextLayers: CONTEXT_LAYERS,
	analysisTypes: FINANCIAL_ANALYSIS_TYPES,
	alertConfigs: ALERT_CONFIGS,
	securityLimits: {
		maxContextTokens: 8000,
		maxResponseTokens: 2048,
		maxConversationHistory: 10,
		rateLimitPerHour: 30,
	},
	compliance: {
		lgpdRequired: true,
		auditLogging: true,
		dataRetentionDays: 30,
		sensitiveDataPatterns: [
			/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
			/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, // CNPJ
			/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Cartão de crédito
			/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
		],
	},
};

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Obtém configuração de análise por nome
 */
export function getAnalysisConfig(name: string): FinancialAnalysisConfig | undefined {
	return FINANCIAL_ANALYSIS_TYPES.find((a) => a.name === name);
}

/**
 * Obtém alertas aplicáveis com base nos dados financeiros
 */
export function getApplicableAlerts(financialData: {
	checkingBalance?: number;
	budgets?: Array<{ category: string; usagePercent: number }>;
	goals?: Array<{
		name: string;
		progressPercent: number;
		daysRemaining?: number;
		isOverdue?: boolean;
	}>;
}): AlertConfig[] {
	const applicableAlerts: AlertConfig[] = [];

	// Helper para buscar configuração de alerta com segurança
	const findAlertConfig = (type: string): AlertConfig | undefined =>
		ALERT_CONFIGS.find((a) => a.type === type);

	// Verificar saldo baixo
	const lowBalanceConfig = findAlertConfig('low_balance');
	if (
		lowBalanceConfig &&
		financialData.checkingBalance !== undefined &&
		financialData.checkingBalance < lowBalanceConfig.thresholds.checking_balance
	) {
		applicableAlerts.push(lowBalanceConfig);
	}

	// Verificar orçamentos
	const budgetExceededConfig = findAlertConfig('budget_exceeded');
	const budgetWarningConfig = findAlertConfig('budget_warning');

	financialData.budgets?.forEach((budget) => {
		if (budget.usagePercent >= 100 && budgetExceededConfig) {
			applicableAlerts.push(budgetExceededConfig);
		} else if (budget.usagePercent >= 80 && budgetWarningConfig) {
			applicableAlerts.push(budgetWarningConfig);
		}
	});

	// Verificar metas
	const goalOverdueConfig = findAlertConfig('goal_overdue');
	const goalAtRiskConfig = findAlertConfig('goal_at_risk');

	financialData.goals?.forEach((goal) => {
		if (goal.isOverdue && goalOverdueConfig) {
			applicableAlerts.push(goalOverdueConfig);
		} else if (
			goal.progressPercent < 50 &&
			goal.daysRemaining &&
			goal.daysRemaining < 30 &&
			goalAtRiskConfig
		) {
			applicableAlerts.push(goalAtRiskConfig);
		}
	});

	return applicableAlerts;
}

/**
 * Formata dados financeiros para contexto do prompt
 */
export function formatFinancialContext(data: {
	userName: string;
	netWorth: number;
	checkingBalance: number;
	savingsBalance: number;
	creditBalance: number;
	investmentBalance: number;
	spending: Array<{ category: string; total: number; count: number }>;
	budgets: Array<{ category: string; limit: number; spent: number; usagePercent: number }>;
	goals: Array<{ name: string; target: number; current: number; progress: number; status: string }>;
	alerts: Array<{ type: string; severity: string; message: string }>;
	transactions: Array<{ date: string; category: string; amount: number; description: string }>;
}): string {
	const formatCurrency = (value: number) =>
		value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

	const spendingCategories = data.spending
		.map((s) =>
			CONTEXT_FORMAT_TEMPLATES.spendingCategory
				.replace('{category}', s.category)
				.replace('{total}', formatCurrency(s.total))
				.replace('{count}', s.count.toString()),
		)
		.join('\n    ');

	const budgetStatus = data.budgets
		.map((b) =>
			CONTEXT_FORMAT_TEMPLATES.budgetStatus
				.replace('{category}', b.category)
				.replace('{limit}', formatCurrency(b.limit))
				.replace('{spent}', formatCurrency(b.spent))
				.replace('{usagePercent}', b.usagePercent.toString()),
		)
		.join('\n    ');

	const goalsProgress = data.goals
		.map((g) =>
			CONTEXT_FORMAT_TEMPLATES.goalProgress
				.replace('{name}', g.name)
				.replace('{target}', formatCurrency(g.target))
				.replace('{current}', formatCurrency(g.current))
				.replace('{progress}', g.progress.toString())
				.replace('{status}', g.status),
		)
		.join('\n    ');

	const activeAlerts = data.alerts
		.map((a) =>
			CONTEXT_FORMAT_TEMPLATES.alert
				.replace('{type}', a.type)
				.replace('{severity}', a.severity)
				.replace('{message}', a.message),
		)
		.join('\n    ');

	const recentTransactions = data.transactions
		.slice(0, 10)
		.map((t) =>
			CONTEXT_FORMAT_TEMPLATES.transaction
				.replace('{date}', t.date)
				.replace('{category}', t.category)
				.replace('{amount}', formatCurrency(t.amount))
				.replace('{description}', t.description || 'N/A'),
		)
		.join('\n    ');

	return CONTEXT_FORMAT_TEMPLATES.financialDataXml
		.replace('{userName}', data.userName)
		.replace('{netWorth}', formatCurrency(data.netWorth))
		.replace('{checkingBalance}', formatCurrency(data.checkingBalance))
		.replace('{savingsBalance}', formatCurrency(data.savingsBalance))
		.replace('{creditBalance}', formatCurrency(data.creditBalance))
		.replace('{investmentBalance}', formatCurrency(data.investmentBalance))
		.replace('{spendingCategories}', spendingCategories)
		.replace('{budgetStatus}', budgetStatus)
		.replace('{goalsProgress}', goalsProgress)
		.replace('{activeAlerts}', activeAlerts)
		.replace('{recentTransactions}', recentTransactions);
}

/**
 * Combina system prompt com configuração de análise específica
 */
export function buildAnalysisPrompt(
	baseSystemPrompt: string,
	analysisType: string,
	financialContext: string,
): string {
	const analysisConfig = getAnalysisConfig(analysisType);

	if (!analysisConfig) {
		return `${baseSystemPrompt}\n\n${FINANCIAL_IMPROVEMENT_PROMPT}\n\n${financialContext}`;
	}

	return `${baseSystemPrompt}

## ANÁLISE SOLICITADA: ${analysisConfig.name.toUpperCase()}

${analysisConfig.description}

### Instruções Específicas
${analysisConfig.analysisPrompt}

### Métricas Alvo
${analysisConfig.targetMetrics?.map((m) => `- ${m}`).join('\n') || 'Métricas gerais'}

${financialContext}`;
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default PROMPT_CONFIG;

/**
 * User-Friendly Error Messages for AegisWallet
 *
 * Provides Brazilian Portuguese error messages with context and recovery suggestions
 * for better user experience and compliance with accessibility requirements.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

// ============================================================================
// Error Message Types
// ============================================================================

export interface ErrorMessage {
	/** User-friendly error message in Brazilian Portuguese */
	message: string;
	/** Technical error details for debugging */
	technical?: string;
	/** Suggested recovery actions */
	recovery?: string[];
	/** Error severity level */
	severity: 'low' | 'medium' | 'high' | 'critical';
	/** Error category for better organization */
	category: 'network' | 'validation' | 'authentication' | 'financial' | 'system' | 'user_input';
	/** Whether error should be reported to support */
	shouldReport: boolean;
	/** Accessibility message for screen readers */
	accessibilityMessage?: string;
}

// ============================================================================
// Network Error Messages
// ============================================================================

export const networkErrors: Record<string, ErrorMessage> = {
	NETWORK_OFFLINE: {
		message: 'Você está offline. Verifique sua conexão com a internet e tente novamente.',
		technical: 'Network connection unavailable',
		recovery: [
			'Verifique sua conexão Wi-Fi ou dados móveis',
			'Tente recarregar a página',
			'Verifique se outros sites estão funcionando',
		],
		severity: 'medium',
		category: 'network',
		shouldReport: false,
		accessibilityMessage: 'Erro de conexão: Você está offline. Verifique sua internet.',
	},

	NETWORK_TIMEOUT: {
		message: 'A conexão demorou muito tempo. Tente novamente.',
		technical: 'Request timeout exceeded',
		recovery: [
			'Verifique sua velocidade de conexão',
			'Tente novamente em alguns segundos',
			'Feche outras abas que possam estar usando internet',
		],
		severity: 'medium',
		category: 'network',
		shouldReport: false,
		accessibilityMessage: 'Erro de tempo: A operação demorou demais. Tente novamente.',
	},

	SERVER_ERROR: {
		message:
			'Nosso servidores estão temporariamente indisponíveis. Tente novamente em alguns minutos.',
		technical: 'Internal server error',
		recovery: [
			'Aguarde alguns minutos e tente novamente',
			'Verifique nosso status em status.aegiswallet.com.br',
			'Entre em contato com o suporte se o problema persistir',
		],
		severity: 'high',
		category: 'network',
		shouldReport: true,
		accessibilityMessage: 'Erro do servidor: Serviço temporariamente indisponível.',
	},

	API_LIMIT_EXCEEDED: {
		message: 'Você fez muitas solicitações. Aguarde um momento e tente novamente.',
		technical: 'API rate limit exceeded',
		recovery: [
			'Aguarde alguns segundos antes de tentar novamente',
			'Evite fazer múltiplas solicitações simultâneas',
		],
		severity: 'medium',
		category: 'network',
		shouldReport: false,
		accessibilityMessage: 'Limite excedido: Aguarde um momento antes de continuar.',
	},
};

// ============================================================================
// Authentication Error Messages
// ============================================================================

export const authErrors: Record<string, ErrorMessage> = {
	INVALID_CREDENTIALS: {
		message: 'Email ou senha incorretos. Verifique suas informações e tente novamente.',
		technical: 'Invalid authentication credentials',
		recovery: [
			'Verifique se o email foi digitado corretamente',
			'Confirme se a tecla Caps Lock não está ativada',
			'Tente redefinir sua senha se esqueceu',
		],
		severity: 'medium',
		category: 'authentication',
		shouldReport: false,
		accessibilityMessage: 'Erro de autenticação: Credenciais inválidas.',
	},

	SESSION_EXPIRED: {
		message: 'Sua sessão expirou por segurança. Faça login novamente.',
		technical: 'Authentication session expired',
		recovery: [
			'Faça login novamente com suas credenciais',
			'Sua sessão expirou para proteger sua conta',
		],
		severity: 'medium',
		category: 'authentication',
		shouldReport: false,
		accessibilityMessage: 'Sessão expirada: Faça login novamente para continuar.',
	},

	ACCOUNT_LOCKED: {
		message:
			'Sua conta foi temporariamente bloqueada por segurança. Entre em contato com o suporte.',
		technical: 'Account locked due to security concerns',
		recovery: [
			'Entre em contato com nosso suporte',
			'Espere 30 minutos antes de tentar novamente',
			'Verifique seu email para instruções de desbloqueio',
		],
		severity: 'high',
		category: 'authentication',
		shouldReport: true,
		accessibilityMessage: 'Conta bloqueada: Entre em contato com o suporte para ajuda.',
	},

	PERMISSION_DENIED: {
		message: 'Você não tem permissão para realizar esta operação.',
		technical: 'Insufficient permissions for requested operation',
		recovery: [
			'Verifique se você tem as permissões necessárias',
			'Entre em contato com o administrador da conta',
			'Faça login com uma conta com permissões adequadas',
		],
		severity: 'medium',
		category: 'authentication',
		shouldReport: false,
		accessibilityMessage: 'Permissão negada: Você não pode realizar esta operação.',
	},
};

// ============================================================================
// Financial Error Messages
// ============================================================================

export const financialErrors: Record<string, ErrorMessage> = {
	INSUFFICIENT_BALANCE: {
		message: 'Saldo insuficiente para completar esta transação.',
		technical: 'Insufficient account balance',
		recovery: [
			'Verifique seu saldo disponível',
			'Considere transferir um valor menor',
			'Deposite fundos em sua conta se necessário',
		],
		severity: 'medium',
		category: 'financial',
		shouldReport: false,
		accessibilityMessage: 'Saldo insuficiente: Não há fundos suficientes para esta transação.',
	},

	INVALID_AMOUNT: {
		message: 'Valor inválido. Digite um valor positivo e válido.',
		technical: 'Invalid transaction amount',
		recovery: [
			'Digite um valor maior que zero',
			'Use apenas números e vírgula decimal',
			'Verifique o formato do valor (ex: 100,50)',
		],
		severity: 'low',
		category: 'financial',
		shouldReport: false,
		accessibilityMessage: 'Valor inválido: Digite um valor positivo e válido.',
	},

	PIX_KEY_INVALID: {
		message: 'Chave PIX inválida. Verifique e tente novamente.',
		technical: 'Invalid PIX key format',
		recovery: [
			'Verifique se a chave PIX está correta',
			'Confirme o tipo da chave (CPF, email, telefone)',
			'Copie e cole a chave para evitar erros de digitação',
		],
		severity: 'medium',
		category: 'financial',
		shouldReport: false,
		accessibilityMessage: 'Chave PIX inválida: Verifique a chave digitada.',
	},

	TRANSACTION_LIMIT_EXCEEDED: {
		message: 'Valor acima do limite permitido para esta transação.',
		technical: 'Transaction amount exceeds daily/monthly limit',
		recovery: [
			'Tente um valor menor',
			'Verifique seus limites diários/mensais',
			'Entre em contato com o banco para aumentar limites',
		],
		severity: 'medium',
		category: 'financial',
		shouldReport: false,
		accessibilityMessage: 'Limite excedido: Valor acima do permitido.',
	},

	BANK_ACCOUNT_NOT_FOUND: {
		message: 'Conta bancária não encontrada. Verifique os dados e tente novamente.',
		technical: 'Bank account not found',
		recovery: [
			'Verifique o número do banco e da conta',
			'Confirme os dígitos verificadores',
			'Tente salvar a conta novamente',
		],
		severity: 'medium',
		category: 'financial',
		shouldReport: false,
		accessibilityMessage: 'Conta não encontrada: Verifique os dados bancários.',
	},
};

// ============================================================================
// Validation Error Messages
// ============================================================================

export const validationErrors: Record<string, ErrorMessage> = {
	REQUIRED_FIELD: {
		message: 'Este campo é obrigatório. Por favor, preencha-o.',
		technical: 'Required field validation failed',
		recovery: ['Preencha o campo destacado', 'Verifique todos os campos obrigatórios'],
		severity: 'low',
		category: 'validation',
		shouldReport: false,
		accessibilityMessage: 'Campo obrigatório: Este campo precisa ser preenchido.',
	},

	INVALID_EMAIL: {
		message: 'Email inválido. Digite um endereço de email válido.',
		technical: 'Email format validation failed',
		recovery: [
			'Digite um email no formato nome@exemplo.com',
			'Verifique se não há erros de digitação',
			'Use um email que você tenha acesso',
		],
		severity: 'low',
		category: 'validation',
		shouldReport: false,
		accessibilityMessage: 'Email inválido: Digite um endereço de email válido.',
	},

	INVALID_CPF: {
		message: 'CPF inválido. Verifique os números e tente novamente.',
		technical: 'CPF validation failed',
		recovery: [
			'Digite os 11 números do CPF sem pontos ou traço',
			'Verifique se não há erros de digitação',
			'Confirme os dígitos verificadores',
		],
		severity: 'low',
		category: 'validation',
		shouldReport: false,
		accessibilityMessage: 'CPF inválido: Verifique os números digitados.',
	},

	INVALID_PHONE: {
		message: 'Telefone inválido. Digite um número válido com DDD.',
		technical: 'Phone number validation failed',
		recovery: [
			'Digite o DDD seguido do número (ex: 11 99999-9999)',
			'Inclua apenas números',
			'Verifique o código da sua cidade',
		],
		severity: 'low',
		category: 'validation',
		shouldReport: false,
		accessibilityMessage: 'Telefone inválido: Digite um número com DDD.',
	},

	WEAK_PASSWORD: {
		message: 'Senha muito fraca. Use uma senha mais segura.',
		technical: 'Password strength validation failed',
		recovery: [
			'Use pelo menos 8 caracteres',
			'Inclua letras maiúsculas e minúsculas',
			'Adicione números e caracteres especiais',
			'Evite senhas óbvias como datas ou nomes',
		],
		severity: 'medium',
		category: 'validation',
		shouldReport: false,
		accessibilityMessage: 'Senha fraca: Crie uma senha mais segura.',
	},
};

// ============================================================================
// System Error Messages
// ============================================================================

export const systemErrors: Record<string, ErrorMessage> = {
	UNKNOWN_ERROR: {
		message: 'Ocorreu um erro inesperado. Tente novamente.',
		technical: 'Unknown system error occurred',
		recovery: [
			'Tente recarregar a página',
			'Feche e reabra o aplicativo',
			'Entre em contato com o suporte se o problema persistir',
		],
		severity: 'medium',
		category: 'system',
		shouldReport: true,
		accessibilityMessage: 'Erro inesperado: Ocorreu um erro desconhecido.',
	},

	BROWSER_NOT_SUPPORTED: {
		message: 'Seu navegador não é compatível. Atualize para uma versão mais recente.',
		technical: 'Browser compatibility issue',
		recovery: [
			'Atualize seu navegador para a versão mais recente',
			'Tente usar Chrome, Firefox, Safari ou Edge',
			'Verifique se JavaScript está habilitado',
		],
		severity: 'high',
		category: 'system',
		shouldReport: false,
		accessibilityMessage: 'Navegador incompatível: Atualize seu navegador.',
	},

	STORAGE_FULL: {
		message: 'Espaço de armazenamento local cheio. Limpe o cache do navegador.',
		technical: 'Local storage quota exceeded',
		recovery: [
			'Limpe o cache e cookies do navegador',
			'Remova extensões desnecessárias',
			'Use o navegador em modo privado temporariamente',
		],
		severity: 'medium',
		category: 'system',
		shouldReport: false,
		accessibilityMessage: 'Armazenamento cheio: Limpe o cache do navegador.',
	},
};

// ============================================================================
// User Input Error Messages
// ============================================================================

export const userInputErrors: Record<string, ErrorMessage> = {
	FILE_TOO_LARGE: {
		message: 'Arquivo muito grande. Selecione um arquivo menor.',
		technical: 'File size exceeds maximum limit',
		recovery: [
			'Selecione um arquivo menor que 5MB',
			'Comprima a imagem antes de enviar',
			'Use um formato de arquivo mais eficiente (JPG, PNG)',
		],
		severity: 'low',
		category: 'user_input',
		shouldReport: false,
		accessibilityMessage: 'Arquivo grande: Selecione um arquivo menor.',
	},

	INVALID_FILE_TYPE: {
		message: 'Tipo de arquivo não permitido. Selecione um formato válido.',
		technical: 'Unsupported file type',
		recovery: [
			'Use arquivos PDF, JPG ou PNG',
			'Verifique a lista de formatos aceitos',
			'Converta o arquivo para um formato suportado',
		],
		severity: 'low',
		category: 'user_input',
		shouldReport: false,
		accessibilityMessage: 'Arquivo inválido: Use um formato de arquivo permitido.',
	},

	CHARACTER_LIMIT_EXCEEDED: {
		message: 'Texto muito longo. Reduza o número de caracteres.',
		technical: 'Text exceeds character limit',
		recovery: [
			'Seja mais conciso na sua mensagem',
			'Use abreviações se apropriado',
			'Divida o texto em partes menores',
		],
		severity: 'low',
		category: 'user_input',
		shouldReport: false,
		accessibilityMessage: 'Texto longo: Reduza o número de caracteres.',
	},
};

// ============================================================================
// Error Message Utilities
// ============================================================================

/**
 * Get error message by error code
 */
export function getErrorMessage(errorCode: string): ErrorMessage {
	// Search in all error categories
	const allErrors = {
		...networkErrors,
		...authErrors,
		...financialErrors,
		...validationErrors,
		...systemErrors,
		...userInputErrors,
	};

	return allErrors[errorCode] || systemErrors.UNKNOWN_ERROR;
}

/**
 * Get user-friendly message for any error
 */
export function getUserFriendlyMessage(error: unknown): ErrorMessage {
	// Handle string errors
	if (typeof error === 'string') {
		return getErrorMessage(error);
	}

	// Handle Error objects
	if (error instanceof Error) {
		// Try to extract error code from message
		const message = error.message;
		const errorCode = message.toUpperCase().replace(/\s+/g, '_');

		const errorMessage = getErrorMessage(errorCode);
		if (errorMessage !== systemErrors.UNKNOWN_ERROR) {
			return {
				...errorMessage,
				technical: error.message,
			};
		}
	}

	// Handle API response errors
	if (typeof error === 'object' && error !== null) {
		const errorObj = error as Record<string, unknown>;

		if (typeof errorObj.code === 'string') {
			const errorMessage = getErrorMessage(errorObj.code);
			return {
				...errorMessage,
				technical: JSON.stringify(errorObj),
			};
		}
	}

	// Fallback to unknown error
	return systemErrors.UNKNOWN_ERROR;
}

/**
 * Format error message for display
 */
export function formatErrorForDisplay(error: ErrorMessage): {
	title: string;
	message: string;
	recovery?: string[];
	severity: string;
	accessibilityMessage: string;
} {
	return {
		title: getErrorTitle(error.category),
		message: error.message,
		recovery: error.recovery,
		severity: error.severity,
		accessibilityMessage: error.accessibilityMessage || error.message,
	};
}

/**
 * Get error title by category
 */
function getErrorTitle(category: ErrorMessage['category']): string {
	const titles = {
		network: 'Erro de Conexão',
		authentication: 'Erro de Autenticação',
		financial: 'Erro Financeiro',
		validation: 'Erro de Validação',
		system: 'Erro do Sistema',
		user_input: 'Erro de Entrada',
	};

	return titles[category] || 'Erro';
}

/**
 * Check if error should be reported to support
 */
export function shouldReportError(error: unknown): boolean {
	const errorMessage = getUserFriendlyMessage(error);
	return errorMessage.shouldReport;
}

/**
 * Get recovery suggestions for error
 */
export function getRecoverySuggestions(error: unknown): string[] {
	const errorMessage = getUserFriendlyMessage(error);
	return errorMessage.recovery || [];
}

// ============================================================================
// Export All Error Collections
// ============================================================================

export const allErrorMessages = {
	network: networkErrors,
	auth: authErrors,
	financial: financialErrors,
	validation: validationErrors,
	system: systemErrors,
	userInput: userInputErrors,
};

export type ErrorCategory = keyof typeof allErrorMessages;

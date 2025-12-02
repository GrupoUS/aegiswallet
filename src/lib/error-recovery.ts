/**
 * Error Recovery Mechanisms for AegisWallet
 *
 * Provides comprehensive error recovery strategies including retry logic,
 * fallback mechanisms, and user guidance for Brazilian users.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

import { errorLogger } from './error-logger';
import { getUserFriendlyMessage, shouldReportError } from './error-messages';

// ============================================================================
// Recovery Configuration Types
// ============================================================================

export interface RecoveryConfig {
	/** Maximum number of retry attempts */
	maxRetries: number;
	/** Base delay between retries in milliseconds */
	baseDelay: number;
	/** Maximum delay between retries in milliseconds */
	maxDelay: number;
	/** Exponential backoff multiplier */
	backoffMultiplier: number;
	/** Whether to use jitter in retry delays */
	useJitter: boolean;
	/** Custom retry condition function */
	shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RecoveryResult<T = unknown> {
	/** Whether recovery was successful */
	success: boolean;
	/** Result data if successful */
	data?: T;
	/** Error if recovery failed */
	error?: unknown;
	/** Number of attempts made */
	attempts: number;
	/** Total time spent in milliseconds */
	totalTime: number;
	/** Recovery strategy used */
	strategy: string;
}

export interface FallbackConfig<T = unknown> {
	/** Primary operation to attempt */
	primary: () => T | Promise<T>;
	/** Fallback operations in order of preference */
	fallbacks: Array<() => T | Promise<T>>;
	/** Whether to run all fallbacks in parallel */
	parallel?: boolean;
	/** Timeout for each operation in milliseconds */
	timeout?: number;
}

// ============================================================================
// Default Recovery Configurations
// ============================================================================

export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
	maxRetries: 3,
	baseDelay: 1000,
	maxDelay: 10000,
	backoffMultiplier: 2,
	useJitter: true,
};

export const NETWORK_RECOVERY_CONFIG: RecoveryConfig = {
	...DEFAULT_RECOVERY_CONFIG,
	maxRetries: 5,
	baseDelay: 500,
	maxDelay: 5000,
};

export const FINANCIAL_RECOVERY_CONFIG: RecoveryConfig = {
	...DEFAULT_RECOVERY_CONFIG,
	maxRetries: 2,
	baseDelay: 2000,
	maxDelay: 8000,
	shouldRetry: (error, attempt) => {
		const errorMessage = getUserFriendlyMessage(error);
		// Don't retry financial validation errors
		if (errorMessage.category === 'validation' || errorMessage.category === 'financial') {
			return false;
		}
		// Only retry network-related errors
		return errorMessage.category === 'network' && attempt < 2;
	},
};

export const AUTH_RECOVERY_CONFIG: RecoveryConfig = {
	...DEFAULT_RECOVERY_CONFIG,
	maxRetries: 1,
	baseDelay: 1000,
	shouldRetry: (error, attempt) => {
		const errorMessage = getUserFriendlyMessage(error);
		// Don't retry authentication errors except session expired
		return (
			errorMessage.category === 'authentication' &&
			errorMessage.message.includes('expirou') &&
			attempt === 0
		);
	},
};

// ============================================================================
// Retry Mechanisms
// ============================================================================

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
	attempt: number,
	baseDelay: number,
	maxDelay: number,
	multiplier: number,
	useJitter: boolean,
): number {
	let delay = baseDelay * multiplier ** (attempt - 1);

	// Apply maximum delay limit
	delay = Math.min(delay, maxDelay);

	// Add jitter to prevent thundering herd
	if (useJitter) {
		const jitter = delay * 0.1 * Math.random();
		delay += jitter;
	}

	return Math.floor(delay);
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
	operation: () => Promise<T>,
	config: Partial<RecoveryConfig> = {},
): Promise<RecoveryResult<T>> {
	const finalConfig = { ...DEFAULT_RECOVERY_CONFIG, ...config };
	const startTime = Date.now();
	let lastError: unknown;

	for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
		try {
			const result = await operation();
			const totalTime = Date.now() - startTime;

			// Log successful recovery
			errorLogger.info(
				`Operation succeeded on attempt ${attempt} (${totalTime}ms, strategy: retry_with_backoff)`,
			);

			return {
				success: true,
				data: result,
				attempts: attempt,
				totalTime,
				strategy: 'retry_with_backoff',
			};
		} catch (error) {
			lastError = error;

			// Check if we should retry
			const shouldRetryCondition = finalConfig.shouldRetry
				? finalConfig.shouldRetry(error, attempt)
				: attempt <= finalConfig.maxRetries;

			// Log retry attempt
			errorLogger.warn(
				`Operation failed on attempt ${attempt}/${finalConfig.maxRetries}, shouldRetry: ${shouldRetryCondition}`,
				error instanceof Error ? error : new Error(String(error)),
			);

			if (!shouldRetryCondition) {
				break;
			}

			// Calculate delay for next attempt
			if (attempt <= finalConfig.maxRetries) {
				const delay = calculateDelay(
					attempt,
					finalConfig.baseDelay,
					finalConfig.maxDelay,
					finalConfig.backoffMultiplier,
					finalConfig.useJitter,
				);

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	const totalTime = Date.now() - startTime;
	// Log failed recovery
	errorLogger.error(
		`Operation failed after all ${finalConfig.maxRetries + 1} retries (${totalTime}ms, shouldReport: ${shouldReportError(lastError)})`,
		lastError instanceof Error ? lastError : new Error(String(lastError)),
	);

	return {
		success: false,
		error: lastError,
		attempts: finalConfig.maxRetries + 1,
		totalTime,
		strategy: 'retry_with_backoff',
	};
}

/**
 * Retry synchronous operation with exponential backoff
 */
export function retrySync<T>(
	operation: () => T,
	config: Partial<RecoveryConfig> = {},
): RecoveryResult<T> {
	const finalConfig = { ...DEFAULT_RECOVERY_CONFIG, ...config };
	const startTime = Date.now();
	let lastError: unknown;

	for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
		try {
			const result = operation();
			const totalTime = Date.now() - startTime;

			return {
				success: true,
				data: result,
				attempts: attempt,
				totalTime,
				strategy: 'retry_sync',
			};
		} catch (error) {
			lastError = error;

			const shouldRetryCondition = finalConfig.shouldRetry
				? finalConfig.shouldRetry(error, attempt)
				: attempt <= finalConfig.maxRetries;

			if (!shouldRetryCondition) {
				break;
			}
		}
	}

	const totalTime = Date.now() - startTime;

	return {
		success: false,
		error: lastError,
		attempts: finalConfig.maxRetries + 1,
		totalTime,
		strategy: 'retry_sync',
	};
}

// ============================================================================
// Fallback Mechanisms
// ============================================================================

/**
 * Execute operation with fallbacks
 */
export async function executeWithFallbacks<T>(
	config: FallbackConfig<T>,
): Promise<RecoveryResult<T>> {
	const startTime = Date.now();
	const errors: unknown[] = [];

	try {
		// Try primary operation
		const primaryResult = await executeWithTimeout(config.primary, config.timeout);

		return {
			success: true,
			data: primaryResult,
			attempts: 1,
			totalTime: Date.now() - startTime,
			strategy: 'primary_success',
		};
	} catch (primaryError) {
		errors.push(primaryError);

		if (config.parallel) {
			// Execute all fallbacks in parallel
			const fallbackPromises = config.fallbacks.map(async (fallback, index) => {
				try {
					const result = await executeWithTimeout(fallback, config.timeout);
					return { success: true, data: result, index };
				} catch (error) {
					errors.push(error);
					return { success: false, error, index };
				}
			});

			const fallbackResults = await Promise.allSettled(fallbackPromises);

			// Find first successful fallback
			for (const result of fallbackResults) {
				if (result.status === 'fulfilled' && result.value.success) {
					return {
						success: true,
						data: result.value.data,
						attempts: 2,
						totalTime: Date.now() - startTime,
						strategy: `fallback_parallel_${result.value.index}`,
					};
				}
			}
		} else {
			// Execute fallbacks sequentially
			for (let i = 0; i < config.fallbacks.length; i++) {
				try {
					const fallbackResult = await executeWithTimeout(config.fallbacks[i], config.timeout);

					return {
						success: true,
						data: fallbackResult,
						attempts: i + 2,
						totalTime: Date.now() - startTime,
						strategy: `fallback_sequential_${i}`,
					};
				} catch (fallbackError) {
					errors.push(fallbackError);
				}
			}
		}
	}

	// All operations failed
	const totalTime = Date.now() - startTime;

	return {
		success: false,
		error: errors[errors.length - 1], // Last error
		attempts: config.fallbacks.length + 1,
		totalTime,
		strategy: 'all_fallbacks_failed',
	};
}

/**
 * Execute operation with timeout
 */
async function executeWithTimeout<T>(
	operation: () => T | Promise<T>,
	timeout?: number,
): Promise<T> {
	if (!timeout) {
		return await operation();
	}

	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new Error('Operação expirou')), timeout);
	});
	return await Promise.race([Promise.resolve(operation()), timeoutPromise]);
}

// ============================================================================
// Specialized Recovery Functions
// ============================================================================

/**
 * Recover from network errors
 */
export async function recoverFromNetworkError<T>(
	operation: () => Promise<T>,
): Promise<RecoveryResult<T>> {
	// First, try with network-specific retry config
	const networkResult = await retryWithBackoff(operation, NETWORK_RECOVERY_CONFIG);

	if (networkResult.success) {
		return networkResult;
	}

	// If network retry fails, try fallback strategies
	return executeWithFallbacks({
		primary: operation,
		fallbacks: [
			// Fallback 1: Wait longer and retry once
			async () => {
				await new Promise((resolve) => setTimeout(resolve, 3000));
				return await operation();
			},
			// Fallback 2: Try with cached data if available
			async () => {
				if ('caches' in window) {
					const cache = await caches.open('api-cache');
					const cachedResponse = await cache.match(window.location.href);
					if (cachedResponse) {
						return await cachedResponse.json();
					}
				}
				throw new Error('Nenhum dado em cache disponível');
			},
		],
		timeout: 15000,
	});
}

/**
 * Recover from authentication errors
 */
export async function recoverFromAuthError<T>(
	operation: () => Promise<T>,
	onSessionExpired?: () => Promise<void>,
): Promise<RecoveryResult<T>> {
	const authResult = await retryWithBackoff(operation, AUTH_RECOVERY_CONFIG);

	if (authResult.success) {
		return authResult;
	}

	// Check if error is session expired
	const errorMessage = getUserFriendlyMessage(authResult.error);
	if (errorMessage.message.includes('expirou') && onSessionExpired) {
		try {
			// Try to refresh session
			await onSessionExpired();

			// Retry operation with fresh session
			const retryResult = await retryWithBackoff(operation, {
				...AUTH_RECOVERY_CONFIG,
				maxRetries: 1,
			});

			if (retryResult.success) {
				return {
					...retryResult,
					strategy: 'auth_session_refresh',
				};
			}
		} catch (refreshError) {
			errorLogger.error('Session refresh failed', refreshError as Error);
		}
	}

	return {
		...authResult,
		strategy: 'auth_recovery_failed',
	};
}

/**
 * Recover from financial operation errors
 */
export async function recoverFromFinancialError<T>(
	operation: () => Promise<T>,
	fallbackOperation?: () => Promise<T>,
): Promise<RecoveryResult<T>> {
	const financialResult = await retryWithBackoff(operation, FINANCIAL_RECOVERY_CONFIG);

	if (financialResult.success) {
		return financialResult;
	}

	// For financial errors, try fallback if provided
	if (fallbackOperation) {
		try {
			const fallbackResult = await fallbackOperation();
			return {
				success: true,
				data: fallbackResult,
				attempts: financialResult.attempts + 1,
				totalTime: Date.now() - Date.now() + financialResult.totalTime,
				strategy: 'financial_fallback',
			};
		} catch (fallbackError) {
			errorLogger.error('Financial fallback failed', fallbackError as Error);
		}
	}

	return {
		...financialResult,
		strategy: 'financial_recovery_failed',
	};
}

// ============================================================================
// User Guidance Functions
// ============================================================================

/**
 * Get user guidance for error recovery
 */
export function getRecoveryGuidance(error: unknown): {
	title: string;
	message: string;
	actions: Array<{
		label: string;
		action: () => void;
		primary?: boolean;
	}>;
} {
	const errorMessage = getUserFriendlyMessage(error);

	const baseGuidance = {
		title:
			errorMessage.category === 'network'
				? 'Problema de Conexão'
				: errorMessage.category === 'authentication'
					? 'Problema de Acesso'
					: errorMessage.category === 'financial'
						? 'Erro na Transação'
						: 'Erro Inesperado',
		message: errorMessage.message,
		actions: [] as Array<{
			label: string;
			action: () => void;
			primary?: boolean;
		}>,
	};

	// Add specific actions based on error category
	switch (errorMessage.category) {
		case 'network':
			baseGuidance.actions.push(
				{
					label: 'Tentar Novamente',
					action: () => window.location.reload(),
					primary: true,
				},
				{
					label: 'Verificar Conexão',
					action: () => {
						// Open network settings or help
						window.open('https://ajuda.aegiswallet.com.br/conexao', '_blank');
					},
				},
			);
			break;

		case 'authentication':
			baseGuidance.actions.push(
				{
					label: 'Fazer Login Novamente',
					action: () => {
						window.location.href = '/login';
					},
					primary: true,
				},
				{
					label: 'Recuperar Senha',
					action: () => {
						window.location.href = '/recuperar-senha';
					},
				},
			);
			break;

		case 'financial':
			baseGuidance.actions.push(
				{
					label: 'Verificar Saldo',
					action: () => {
						window.location.href = '/saldo';
					},
					primary: true,
				},
				{
					label: 'Tentar Outro Valor',
					action: () => {
						window.location.href = '/transferir';
					},
				},
				{
					label: 'Ajuda com PIX',
					action: () => {
						window.open('https://ajuda.aegiswallet.com.br/pix', '_blank');
					},
				},
			);
			break;

		default:
			baseGuidance.actions.push(
				{
					label: 'Tentar Novamente',
					action: () => window.location.reload(),
					primary: true,
				},
				{
					label: 'Contatar Suporte',
					action: () => {
						window.open('https://suporte.aegiswallet.com.br', '_blank');
					},
				},
			);
	}

	return baseGuidance;
}

// ============================================================================
// Recovery Utilities
// ============================================================================

/**
 * Create recovery-aware wrapper for API calls
 */
export function createRecoveryAwareApi<T extends (...args: unknown[]) => Promise<unknown>>(
	apiFunction: T,
	config: Partial<RecoveryConfig> = {},
): T {
	return (async (...args: Parameters<T>) => {
		const result = await retryWithBackoff(() => apiFunction(...args), config);

		if (result.success) {
			return result.data;
		}
		throw result.error;
	}) as T;
}

/**
 * Check if recovery is possible for error
 */
export function canRecoverFrom(error: unknown): boolean {
	const errorMessage = getUserFriendlyMessage(error);

	// Some errors are not recoverable
	const nonRecoverableErrors = [
		'INSUFFICIENT_BALANCE',
		'INVALID_AMOUNT',
		'PIX_KEY_INVALID',
		'ACCOUNT_LOCKED',
		'BROWSER_NOT_SUPPORTED',
	];

	return (
		!nonRecoverableErrors.includes(errorMessage.message) || errorMessage.category === 'network'
	);
}

/**
 * Get recommended recovery strategy
 */
export function getRecoveryStrategy(error: unknown): string {
	const errorMessage = getUserFriendlyMessage(error);

	switch (errorMessage.category) {
		case 'network':
			return 'retry_with_backoff';
		case 'authentication':
			return errorMessage.message.includes('expirou') ? 'session_refresh' : 'reauthenticate';
		case 'financial':
			return 'user_intervention';
		case 'validation':
			return 'user_correction';
		default:
			return 'generic_retry';
	}
}

export default {
	retryWithBackoff,
	retrySync,
	executeWithFallbacks,
	recoverFromNetworkError,
	recoverFromAuthError,
	recoverFromFinancialError,
	getRecoveryGuidance,
	createRecoveryAwareApi,
	canRecoverFrom,
	getRecoveryStrategy,
	DEFAULT_RECOVERY_CONFIG,
	NETWORK_RECOVERY_CONFIG,
	FINANCIAL_RECOVERY_CONFIG,
	AUTH_RECOVERY_CONFIG,
};

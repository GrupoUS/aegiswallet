/**
 * Error Display Component for AegisWallet
 *
 * Provides accessible, user-friendly error display with Brazilian Portuguese messages
 * and recovery suggestions for better user experience.
 *
 * @version 1.0.0
 * @since 2025-12-02
 */

import { AlertTriangle, ExternalLink, Headphones, RefreshCw, X } from 'lucide-react';
import { useId } from 'react';

import { Button } from './button';
import { getUserFriendlyMessage, shouldReportError } from '@/lib/error-messages';

interface ErrorDisplayProps {
	/** Error to display */
	error: unknown;
	/** Optional custom error message */
	customMessage?: string;
	/** Whether to show recovery suggestions */
	showRecovery?: boolean;
	/** Whether to show report button */
	showReport?: boolean;
	/** Callback for retry action */
	onRetry?: () => void;
	/** Callback for dismiss action */
	onDismiss?: () => void;
	/** Callback for report action */
	onReport?: () => void;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Error Display Component
 *
 * Provides comprehensive error information with accessibility features
 * and Brazilian Portuguese localization.
 */
export function ErrorDisplay({
	error,
	customMessage,
	showRecovery = true,
	showReport = true,
	onRetry,
	onDismiss,
	onReport,
	className = '',
}: ErrorDisplayProps) {
	// Get user-friendly error message
	const errorMessage = getUserFriendlyMessage(error);
	const displayError = customMessage ? { ...errorMessage, message: customMessage } : errorMessage;

	const formatted = {
		title: getErrorTitle(displayError.category),
		message: displayError.message,
		recovery: displayError.recovery,
		severity: displayError.severity,
		accessibilityMessage: displayError.accessibilityMessage || displayError.message,
	};

	/**
	 * Get error title by category
	 */
	function getErrorTitle(category: string): string {
		const titles: Record<string, string> = {
			network: 'Erro de Conexão',
			authentication: 'Erro de Autenticação',
			financial: 'Erro Financeiro',
			validation: 'Erro de Validação',
			system: 'Erro do Sistema',
			user_input: 'Erro de Entrada',
		};

		return titles[category] || 'Erro';
	}
	const shouldReport = showReport && shouldReportError(error);

	// Determine severity styling
	const severityStyles = {
		low: 'border-yellow-200 bg-yellow-50 text-yellow-800',
		medium: 'border-orange-200 bg-orange-50 text-orange-800',
		high: 'border-red-200 bg-red-50 text-red-800',
		critical: 'border-red-300 bg-red-100 text-red-900',
	};

	const severityIcons = {
		low: AlertTriangle,
		medium: AlertTriangle,
		high: AlertTriangle,
		critical: AlertTriangle,
	};

	const Icon = severityIcons[displayError.severity];
	const uniqueId = useId();
	const errorTitleId = `${uniqueId}-error-title`;
	const errorMessageId = `${uniqueId}-error-message`;
	const errorRecoveryId = `${uniqueId}-error-recovery`;
	const errorRecoveryTitleId = `${uniqueId}-error-recovery-title`;

	return (
		<div
			className={`
				border rounded-lg p-4 mb-4
				${severityStyles[displayError.severity]}
				${className}
			`}
			role="alert"
			aria-live="polite"
			aria-labelledby={errorTitleId}
			aria-describedby={`${errorMessageId} ${errorRecoveryId}`}
		>
			{/* Header with title and dismiss */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2">
					<Icon className="w-5 h-5" aria-hidden="true" />
					<h3 id={errorTitleId} className="font-semibold text-lg">
						{formatted.title}
					</h3>
				</div>

				{onDismiss && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onDismiss}
						className="h-6 w-6 p-0"
						aria-label="Fechar mensagem de erro"
					>
						<X className="w-4 h-4" />
					</Button>
				)}
			</div>

			{/* Error message */}
			<p id={errorMessageId} className="mb-3 text-sm leading-relaxed">
				{formatted.message}
			</p>

			{/* Recovery suggestions */}
			{showRecovery && formatted.recovery && formatted.recovery.length > 0 && (
				<div className="mb-4">
					<h4 className="font-medium mb-2 text-sm" id={errorRecoveryTitleId}>
						O que você pode fazer:
					</h4>
					<ul id={errorRecoveryId} className="list-disc list-inside space-y-1 text-sm">
						{formatted.recovery.map((suggestion: string, index: number) => (
							<li key={index} className="leading-relaxed">
								{suggestion}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Action buttons */}
			<div className="flex flex-wrap gap-2">
				{onRetry && (
					<Button variant="outline" size="sm" onClick={onRetry} className="flex items-center gap-2">
						<RefreshCw className="w-4 h-4" />
						Tentar Novamente
					</Button>
				)}

				{shouldReport && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => onReport?.()}
						className="flex items-center gap-2"
					>
						<Headphones className="w-4 h-4" />
						Reportar Problema
					</Button>
				)}

				<Button
					variant="ghost"
					size="sm"
					onClick={() => window.open('https://ajuda.aegiswallet.com.br', '_blank')}
					className="flex items-center gap-2"
				>
					<ExternalLink className="w-4 h-4" />
					Central de Ajuda
				</Button>
			</div>

			{/* Screen reader only technical details */}
			<div className="sr-only" aria-live="polite">
				<p>Detalhes técnicos: {displayError.technical || 'Não disponível'}</p>
				<p>Categoria do erro: {displayError.category}</p>
				<p>Nível de severidade: {displayError.severity}</p>
			</div>
		</div>
	);
}

/**
 * Inline Error Display Component
 *
 * Compact version for inline error display
 */
interface ErrorDisplayInlineProps {
	error: unknown;
	customMessage?: string;
	className?: string;
}

export function ErrorDisplayInline({
	error,
	customMessage,
	className = '',
}: ErrorDisplayInlineProps) {
	const errorMessage = getUserFriendlyMessage(error);
	const displayError = customMessage ? { ...errorMessage, message: customMessage } : errorMessage;

	const severityStyles = {
		low: 'text-yellow-700 bg-yellow-100',
		medium: 'text-orange-700 bg-orange-100',
		high: 'text-red-700 bg-red-100',
		critical: 'text-red-800 bg-red-200',
	};

	return (
		<div
			className={`
				inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm
				${severityStyles[displayError.severity]}
				${className}
			`}
			role="alert"
			aria-live="polite"
		>
			<AlertTriangle className="w-4 h-4" aria-hidden="true" />
			<span>{displayError.message}</span>
		</div>
	);
}

/**
 * Toast Error Display Component
 *
 * For toast notification error display
 */
interface ErrorDisplayToastProps {
	error: unknown;
	customMessage?: string;
	onDismiss?: () => void;
}

export function ErrorDisplayToast({ error, customMessage, onDismiss }: ErrorDisplayToastProps) {
	const errorMessage = getUserFriendlyMessage(error);
	const displayError = customMessage ? { ...errorMessage, message: customMessage } : errorMessage;

	return (
		<div
			className="bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-sm"
			role="alert"
			aria-live="assertive"
		>
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0">
					<AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
				</div>

				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-gray-900 mb-1">{displayError.message}</p>

					{displayError.severity === 'high' || displayError.severity === 'critical' ? (
						<p className="text-xs text-gray-600">
							Se o problema persistir, entre em contato com o suporte.
						</p>
					) : null}
				</div>

				{onDismiss && (
					<button
						type="button"
						onClick={onDismiss}
						className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100"
						aria-label="Fechar notificação de erro"
					>
						<X className="w-4 h-4 text-gray-500" />
					</button>
				)}
			</div>
		</div>
	);
}

export default ErrorDisplay;

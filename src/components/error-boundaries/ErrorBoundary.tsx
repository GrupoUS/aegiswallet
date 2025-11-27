/**
 * Error Boundary Component
 * Catches JavaScript errors in child component trees and displays fallback UI
 */

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import type { ComponentType, ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
	errorId: string;
	retryCount: number;
}

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ComponentType<{
		error: Error;
		errorId: string;
		retry: () => void;
	}>;
	onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
	maxRetries?: number;
	showErrorDetails?: boolean;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	private retryTimeouts: NodeJS.Timeout[] = [];

	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			error: null,
			errorId: '',
			errorInfo: null,
			hasError: false,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			error,
			errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			hasError: true,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ errorInfo });

		// Log error to console in development
		if (process.env.NODE_ENV === 'development') {
		}

		// Call custom error handler if provided
		this.props.onError?.(error, errorInfo, this.state.errorId);

		// Log error to service (in production)
		this.logErrorToService(error, errorInfo);
	}

	componentWillUnmount() {
		// Clear any pending retry timeouts
		this.retryTimeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});
	}

	private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
		try {
			// In production, this would send to an error reporting service
			const errorData = {
				componentStack: errorInfo.componentStack,
				errorId: this.state.errorId,
				message: error.message,
				stack: error.stack,
				timestamp: new Date().toISOString(),
				url: window.location.href,
				userAgent: navigator.userAgent,
			};

			// Example: Send to error reporting service
			// errorReportingService.captureException(error, { extra: errorData });

			// For now, store in localStorage for debugging
			const existingErrors = JSON.parse(
				localStorage.getItem('error-logs') || '[]',
			);
			existingErrors.push(errorData);

			// Keep only last 50 errors
			const recentErrors = existingErrors.slice(-50);
			localStorage.setItem('error-logs', JSON.stringify(recentErrors));
		} catch (_loggingError) {}
	};

	private handleRetry = () => {
		const { maxRetries = 3 } = this.props;
		const { retryCount } = this.state;

		if (retryCount < maxRetries) {
			this.setState((prevState) => ({
				error: null,
				errorInfo: null,
				hasError: false,
				retryCount: prevState.retryCount + 1,
			}));
		}
	};

	private handleGoHome = () => {
		window.location.href = '/';
	};

	render() {
		const { hasError, error, errorId, retryCount } = this.state;
		const {
			children,
			fallback,
			maxRetries = 3,
			showErrorDetails = false,
		} = this.props;

		if (hasError && error) {
			// Use custom fallback if provided
			if (fallback) {
				const FallbackComponent = fallback;
				return (
					<FallbackComponent
						error={error}
						errorId={errorId}
						retry={this.handleRetry}
					/>
				);
			}

			// Default error UI
			const canRetry = retryCount < maxRetries;

			return (
				<div className="flex min-h-screen items-center justify-center bg-background p-4">
					<Card className="w-full max-w-2xl">
						<CardHeader className="text-center">
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
								<AlertTriangle className="h-6 w-6 text-destructive" />
							</div>
							<CardTitle className="text-destructive">
								Ops! Algo deu errado
							</CardTitle>
							<CardDescription>
								Encontramos um erro inesperado. Nossa equipe foi notificada e
								estamos trabalhando para resolver.
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							<Alert>
								<AlertTriangle className="h-4 w-4" />
								<AlertTitle>ID do Erro</AlertTitle>
								<AlertDescription className="font-mono text-sm">
									{errorId}
								</AlertDescription>
							</Alert>

							{canRetry ? (
								<div className="flex flex-col gap-3 sm:flex-row">
									<Button
										onClick={this.handleRetry}
										className="flex-1"
										variant="default"
									>
										<RefreshCw className="mr-2 h-4 w-4" />
										Tentar Novamente ({retryCount + 1}/{maxRetries})
									</Button>
									<Button
										onClick={this.handleGoHome}
										className="flex-1"
										variant="outline"
									>
										<Home className="mr-2 h-4 w-4" />
										Página Inicial
									</Button>
								</div>
							) : (
								<div className="space-y-3">
									<Alert>
										<AlertTriangle className="h-4 w-4" />
										<AlertTitle>Máximo de Tentativas Atingido</AlertTitle>
										<AlertDescription>
											Você atingiu o número máximo de tentativas. Por favor,
											recarregue a página ou contate o suporte.
										</AlertDescription>
									</Alert>
									<div className="flex flex-col gap-3 sm:flex-row">
										<Button
											onClick={() => window.location.reload()}
											className="flex-1"
											variant="default"
										>
											<RefreshCw className="mr-2 h-4 w-4" />
											Recarregar Página
										</Button>
										<Button
											onClick={this.handleGoHome}
											className="flex-1"
											variant="outline"
										>
											<Home className="mr-2 h-4 w-4" />
											Página Inicial
										</Button>
									</div>
								</div>
							)}

							{showErrorDetails && process.env.NODE_ENV === 'development' && (
								<details className="mt-4">
									<summary className="cursor-pointer font-medium text-muted-foreground text-sm">
										Detalhes Técnicos (Apenas Desenvolvimento)
									</summary>
									<div className="mt-2 rounded-md bg-muted p-3">
										<pre className="overflow-auto whitespace-pre-wrap text-xs">
											{error.stack}
										</pre>
									</div>
								</details>
							)}

							<div className="text-center text-muted-foreground text-sm">
								<p>
									Se o problema persistir, entre em contato com nosso suporte.
								</p>
								<p className="mt-1">
									Mencione o ID do erro:{' '}
									<span className="font-mono">{errorId}</span>
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		}

		return children;
	}
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
	Component: ComponentType<P>,
	errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary {...errorBoundaryProps}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

	return WrappedComponent;
}

/**
 * Hook for handling async errors in functional components
 */
export function useErrorHandler() {
	return (_error: Error, _errorInfo?: string) => {
		// In production, send to error reporting service
		if (process.env.NODE_ENV === 'production') {
			// errorReportingService.captureException(error, { extra: { errorInfo } });
		}

		// You could also show a toast notification here
		// toast.error('Ocorreu um erro inesperado');
	};
}

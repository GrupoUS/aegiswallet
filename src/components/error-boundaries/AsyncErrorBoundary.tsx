/**
 * AsyncErrorBoundary Component
 * Handles async errors in React components (Promise rejections, async operations)
 */

import type { ComponentType, ReactNode } from 'react';
import { Component } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<{
    error: Error;
    errorId: string;
    retry: () => void;
  }>;
  onError?: (error: Error) => void;
}

export class AsyncErrorBoundary extends Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private generateErrorId = (): string => {
    return crypto.randomUUID();
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();

    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    this.setState({
      hasError: true,
      error,
    });

    this.props.onError?.(error);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (fallback) {
        const FallbackComponent = fallback;
        return (
          <FallbackComponent
            error={error}
            errorId={this.generateErrorId()}
            retry={this.handleRetry}
          />
        );
      }

      // Default async error UI
      return (
        <ErrorBoundary
          fallback={({ error: _error, retry }) => (
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h2 className="mb-4 font-bold text-2xl text-destructive">
                  Erro de Operação Assíncrona
                </h2>
                <p className="mb-4 text-muted-foreground">
                  Ocorreu um erro durante uma operação em segundo plano.
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}
        >
          <div />
        </ErrorBoundary>
      );
    }

    return <ErrorBoundary {...this.props}>{children}</ErrorBoundary>;
  }
}

/**
 * HOC to wrap components with error boundary
 */
import type { ComponentType } from 'react';

import type { ErrorBoundaryProps } from '../ErrorBoundary';
import { ErrorBoundary } from '../ErrorBoundary';

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

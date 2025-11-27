import { Navigate, useLocation } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';

export function RouteGuard({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<Navigate
				to="/login"
				search={{ redirect: location.href, error: undefined }}
			/>
		);
	}

	return <>{children}</>;
}

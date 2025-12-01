import { createFileRoute, redirect } from '@tanstack/react-router';

import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	const { isAuthenticated, isLoading } = useAuth();

	// Show loading while checking auth
	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	// Use redirect component for navigation instead of useEffect
	if (!isAuthenticated) {
		throw redirect({ to: '/login', search: { redirect: '/' } });
	}

	throw redirect({ to: '/dashboard' });
}

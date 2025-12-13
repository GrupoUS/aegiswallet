import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	return (
		<>
			<SignedOut>
				<Navigate to="/login" search={{ redirect: '/' }} />
			</SignedOut>
			<SignedIn>
				<Navigate to="/dashboard" search={{} as { period: '30d'; view: 'overview' }} />
			</SignedIn>
		</>
	);
}

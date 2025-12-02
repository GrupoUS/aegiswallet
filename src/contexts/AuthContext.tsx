import { useAuth as useClerkAuth, useSession, useUser } from '@clerk/clerk-react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import { setAuthTokenGetter } from '@/lib/api-client';

type ClerkUser = ReturnType<typeof useUser>['user'];

export interface AuthContextType {
	user: ClerkUser;
	isLoading: boolean;
	isAuthenticated: boolean;
	signOut: () => Promise<void>;
	getToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { user, isLoaded, isSignedIn } = useUser();
	const { signOut: clerkSignOut } = useClerkAuth();
	const { session } = useSession();

	const getToken = useCallback((): Promise<string | null> => {
		if (!session) return Promise.resolve(null);
		return session.getToken();
	}, [session]);

	// Register the token getter with the API client
	useEffect(() => {
		setAuthTokenGetter(getToken);
	}, [getToken]);

	const signOut = useCallback(async () => {
		await clerkSignOut();
	}, [clerkSignOut]);

	const value = useMemo(
		() => ({
			getToken,
			isAuthenticated: !!isSignedIn,
			isLoading: !isLoaded,
			signOut,
			user,
		}),
		[getToken, isSignedIn, isLoaded, signOut, user],
	);

	if (!isLoaded) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
			</div>
		);
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook for accessing auth context
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

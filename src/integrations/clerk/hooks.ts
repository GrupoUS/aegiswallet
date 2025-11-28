/**
 * Custom Clerk Hooks
 *
 * Extended hooks for AegisWallet authentication needs
 * NOTE: Clerk integration is currently disabled - using Supabase auth instead
 */

import { useCallback, useMemo } from 'react';

/**
 * Extended user data including AegisWallet-specific fields
 */
export interface AegisWalletUser {
	id: string;
	email: string | null;
	fullName: string | null;
	firstName: string | null;
	lastName: string | null;
	imageUrl: string | null;
	// AegisWallet-specific (from public metadata)
	cpf?: string;
	autonomyLevel?: number;
	voiceCommandEnabled?: boolean;
	language?: string;
	timezone?: string;
}

/**
 * Hook to get the current authenticated user with AegisWallet-specific data
 * NOTE: Currently disabled - using Supabase auth instead
 */
export function useAegisUser() {
	// Stub implementation - Clerk not currently used
	const aegisUser = useMemo<AegisWalletUser | null>(() => null, []);

	return {
		user: aegisUser,
		isLoaded: true,
		isSignedIn: false,
		clerkUser: null,
	};
}

/**
 * Hook to get authentication state and token
 * NOTE: Currently disabled - using Supabase auth instead
 */
export function useAegisAuth() {
	/**
	 * Get a session token for API requests
	 */
	const getApiToken = useCallback(async () => {
		return null;
	}, []);

	/**
	 * Sign out with optional redirect
	 */
	const handleSignOut = useCallback(async (_redirectUrl?: string) => {
		// Stub implementation
	}, []);

	return {
		isLoaded: true,
		isSignedIn: false,
		userId: null,
		sessionId: null,
		getToken: getApiToken,
		signOut: handleSignOut,
	};
}

/**
 * Hook to manage user session
 * NOTE: Currently disabled - using Supabase auth instead
 */
export function useAegisSession() {
	/**
	 * Get session expiration info
	 */
	const sessionInfo = useMemo(() => null, []);

	return {
		session: sessionInfo,
		isLoaded: true,
		isSignedIn: false,
		openUserProfile: () => {},
		openSignIn: () => {},
		openSignUp: () => {},
	};
}

/**
 * Hook to update user metadata
 * NOTE: Currently disabled - using Supabase auth instead
 */
export function useUpdateUserMetadata() {
	/**
	 * Update unsafe metadata (can store user preferences)
	 * Note: publicMetadata can only be updated server-side via Clerk Backend SDK
	 */
	const updateUnsafeMetadata = useCallback(
		async (
			_metadata: Partial<{
				cpf: string;
				autonomyLevel: number;
				voiceCommandEnabled: boolean;
				language: string;
				timezone: string;
			}>,
		) => {
			// Stub implementation
			throw new Error('Clerk integration is currently disabled');
		},
		[],
	);

	return {
		updateUnsafeMetadata,
	};
}

// Re-export Clerk hooks and components
export {
	Protect,
	RedirectToSignIn,
	RedirectToSignUp,
	SignedIn,
	SignedOut,
	SignIn,
	SignInButton,
	SignOutButton,
	SignUp,
	SignUpButton,
	UserButton,
	UserProfile,
	useAuth,
	useClerk,
	useSession,
	useSignIn,
	useSignUp,
	useUser,
} from '@clerk/clerk-react';

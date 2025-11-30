/**
 * Custom Clerk Hooks
 *
 * Extended hooks for AegisWallet authentication needs
 */

import {
	useClerk,
	useAuth as useClerkAuth,
	useSession as useClerkSession,
	useUser as useClerkUser,
} from '@clerk/clerk-react';
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
 */
export function useAegisUser() {
	const { user, isLoaded, isSignedIn } = useClerkUser();

	const aegisUser = useMemo<AegisWalletUser | null>(() => {
		if (!user) return null;

		const publicMetadata = user.publicMetadata as Record<string, unknown>;

		return {
			id: user.id,
			email: user.primaryEmailAddress?.emailAddress ?? null,
			fullName: user.fullName,
			firstName: user.firstName,
			lastName: user.lastName,
			imageUrl: user.imageUrl,
			cpf: publicMetadata?.cpf as string | undefined,
			autonomyLevel: publicMetadata?.autonomyLevel as number | undefined,
			voiceCommandEnabled: publicMetadata?.voiceCommandEnabled as
				| boolean
				| undefined,
			language: publicMetadata?.language as string | undefined,
			timezone: publicMetadata?.timezone as string | undefined,
		};
	}, [user]);

	return {
		user: aegisUser,
		isLoaded,
		isSignedIn: isSignedIn ?? false,
		clerkUser: user,
	};
}

/**
 * Hook to get authentication state and token
 */
export function useAegisAuth() {
	const { isLoaded, isSignedIn, userId, sessionId, getToken, signOut } =
		useClerkAuth();

	/**
	 * Get a session token for API requests
	 */
	const getApiToken = useCallback(async () => {
		return getToken();
	}, [getToken]);

	/**
	 * Sign out with optional redirect
	 */
	const handleSignOut = useCallback(
		async (redirectUrl?: string) => {
			await signOut({ redirectUrl });
		},
		[signOut],
	);

	return {
		isLoaded,
		isSignedIn: isSignedIn ?? false,
		userId: userId ?? null,
		sessionId: sessionId ?? null,
		getToken: getApiToken,
		signOut: handleSignOut,
	};
}

/**
 * Hook to manage user session
 */
export function useAegisSession() {
	const { session, isLoaded, isSignedIn } = useClerkSession();
	const clerk = useClerk();

	/**
	 * Get session expiration info
	 */
	const sessionInfo = useMemo(() => {
		if (!session) return null;

		return {
			id: session.id,
			status: session.status,
			lastActiveAt: session.lastActiveAt,
			expireAt: session.expireAt,
			abandonAt: session.abandonAt,
		};
	}, [session]);

	return {
		session: sessionInfo,
		isLoaded,
		isSignedIn: isSignedIn ?? false,
		openUserProfile: () => clerk.openUserProfile(),
		openSignIn: () => clerk.openSignIn(),
		openSignUp: () => clerk.openSignUp(),
	};
}

/**
 * Hook to update user metadata
 */
export function useUpdateUserMetadata() {
	const { user } = useClerkUser();

	/**
	 * Update unsafe metadata (can store user preferences)
	 * Note: publicMetadata can only be updated server-side via Clerk Backend SDK
	 */
	const updateUnsafeMetadata = useCallback(
		async (
			metadata: Partial<{
				cpf: string;
				autonomyLevel: number;
				voiceCommandEnabled: boolean;
				language: string;
				timezone: string;
			}>,
		) => {
			if (!user) {
				throw new Error('User not authenticated');
			}

			await user.update({
				unsafeMetadata: {
					...user.unsafeMetadata,
					...metadata,
				},
			});
		},
		[user],
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

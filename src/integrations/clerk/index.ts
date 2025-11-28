/**
 * Clerk Integration - Main Export
 *
 * Central export for all Clerk authentication functionality
 */

// Client configuration
export {
	clerkAppearance,
	clerkLocalization,
	clerkPublishableKey,
	clerkUrls,
} from './client';
// Custom hooks
// Re-exported Clerk hooks
// Re-exported Clerk components
export {
	type AegisWalletUser,
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
	useAegisAuth,
	useAegisSession,
	useAegisUser,
	useAuth,
	useClerk,
	useSession,
	useSignIn,
	useSignUp,
	useUpdateUserMetadata,
	useUser,
} from './hooks';
// Provider
export { ClerkProvider } from './provider';

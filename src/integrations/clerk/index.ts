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
// Stub components
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
} from './components';
// Custom hooks
export {
	type AegisWalletUser,
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

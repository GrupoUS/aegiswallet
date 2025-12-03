/**
 * Clerk Client Configuration
 *
 * Centralized Clerk configuration and utilities
 */

// Clerk publishable key from environment
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Validate publishable key format if present
if (clerkPublishableKey) {
	if (!clerkPublishableKey.startsWith('pk_test_') && !clerkPublishableKey.startsWith('pk_live_')) {
		// biome-ignore lint/suspicious/noConsole: Critical error for invalid format
		console.error(
			'[Clerk] Invalid VITE_CLERK_PUBLISHABLE_KEY format! Must start with pk_test_ or pk_live_',
		);
	}
}

// Note: Clerk is currently stubbed, so we warn instead of throwing
if (!clerkPublishableKey) {
	if (import.meta.env.PROD) {
		// biome-ignore lint/suspicious/noConsole: Critical error for production
		console.error(
			'[Clerk] Critical Error: VITE_CLERK_PUBLISHABLE_KEY is missing in production! Please check your Vercel environment variables and ensure VITE_CLERK_PUBLISHABLE_KEY is set correctly.',
		);
	} else {
		// biome-ignore lint/suspicious/noConsole: Intentional warning for dev environment
		console.warn(
			'[Clerk] Missing VITE_CLERK_PUBLISHABLE_KEY - authentication features will be disabled',
		);
	}
}

/**
 * Clerk appearance configuration
 * Customized for AegisWallet Brazilian market
 */
export const clerkAppearance = {
	baseTheme: undefined, // Uses default light theme
	variables: {
		colorPrimary: '#3B82F6', // Blue-500 - matches AegisWallet brand
		colorText: '#1F2937', // Gray-800
		colorTextSecondary: '#6B7280', // Gray-500
		colorBackground: '#FFFFFF',
		colorInputBackground: '#F9FAFB', // Gray-50
		colorInputText: '#1F2937',
		borderRadius: '0.5rem',
		fontFamily: 'Inter, system-ui, sans-serif',
	},
	elements: {
		// Form elements
		formButtonPrimary: {
			backgroundColor: '#3B82F6',
			'&:hover': {
				backgroundColor: '#2563EB',
			},
		},
		card: {
			borderRadius: '1rem',
			boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
		},
		// Modal styles
		modalContent: {
			borderRadius: '1rem',
		},
		// Social button styles
		socialButtonsBlockButton: {
			borderRadius: '0.5rem',
		},
	},
	layout: {
		socialButtonsPlacement: 'top' as const,
		socialButtonsVariant: 'iconButton' as const,
		termsPageUrl: '/termos-de-uso',
		privacyPageUrl: '/politica-de-privacidade',
	},
};

/**
 * Clerk localization for Brazilian Portuguese
 */
export const clerkLocalization = {
	locale: 'pt-BR',
	// Custom translations can be added here
	// See: https://clerk.com/docs/components/customization/localization
};

/**
 * URLs for Clerk redirects
 */
export const clerkUrls = {
	signIn: '/login',
	signUp: '/signup',
	afterSignIn: '/dashboard',
	afterSignUp: '/dashboard',
	afterSignOut: '/',
};

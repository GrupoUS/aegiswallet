/**
 * Clerk Client Configuration
 *
 * Centralized Clerk configuration and utilities
 */

// Clerk publishable key from environment
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Note: Clerk is currently stubbed, so we warn instead of throwing
if (!clerkPublishableKey && import.meta.env.DEV) {
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
	afterSignUp: '/onboarding',
	afterSignOut: '/',
};

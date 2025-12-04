import { QueryClient } from '@tanstack/react-query';

/**
 * Check if an error is retryable based on HTTP status code
 * 4xx errors (client errors) should not be retried
 * 5xx errors (server errors) may be retried
 */
function isRetryableError(failureCount: number, error: unknown): boolean {
	// Don't retry if we've already tried too many times
	if (failureCount >= 2) {
		return false;
	}

	// Check if error has a status property (from API client)
	if (error && typeof error === 'object' && 'status' in error) {
		const status = (error as { status?: number }).status;

		// Don't retry on 4xx errors (client errors)
		if (status && status >= 400 && status < 500) {
			return false;
		}

		// Retry on 5xx errors (server errors) and network errors
		if (status && status >= 500) {
			return true;
		}
	}

	// Check error message for network-related errors
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// Don't retry on authentication/authorization errors
		if (
			message.includes('401') ||
			message.includes('403') ||
			message.includes('unauthorized') ||
			message.includes('forbidden') ||
			message.includes('authentication') ||
			message.includes('permission denied')
		) {
			return false;
		}

		// Retry on network errors
		if (
			message.includes('network') ||
			message.includes('timeout') ||
			message.includes('econnrefused') ||
			message.includes('fetch failed')
		) {
			return true;
		}
	}

	// Default: retry on unknown errors (but limit to 2 attempts)
	return failureCount < 2;
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: isRetryableError,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff, max 10s
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes
		},
		mutations: {
			retry: (failureCount, error) => {
				// Mutations should rarely be retried
				// Only retry on network errors, not on 4xx/5xx
				if (failureCount >= 1) {
					return false;
				}

				if (error && typeof error === 'object' && 'status' in error) {
					const status = (error as { status?: number }).status;
					// Don't retry on any HTTP errors for mutations
					if (status && status >= 400) {
						return false;
					}
				}

				// Only retry on network errors
				if (error instanceof Error) {
					const message = error.message.toLowerCase();
					return (
						message.includes('network') ||
						message.includes('timeout') ||
						message.includes('econnrefused') ||
						message.includes('fetch failed')
					);
				}

				return false;
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Shorter delay for mutations
		},
	},
});

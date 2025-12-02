/**
 * API Client for Hono RPC endpoints
 * Provides type-safe fetch wrapper with authentication and error handling
 *
 * Uses Clerk authentication with NeonDB backend
 * LGPD compliant with Brazilian financial regulations
 */

import type {
	ApiErrorResponse,
	ApiRequestContext,
	ApiResponse,
	ApiResult,
	BankAccountData,
	ContactData,
	EnhancedApiError,
	FinancialEventData,
	TransactionData,
} from '@/types/api.types';
import {
	isApiErrorResponse,
	isApiSuccessResponse,
	type isBankAccountData,
	type isContactData,
	type isFinancialEventData,
	type isTransactionData,
} from '@/types/api.types';

/**
 * Legacy interface for backward compatibility
 * @deprecated Use ApiResponse from @/types/api.types
 */
interface LegacyApiResponse<T = unknown> {
	data?: T;
	error?: string;
	code?: string;
	details?: Record<string, unknown>;
}

/**
 * Legacy error interface for backward compatibility
 * @deprecated Use EnhancedApiError from @/types/api.types
 */
interface LegacyApiError extends Error {
	status?: number;
	code?: string;
	details?: Record<string, unknown>;
}

// Global auth token getter - set by AuthContext
let getAuthToken: (() => Promise<string | null>) | null = null;

/**
 * Set the auth token getter function
 * Called by AuthContext when initializing
 */
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
	getAuthToken = getter;
}

class ApiClient {
	private baseUrl: string;

	constructor() {
		// Dynamic URL detection for different environments
		// Priority: window.location.origin (browser) > relative path (fallback)
		// Never use VITE_API_URL in production as it gets baked during build
		if (typeof window !== 'undefined') {
			// Client-side: ALWAYS use current origin for API calls
			// This ensures requests go to the correct domain after deployment
			this.baseUrl = `${window.location.origin}/api`;
		} else {
			// Server-side / SSR: use relative path
			// The server will resolve this correctly
			this.baseUrl = '/api';
		}
	}

	/**
	 * Get authentication headers for API requests
	 * Uses Clerk session token via the globally registered getter
	 */
	private async getHeaders(): Promise<Record<string, string>> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (getAuthToken) {
			const token = await getAuthToken();
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
		}

		return headers;
	}

	/**
	 * Handle API response and errors
	 */
	private async handleResponse<T>(response: Response): Promise<T> {
		const contentType = response.headers.get('content-type');
		const isJson = contentType?.includes('application/json');

		if (!response.ok) {
			let errorMessage = `HTTP ${response.status}`;
			let errorDetails: Record<string, unknown> = {};
			let errorCode: string | undefined;

			if (isJson) {
				try {
					const errorData = await response.json();

					// Type-safe error handling with Brazilian compliance
					if (isApiErrorResponse(errorData)) {
						errorMessage = errorData.error;
						errorCode = errorData.code;
						errorDetails = errorData.details || {};

						// Log LGPD compliance context
						this.logApiError({
							message: errorMessage,
							status: response.status,
							code: errorCode,
							details: errorDetails,
							requestId: this.generateRequestId(),
						});
					} else {
						errorMessage = errorData.error || errorMessage;
						errorCode = errorData.code;
						errorDetails = errorData.details || {};
					}
				} catch {
					// If JSON parsing fails, use status text
					errorMessage = response.statusText || errorMessage;

					this.logApiError({
						message: `JSON parsing failed: ${errorMessage}`,
						status: response.status,
						requestId: this.generateRequestId(),
					});
				}
			} else {
				errorMessage = (await response.text()) || errorMessage;

				this.logApiError({
					message: `Non-JSON error response: ${errorMessage}`,
					status: response.status,
					requestId: this.generateRequestId(),
				});
			}

			const error: EnhancedApiError = new Error(errorMessage) as EnhancedApiError;
			error.status = response.status;
			error.code = errorCode;
			error.details = errorDetails;
			error.requestId = this.generateRequestId();

			throw error;
		}

		if (isJson) {
			const responseData = await response.json();

			// Type-safe response validation
			if (isApiSuccessResponse<T>(responseData)) {
				return responseData.data as T;
			}

			// Handle unexpected response format
			this.logApiError({
				message: 'Invalid API response format',
				status: response.status,
				details: { response: responseData },
				requestId: this.generateRequestId(),
			});

			return responseData as T;
		}

		// For non-JSON responses (like file downloads)
		return response as unknown as T;
	}

	/**
	 * Generate unique request ID for tracking
	 */
	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Log API errors with context
	 */
	private logApiError(_error: Partial<EnhancedApiError>): void {
		// In development, log to console for debugging
		if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
		}

		// In production, you might want to send to error monitoring service
		// This is where you would integrate with services like Sentry, LogRocket, etc.
	}

	/**
	 * Make a GET request with optional query parameters
	 */
	async get<T = unknown>(url: string, options?: { params?: Record<string, unknown> }): Promise<T> {
		const baseFullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

		// Build query string from params, filtering out undefined/null values
		let finalUrl = baseFullUrl;
		if (options?.params) {
			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(options.params)) {
				if (value !== undefined && value !== null) {
					searchParams.append(key, String(value));
				}
			}
			const queryString = searchParams.toString();
			if (queryString) {
				finalUrl = `${baseFullUrl}${baseFullUrl.includes('?') ? '&' : '?'}${queryString}`;
			}
		}

		const headers = await this.getHeaders();

		const response = await fetch(finalUrl, {
			headers,
			method: 'GET',
		});

		return this.handleResponse<T>(response);
	}

	/**
	 * Make a POST request
	 */
	async post<T = unknown>(url: string, data?: unknown): Promise<T> {
		const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
		const headers = await this.getHeaders();

		const response = await fetch(fullUrl, {
			body: data ? JSON.stringify(data) : undefined,
			headers,
			method: 'POST',
		});

		return this.handleResponse<T>(response);
	}

	/**
	 * Make a PUT request
	 */
	async put<T = unknown>(url: string, data?: unknown): Promise<T> {
		const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
		const headers = await this.getHeaders();

		const response = await fetch(fullUrl, {
			body: data ? JSON.stringify(data) : undefined,
			headers,
			method: 'PUT',
		});

		return this.handleResponse<T>(response);
	}

	/**
	 * Make a PATCH request
	 */
	async patch<T = unknown>(url: string, data?: unknown): Promise<T> {
		const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
		const headers = await this.getHeaders();

		const response = await fetch(fullUrl, {
			body: data ? JSON.stringify(data) : undefined,
			headers,
			method: 'PATCH',
		});

		return this.handleResponse<T>(response);
	}

	/**
	 * Make a DELETE request
	 */
	async delete<T = unknown>(url: string): Promise<T> {
		const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
		const headers = await this.getHeaders();

		const response = await fetch(fullUrl, {
			headers,
			method: 'DELETE',
		});

		return this.handleResponse<T>(response);
	}

	/**
	 * Upload a file
	 */
	async upload<T = unknown>(
		url: string,
		file: File,
		additionalData?: Record<string, unknown>,
	): Promise<T> {
		const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

		const formData = new FormData();
		formData.append('file', file);

		if (additionalData) {
			Object.entries(additionalData).forEach(([key, value]) => {
				formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
			});
		}

		const headers: Record<string, string> = {};
		if (getAuthToken) {
			const token = await getAuthToken();
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
		}

		const response = await fetch(fullUrl, {
			body: formData,
			headers,
			method: 'POST',
		});

		return this.handleResponse<T>(response);
	}

	/**
	 * Download a file
	 */
	async download(url: string, filename?: string): Promise<void> {
		const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
		const headers = await this.getHeaders();

		const response = await fetch(fullUrl, {
			headers,
			method: 'GET',
		});

		if (!response.ok) {
			throw new Error(`Download failed: ${response.statusText}`);
		}

		const blob = await response.blob();
		const downloadUrl = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = filename || 'download';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(downloadUrl);
	}
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types for use with React Query
export type {
	ApiResponse,
	ApiErrorResponse,
	ApiResult,
	TransactionData,
	BankAccountData,
	FinancialEventData,
	ContactData,
	EnhancedApiError,
	ApiRequestContext,
	// Type guards
	isApiSuccessResponse,
	isApiErrorResponse,
	isTransactionData,
	isBankAccountData,
	isFinancialEventData,
	isContactData,
	// Legacy types for backward compatibility
	LegacyApiResponse,
	LegacyApiError,
};

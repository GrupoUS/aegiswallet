/**
 * Supabase Client Factory
 * Provides unified Supabase client creation for both client and server contexts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './config';
import { getClientOptions, isServer, SUPABASE_CONFIG } from './config';

/**
 * Creates a Supabase client instance with appropriate configuration
 * @param options - Additional client options (optional)
 * @returns Configured Supabase client
 */
export function createSupabaseClient(
	options?: Partial<Parameters<typeof createClient>[2]>,
): SupabaseClient<Database> {
	const clientOptions = {
		...getClientOptions(),
		...options,
	};

	const apiKey =
		isServer && SUPABASE_CONFIG.SERVICE_ROLE_KEY
			? SUPABASE_CONFIG.SERVICE_ROLE_KEY
			: SUPABASE_CONFIG.ANON_KEY;

	return createClient<Database>(SUPABASE_CONFIG.URL, apiKey, clientOptions);
}

/**
 * Singleton client instance for browser context
 */
let browserClient: SupabaseClient<Database> | null = null;

/**
 * Gets or creates the browser Supabase client (singleton pattern)
 * @returns Supabase client for browser context
 */
export function getBrowserClient(): SupabaseClient<Database> {
	if (!browserClient) {
		browserClient = createSupabaseClient();
	}
	return browserClient;
}

/**
 * Creates a server-side Supabase client for each request
 * @returns Fresh Supabase client for server context
 */
export function createServerClient(): SupabaseClient<Database> {
	// For server-side, we create a fresh client without browser-specific options
	return createSupabaseClient({
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
		global: undefined,
	});
}

/**
 * Creates a request-scoped Supabase client that optionally forwards a user access token.
 */
export function createRequestScopedClient(
	accessToken?: string,
): SupabaseClient<Database> {
	return createSupabaseClient({
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
		global: accessToken
			? {
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			: undefined,
	});
}

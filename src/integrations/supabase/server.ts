/**
 * Supabase Server-Side Client
 * Re-exports createClient from @supabase/supabase-js for server usage
 */

import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

import type { Database } from './types';

/**
 * Creates a Supabase client for server-side usage
 * Wraps the base createClient with proper Database typing
 */
export const createClient = supabaseCreateClient<Database>;

/**
 * Creates a Supabase client configured for server-side usage
 * Uses service role key for elevated permissions (bypasses RLS)
 * @returns Supabase client instance
 */
export function createServerSupabaseClient() {
	const supabaseUrl =
		import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
	const supabaseServiceKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		import.meta.env.VITE_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseServiceKey) {
		throw new Error('Missing Supabase environment variables');
	}

	return supabaseCreateClient<Database>(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

/**
 * Re-export for convenience
 */
export { supabaseCreateClient };

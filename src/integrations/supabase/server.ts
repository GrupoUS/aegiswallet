/**
 * Supabase Server-Side Client
 * Re-exports createClient from @supabase/supabase-js for server usage
 */

import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import type { Database } from './config';

/**
 * Creates a Supabase client for server-side usage
 * Wraps the base createClient with proper Database typing
 */
export const createClient = supabaseCreateClient<Database>;

/**
 * Re-export for convenience
 */
export { supabaseCreateClient };


/**
 * Supabase Client for Browser Context
 * Unified Supabase client using factory pattern
 */

import { createClient } from '@supabase/supabase-js';

import { getBrowserClient } from './factory';

/**
 * Browser Supabase client instance
 * Import supabase client like this:
 * import { supabase } from "@/integrations/supabase/client";
 */
export const supabase = getBrowserClient();

/**
 * Export createClient for server-side usage
 */
export { createClient };

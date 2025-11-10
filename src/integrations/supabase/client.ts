/**
 * Supabase Client for Browser Context
 * Unified Supabase client using the factory pattern
 */

import { getBrowserClient } from './factory';

/**
 * Browser Supabase client instance
 * Import the supabase client like this:
 * import { supabase } from "@/integrations/supabase/client";
 */
export const supabase = getBrowserClient();

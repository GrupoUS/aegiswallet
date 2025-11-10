/**
 * Supabase Integration Exports
 * Unified exports for all Supabase-related functionality
 */

// Client exports
export { supabase } from './client';
export type { Database } from './config';

// Configuration exports
export { getClientOptions, isBrowser, isServer, SUPABASE_CONFIG } from './config';
export { createServerClient, createSupabaseClient, getBrowserClient } from './factory';

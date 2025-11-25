/**
 * Unified Supabase Configuration
 * Single source of truth for all Supabase client configurations
 */

import type { Database } from '@/types/database.types';

const getServerEnvVar = (key: string): string | undefined => {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env?.[key];
};

// Get Supabase configuration with proper fallback for Vite env vars
// In browser/build time, VITE_* vars are available via import.meta.env
// In server runtime, process.env is used
export const SUPABASE_CONFIG = {
  ANON_KEY: (() => {
    // Try VITE_ prefix first (for browser/build time)
    const viteKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY;
    if (viteKey) return viteKey;

    // Fallback to non-prefixed for server
    const serverKey = typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY;
    if (serverKey) return serverKey;

    // Try VITE_ in process.env (for build time)
    const processViteKey = typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY;
    if (processViteKey) return processViteKey;

    throw new Error(
      '❌ SECURITY ERROR: Missing required environment variable: SUPABASE_ANON_KEY\n' +
        'Please configure VITE_SUPABASE_ANON_KEY in Vercel environment variables.\n' +
        'See env.example for the up-to-date list of variables.'
    );
  })(),
  SERVICE_ROLE_KEY: getServerEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  URL: (() => {
    // Try VITE_ prefix first (for browser/build time)
    const viteUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
    if (viteUrl) return viteUrl;

    // Fallback to non-prefixed for server
    const serverUrl = typeof process !== 'undefined' && process.env?.SUPABASE_URL;
    if (serverUrl) return serverUrl;

    // Try VITE_ in process.env (for build time)
    const processViteUrl = typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL;
    if (processViteUrl) return processViteUrl;

    throw new Error(
      '❌ SECURITY ERROR: Missing required environment variable: SUPABASE_URL\n' +
        'Please configure VITE_SUPABASE_URL in Vercel environment variables.\n' +
        'See env.example for the up-to-date list of variables.'
    );
  })(),
} as const;

// Environment detection
export const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
export const isServer = !isBrowser;

// Import the factory to create clients properly
import { createSupabaseClient as createClientFromFactory } from './factory';

// Create a development client that uses the factory
// This ensures proper configuration with URL and API keys
export const createDevSupabaseClient = () => {
  return createClientFromFactory();
};

// Client configuration options
export const getClientOptions = () => {
  // For PKCE flow to work correctly, we MUST use localStorage directly
  // The secure storage adapter interferes with PKCE code_verifier persistence
  // Supabase needs direct access to localStorage for PKCE keys
  // We'll use secure storage only for sensitive session data in the future if needed
  const storage = isBrowser && typeof localStorage !== 'undefined' ? localStorage : undefined;

  return {
    auth: {
      autoRefreshToken: isBrowser,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
      persistSession: isBrowser,
      storage,
    },
  };
};

export type { Database };

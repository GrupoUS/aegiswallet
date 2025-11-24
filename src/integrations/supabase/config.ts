/**
 * Unified Supabase Configuration
 * Single source of truth for all Supabase client configurations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Supabase configuration with mandatory environment variables
function getRequiredEnvVar(key: string): string {
  const value =
    (typeof import.meta !== 'undefined' && import.meta.env?.[`VITE_${key}`]) ||
    (typeof process !== 'undefined' && process.env?.[key]);

  if (!value) {
    throw new Error(
      `❌ SECURITY ERROR: Missing required environment variable: ${key}\n` +
        `Please configure your .env file with the ${key} value.\n` +
        `See env.example for the up-to-date list of variables.`
    );
  }

  return value;
}

const getServerEnvVar = (key: string): string | undefined => {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env?.[key];
};

export const SUPABASE_CONFIG = {
  ANON_KEY: getRequiredEnvVar('SUPABASE_ANON_KEY'),
  SERVICE_ROLE_KEY: getServerEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  URL: getRequiredEnvVar('SUPABASE_URL'),
} as const;

// Environment detection
export const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
export const isServer = !isBrowser;

// Temporary development RLS policy for audit_logs
// This allows unauthenticated INSERT operations during development
// In production, this should be replaced with proper authentication checks
const DEV_RLS_POLICY = `
  -- Allow insert operations during development
  CREATE POLICY dev_allow_audit_logs_insert ON audit_logs
    FOR INSERT
    TO ANONYMOUS
    WITH CHECK (true);
`;

// Create a client factory with the policy
export const createDevSupabaseClient = () => {
  const client = createClient();

  // Apply the development policy if we're in browser and in development
  if (isBrowser && import.meta.env?.DEV === 'true') {
    // Use the raw SQL approach to ensure the policy is applied
    client
      .rpc('apply_rls_policy', {
        sql: DEV_RLS_POLICY
      })
      .then(() => client)
      .catch((error) => {
        console.warn('Failed to apply development RLS policy:', error);
        return client;
      });
  }

  return client;
};

// Regular client factory for production
export const createSupabaseClient = createClient;

// Secure storage implementation
type SecureStorageEngine = Storage & {
  secureSession?: {
    retrieve: () => Promise<unknown>;
    store: (...args: unknown[]) => Promise<void>;
  };
};

class SecureStorageAdapter {
  private secureStorage: SecureStorageEngine | null;

  constructor() {
    // Lazy import to avoid SSR issues
    this.secureStorage = null;
  }

  private getSecureStorage() {
    if (!this.secureStorage && isBrowser) {
      try {
        // Dynamic import to avoid SSR issues
        const { secureStorage } = require('@/lib/security/secure-storage');
        this.secureStorage = secureStorage;
      } catch {
        // Fallback to localStorage if secure storage is not available
        this.secureStorage = localStorage;
      }
    }
    return this.secureStorage;
  }

  async getItem(key: string): Promise<string | null> {
    const storage = this.getSecureStorage();
    if (!storage) {
      return null;
    }

    try {
      if (storage.secureSession) {
        const sessionData = await storage.secureSession.retrieve();
        return sessionData ? JSON.stringify(sessionData) : null;
      }
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const storage = this.getSecureStorage();
    if (!storage) {
      return;
    }

    try {
      if (storage.secureSession && key.includes('supabase.auth')) {
        const sessionData = JSON.parse(value);
        await storage.secureSession.store(sessionData.session, sessionData.user);
        return;
      }
      storage.setItem(key, value);
    } catch {
      // Silent fallback
    }
  }

  async removeItem(key: string): Promise<void> {
    const storage = this.getSecureStorage();
    if (!storage) {
      return;
    }

    try {
      if (storage.secureSession && key.includes('supabase.auth')) {
        storage.secureSession.remove();
        return;
      }
      storage.removeItem(key);
    } catch {
      // Silent fallback
    }
  }
}

// Create secure storage adapter
const secureStorageAdapter = new SecureStorageAdapter();

// Client configuration options
export const getClientOptions = () => ({
  auth: {
    autoRefreshToken: isBrowser,
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: isBrowser,
    storage: isBrowser ? secureStorageAdapter : undefined,
  },
});

export type { Database };

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

// Import the factory to create clients properly
import { createSupabaseClient as createClientFromFactory } from './factory';

// Create a development client that uses the factory
// This ensures proper configuration with URL and API keys
export const createDevSupabaseClient = () => {
  return createClientFromFactory();
};

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
    // For PKCE flow, read from localStorage directly
    if (key.includes('code-verifier') || key.includes('pkce')) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }

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
      // For PKCE flow, we need to store code_verifier in localStorage
      // Don't use secure storage for PKCE-related keys to ensure they persist
      if (key.includes('code-verifier') || key.includes('pkce')) {
        // Use localStorage directly for PKCE keys to ensure they persist across redirects
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
          return;
        }
      }

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
    // For PKCE flow, remove from localStorage directly
    if (key.includes('code-verifier') || key.includes('pkce')) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    }

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
export const getClientOptions = () => {
  // For PKCE flow to work correctly, we MUST use localStorage directly
  // The secure storage adapter interferes with PKCE code_verifier persistence
  // Supabase needs direct access to localStorage for PKCE keys
  // We'll use secure storage only for sensitive session data in the future if needed
  const storage = isBrowser && typeof localStorage !== 'undefined'
    ? localStorage
    : undefined;

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

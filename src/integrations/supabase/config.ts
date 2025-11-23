/**
 * Unified Supabase Configuration
 * Single source of truth for all Supabase client configurations
 */

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
        `See .env.example for required variables.`
    );
  }

  return value;
}

export const SUPABASE_CONFIG = {
  ANON_KEY: getRequiredEnvVar('SUPABASE_ANON_KEY'),
  URL: getRequiredEnvVar('SUPABASE_URL'),
} as const;

// Environment detection
export const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
export const isServer = !isBrowser;

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

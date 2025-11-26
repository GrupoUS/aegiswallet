/**
 * Environment Variables Validator
 * Validates required environment variables on application startup
 * and provides clear error messages for misconfiguration
 */

import { secureLogger } from '@/lib/logging/secure-logger';

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  diagnostics: Record<string, unknown>;
}

/**
 * Validates that a string looks like a valid Supabase URL
 */
const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.includes('supabase');
  } catch {
    return false;
  }
};

/**
 * Validates that a string looks like a valid Supabase anon key (JWT format)
 */
const isValidSupabaseAnonKey = (key: string | undefined): boolean => {
  if (!key) return false;
  // JWT format: header.payload.signature
  const jwtParts = key.split('.');
  if (jwtParts.length !== 3) return false;

  try {
    // Try to decode the payload to verify it's a valid JWT
    const payload = JSON.parse(atob(jwtParts[1]));
    return payload.role === 'anon' && payload.iss === 'supabase';
  } catch {
    return false;
  }
};

/**
 * Gets environment variable value with fallback logic
 */
const getEnvVar = (key: string): string | undefined => {
  // Try Vite env first
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  // Try process.env for server context
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return undefined;
};

/**
 * Validates all required environment variables for Supabase integration
 */
export const validateSupabaseEnv = (): EnvValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const diagnostics: Record<string, unknown> = {};

  // Check Supabase URL
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  diagnostics.hasSupabaseUrl = !!supabaseUrl;
  diagnostics.supabaseUrlValid = isValidSupabaseUrl(supabaseUrl);

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL não está definida');
  } else if (!isValidSupabaseUrl(supabaseUrl)) {
    errors.push(`VITE_SUPABASE_URL inválida: ${supabaseUrl}`);
  }

  // Check Supabase Anon Key
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
  diagnostics.hasSupabaseAnonKey = !!supabaseAnonKey;
  diagnostics.supabaseAnonKeyValid = isValidSupabaseAnonKey(supabaseAnonKey);

  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY não está definida');
  } else if (!isValidSupabaseAnonKey(supabaseAnonKey)) {
    errors.push('VITE_SUPABASE_ANON_KEY parece inválida');
  }

  // Optional: Check Google Client ID (for OAuth)
  const googleClientId = getEnvVar('VITE_GOOGLE_CLIENT_ID');
  diagnostics.hasGoogleClientId = !!googleClientId;
  if (!googleClientId) {
    warnings.push('VITE_GOOGLE_CLIENT_ID não definida');
  }

  const isValid = errors.length === 0;

  // Log validation result
  if (!isValid) {
    secureLogger.error('Environment validation failed', {
      diagnostics,
      errorCount: errors.length,
      errors,
    });
  } else if (warnings.length > 0) {
    secureLogger.warn('Environment validation passed with warnings', {
      diagnostics,
      warningCount: warnings.length,
      warnings,
    });
  }

  return { diagnostics, errors, isValid, warnings };
};

/**
 * Validates environment and throws if critical vars missing
 */
export const assertValidEnv = (): void => {
  const result = validateSupabaseEnv();

  if (!result.isValid) {
    const msg = `
╔═══════════════════════════════════════════════════════════╗
║  ⚠️  CONFIGURAÇÃO INVÁLIDA - AegisWallet                   ║
╠═══════════════════════════════════════════════════════════╣
${result.errors.map((e) => `║  ❌ ${e.padEnd(52)}║`).join('\n')}
║                                                           ║
║  Crie .env.local com as variáveis (veja env.example)     ║
╚═══════════════════════════════════════════════════════════╝`;
    secureLogger.error('Environment configuration invalid', { message: msg });
    throw new Error('Invalid environment configuration');
  }
};

export default { assertValidEnv, validateSupabaseEnv };

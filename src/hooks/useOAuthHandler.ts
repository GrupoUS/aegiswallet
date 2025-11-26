/**
 * OAuth Handler Hook
 * Extracts and centralizes OAuth hash fragment handling logic
 * Enhanced with PKCE debugging and comprehensive error handling
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/lib/logging/secure-logger';

export interface OAuthHandlerResult {
  isRedirecting: boolean;
  isProcessing: boolean;
  oauthError: string | null;
}

/**
 * Validates that PKCE code verifier exists in localStorage
 * This is crucial for the code exchange to work
 */
const validatePKCEState = (): { isValid: boolean; diagnostics: Record<string, unknown> } => {
  if (typeof window === 'undefined') {
    return { diagnostics: { reason: 'SSR context' }, isValid: false };
  }

  const diagnostics: Record<string, unknown> = {
    hasLocalStorage: typeof localStorage !== 'undefined',
    origin: window.location.origin,
    pathname: window.location.pathname,
  };

  // Check for Supabase auth storage keys
  try {
    const storageKeys = Object.keys(localStorage).filter(
      (key) => key.includes('supabase') || key.includes('sb-') || key.includes('pkce')
    );
    diagnostics.supabaseStorageKeys = storageKeys.length;
    diagnostics.hasAuthToken = storageKeys.some((key) => key.includes('auth-token'));
  } catch (e) {
    diagnostics.storageAccessError = e instanceof Error ? e.message : 'Unknown error';
  }

  return {
    diagnostics,
    isValid: true,
  };
};

export interface OAuthHandlerResult {
  isRedirecting: boolean;
  isProcessing: boolean;
  oauthError: string | null;
}

export function useOAuthHandler(): OAuthHandlerResult {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  const performPostAuthRedirect = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const storedRedirect = sessionStorage.getItem('post_auth_redirect') || '/dashboard';

    sessionStorage.removeItem('post_auth_redirect');

    if (window.location.pathname !== storedRedirect) {
      window.location.replace(storedRedirect);
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    const processOAuthQuery = async () => {
      if (typeof window === 'undefined') {
        return false;
      }

      const queryParams = new URLSearchParams(window.location.search);
      const queryError = queryParams.get('error') ?? queryParams.get('error_description');

      if (queryError) {
        secureLogger.security('OAuth query error detected', {
          error: queryError,
          pathname: window.location.pathname,
        });
        setOAuthError(queryError);
        setIsProcessing(false);
        return true;
      }

      const code = queryParams.get('code');
      if (!code) {
        return false;
      }

      try {
        setIsProcessing(true);

        // Validate PKCE state before attempting exchange
        const pkceState = validatePKCEState();
        secureLogger.info('PKCE state validation', {
          diagnostics: pkceState.diagnostics,
          hasCode: true,
          isValid: pkceState.isValid,
        });

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          // Enhanced error logging with diagnostic context
          const errorContext = {
            code: `${code.substring(0, 10)}...`, // Truncate for security
            errorCode: exchangeError.status?.toString(),
            errorMessage: exchangeError.message,
            errorName: exchangeError.name,
            pathname: window.location.pathname,
            pkceState: validatePKCEState().diagnostics,
          };

          secureLogger.error('Failed to exchange PKCE code for session', errorContext);

          // Provide more specific error messages based on error type
          let userMessage = exchangeError.message;
          if (exchangeError.message?.toLowerCase().includes('invalid')) {
            userMessage = 'Invalid API key. Verifique a configuração do Supabase.';
          } else if (exchangeError.message?.toLowerCase().includes('expired')) {
            userMessage = 'Código de autenticação expirado. Tente fazer login novamente.';
          }

          setOAuthError(userMessage);
          setIsProcessing(false);
          return true;
        }

        // Log successful exchange
        secureLogger.info('PKCE code exchange successful', {
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          pathname: window.location.pathname,
        });

        // Clean up query parameters after successful exchange
        for (const param of ['code', 'state', 'scope', 'auth_type']) {
          queryParams.delete(param);
        }
        const newQuery = queryParams.toString();
        const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${
          window.location.hash
        }`;
        window.history.replaceState({}, document.title, newUrl);

        secureLogger.authEvent('pkce_code_exchanged', undefined, {
          pathname: window.location.pathname,
        });

        if (performPostAuthRedirect()) {
          return true;
        }

        setIsProcessing(false);
        return true;
      } catch (error) {
        secureLogger.error('Unexpected error exchanging PKCE code', {
          error: error instanceof Error ? error.message : 'Unknown error',
          pathname: window.location.pathname,
        });
        setOAuthError('Não foi possível concluir o login com o Google.');
        setIsProcessing(false);
        return true;
      }
    };

    const handleOAuthHash = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsProcessing(false);
          return false;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasOAuthParams = hashParams.has('access_token') || hashParams.has('error');

        if (hasOAuthParams) {
          // Check for OAuth errors
          const error = hashParams.get('error');
          const errorDescription = hashParams.get('error_description');

          if (error) {
            secureLogger.security('OAuth authentication failed', {
              error,
              errorDescription,
              pathname: window.location.pathname,
            });

            setOAuthError(errorDescription || error);
            setIsProcessing(false);
            return false;
          }

          // For OAuth redirects, we need to make sure we're on the dashboard path
          if (!window.location.pathname.includes('/dashboard')) {
            // Store the hash in sessionStorage and redirect to dashboard
            sessionStorage.setItem('oauth_hash', window.location.hash);

            secureLogger.authEvent('oauth_redirect', undefined, {
              action: 'redirect_to_dashboard',
              pathname: window.location.pathname,
            });

            window.location.replace('/dashboard');
            setIsRedirecting(true);
            return true; // Indicate that redirect is happening
          }
          // Store the hash for processing by the dashboard component
          sessionStorage.setItem('oauth_hash', window.location.hash);

          secureLogger.authEvent('oauth_callback_received', undefined, {
            hasAccessToken: hashParams.has('access_token'),
            pathname: window.location.pathname,
          });

          performPostAuthRedirect();
        }

        setIsProcessing(false);
        return false;
      } catch (error) {
        secureLogger.error('OAuth handling error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          stack: error instanceof Error ? error.stack : undefined,
        });

        setOAuthError('Failed to process OAuth callback');
        setIsProcessing(false);
        return false;
      }
    };

    const orchestrateOAuthHandling = async () => {
      const queryHandled = await processOAuthQuery();
      if (!queryHandled) {
        const redirecting = await handleOAuthHash();
        if (!redirecting) {
          setIsRedirecting(false);
        }
      }
    };

    orchestrateOAuthHandling();
  }, [performPostAuthRedirect]);

  return {
    isProcessing,
    isRedirecting,
    oauthError,
  };
}

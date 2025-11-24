/**
 * OAuth Handler Hook
 * Extracts and centralizes OAuth hash fragment handling logic
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/lib/logging/secure-logger';

export interface OAuthHandlerResult {
  isRedirecting: boolean;
  isProcessing: boolean;
  oauthError: string | null;
}

export function useOAuthHandler(): OAuthHandlerResult {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [oauthError, setOAuthError] = useState<string | null>(null);

  const performPostAuthRedirect = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    const storedRedirect =
      sessionStorage.getItem('post_auth_redirect') || '/dashboard';

    sessionStorage.removeItem('post_auth_redirect');

    if (window.location.pathname !== storedRedirect) {
      window.location.replace(storedRedirect);
      return true;
    }

    return false;
  };

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
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          secureLogger.error('Failed to exchange PKCE code for session', {
            code,
            error: exchangeError.message,
            pathname: window.location.pathname,
          });
          setOAuthError(exchangeError.message);
          setIsProcessing(false);
          return true;
        }

        // Clean up query parameters after successful exchange
        ['code', 'state', 'scope', 'auth_type'].forEach((param) => queryParams.delete(param));
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
  }, []);

  return {
    isProcessing,
    isRedirecting,
    oauthError,
  };
}

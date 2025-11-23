/**
 * OAuth Handler Hook
 * Extracts and centralizes OAuth hash fragment handling logic
 */

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const handleOAuthHash = () => {
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

    const redirecting = handleOAuthHash();
    if (!redirecting) {
      setIsRedirecting(false);
    }
  }, []);

  return {
    isProcessing,
    isRedirecting,
    oauthError,
  };
}

import { useEffect } from 'react';
import { toast } from 'sonner';
import { InnerApp } from '@/components/app/InnerApp';
import { useOAuthHandler } from '@/hooks/useOAuthHandler';
import { secureLogger } from '@/lib/logging/secure-logger';
import { sessionManager } from '@/lib/session/sessionManager';

import '@/styles/accessibility.css';

/**
 * OAuth Error Messages (Portuguese)
 * Maps common OAuth errors to user-friendly messages
 */
const getOAuthErrorMessage = (error: string): { title: string; description: string } => {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('invalid api key') || errorLower.includes('api key')) {
    return {
      description:
        'Verifique se as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas corretamente.',
      title: 'Erro de configuração',
    };
  }

  if (errorLower.includes('pkce') || errorLower.includes('code_verifier')) {
    return {
      description: 'Sessão expirada. Por favor, limpe o cache do navegador e tente novamente.',
      title: 'Erro de sessão',
    };
  }

  if (errorLower.includes('access_denied')) {
    return {
      description: 'Você negou acesso à sua conta Google. Tente novamente se isso foi um erro.',
      title: 'Acesso negado',
    };
  }

  if (errorLower.includes('redirect_uri_mismatch')) {
    return {
      description: 'URL de redirecionamento inválida. Entre em contato com o suporte.',
      title: 'Erro de configuração OAuth',
    };
  }

  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return {
      description: 'Verifique sua conexão com a internet e tente novamente.',
      title: 'Erro de conexão',
    };
  }

  return {
    description: error || 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    title: 'Erro de autenticação',
  };
};

/**
 * Main Application Component
 * Handles OAuth redirects and provides the application structure
 */
function App() {
  const { isRedirecting, isProcessing, oauthError } = useOAuthHandler();

  useEffect(() => {
    // Initialize session manager
    // SessionManager auto-initializes when imported, but we ensure it's active
    if (typeof window !== 'undefined') {
      secureLogger.info('Session manager initialized', {
        isActive: sessionManager.isSessionActive(),
        sessionId: sessionManager.getSessionId(),
      });
    }
  }, []);

  // Handle OAuth errors with toast notifications
  useEffect(() => {
    if (oauthError && typeof window !== 'undefined') {
      secureLogger.error('OAuth Error in App component', {
        component: 'App',
        error: oauthError,
      });

      const { title, description } = getOAuthErrorMessage(oauthError);

      toast.error(title, {
        action: {
          label: 'Tentar novamente',
          onClick: () => {
            // Clear any stale OAuth state and redirect to login
            sessionStorage.removeItem('post_auth_redirect');
            sessionStorage.removeItem('oauth_hash');
            window.location.href = '/login';
          },
        },
        description,
        duration: 10000,
      });
    }
  }, [oauthError]);

  // Don't render anything if redirecting or still processing OAuth
  if (isRedirecting || isProcessing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
        <p className="text-muted-foreground text-sm">
          {isRedirecting ? 'Redirecionando...' : 'Processando autenticação...'}
        </p>
      </div>
    );
  }

  return <InnerApp />;
}

export default App;

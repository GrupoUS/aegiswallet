import { useEffect } from "react";
import { InnerApp } from "@/components/app/InnerApp";
import { AppProviders } from "@/components/providers/AppProviders";
import { useOAuthHandler } from "@/hooks/useOAuthHandler";
import { secureLogger } from "@/lib/logging/secure-logger";
import { sessionManager } from "@/lib/session/sessionManager";

import "@/styles/accessibility.css";

/**
 * Main Application Component
 * Handles OAuth redirects and provides the application structure
 */
function App() {
  const { isRedirecting, isProcessing, oauthError } = useOAuthHandler();

  useEffect(() => {
    // Initialize session manager
    // SessionManager auto-initializes when imported, but we ensure it's active
    if (typeof window !== "undefined") {
      secureLogger.info("Session manager initialized", {
        sessionId: sessionManager.getSessionId(),
        isActive: sessionManager.isSessionActive(),
      });
    }

    // Handle OAuth errors
    if (oauthError) {
      secureLogger.error("OAuth Error in App component", {
        error: oauthError,
        component: "App",
      });

      // Show error notification to user
      // In a real implementation, you would show a toast or error component
      if (typeof window !== "undefined") {
        // For now, we'll use an alert as a simple error display
        // In production, this should be replaced with a proper error UI
        alert(
          `Erro de autenticação: ${oauthError}. Por favor, tente novamente.`,
        );
      }
    }
  }, [oauthError]);

  // Don't render anything if redirecting or still processing OAuth
  if (isRedirecting || isProcessing) {
    return null;
  }

  return (
    <AppProviders>
      <InnerApp />
    </AppProviders>
  );
}

export default App;

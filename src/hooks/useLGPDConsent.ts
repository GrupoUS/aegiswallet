import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface LGPDConsent {
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  version: string;
  timestamp: string;
}

const CONSENT_KEY = 'aegis_lgpd_consent';
const CURRENT_VERSION = '1.0.0';

export function useLGPDConsent() {
  const [consent, setConsent] = useState<LGPDConsent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Check version compatibility if needed
          setConsent(parsed);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  const grantConsent = useCallback((types: Partial<Omit<LGPDConsent, 'version' | 'timestamp'>>) => {
    const newConsent: LGPDConsent = {
      dataProcessing: true, // Always required for app usage
      marketing: types.marketing ?? false,
      analytics: types.analytics ?? false,
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
      setConsent(newConsent);
      toast.success('Preferências de privacidade salvas');
    } catch (error) {
      console.error('
    }
  }, []);

  const revokeConsent = useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_KEY);
      setConsent(null);
      toast.info('Consentimento revogado');
    } catch (error) {
      console.error('Failed to revoke LGPD consent', error);
    }

  return {
    consent,
    hasConsent: !!consent?.dataProcessing,
    isLoading,
    grantConsent,
    revokeConsent,
  };
}
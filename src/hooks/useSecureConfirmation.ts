/**
 * Secure Confirmation Hook - Story 01.04
 */

import { useCallback, useState } from 'react';
import type { ConfirmationResult, VoiceConfirmationConfig } from '@/lib/security/voiceConfirmation';
import { getVoiceConfirmationService } from '@/lib/security/voiceConfirmation';

export function useSecureConfirmation(config?: Partial<VoiceConfirmationConfig>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmTransaction = useCallback(
    async (params: {
      userId: string;
      transactionType: string;
      amount: number;
      recipient?: string;
      expectedPhrase: string;
    }) => {
      setIsConfirming(true);
      setError(null);

      try {
        const service = getVoiceConfirmationService(config);
        const confirmResult = await service.confirmTransaction(params);

        setResult(confirmResult);
        return confirmResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Confirmation failed';
        setError(errorMessage);
        return {
          confidence: 0,
          method: 'fallback' as const,
          processingTime: 0,
          success: false,
        };
      } finally {
        setIsConfirming(false);
      }
    },
    [config]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    confirmTransaction,
    error,
    isConfirming,
    reset,
    result,
  };
}

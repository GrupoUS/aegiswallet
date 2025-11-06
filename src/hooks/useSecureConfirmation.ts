/**
 * Secure Confirmation Hook - Story 01.04
 */

import { useCallback, useState } from 'react';
import {
  type ConfirmationResult,
  getVoiceConfirmationService,
  type VoiceConfirmationConfig,
} from '@/lib/security/voiceConfirmation';

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
          success: false,
          method: 'fallback' as const,
          confidence: 0,
          processingTime: 0,
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
    isConfirming,
    result,
    error,
    confirmTransaction,
    reset,
  };
}

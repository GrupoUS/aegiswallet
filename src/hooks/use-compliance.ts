/**
 * LGPD Compliance Hooks
 * React Query hooks for consent, export, deletion, and limits management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
  ConsentTemplate,
  ConsentType,
  CollectionMethod,
  LgpdConsent,
  DataExportRequest,
  DataExportFormat,
  DataExportRequestType,
  DataDeletionRequest,
  DataDeletionRequestType,
  TransactionLimit,
  TransactionLimitType,
  CheckLimitResponse,
} from '@/types/compliance';

// =====================================================
// Query Keys
// =====================================================

export const complianceKeys = {
  all: ['compliance'] as const,
  templates: () => [...complianceKeys.all, 'templates'] as const,
  consents: () => [...complianceKeys.all, 'consents'] as const,
  missingConsents: () => [...complianceKeys.all, 'missing'] as const,
  exportRequests: () => [...complianceKeys.all, 'export-requests'] as const,
  deletionRequests: () => [...complianceKeys.all, 'deletion-requests'] as const,
  limits: () => [...complianceKeys.all, 'limits'] as const,
  audit: (params?: { limit?: number; eventType?: string }) =>
    [...complianceKeys.all, 'audit', params] as const,
};

// =====================================================
// Response Types
// =====================================================

interface ApiResponse<T> {
  data: T;
  meta: { requestId: string; retrievedAt?: string };
}

interface MissingConsentsResponse {
  hasMissing: boolean;
  missingConsents: ConsentType[];
}

// =====================================================
// CONSENT HOOKS
// =====================================================

/**
 * Fetch available consent templates
 */
export function useConsentTemplates() {
  return useQuery({
    queryKey: complianceKeys.templates(),
    queryFn: async (): Promise<ConsentTemplate[]> => {
      const response = await apiClient.get<ApiResponse<ConsentTemplate[]>>(
        '/v1/compliance/consent-templates'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch user's current consents
 */
export function useConsents() {
  return useQuery({
    queryKey: complianceKeys.consents(),
    queryFn: async (): Promise<LgpdConsent[]> => {
      const response = await apiClient.get<ApiResponse<LgpdConsent[]>>(
        '/v1/compliance/consents'
      );
      return response.data;
    },
  });
}

/**
 * Check for missing mandatory consents
 */
export function useMissingConsents() {
  return useQuery({
    queryKey: complianceKeys.missingConsents(),
    queryFn: async (): Promise<MissingConsentsResponse> => {
      const response = await apiClient.get<ApiResponse<MissingConsentsResponse>>(
        '/v1/compliance/consents/missing'
      );
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Grant a consent
 */
export function useGrantConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      consentType: ConsentType;
      collectionMethod?: CollectionMethod;
    }): Promise<LgpdConsent> => {
      const response = await apiClient.post<ApiResponse<LgpdConsent>>(
        '/v1/compliance/consents',
        {
          consentType: params.consentType,
          collectionMethod: params.collectionMethod ?? 'explicit_form',
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.consents() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.missingConsents() });
      toast.success('Consentimento registrado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar consentimento: ${error.message}`);
    },
  });
}

/**
 * Revoke a consent
 */
export function useRevokeConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consentType: ConsentType): Promise<void> => {
      await apiClient.delete(`/v1/compliance/consents/${consentType}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.consents() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.missingConsents() });
      toast.success('Consentimento revogado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao revogar consentimento: ${error.message}`);
    },
  });
}

// =====================================================
// DATA EXPORT HOOKS
// =====================================================

/**
 * Fetch user's export requests
 */
export function useExportRequests() {
  return useQuery({
    queryKey: complianceKeys.exportRequests(),
    queryFn: async (): Promise<DataExportRequest[]> => {
      const response = await apiClient.get<ApiResponse<DataExportRequest[]>>(
        '/v1/compliance/export-requests'
      );
      return response.data;
    },
  });
}

/**
 * Create a data export request
 */
export function useCreateExportRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      requestType?: DataExportRequestType;
      format?: DataExportFormat;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<DataExportRequest> => {
      const response = await apiClient.post<ApiResponse<DataExportRequest>>(
        '/v1/compliance/export-requests',
        {
          requestType: params.requestType ?? 'full_export',
          format: params.format ?? 'json',
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.exportRequests() });
      toast.success('Solicitação de exportação criada. Você receberá um e-mail quando estiver pronta.');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao solicitar exportação: ${error.message}`);
    },
  });
}

// =====================================================
// DATA DELETION HOOKS
// =====================================================

/**
 * Fetch user's deletion requests
 */
export function useDeletionRequests() {
  return useQuery({
    queryKey: complianceKeys.deletionRequests(),
    queryFn: async (): Promise<DataDeletionRequest[]> => {
      const response = await apiClient.get<ApiResponse<DataDeletionRequest[]>>(
        '/v1/compliance/deletion-requests'
      );
      return response.data;
    },
  });
}

/**
 * Create a data deletion request
 */
export function useCreateDeletionRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      requestType: DataDeletionRequestType;
      scope?: Record<string, unknown>;
      reason?: string;
    }): Promise<DataDeletionRequest> => {
      const response = await apiClient.post<ApiResponse<DataDeletionRequest>>(
        '/v1/compliance/deletion-requests',
        {
          requestType: params.requestType,
          scope: params.scope,
          reason: params.reason,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.deletionRequests() });
      toast.success('Solicitação de exclusão criada. Analisaremos em até 15 dias.');
    },
    onError: (error: Error) => {
      if (error.message.includes('retenção legal')) {
        toast.error('Seus dados estão sob retenção legal e não podem ser excluídos.');
      } else {
        toast.error(`Erro ao solicitar exclusão: ${error.message}`);
      }
    },
  });
}

// =====================================================
// TRANSACTION LIMITS HOOKS
// =====================================================

/**
 * Fetch user's transaction limits
 */
export function useTransactionLimits() {
  return useQuery({
    queryKey: complianceKeys.limits(),
    queryFn: async (): Promise<TransactionLimit[]> => {
      const response = await apiClient.get<ApiResponse<TransactionLimit[]>>(
        '/v1/compliance/limits'
      );
      return response.data;
    },
  });
}

/**
 * Check if a transaction is within limits
 */
export function useCheckTransactionLimit() {
  return useMutation({
    mutationFn: async (params: {
      limitType: TransactionLimitType;
      amount: number;
    }): Promise<CheckLimitResponse> => {
      const response = await apiClient.post<ApiResponse<CheckLimitResponse>>(
        '/v1/compliance/limits/check',
        {
          limitType: params.limitType,
          amount: params.amount,
        }
      );
      return response.data;
    },
  });
}

// =====================================================
// AUDIT HOOKS
// =====================================================

/**
 * Fetch compliance audit history
 */
export function useAuditHistory(options?: { limit?: number; eventType?: string }) {
  return useQuery({
    queryKey: complianceKeys.audit(options),
    queryFn: async (): Promise<unknown[]> => {
      const response = await apiClient.get<ApiResponse<unknown[]>>(
        '/v1/compliance/audit',
        { params: options }
      );
      return response.data;
    },
  });
}

// =====================================================
// CONVENIENCE HOOKS
// =====================================================

/**
 * Combined hook for consent management UI
 */
export function useConsentManagement() {
  const templates = useConsentTemplates();
  const consents = useConsents();
  const missing = useMissingConsents();
  const grantConsent = useGrantConsent();
  const revokeConsent = useRevokeConsent();

  return {
    templates: templates.data ?? [],
    consents: consents.data ?? [],
    missingConsents: missing.data?.missingConsents ?? [],
    hasMissing: missing.data?.hasMissing ?? false,
    isLoading: templates.isLoading || consents.isLoading || missing.isLoading,
    grantConsent: grantConsent.mutate,
    revokeConsent: revokeConsent.mutate,
    isGranting: grantConsent.isPending,
    isRevoking: revokeConsent.isPending,
  };
}

/**
 * Hook to check if user has all required consents before an action
 */
export function useRequiredConsentsCheck(requiredTypes: ConsentType[]) {
  const { data: consents, isLoading } = useConsents();

  const hasAllRequired = consents?.every((consent) => {
    if (!requiredTypes.includes(consent.consent_type)) return true;
    return consent.granted && !consent.revoked_at;
  }) ?? false;

  const missingTypes = requiredTypes.filter((type) => {
    const consent = consents?.find((c) => c.consent_type === type);
    return !consent || !consent.granted || consent.revoked_at;
  });

  return {
    hasAllRequired,
    missingTypes,
    isLoading,
  };
}

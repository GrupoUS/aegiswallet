import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

/**
 * Hook para gerenciar perfil do usuário
 */
export function useProfile() {
  const utils = trpc.useUtils();

  const { data: profile, isLoading, error } = trpc.profiles.getProfile.useQuery();

  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    trpc.profiles.updateProfile.useMutation({
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar perfil');
      },
      onSuccess: () => {
        utils.profiles.getProfile.invalidate();
        toast.success('Perfil atualizado com sucesso!');
      },
    });

  const { mutate: updatePreferences, isPending: isUpdatingPreferences } =
    trpc.profiles.updatePreferences.useMutation({
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar preferências');
      },
      onSuccess: (data) => {
        utils.profiles.getProfile.setData(undefined, (old) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            user_preferences: data ? [data] : [],
          };
        });

        toast.success('Preferências atualizadas com sucesso!');
      },
    });

  const { mutate: updateLastLogin } = trpc.profiles.updateLastLogin.useMutation();

  return {
    error,
    isLoading,
    isUpdatingPreferences,
    isUpdatingProfile,
    profile,
    updateLastLogin,
    updatePreferences,
    updateProfile,
  };
}

/**
 * Hook para obter resumo financeiro do usuário
 */
export function useFinancialSummary(startDate: string, endDate: string) {
  const { data, isLoading, error } = trpc.profiles.getFinancialSummary.useQuery(
    {
      period_end: endDate,
      period_start: startDate,
    },
    {
      enabled: !!startDate && !!endDate,
    }
  );

  return {
    error,
    isLoading,
    summary: data,
  };
}

/**
 * Hook para verificar status do usuário
 */
export function useUserStatus() {
  const { data, isLoading, error } = trpc.profiles.checkUserStatus.useQuery();

  return {
    error,
    isActive: data?.is_active ?? false,
    isLoading,
    lastLogin: data?.last_login,
    status: data,
  };
}

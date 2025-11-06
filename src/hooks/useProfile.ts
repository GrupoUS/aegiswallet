import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'

/**
 * Hook para gerenciar perfil do usuário
 */
export function useProfile() {
  const utils = trpc.useUtils()

  const { data: profile, isLoading, error } = trpc.profiles.getProfile.useQuery()

  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    trpc.profiles.updateProfile.useMutation({
      onSuccess: () => {
        utils.profiles.getProfile.invalidate()
        toast.success('Perfil atualizado com sucesso!')
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar perfil')
      },
    })

  const { mutate: updatePreferences, isPending: isUpdatingPreferences } =
    trpc.profiles.updatePreferences.useMutation({
      onSuccess: (data) => {
        utils.profiles.getProfile.setData(undefined, (old) => {
          if (!old) return old
          return { ...old, user_preferences: data }
        })
        toast.success('Preferências atualizadas com sucesso!')
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar preferências')
      },
    })

  const { mutate: updateLastLogin } = trpc.profiles.updateLastLogin.useMutation()

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    updateLastLogin,
    isUpdatingProfile,
    isUpdatingPreferences,
  }
}

/**
 * Hook para obter resumo financeiro do usuário
 */
export function useFinancialSummary(startDate: string, endDate: string) {
  const { data, isLoading, error } = trpc.profiles.getFinancialSummary.useQuery(
    {
      period_start: startDate,
      period_end: endDate,
    },
    {
      enabled: !!startDate && !!endDate,
    }
  )

  return {
    summary: data,
    isLoading,
    error,
  }
}

/**
 * Hook para verificar status do usuário
 */
export function useUserStatus() {
  const { data, isLoading, error } = trpc.profiles.checkUserStatus.useQuery()

  return {
    status: data,
    isLoading,
    error,
    isActive: data?.is_active ?? false,
    lastLogin: data?.last_login,
  }
}

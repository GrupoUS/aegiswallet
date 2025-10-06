import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { useEffect, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'

/**
 * Hook para gerenciar contatos
 */
export function useContacts(filters?: {
  search?: string
  isFavorite?: boolean
  limit?: number
  offset?: number
}) {
  const utils = trpc.useUtils()
  
  const { data, isLoading, error, fetchNextPage, hasNextPage, refetch } = trpc.contacts.getAll.useInfiniteQuery(
    filters || {},
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.hasMore) {
          return {
            ...filters,
            offset: (filters?.offset || 0) + (filters?.limit || 50),
          }
        }
        return undefined
      },
    }
  )

  const contacts = useMemo(() => {
    return data?.pages.flatMap(page => page.contacts) || []
  }, [data])

  const total = useMemo(() => {
    return data?.pages[0]?.total || 0
  }, [data])

  const { mutate: createContact, isPending: isCreating } = trpc.contacts.create.useMutation({
    onSuccess: (data) => {
      utils.contacts.getAll.setData(undefined, (old) => {
        if (!old) return { pages: [{ contacts: [data], total: 1, hasMore: false }] }
        return {
          ...old,
          pages: [{
            ...old.pages[0],
            contacts: [data, ...old.pages[0].contacts],
            total: old.pages[0].total + 1,
          }, ...old.pages.slice(1)]
        }
      })
      utils.contacts.getStats.invalidate()
      toast.success('Contato criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar contato')
    },
  })

  const { mutate: updateContact, isPending: isUpdating } = trpc.contacts.update.useMutation({
    onSuccess: (data) => {
      utils.contacts.getAll.setData(undefined, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            contacts: page.contacts.map(c => c.id === data.id ? data : c)
          }))
        }
      })
      utils.contacts.getStats.invalidate()
      toast.success('Contato atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar contato')
    },
  })

  const { mutate: deleteContact, isPending: isDeleting } = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      utils.contacts.getAll.invalidate()
      utils.contacts.getStats.invalidate()
      toast.success('Contato removido com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover contato')
    },
  })

  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = trpc.contacts.toggleFavorite.useMutation({
    onSuccess: (data) => {
      utils.contacts.getAll.setData(undefined, (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            contacts: page.contacts.map(c => c.id === data.id ? data : c)
          }))
        }
      })
      utils.contacts.getFavorites.invalidate()
      utils.contacts.getStats.invalidate()
      toast.success(data.is_favorite ? 'Contato adicionado aos favoritos!' : 'Contato removido dos favoritos!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao alternar favorito')
    },
  })

  // Real-time subscription para contatos
  useEffect(() => {
    if (!contacts.length) return

    const channel = supabase
      .channel('contacts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
        },
        (payload) => {
          console.log('Contact change detected:', payload)
          utils.contacts.getAll.invalidate()
          utils.contacts.getFavorites.invalidate()
          utils.contacts.getStats.invalidate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contacts.length, utils])

  return {
    contacts,
    total,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
    createContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingFavorite,
  }
}

/**
 * Hook para obter contato específico
 */
export function useContact(contactId: string) {
  const { data: contact, isLoading, error } = trpc.contacts.getById.useQuery(
    { id: contactId },
    { enabled: !!contactId }
  )

  return {
    contact,
    isLoading,
    error,
  }
}

/**
 * Hook para contatos favoritos
 */
export function useFavoriteContacts() {
  const { data: favoriteContacts, isLoading, error } = trpc.contacts.getFavorites.useQuery()

  return {
    favoriteContacts: favoriteContacts || [],
    isLoading,
    error,
  }
}

/**
 * Hook para busca de contatos
 */
export function useContactSearch(query: string, limit: number = 10) {
  const { data: searchResults, isLoading, error } = trpc.contacts.search.useQuery(
    { query, limit },
    { enabled: !!query && query.length >= 2 }
  )

  return {
    searchResults: searchResults || [],
    isLoading,
    error,
  }
}

/**
 * Hook para estatísticas dos contatos
 */
export function useContactsStats() {
  const { data: stats, isLoading, error } = trpc.contacts.getStats.useQuery()

  return {
    stats,
    isLoading,
    error,
  }
}

/**
 * Hook para contatos recentes
 */
export function useRecentContacts(limit: number = 5) {
  const { data, isLoading, error } = trpc.contacts.getAll.useQuery(
    { limit },
    { staleTime: 1000 * 60 } // 1 minuto
  )

  return {
    contacts: data?.contacts || [],
    isLoading,
    error,
  }
}

/**
 * Hook para contatos para transferências
 */
export function useContactsForTransfer() {
  const { contacts } = useContacts({ limit: 50 })

  // Filtrar contatos que têm informações para transferência
  const transferableContacts = useMemo(() => {
    return contacts.filter(contact => 
      contact.email || contact.phone || contact.cpf
    ).map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      cpf: contact.cpf,
      isFavorite: contact.is_favorite,
      // Determinar métodos de pagamento disponíveis
      availableMethods: [
        ...(contact.email ? ['EMAIL'] : []),
        ...(contact.phone ? ['PHONE'] : []),
        ...(contact.cpf ? ['CPF', 'CNPJ'] : []),
      ],
    }))
  }, [contacts])

  return {
    contacts: transferableContacts,
  }
}

/**
 * Hook para contatos com PIX
 */
export function useContactsForPix() {
  const { contacts } = useContacts({ limit: 50 })

  // Filtrar contatos que têm informações para PIX
  const pixContacts = useMemo(() => {
    return contacts.filter(contact => 
      contact.email || contact.phone || contact.cpf
    ).map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      cpf: contact.cpf,
      isFavorite: contact.is_favorite,
      // Determinar chaves PIX disponíveis
      pixKeys: [
        ...(contact.email ? [{ type: 'EMAIL', value: contact.email }] : []),
        ...(contact.phone ? [{ type: 'PHONE', value: contact.phone }] : []),
        ...(contact.cpf ? [{ type: 'CPF', value: contact.cpf }] : []),
      ],
    }))
  }, [contacts])

  return {
    contacts: pixContacts,
  }
}

/**
 * Hook para sugestões de contatos baseado no histórico
 */
export function useContactSuggestions(limit: number = 3) {
  const { favoriteContacts } = useFavoriteContacts()
  const { contacts } = useRecentContacts(limit)

  // Combinar favoritos e contatos recentes, removendo duplicatas
  const suggestions = useMemo(() => {
    const allContacts = [...favoriteContacts, ...contacts]
    const uniqueContacts = allContacts.filter((contact, index, self) => 
      index === self.findIndex(c => c.id === contact.id)
    )
    return uniqueContacts.slice(0, limit)
  }, [favoriteContacts, contacts, limit])

  return {
    suggestions,
  }
}

/**
 * Hook para validação de contatos
 */
export function useContactValidation() {
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')
    // Validação básica para telefone brasileiro (10 ou 11 dígitos)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11
  }

  const validateCPF = (cpf: string) => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '')
    // Validação básica (11 dígitos)
    return cleanCPF.length === 11
  }

  return {
    validateEmail,
    validatePhone,
    validateCPF,
  }
}

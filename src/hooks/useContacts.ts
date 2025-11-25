import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api-client';
import type { Database } from '@/types/database.types';

// Contact type from database
type Contact = Database['public']['Tables']['contacts']['Row'];

// Contact list response type
interface ContactsListResponse {
  contacts: Contact[];
  total: number;
  hasMore: boolean;
}

interface ContactsApiResponse {
  data: ContactsListResponse;
  meta: {
    requestId: string;
    retrievedAt: string;
  };
}

interface ContactApiResponse {
  data: Contact;
  meta: {
    requestId: string;
    retrievedAt: string;
  };
}

interface StatsResponse {
  data: {
    totalContacts: number;
    favoriteContacts: number;
    contactsWithEmail: number;
    contactsWithPhone: number;
    favoritePercentage: number;
  };
  meta: {
    requestId: string;
    retrievedAt: string;
  };
}

/**
 * Hook para gerenciar contatos
 */
export function useContacts(filters?: {
  search?: string;
  isFavorite?: boolean;
  limit?: number;
  offset?: number;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default filters
  const defaultFilters = {
    limit: 50,
    offset: 0,
    ...filters,
  };

  const total = contacts.length;

  const createContact = async (contactData: Partial<Contact>) => {
    try {
      const response = await apiClient.post<ContactApiResponse>('/v1/contacts', {
        name: contactData.name!,
        email: contactData.email || undefined,
        phone: contactData.phone || undefined,
        notes: contactData.notes || undefined,
        isFavorite: contactData.is_favorite || false,
      });

      toast.success('Contato criado com sucesso!');
      await refetch(); // Refresh contacts
      return response.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar contato');
      throw error;
    }
  };

  const updateContact = async (contactData: Partial<Contact> & { id: string }) => {
    try {
      const response = await apiClient.put<ContactApiResponse>(`/v1/contacts/${contactData.id}`, {
        id: contactData.id,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        notes: contactData.notes,
        isFavorite: contactData.is_favorite,
      });

      toast.success('Contato atualizado com sucesso!');
      await refetch(); // Refresh contacts
      return response.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar contato');
      throw error;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      await apiClient.delete(`/v1/contacts/${contactId}`);
      toast.success('Contato removido com sucesso!');
      await refetch(); // Refresh contacts
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao remover contato');
      throw error;
    }
  };

  const toggleFavorite = async (contactId: string) => {
    try {
      const response = await apiClient.post<ContactApiResponse>(`/v1/contacts/${contactId}/favorite`);
      toast.success('Favorito atualizado com sucesso!');
      await refetch(); // Refresh contacts
      return response.data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao alternar favorito');
      throw error;
    }
  };

  const refetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id);

      if (defaultFilters.search) {
        query = query.or(
          `name.ilike.%${defaultFilters.search}%,email.ilike.%${defaultFilters.search}%,phone.ilike.%${defaultFilters.search}%`
        );
      }

      if (defaultFilters.isFavorite !== undefined) {
        query = query.eq('is_favorite', defaultFilters.isFavorite);
      }

      const { data, error } = await query
        .order('is_favorite', { ascending: false })
        .order('name', { ascending: true })
        .range(defaultFilters.offset || 0, (defaultFilters.offset || 0) + (defaultFilters.limit || 50) - 1);

      if (error) {
        throw error;
      }

      setContacts(data || []);
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar contatos';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load contacts on mount and when filters change
  useEffect(() => {
    refetch();
  }, [JSON.stringify(defaultFilters)]);

  return {
    contacts,
    createContact,
    deleteContact,
    error,
    isCreating: false,
    isDeleting: false,
    isLoading,
    isTogglingFavorite: false,
    isUpdating: false,
    refetch,
    toggleFavorite,
    total,
    updateContact,
  };
}

/**
 * Hook para obter contato específico
 */
export function useContact(contactId: string) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId) return;

    const fetchContact = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<ContactApiResponse>(`/v1/contacts/${contactId}`);
        setContact(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar contato');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [contactId]);

  return {
    contact,
    error,
    isLoading,
  };
}

/**
 * Hook para contatos favoritos
 */
export function useFavoriteContacts() {
  const [favoriteContacts, setFavoriteContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavoriteContacts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ data: Contact[]; meta: any }>('/v1/contacts/favorites');
      setFavoriteContacts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar favoritos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteContacts();
  }, []);

  return {
    error,
    favoriteContacts,
    isLoading,
  };
}

/**
 * Hook para busca de contatos
 */
export function useContactSearch(query: string, limit: number = 10) {
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchContacts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{ data: Contact[]; meta: any }>(`/v1/contacts/search?query=${encodeURIComponent(query)}&limit=${limit}`);
        setSearchResults(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro na busca');
      } finally {
        setIsLoading(false);
      }
    };

    searchContacts();
  }, [query, limit]);

  return {
    error,
    isLoading,
    searchResults,
  };
}

/**
 * Hook para estatísticas dos contatos
 */
export function useContactsStats() {
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<StatsResponse>('/v1/contacts/stats');
      setStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    error,
    isLoading,
    stats,
  };
}

/**
 * Hook para contatos recentes
 */
export function useRecentContacts(limit: number = 5) {
  const { contacts, error, isLoading } = useContacts({ limit });

  return {
    contacts: contacts || [],
    error,
    isLoading,
  };
}

/**
 * Hook para contatos para transferências
 */
export function useContactsForTransfer() {
  const { contacts } = useContacts({ limit: 50 });

  // Filtrar contatos que têm informações para transferência
  const transferableContacts = useMemo(() => {
    return contacts
      .filter((contact: Contact) => contact.email || contact.phone)
      .map((contact: Contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        isFavorite: contact.is_favorite,
        // Determinar métodos de pagamento disponíveis
        availableMethods: [
          ...(contact.email ? ['EMAIL'] : []),
          ...(contact.phone ? ['PHONE'] : []),
        ],
      }));
  }, [contacts]);

  return {
    contacts: transferableContacts,
  };
}

/**
 * Hook para contatos com PIX
 */
export function useContactsForPix() {
  const { contacts } = useContacts({ limit: 50 });

  // Filtrar contatos que têm informações para PIX
  const pixContacts = useMemo(() => {
    return contacts
      .filter((contact: Contact) => contact.email || contact.phone)
      .map((contact: Contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        isFavorite: contact.is_favorite,
        // Determinar chaves PIX disponíveis
        pixKeys: [
          ...(contact.email ? [{ type: 'EMAIL', value: contact.email }] : []),
          ...(contact.phone ? [{ type: 'PHONE', value: contact.phone }] : []),
        ],
      }));
  }, [contacts]);

  return {
    contacts: pixContacts,
  };
}

/**
 * Hook para sugestões de contatos baseado no histórico
 */
export function useContactSuggestions(limit: number = 3) {
  const { favoriteContacts } = useFavoriteContacts();
  const { contacts } = useRecentContacts(limit);

  // Combinar favoritos e contatos recentes, removendo duplicatas
  const suggestions = useMemo(() => {
    const allContacts = [...favoriteContacts, ...contacts];
    const uniqueContacts = allContacts.filter(
      (contact, index, self) => index === self.findIndex((c) => c.id === contact.id)
    );
    return uniqueContacts.slice(0, limit);
  }, [favoriteContacts, contacts, limit]);

  return {
    suggestions,
  };
}

/**
 * Hook para validação de contatos
 */
export function useContactValidation() {
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Validação básica para telefone brasileiro (10 ou 11 dígitos)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const validateCPF = (cpf: string) => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    // Validação básica (11 dígitos)
    return cleanCPF.length === 11;
  };

  return {
    validateCPF,
    validateEmail,
    validatePhone,
  };
}
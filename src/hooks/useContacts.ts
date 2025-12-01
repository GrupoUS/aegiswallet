/**
 * NOTA: useContacts, useContact, useFavoriteContacts, useContactSearch, useContactsStats
 * foram migrados para TanStack Query para melhor cache, retry automático e invalidação.
 * Manter API pública idêntica para backward compatibility.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Contact } from '@/db/schema';
import { apiClient } from '@/lib/api-client';

// Query keys factory for contacts
export const contactsKeys = {
	all: ['contacts'] as const,
	lists: () => [...contactsKeys.all, 'list'] as const,
	list: (filters?: {
		search?: string;
		isFavorite?: boolean;
		limit?: number;
		offset?: number;
	}) => [...contactsKeys.lists(), filters] as const,
	details: () => [...contactsKeys.all, 'detail'] as const,
	detail: (id: string) => [...contactsKeys.details(), id] as const,
	favorites: () => [...contactsKeys.all, 'favorites'] as const,
	search: (query: string, limit?: number) => [...contactsKeys.all, 'search', query, limit] as const,
	stats: () => [...contactsKeys.all, 'stats'] as const,
};

// Response meta type
interface ResponseMeta {
	requestId: string;
	retrievedAt: string;
}

interface UseContactsReturn {
	contacts: Contact[];
	isLoading: boolean;
	error: string | null;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	isTogglingFavorite: boolean;
	total: number;
	createContact: (contactData: Partial<Contact>) => Promise<Contact>;
	updateContact: (contactData: Partial<Contact> & { id: string }) => Promise<Contact>;
	deleteContact: (contactId: string) => Promise<void>;
	toggleFavorite: (contactId: string) => Promise<Contact>;
	refetch: () => Promise<Contact[]>;
}

interface UseContactReturn {
	contact: Contact | null;
	isLoading: boolean;
	error: string | null;
}

interface UseFavoriteContactsReturn {
	favoriteContacts: Contact[];
	isLoading: boolean;
	error: string | null;
}

interface UseContactSearchReturn {
	searchResults: Contact[];
	isLoading: boolean;
	error: string | null;
}

interface UseContactsStatsReturn {
	stats: StatsResponse['data'] | null;
	isLoading: boolean;
	error: string | null;
}

interface UseRecentContactsReturn {
	contacts: Contact[];
	isLoading: boolean;
	error: string | null;
}

interface UseContactsForTransferReturn {
	contacts: Array<{
		id: string;
		name: string;
		email?: string;
		phone?: string;
		isFavorite: boolean;
		availableMethods: Array<'EMAIL' | 'PHONE'>;
	}>;
}

interface UseContactsForPixReturn {
	contacts: Array<{
		id: string;
		name: string;
		email?: string;
		phone?: string;
		isFavorite: boolean;
		pixKeys: Array<{ type: 'EMAIL' | 'PHONE'; value: string }>;
	}>;
}

interface UseContactSuggestionsReturn {
	suggestions: Contact[];
}

interface UseContactValidationReturn {
	validateEmail: (email: string) => boolean;
	validatePhone: (phone: string) => boolean;
	validateCPF: (cpf: string) => boolean;
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
 * Migrado para TanStack Query para melhor cache, retry automático e invalidação
 */
export function useContacts(filters?: {
	search?: string;
	isFavorite?: boolean;
	limit?: number;
	offset?: number;
}): UseContactsReturn {
	// Memoize filters to avoid unnecessary re-renders
	const defaultFilters = useMemo(
		() => ({
			limit: 50,
			offset: 0,
			...filters,
		}),
		[filters],
	);

	const queryClient = useQueryClient();

	// Query for fetching contacts with TanStack Query
	const {
		data: contacts = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: contactsKeys.list(defaultFilters),
		queryFn: async () => {
			const params = new URLSearchParams();
			if (defaultFilters.search) params.append('search', defaultFilters.search);
			if (defaultFilters.isFavorite !== undefined)
				params.append('isFavorite', String(defaultFilters.isFavorite));
			if (defaultFilters.limit) params.append('limit', String(defaultFilters.limit));
			if (defaultFilters.offset) params.append('offset', String(defaultFilters.offset));

			const response = await apiClient.get<{
				data: Contact[];
				meta: ResponseMeta;
			}>(`/v1/contacts?${params.toString()}`);

			return response.data || [];
		},
		staleTime: 30000, // 30 seconds
		gcTime: 300000, // 5 minutes
	});

	// Mutation for creating contacts with optimistic update
	const createContactMutation = useMutation({
		mutationFn: async (contactData: Partial<Contact>) => {
			if (!contactData.name) {
				throw new Error('Nome do contato é obrigatório');
			}
			const response = await apiClient.post<ContactApiResponse>('/v1/contacts', {
				name: contactData.name,
				email: contactData.email || undefined,
				phone: contactData.phone || undefined,
				notes: contactData.notes || undefined,
				isFavorite: contactData.isFavorite,
			});
			return response.data;
		},
		onMutate: async (newContact) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: contactsKeys.lists() });

			// Snapshot the previous value
			const previousContacts = queryClient.getQueryData<Contact[]>(contactsKeys.lists());

			// Optimistically update to the new value
			if (previousContacts && Array.isArray(previousContacts)) {
				queryClient.setQueryData(contactsKeys.lists(), [...previousContacts, newContact as Contact]);
			}

			return { previousContacts };
		},
		onError: (err, newContact, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			queryClient.setQueryData(contactsKeys.lists(), context?.previousContacts);
			toast.error(err.message || 'Falha ao criar contato');
		},
		onSettled: () => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: contactsKeys.favorites() });
		},
		onSuccess: () => {
			toast.success('Contato criado com sucesso!');
		},
	});

	// Mutation for updating contacts
	const updateContactMutation = useMutation({
		mutationFn: async (contactData: Partial<Contact> & { id: string }) => {
			const response = await apiClient.put<ContactApiResponse>(`/v1/contacts/${contactData.id}`, {
				id: contactData.id,
				name: contactData.name,
				email: contactData.email,
				phone: contactData.phone,
				notes: contactData.notes,
				isFavorite: contactData.isFavorite,
			});
			return response.data;
		},
		onSuccess: () => {
			toast.success('Contato atualizado com sucesso!');
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: contactsKeys.favorites() });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Falha ao atualizar contato');
		},
	});

	// Mutation for deleting contacts with optimistic update
	const deleteContactMutation = useMutation({
		mutationFn: async (contactId: string) => {
			await apiClient.delete(`/v1/contacts/${contactId}`);
			return contactId;
		},
		onMutate: async (contactId) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: contactsKeys.lists() });
			await queryClient.cancelQueries({ queryKey: contactsKeys.favorites() });

			// Snapshot the previous value
			const previousContacts = queryClient.getQueryData<Contact[]>(contactsKeys.lists());
			const previousFavorites = queryClient.getQueryData<Contact[]>(contactsKeys.favorites());

			// Optimistically update to remove the contact
			if (previousContacts && Array.isArray(previousContacts)) {
				queryClient.setQueryData(
					contactsKeys.lists(),
					previousContacts.filter((contact: Contact) => contact.id !== contactId),
				);
			}

			if (previousFavorites && Array.isArray(previousFavorites)) {
				queryClient.setQueryData(
					contactsKeys.favorites(),
					previousFavorites.filter((contact: Contact) => contact.id !== contactId),
				);
			}

			return { previousContacts, previousFavorites };
		},
		onError: (err, contactId, context) => {
			// If the mutation fails, use the context to roll back
			queryClient.setQueryData(contactsKeys.lists(), context?.previousContacts);
			queryClient.setQueryData(contactsKeys.favorites(), context?.previousFavorites);
			toast.error(err.message || 'Falha ao remover contato');
		},
		onSettled: () => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: contactsKeys.favorites() });
		},
		onSuccess: () => {
			toast.success('Contato removido com sucesso!');
		},
	});

	// Mutation for toggling favorite status with optimistic update
	const toggleFavoriteMutation = useMutation({
		mutationFn: async (contactId: string) => {
			const response = await apiClient.post<ContactApiResponse>(
				`/v1/contacts/${contactId}/favorite`,
			);
			return response.data;
		},
		onMutate: async (contactId) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: contactsKeys.lists() });
			await queryClient.cancelQueries({ queryKey: contactsKeys.favorites() });

			// Snapshot the previous value
			const previousContacts = queryClient.getQueryData(contactsKeys.lists());
			const previousFavorites = queryClient.getQueryData(contactsKeys.favorites());

			// Optimistically update to toggle favorite status
			if (previousContacts) {
				queryClient.setQueryData(contactsKeys.lists(), (old: Contact[] | undefined) => {
					if (!old) return old;
					return old.map(contact =>
						contact.id === contactId
							? { ...contact, isFavorite: !contact.isFavorite }
							: contact,
					);
				});
			}

			if (previousFavorites) {
				queryClient.setQueryData(contactsKeys.favorites(), (old: Contact[] | undefined) => {
					if (!old) return old;
					const contact = old.find(c => c.id === contactId);
					if (!contact) return old;

					if (contact.isFavorite) {
						// Removing from favorites
						return old.filter(c => c.id !== contactId);
					} else {
						// Adding to favorites
						return [...old, { ...contact, isFavorite: true }];
					}
				});
			}

			return { previousContacts, previousFavorites };
		},
		onError: (err, contactId, context) => {
			// If the mutation fails, use the context to roll back
			queryClient.setQueryData(contactsKeys.lists(), context?.previousContacts);
			queryClient.setQueryData(contactsKeys.favorites(), context?.previousFavorites);
			toast.error(err.message || 'Falha ao alternar favorito');
		},
		onSettled: () => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: contactsKeys.favorites() });
		},
		onSuccess: () => {
			toast.success('Favorito atualizado com sucesso!');
		},
	});

	// Helper functions that use mutations
	const createContact = async (contactData: Partial<Contact>) => {
		return createContactMutation.mutateAsync(contactData);
	};

	const updateContact = async (contactData: Partial<Contact> & { id: string }) => {
		return updateContactMutation.mutateAsync(contactData);
	};

	const deleteContact = async (contactId: string) => {
		await deleteContactMutation.mutateAsync(contactId);
	};

	const toggleFavorite = async (contactId: string) => {
		return toggleFavoriteMutation.mutateAsync(contactId);
	};

	// Wrapper for refetch to match the interface
	const handleRefetch = async (): Promise<Contact[]> => {
		const result = await refetch();
		return result.data ?? [];
	};

	return {
		contacts,
		createContact,
		deleteContact,
		error: error instanceof Error ? error.message : null,
		isCreating: createContactMutation.isPending,
		isDeleting: deleteContactMutation.isPending,
		isLoading,
		isTogglingFavorite: toggleFavoriteMutation.isPending,
		isUpdating: updateContactMutation.isPending,
		refetch: handleRefetch,
		toggleFavorite,
		total: contacts.length,
		updateContact,
	};
}

/**
 * Hook para obter contato específico
 * Migrado para TanStack Query
 */
export function useContact(contactId: string): UseContactReturn {
	const {
		data: contact = null,
		isLoading,
		error,
	} = useQuery({
		queryKey: contactsKeys.detail(contactId),
		queryFn: async () => {
			if (!contactId) return null;
			const response = await apiClient.get<ContactApiResponse>(`/v1/contacts/${contactId}`);
			return response.data;
		},
		enabled: !!contactId,
		staleTime: 60000, // 1 minute
	});

	return {
		contact,
		error: error instanceof Error ? error.message : null,
		isLoading,
	};
}

/**
 * Hook para contatos favoritos
 * Migrado para TanStack Query
 */
export function useFavoriteContacts(): UseFavoriteContactsReturn {
	const {
		data: favoriteContacts = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: contactsKeys.favorites(),
		queryFn: async () => {
			const response = await apiClient.get<{
				data: Contact[];
				meta: ResponseMeta;
			}>('/v1/contacts/favorites');
			return response.data;
		},
		staleTime: 30000, // 30 seconds
	});

	return {
		error: error instanceof Error ? error.message : null,
		favoriteContacts,
		isLoading,
	};
}

/**
 * Hook para busca de contatos
 * Migrado para TanStack Query
 */
export function useContactSearch(query: string, limit = 10): UseContactSearchReturn {
	const {
		data: searchResults = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: contactsKeys.search(query, limit),
		queryFn: async () => {
			if (!query || query.length < 2) return [];

			const response = await apiClient.get<{
				data: Contact[];
				meta: ResponseMeta;
			}>(`/v1/contacts/search?query=${encodeURIComponent(query)}&limit=${limit}`);
			return response.data;
		},
		enabled: !!query && query.length >= 2,
		staleTime: 120000, // 2 minutes for search results
	});

	return {
		error: error instanceof Error ? error.message : null,
		isLoading,
		searchResults,
	};
}

/**
 * Hook para estatísticas dos contatos
 * Migrado para TanStack Query
 */
export function useContactsStats(): UseContactsStatsReturn {
	const {
		data: stats,
		isLoading,
		error,
	} = useQuery({
		queryKey: contactsKeys.stats(),
		queryFn: async () => {
			const response = await apiClient.get<StatsResponse>('/v1/contacts/stats');
			return response.data;
		},
		staleTime: 600000, // 10 minutes for stats
	});

	return {
		error: error instanceof Error ? error.message : null,
		isLoading,
		stats: stats ?? null,
	};
}

/**
 * Hook para contatos recentes
 */
export function useRecentContacts(limit = 5): UseRecentContactsReturn {
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
export function useContactsForTransfer(): UseContactsForTransferReturn {
	const { contacts } = useContacts({ limit: 50 });

	// Filtrar contatos que têm informações para transferência
	const transferableContacts = useMemo(() => {
		return contacts
			.filter((contact: Contact) => contact.email || contact.phone)
			.map((contact: Contact) => ({
				id: contact.id,
				name: contact.name,
				email: contact.email || undefined,
				phone: contact.phone || undefined,
				isFavorite: Boolean(contact.isFavorite),
				// Determinar métodos de pagamento disponíveis
				availableMethods: [
					...(contact.email ? ['EMAIL'] : []),
					...(contact.phone ? ['PHONE'] : []),
				] as Array<'EMAIL' | 'PHONE'>,
			}));
	}, [contacts]);

	return {
		contacts: transferableContacts,
	};
}

/**
 * Hook para contatos com PIX
 */
export function useContactsForPix(): UseContactsForPixReturn {
	const { contacts } = useContacts({ limit: 50 });

	// Filtrar contatos que têm informações para PIX
	const pixContacts = useMemo(() => {
		return contacts
			.filter((contact: Contact) => contact.email || contact.phone)
			.map((contact: Contact) => ({
				id: contact.id,
				name: contact.name,
				email: contact.email || undefined,
				phone: contact.phone || undefined,
				isFavorite: Boolean(contact.isFavorite),
				// Determinar chaves PIX disponíveis
				pixKeys: [
					...(contact.email ? [{ type: 'EMAIL' as const, value: contact.email }] : []),
					...(contact.phone ? [{ type: 'PHONE' as const, value: contact.phone }] : []),
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
export function useContactSuggestions(limit = 3): UseContactSuggestionsReturn {
	const { favoriteContacts } = useFavoriteContacts();
	const { contacts } = useRecentContacts(limit);

	// Combinar favoritos e contatos recentes, removendo duplicatas
	const suggestions = useMemo(() => {
		const allContacts = [...favoriteContacts, ...contacts];
		const uniqueContacts = allContacts.filter(
			(contact, index, self) => index === self.findIndex((c) => c.id === contact.id),
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
export function useContactValidation(): UseContactValidationReturn {
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

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Contact } from '@/db/schema';
import { apiClient } from '@/lib/api-client';

// Response meta type
interface ResponseMeta {
	requestId: string;
	retrievedAt: string;
}

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

	// Query for fetching contacts
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
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});

	// Mutation for creating contacts
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
		onSuccess: () => {
			toast.success('Contato criado com sucesso!');
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Falha ao criar contato');
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

	// Mutation for deleting contacts
	const deleteContactMutation = useMutation({
		mutationFn: async (contactId: string) => {
			await apiClient.delete(`/v1/contacts/${contactId}`);
		},
		onSuccess: () => {
			toast.success('Contato removido com sucesso!');
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: contactsKeys.favorites() });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Falha ao remover contato');
		},
	});

	// Mutation for toggling favorite status
	const toggleFavoriteMutation = useMutation({
		mutationFn: async (contactId: string) => {
			const response = await apiClient.post<ContactApiResponse>(
				`/v1/contacts/${contactId}/favorite`,
			);
			return response.data;
		},
		onSuccess: () => {
			toast.success('Favorito atualizado com sucesso!');
			queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: contactsKeys.favorites() });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Falha ao alternar favorito');
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
		refetch,
		toggleFavorite,
		total: contacts.length,
		updateContact,
	};
}

/**
 * Hook para obter contato específico
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
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		contact,
		error: error instanceof Error ? error.message : null,
		isLoading,
	};
}

/**
 * Hook para contatos favoritos
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
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		error: error instanceof Error ? error.message : null,
		favoriteContacts,
		isLoading,
	};
}

/**
 * Hook para busca de contatos
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
		staleTime: 2 * 60 * 1000, // 2 minutes for search results
	});

	return {
		error: error instanceof Error ? error.message : null,
		isLoading,
		searchResults,
	};
}

/**
 * Hook para estatísticas dos contatos
 */
export function useContactsStats(): UseContactsStatsReturn {
	const {
		data: statsResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: contactsKeys.stats(),
		queryFn: async () => {
			const response = await apiClient.get<StatsResponse>('/v1/contacts/stats');
			return response.data;
		},
		staleTime: 10 * 60 * 1000, // 10 minutes for stats
	});

	return {
		error: error instanceof Error ? error.message : null,
		isLoading,
		stats: statsResponse?.data || null,
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

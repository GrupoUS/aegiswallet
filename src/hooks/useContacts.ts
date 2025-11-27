import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';
import type { Database } from '@/types/database.types';

// Contact type from database
type Contact = Database['public']['Tables']['contacts']['Row'];

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
	updateContact: (
		contactData: Partial<Contact> & { id: string },
	) => Promise<Contact>;
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
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Memoize filters to avoid unnecessary re-renders
	const defaultFilters = useMemo(
		() => ({
			limit: 50,
			offset: 0,
			...filters,
		}),
		[filters],
	);

	const total = contacts.length;

	const createContact = async (contactData: Partial<Contact>) => {
		try {
			if (!contactData.name) {
				throw new Error('Nome do contato é obrigatório');
			}
			const response = await apiClient.post<ContactApiResponse>(
				'/v1/contacts',
				{
					name: contactData.name,
					email: contactData.email || undefined,
					phone: contactData.phone || undefined,
					notes: contactData.notes || undefined,
					isFavorite: contactData.is_favorite || false,
				},
			);

			toast.success('Contato criado com sucesso!');
			await refetch(); // Refresh contacts
			return response.data;
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Falha ao criar contato',
			);
			throw error;
		}
	};

	const updateContact = async (
		contactData: Partial<Contact> & { id: string },
	) => {
		try {
			const response = await apiClient.put<ContactApiResponse>(
				`/v1/contacts/${contactData.id}`,
				{
					id: contactData.id,
					name: contactData.name,
					email: contactData.email,
					phone: contactData.phone,
					notes: contactData.notes,
					isFavorite: contactData.is_favorite,
				},
			);

			toast.success('Contato atualizado com sucesso!');
			await refetch(); // Refresh contacts
			return response.data;
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Falha ao atualizar contato',
			);
			throw error;
		}
	};

	const deleteContact = async (contactId: string) => {
		try {
			await apiClient.delete(`/v1/contacts/${contactId}`);
			toast.success('Contato removido com sucesso!');
			await refetch(); // Refresh contacts
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Falha ao remover contato',
			);
			throw error;
		}
	};

	const toggleFavorite = async (contactId: string) => {
		try {
			const response = await apiClient.post<ContactApiResponse>(
				`/v1/contacts/${contactId}/favorite`,
			);
			toast.success('Favorito atualizado com sucesso!');
			await refetch(); // Refresh contacts
			return response.data;
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Falha ao alternar favorito',
			);
			throw error;
		}
	};

	const refetch = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams();
			if (defaultFilters.search) params.append('search', defaultFilters.search);
			if (defaultFilters.isFavorite !== undefined)
				params.append('isFavorite', String(defaultFilters.isFavorite));
			if (defaultFilters.limit)
				params.append('limit', String(defaultFilters.limit));
			if (defaultFilters.offset)
				params.append('offset', String(defaultFilters.offset));

			const response = await apiClient.get<{
				data: Contact[];
				meta: ResponseMeta;
			}>(`/v1/contacts?${params.toString()}`);

			setContacts(response.data || []);
			return response.data || [];
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Erro ao carregar contatos';
			setError(errorMessage);
			toast.error(errorMessage);
			return [];
		} finally {
			setIsLoading(false);
		}
	}, [defaultFilters]);

	// Load contacts on mount and when filters change
	useEffect(() => {
		refetch();
	}, [refetch]);

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
export function useContact(contactId: string): UseContactReturn {
	const [contact, setContact] = useState<Contact | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!contactId) return;

		const fetchContact = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await apiClient.get<ContactApiResponse>(
					`/v1/contacts/${contactId}`,
				);
				setContact(response.data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Erro ao carregar contato',
				);
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
export function useFavoriteContacts(): UseFavoriteContactsReturn {
	const [favoriteContacts, setFavoriteContacts] = useState<Contact[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchFavoriteContacts = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await apiClient.get<{
				data: Contact[];
				meta: ResponseMeta;
			}>('/v1/contacts/favorites');
			setFavoriteContacts(response.data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Erro ao carregar favoritos',
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchFavoriteContacts();
	}, [fetchFavoriteContacts]);

	return {
		error,
		favoriteContacts,
		isLoading,
	};
}

/**
 * Hook para busca de contatos
 */
export function useContactSearch(
	query: string,
	limit: number = 10,
): UseContactSearchReturn {
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
				const response = await apiClient.get<{
					data: Contact[];
					meta: ResponseMeta;
				}>(
					`/v1/contacts/search?query=${encodeURIComponent(query)}&limit=${limit}`,
				);
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
export function useContactsStats(): UseContactsStatsReturn {
	const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await apiClient.get<StatsResponse>('/v1/contacts/stats');
			setStats(response.data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Erro ao carregar estatísticas',
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	return {
		error,
		isLoading,
		stats,
	};
}

/**
 * Hook para contatos recentes
 */
export function useRecentContacts(limit: number = 5): UseRecentContactsReturn {
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
				isFavorite: Boolean(contact.is_favorite),
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
				isFavorite: Boolean(contact.is_favorite),
				// Determinar chaves PIX disponíveis
				pixKeys: [
					...(contact.email
						? [{ type: 'EMAIL' as const, value: contact.email }]
						: []),
					...(contact.phone
						? [{ type: 'PHONE' as const, value: contact.phone }]
						: []),
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
export function useContactSuggestions(
	limit: number = 3,
): UseContactSuggestionsReturn {
	const { favoriteContacts } = useFavoriteContacts();
	const { contacts } = useRecentContacts(limit);

	// Combinar favoritos e contatos recentes, removendo duplicatas
	const suggestions = useMemo(() => {
		const allContacts = [...favoriteContacts, ...contacts];
		const uniqueContacts = allContacts.filter(
			(contact, index, self) =>
				index === self.findIndex((c) => c.id === contact.id),
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

interface UserProfile {
	id: string;
	email: string;
	full_name?: string;
	phone?: string;
	cpf?: string;
	birth_date?: string;
	profile_image_url?: string;
	is_active?: boolean;
	last_login?: string;
	created_at: string;
	updated_at?: string;
	user_preferences?: UserPreferences[];
}

interface UserPreferences {
	user_id: string;
	// Accessibility
	accessibility_high_contrast?: boolean;
	accessibility_large_text?: boolean;
	accessibility_screen_reader?: boolean;
	font_size?: number;
	reduce_motion?: boolean;
	keyboard_shortcuts?: boolean;
	// AI settings
	autonomy_level?: number;
	ai_model?: string;
	auto_categorize?: boolean;
	budget_alerts?: boolean;
	voice_commands_enabled?: boolean;
	voice_feedback?: boolean;
	show_reasoning?: boolean;
	custom_prompt?: string;
	chat_history_cleared_at?: string;
	// Regional
	currency?: string;
	language?: string;
	timezone?: string;
	// Theme
	theme?: string;
	// Notifications
	email_notifications?: boolean;
	notifications_enabled?: boolean;
	push_notifications?: boolean;
	notifications_email?: boolean;
	notifications_push?: boolean;
	notifications_sms?: boolean;
	// Notification types
	notify_transactions?: boolean;
	notify_budget_exceeded?: boolean;
	notify_bill_reminders?: boolean;
	notify_security?: boolean;
	notify_weekly_summary?: boolean;
	notify_tips?: boolean;
	// Quiet hours
	quiet_hours_enabled?: boolean;
	quiet_hours_start?: string;
	quiet_hours_end?: string;
	[key: string]: unknown;
}

interface ProfileApiResponse<T> {
	data: T;
	meta: {
		requestId: string;
		retrievedAt?: string;
		updatedAt?: string;
	};
}

interface UseProfileReturn {
	profile: UserProfile | undefined;
	isLoading: boolean;
	error: Error | null;
	isUpdatingProfile: boolean;
	isUpdatingPreferences: boolean;
	updateProfile: (input: {
		full_name?: string;
		phone?: string;
		cpf?: string;
		birth_date?: string;
		profile_image_url?: string;
	}) => void;
	updatePreferences: (input: Record<string, unknown>) => void;
	updateLastLogin: () => void;
}

interface UseFinancialSummaryReturn {
	summary: { income: number; expenses: number; balance: number } | undefined;
	isLoading: boolean;
	error: Error | null;
}

interface UseUserStatusReturn {
	status: { is_active: boolean; last_login: string | null } | undefined;
	isActive: boolean;
	lastLogin: string | null;
	isLoading: boolean;
	error: Error | null;
}

/**
 * Hook para gerenciar perfil do usuário
 */
export function useProfile(): UseProfileReturn {
	const queryClient = useQueryClient();

	const {
		data: profileResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['users', 'me'],
		queryFn: async () => {
			const response =
				await apiClient.get<ProfileApiResponse<UserProfile>>('/v1/users/me');
			return response.data;
		},
	});

	const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
		mutationFn: async (input: {
			full_name?: string;
			phone?: string;
			cpf?: string;
			birth_date?: string;
			profile_image_url?: string;
		}) => {
			const response = await apiClient.put<ProfileApiResponse<UserProfile>>(
				'/v1/users/me',
				input,
			);
			return response.data;
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Erro ao atualizar perfil');
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
			toast.success('Perfil atualizado com sucesso!');
		},
	});

	const { mutate: updatePreferences, isPending: isUpdatingPreferences } =
		useMutation({
			mutationFn: async (input: Record<string, unknown>) => {
				const response = await apiClient.put<
					ProfileApiResponse<UserPreferences>
				>('/v1/users/me/preferences', input);
				return response.data;
			},
			onError: (error: Error) => {
				toast.error(error.message || 'Erro ao atualizar preferências');
			},
			onSuccess: (data) => {
				queryClient.setQueryData(
					['users', 'me'],
					(old: UserProfile | undefined) => {
						if (!old) {
							return old;
						}

						return {
							...old,
							user_preferences: data ? [data] : [],
						};
					},
				);

				toast.success('Preferências atualizadas com sucesso!');
			},
		});

	const { mutate: updateLastLogin } = useMutation({
		mutationFn: async () => {
			const response = await apiClient.post<
				ProfileApiResponse<{ success: boolean }>
			>('/v1/users/me/last-login');
			return response.data;
		},
	});

	return {
		error,
		isLoading,
		isUpdatingPreferences,
		isUpdatingProfile,
		profile: profileResponse,
		updateLastLogin,
		updatePreferences,
		updateProfile,
	};
}

/**
 * Hook para obter resumo financeiro do usuário
 */
export function useFinancialSummary(
	startDate: string,
	endDate: string,
): UseFinancialSummaryReturn {
	const {
		data: summaryResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['users', 'financial-summary', startDate, endDate],
		queryFn: async () => {
			const response = await apiClient.get<
				ProfileApiResponse<{
					income: number;
					expenses: number;
					balance: number;
				}>
			>('/v1/users/me/financial-summary', {
				params: {
					period_start: startDate,
					period_end: endDate,
				},
			});
			return response.data;
		},
		enabled: !!startDate && !!endDate,
	});

	return {
		error,
		isLoading,
		summary: summaryResponse,
	};
}

/**
 * Hook para verificar status do usuário
 */
export function useUserStatus(): UseUserStatusReturn {
	const {
		data: statusResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['users', 'status'],
		queryFn: async () => {
			const response = await apiClient.get<
				ProfileApiResponse<{ is_active: boolean; last_login: string | null }>
			>('/v1/users/me/status');
			return response.data;
		},
	});

	return {
		error,
		isActive: statusResponse?.is_active ?? false,
		isLoading,
		lastLogin: statusResponse?.last_login ?? null,
		status: statusResponse,
	};
}

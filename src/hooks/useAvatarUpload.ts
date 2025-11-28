/**
 * Avatar Upload Hook
 *
 * Handles uploading user profile images to Supabase Storage
 * with proper error handling and optimistic updates.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

interface UseAvatarUploadReturn {
	uploadAvatar: (file: File) => void;
	isUploading: boolean;
	error: Error | null;
}

const BUCKET_NAME = 'profile-images';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Hook for uploading user avatar images to Supabase Storage
 */
export function useAvatarUpload(): UseAvatarUploadReturn {
	const queryClient = useQueryClient();

	const {
		mutate: uploadAvatar,
		isPending: isUploading,
		error,
	} = useMutation({
		mutationFn: async (file: File) => {
			// Validate file size
			if (file.size > MAX_FILE_SIZE) {
				throw new Error('Imagem muito grande. Máximo 2MB.');
			}

			// Validate file type
			if (!ALLOWED_TYPES.includes(file.type)) {
				throw new Error('Formato inválido. Use JPG, PNG ou WebP.');
			}

			// Get current user
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError || !user) {
				throw new Error('Usuário não autenticado');
			}

			// Generate unique filename
			const fileExt = file.name.split('.').pop();
			const fileName = `${user.id}/${Date.now()}.${fileExt}`;

			// Upload to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from(BUCKET_NAME)
				.upload(fileName, file, {
					cacheControl: '3600',
					upsert: true,
				});

			if (uploadError) {
				throw new Error(`Falha no upload: ${uploadError.message}`);
			}

			// Get public URL
			const {
				data: { publicUrl },
			} = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

			// Update user profile with new image URL
			const { error: updateError } = await supabase
				.from('users')
				.update({ profile_image_url: publicUrl })
				.eq('id', user.id);

			if (updateError) {
				throw new Error(`Falha ao atualizar perfil: ${updateError.message}`);
			}

			return publicUrl;
		},
		onSuccess: () => {
			// Invalidate profile query to refetch with new image
			queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
			toast.success('Foto de perfil atualizada!');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Erro ao fazer upload da imagem');
		},
	});

	return {
		error: error as Error | null,
		isUploading,
		uploadAvatar,
	};
}

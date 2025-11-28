/**
 * Avatar Upload Hook
 *
 * NOTE: This hook was previously using Supabase Storage.
 * After migration to Neon/Clerk, file storage needs to be implemented
 * with a different provider (Cloudflare R2, AWS S3, etc.)
 * 
 * For now, this returns a stub that shows a not implemented message.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseAvatarUploadReturn {
	uploadAvatar: (file: File) => void;
	isUploading: boolean;
	error: Error | null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Hook for uploading user avatar images
 * TODO: Implement with Cloudflare R2, AWS S3, or similar storage
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

			// TODO: Implement file upload to new storage provider
			// Options: Cloudflare R2, AWS S3, Vercel Blob Storage
			throw new Error('Upload de avatar temporariamente indisponível. Funcionalidade em migração.');
		},
		onSuccess: () => {
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

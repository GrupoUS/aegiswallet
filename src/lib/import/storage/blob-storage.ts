/**
 * Blob Storage - Temporary file storage for import processing
 *
 * Uses Vercel Blob for temporary file storage during import
 */

import { del, head, put } from '@vercel/blob';

import { BLOB_TTL_SECONDS } from '@/lib/import/constants/bank-patterns';
import { secureLogger } from '@/lib/logging/secure-logger';

// ========================================
// TYPES
// ========================================

export interface BlobUploadResult {
	/** Public URL for the blob */
	url: string;
	/** Pathname for reference and deletion */
	pathname: string;
	/** Content type of the blob */
	contentType: string;
	/** Size in bytes */
	size: number;
}

export interface BlobMetadata {
	url: string;
	pathname: string;
	contentType: string;
	size: number;
	uploadedAt: string;
}

// ========================================
// CONFIGURATION
// ========================================

/**
 * Get Blob token from environment
 */
function getBlobToken(): string {
	const token = process.env.BLOB_READ_WRITE_TOKEN;

	if (!token) {
		throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
	}

	return token;
}

/**
 * Check if Blob storage is configured
 */
export function isBlobConfigured(): boolean {
	return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// ========================================
// UPLOAD FUNCTIONS
// ========================================

/**
 * Upload a temporary file to Vercel Blob
 *
 * @param file - File buffer to upload
 * @param fileName - Original file name
 * @param contentType - MIME type of the file
 * @param userId - User ID for path organization
 * @param sessionId - Session ID for path organization
 * @returns Upload result with URL and pathname
 */
export async function uploadTemporaryFile(
	file: Buffer,
	fileName: string,
	contentType: string,
	userId: string,
	sessionId: string,
): Promise<BlobUploadResult> {
	const startTime = Date.now();

	try {
		const token = getBlobToken();

		// Create a clean filename
		const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
		const pathname = `import-temp/${userId}/${sessionId}/${cleanFileName}`;

		secureLogger.info('Uploading temporary file to Blob', {
			component: 'blob-storage',
			action: 'upload',
			pathname,
			contentType,
			size: file.length,
		});

		const blob = await put(pathname, file, {
			access: 'public',
			contentType,
			token,
			addRandomSuffix: false,
		});

		const processingTime = Date.now() - startTime;

		secureLogger.info('File uploaded to Blob successfully', {
			component: 'blob-storage',
			action: 'upload',
			pathname: blob.pathname,
			url: blob.url,
			processingTimeMs: processingTime,
		});

		return {
			url: blob.url,
			pathname: blob.pathname,
			contentType,
			size: file.length,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const processingTime = Date.now() - startTime;

		secureLogger.error('Failed to upload file to Blob', {
			component: 'blob-storage',
			action: 'upload',
			error: errorMessage,
			processingTimeMs: processingTime,
		});

		// Provide user-friendly error messages
		if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
			throw new Error('Limite de armazenamento atingido. Tente novamente mais tarde.');
		}

		if (errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
			throw new Error('Erro de configuração do armazenamento. Contate o suporte.');
		}

		throw new Error(`Erro ao fazer upload do arquivo: ${errorMessage}`);
	}
}

// ========================================
// RETRIEVAL FUNCTIONS
// ========================================

/**
 * Check if a temporary file exists
 *
 * @param pathname - Blob pathname
 * @returns True if file exists
 */
export async function checkTemporaryFile(pathname: string): Promise<boolean> {
	try {
		const token = getBlobToken();
		const result = await head(pathname, { token });
		return Boolean(result);
	} catch {
		return false;
	}
}

/**
 * Get metadata for a temporary file
 *
 * @param pathname - Blob pathname
 * @returns Blob metadata or null if not found
 */
export async function getTemporaryFileMetadata(pathname: string): Promise<BlobMetadata | null> {
	try {
		const token = getBlobToken();
		const result = await head(pathname, { token });

		if (!result) {
			return null;
		}

		return {
			url: result.url,
			pathname: result.pathname,
			contentType: result.contentType,
			size: result.size,
			uploadedAt: result.uploadedAt.toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Fetch a temporary file's content
 *
 * @param url - Blob URL
 * @returns File content as Buffer
 */
export async function getTemporaryFile(url: string): Promise<Buffer> {
	try {
		secureLogger.info('Fetching file from Blob', {
			component: 'blob-storage',
			action: 'fetch',
		});

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch file: ${response.status}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.error('Failed to fetch file from Blob', {
			component: 'blob-storage',
			action: 'fetch',
			error: errorMessage,
		});

		if (errorMessage.includes('404') || errorMessage.includes('not found')) {
			throw new Error('Arquivo não encontrado ou expirado. Faça upload novamente.');
		}

		throw new Error(`Erro ao recuperar arquivo: ${errorMessage}`);
	}
}

// ========================================
// DELETION FUNCTIONS
// ========================================

/**
 * Delete a temporary file from Vercel Blob
 *
 * @param urlOrPathname - Blob URL or pathname
 */
export async function deleteTemporaryFile(urlOrPathname: string): Promise<void> {
	try {
		const token = getBlobToken();

		secureLogger.info('Deleting file from Blob', {
			component: 'blob-storage',
			action: 'delete',
		});

		await del(urlOrPathname, { token });

		secureLogger.info('File deleted from Blob successfully', {
			component: 'blob-storage',
			action: 'delete',
		});
	} catch (error) {
		// Silently ignore deletion errors (file might already be deleted or expired)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		secureLogger.warn('Failed to delete file from Blob (may already be deleted)', {
			component: 'blob-storage',
			action: 'delete',
			error: errorMessage,
		});
	}
}

/**
 * Delete all temporary files for a session
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 */
export function deleteSessionFiles(userId: string, sessionId: string): void {
	// Note: Vercel Blob doesn't support directory deletion directly
	// Files will be cleaned up by TTL or individually
	// This is a placeholder for potential future implementation

	secureLogger.info('Session file cleanup requested', {
		component: 'blob-storage',
		action: 'cleanup-session',
		userId,
		sessionId,
	});
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Generate a unique pathname for a file
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 * @param fileName - Original file name
 * @returns Generated pathname
 */
export function generatePathname(userId: string, sessionId: string, fileName: string): string {
	const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
	const timestamp = Date.now();
	return `import-temp/${userId}/${sessionId}/${timestamp}_${cleanFileName}`;
}

/**
 * Get TTL information message
 */
export function getTTLMessage(): string {
	const hours = Math.floor(BLOB_TTL_SECONDS / 3600);
	return `O arquivo será automaticamente removido após ${hours} hora(s).`;
}

/**
 * LGPD-Compliant Audio Storage Service
 *
 * Features:
 * - Encrypted audio storage via API
 * - Automatic retention policy (12 months)
 * - Audit logging for compliance
 * - User consent management
 *
 * NOTE: Uses API-based operations with NeonDB backend
 *
 * @module audioStorage
 */

import { apiClient } from '@/lib/api-client';
import type { EncryptedData } from '@/lib/security/audioEncryption';
import { AudioEncryptionService } from '@/lib/security/audioEncryption';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AudioStorageConfig {
	encryptionService: AudioEncryptionService;
	bucketName?: string;
	retentionDays?: number;
}

export interface StoredAudio {
	id: string;
	userId: string;
	storagePath: string;
	transcript: string;
	confidence: number;
	language: string;
	processingTimeMs: number;
	createdAt: Date;
	expiresAt: Date;
}

export interface UserConsent {
	userId: string;
	consentGiven: boolean;
	consentDate: Date;
}

export interface AuditLog {
	id: string;
	userId: string;
	action: 'upload' | 'download' | 'delete' | 'access';
	audioId: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

// ============================================================================
// Audio Storage Service
// ============================================================================

export class AudioStorageService {
	private config: Required<AudioStorageConfig>;

	constructor(config: AudioStorageConfig) {
		this.config = {
			bucketName: config.bucketName || 'voice-recordings',
			encryptionService: config.encryptionService,
			retentionDays: config.retentionDays || 365, // 12 months
		};
	}

	/**
	 * Store audio with encryption and metadata
	 * NOTE: Uses API calls with NeonDB backend
	 *
	 * @param userId - User ID
	 * @param audioBlob - Audio data
	 * @param transcript - Transcription text
	 * @param metadata - Additional metadata
	 * @returns Stored audio record
	 */
	async storeAudio(
		userId: string,
		audioBlob: Blob,
		transcript: string,
		metadata: {
			confidence: number;
			language: string;
			processingTimeMs: number;
		},
	): Promise<StoredAudio> {
		try {
			// Check user consent
			const hasConsent = await this.checkConsent(userId);
			if (!hasConsent) {
				throw new Error('User consent required for audio storage');
			}

			// Encrypt audio
			const encryptedAudio = await this.config.encryptionService.encryptAudio(audioBlob);

			// Anonymize transcript
			const anonymizedTranscript = AudioEncryptionService.anonymizeText(transcript);

			// Encrypt transcript
			const encryptedTranscript =
				await this.config.encryptionService.encryptText(anonymizedTranscript);

			// Generate storage path
			const audioId = crypto.randomUUID();
			const storagePath = `${userId}/${audioId}.enc`;

			// Calculate expiration date
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + this.config.retentionDays);

			// Store audio and metadata via API
			const response = await apiClient.post<{ data: { created_at: string } }>('/v1/voice/audio', {
				audio_data: JSON.stringify(encryptedAudio),
				audio_storage_path: storagePath,
				bucket_name: this.config.bucketName,
				confidence_score: metadata.confidence,
				created_at: new Date().toISOString(),
				expires_at: expiresAt.toISOString(),
				id: audioId,
				language: metadata.language,
				processing_time_ms: metadata.processingTimeMs,
				transcript: JSON.stringify(encryptedTranscript),
				user_id: userId,
			});

			// Log audit trail
			await this.logAudit(userId, 'upload', audioId, {
				confidence: metadata.confidence,
				storagePath,
			});

			return {
				confidence: metadata.confidence,
				createdAt: new Date(response.data?.created_at || new Date().toISOString()),
				expiresAt,
				id: audioId,
				language: metadata.language,
				processingTimeMs: metadata.processingTimeMs,
				storagePath,
				transcript: anonymizedTranscript,
				userId,
			};
		} catch (error) {
			throw new Error(`Audio storage failed: ${error}`, { cause: error });
		}
	}

	/**
	 * Retrieve and decrypt audio
	 * NOTE: Uses API calls with NeonDB backend
	 *
	 * @param userId - User ID
	 * @param audioId - Audio record ID
	 * @returns Decrypted audio blob
	 */
	async retrieveAudio(userId: string, audioId: string): Promise<Blob> {
		try {
			// Get audio data via API
			const response = await apiClient.get<{
				audio_data: string;
				audio_storage_path: string;
			}>(`/v1/voice/audio/${audioId}`, {
				params: { user_id: userId },
			});

			if (!response?.audio_data) {
				throw new Error('Audio not found or access denied');
			}

			// Parse encrypted data
			const encryptedData: EncryptedData = JSON.parse(response.audio_data);

			// Decrypt audio
			const audioBlob = await this.config.encryptionService.decryptAudio(encryptedData);

			// Log audit trail
			await this.logAudit(userId, 'download', audioId);

			return audioBlob;
		} catch (error) {
			throw new Error(`Audio retrieval failed: ${error}`, { cause: error });
		}
	}

	/**
	 * Delete audio and metadata
	 * NOTE: Uses API calls with NeonDB backend
	 *
	 * @param userId - User ID
	 * @param audioId - Audio record ID
	 */
	async deleteAudio(userId: string, audioId: string): Promise<void> {
		try {
			// Delete via API
			await apiClient.delete(`/v1/voice/audio/${audioId}?user_id=${userId}`);

			// Log audit trail
			await this.logAudit(userId, 'delete', audioId);
		} catch (error) {
			throw new Error(`Audio deletion failed: ${error}`, { cause: error });
		}
	}

	/**
	 * Check if user has given consent for audio storage
	 * NOTE: Uses API calls with NeonDB backend
	 */
	async checkConsent(userId: string): Promise<boolean> {
		try {
			const response = await apiClient.get<{ consent_given: boolean }>(
				`/v1/voice/consent/${userId}`,
			);

			return response?.consent_given === true;
		} catch {
			return false;
		}
	}

	/**
	 * Record user consent
	 * NOTE: Uses API calls with NeonDB backend
	 */
	async recordConsent(userId: string, consentGiven: boolean): Promise<void> {
		try {
			await apiClient.post('/v1/voice/consent', {
				consent_date: new Date().toISOString(),
				consent_given: consentGiven,
				updated_at: new Date().toISOString(),
				user_id: userId,
			});
		} catch (error) {
			throw new Error(`Consent recording failed: ${error}`, { cause: error });
		}
	}

	/**
	 * Log audit trail for compliance
	 * NOTE: Uses API calls with NeonDB backend
	 */
	private async logAudit(
		userId: string,
		action: AuditLog['action'],
		audioId: string,
		metadata?: Record<string, unknown>,
	): Promise<void> {
		try {
			await apiClient.post('/v1/voice/audit-logs', {
				action,
				audio_id: audioId,
				metadata: metadata || {},
				timestamp: new Date().toISOString(),
				user_id: userId,
			});
		} catch (_error) {
			// Silent fail - audit logging is best effort
		}
	}

	/**
	 * Cleanup expired audio files (run periodically)
	 * NOTE: Uses API calls with NeonDB backend
	 */
	async cleanupExpiredAudio(): Promise<number> {
		try {
			// Request cleanup via API
			const response = await apiClient.post<{ deleted_count: number }>('/v1/voice/cleanup', {
				before: new Date().toISOString(),
			});

			return response.deleted_count || 0;
		} catch (error) {
			throw new Error(`Cleanup failed: ${error}`, { cause: error });
		}
	}
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create audio storage service
 * NOTE: Uses NeonDB via Drizzle ORM
 */
export function createAudioStorageService(
	encryptionService: AudioEncryptionService,
): AudioStorageService {
	return new AudioStorageService({
		bucketName: 'voice-recordings',
		encryptionService,
		retentionDays: 365, // 12 months LGPD compliance
	});
}

/**
 * Audio Encryption Service for LGPD Compliance
 *
 * Implements AES-256-GCM encryption for audio files and transcriptions
 *
 * Features:
 * - AES-256-GCM encryption (industry standard)
 * - Secure key derivation from master key
 * - Initialization vector (IV) generation
 * - Authenticated encryption (prevents tampering)
 * - LGPD-compliant data protection
 *
 * @module audioEncryption
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EncryptedData {
	ciphertext: string; // Base64 encoded
	iv: string; // Base64 encoded initialization vector
	authTag: string; // Base64 encoded authentication tag
	algorithm: 'aes-256-gcm';
	timestamp: Date;
}

export interface EncryptionConfig {
	masterKey: string; // Base64 encoded 256-bit key
	algorithm?: 'aes-256-gcm';
}

// ============================================================================
// Audio Encryption Service
// ============================================================================

export class AudioEncryptionService {
	private masterKey: CryptoKey | null = null;
	private readonly algorithm = 'AES-GCM';
	private readonly keyLength = 256;

	constructor(private config: EncryptionConfig) {
		if (!config.masterKey) {
			throw new Error('Master encryption key is required');
		}
	}

	/**
	 * Initialize encryption service (async key derivation)
	 */
	async initialize(): Promise<void> {
		try {
			// Decode master key from base64
			const keyData = this.base64ToArrayBuffer(this.config.masterKey);

			// Import key for AES-GCM
			this.masterKey = await crypto.subtle.importKey(
				'raw',
				keyData,
				{ length: this.keyLength, name: this.algorithm },
				false, // not extractable
				['encrypt', 'decrypt'],
			);
		} catch (error) {
			throw new Error(`Failed to initialize encryption: ${error}`, {
				cause: error,
			});
		}
	}

	/**
	 * Encrypt audio blob
	 *
	 * @param audioBlob - Audio data to encrypt
	 * @returns Encrypted data with metadata
	 */
	async encryptAudio(audioBlob: Blob): Promise<EncryptedData> {
		if (!this.masterKey) {
			await this.initialize();
		}

		try {
			// Convert blob to array buffer
			const audioData = await audioBlob.arrayBuffer();

			// Generate random IV (12 bytes for GCM)
			const iv = crypto.getRandomValues(new Uint8Array(12));

			// Encrypt data
			if (!this.masterKey) {
				throw new Error('Master key not initialized');
			}
			const encryptedData = await crypto.subtle.encrypt(
				{
					iv: iv,
					name: this.algorithm,
					tagLength: 128, // 128-bit authentication tag
				},
				this.masterKey,
				audioData,
			);

			// Extract authentication tag (last 16 bytes)
			const ciphertext = new Uint8Array(encryptedData.slice(0, -16));
			const authTag = new Uint8Array(encryptedData.slice(-16));

			return {
				algorithm: 'aes-256-gcm',
				authTag: this.arrayBufferToBase64(authTag),
				ciphertext: this.arrayBufferToBase64(ciphertext),
				iv: this.arrayBufferToBase64(iv),
				timestamp: new Date(),
			};
		} catch (error) {
			throw new Error(`Encryption failed: ${error}`, { cause: error });
		}
	}

	/**
	 * Decrypt audio data
	 *
	 * @param encryptedData - Encrypted data with metadata
	 * @returns Decrypted audio as Blob
	 */
	async decryptAudio(encryptedData: EncryptedData): Promise<Blob> {
		if (!this.masterKey) {
			await this.initialize();
		}

		try {
			// Decode base64 data
			const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
			const iv = this.base64ToArrayBuffer(encryptedData.iv);
			const authTag = this.base64ToArrayBuffer(encryptedData.authTag);

			// Combine ciphertext and auth tag
			const encryptedBuffer = new Uint8Array(
				ciphertext.byteLength + authTag.byteLength,
			);
			encryptedBuffer.set(new Uint8Array(ciphertext), 0);
			encryptedBuffer.set(new Uint8Array(authTag), ciphertext.byteLength);

			// Decrypt data
			if (!this.masterKey) {
				throw new Error('Master key not initialized');
			}
			const decryptedData = await crypto.subtle.decrypt(
				{
					iv: new Uint8Array(iv),
					name: this.algorithm,
					tagLength: 128,
				},
				this.masterKey,
				encryptedBuffer,
			);

			// Return as Blob
			return new Blob([decryptedData], { type: 'audio/webm' });
		} catch (error) {
			throw new Error(`Decryption failed: ${error}`, { cause: error });
		}
	}

	/**
	 * Encrypt text (for transcriptions)
	 *
	 * @param text - Text to encrypt
	 * @returns Encrypted data with metadata
	 */
	async encryptText(text: string): Promise<EncryptedData> {
		const textBlob = new Blob([text], { type: 'text/plain' });
		return this.encryptAudio(textBlob);
	}

	/**
	 * Decrypt text (for transcriptions)
	 *
	 * @param encryptedData - Encrypted data with metadata
	 * @returns Decrypted text
	 */
	async decryptText(encryptedData: EncryptedData): Promise<string> {
		const blob = await this.decryptAudio(encryptedData);
		return await blob.text();
	}

	/**
	 * Generate secure random encryption key
	 *
	 * @returns Base64 encoded 256-bit key
	 */
	static generateKey(): string {
		const key = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
		return btoa(String.fromCharCode(...key));
	}

	/**
	 * Anonymize personal data in transcription
	 *
	 * Removes/masks:
	 * - CPF (Brazilian tax ID)
	 * - Phone numbers
	 * - Email addresses
	 * - Credit card numbers
	 *
	 * @param text - Text to anonymize
	 * @returns Anonymized text
	 */
	static anonymizeText(text: string): string {
		let anonymized = text;

		// Anonymize CPF (format: 123.456.789-01 or 12345678901)
		anonymized = anonymized.replace(
			/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g,
			'***.***.***-**',
		);

		// Anonymize phone numbers (format: (11) 98765-4321 or 11987654321)
		anonymized = anonymized.replace(
			/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g,
			'(**) *****-****',
		);

		// Anonymize email addresses
		anonymized = anonymized.replace(
			/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
			'***@***.***',
		);

		// Anonymize credit card numbers (format: 1234 5678 9012 3456)
		anonymized = anonymized.replace(
			/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
			'**** **** **** ****',
		);

		return anonymized;
	}

	// ============================================================================
	// Utility Methods
	// ============================================================================

	private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
		const bytes =
			buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	}
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create encryption service with environment configuration
 */
export function createEncryptionService(
	masterKey?: string,
): AudioEncryptionService {
	const key =
		masterKey ||
		import.meta.env.VITE_ENCRYPTION_KEY ||
		process.env.ENCRYPTION_KEY;

	if (!key) {
		throw new Error(
			'Encryption key not found. Set VITE_ENCRYPTION_KEY or ENCRYPTION_KEY.',
		);
	}

	return new AudioEncryptionService({ masterKey: key });
}

/**
 * Generate and display new encryption key (for initial setup)
 */
export function generateEncryptionKey(): void {
	AudioEncryptionService.generateKey();
}

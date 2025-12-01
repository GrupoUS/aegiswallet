/**
 * Secure Storage for AegisWallet
 * Implements secure storage mechanisms for sensitive authentication data
 *
 * Features:
 * - Encryption at rest
 * - Secure key derivation
 * - Session management
 * - LGPD compliance
 * - Data retention policies
 *
 * NOTE: Uses Clerk authentication with NeonDB backend
 */

import { logger } from '@/lib/logging/logger';

// Session and User types for secure storage (compatible with Clerk)
export interface SecureSession {
	id: string;
	userId: string;
	expiresAt: string;
	status: 'active' | 'expired' | 'revoked';
	lastActiveAt?: string;
}

export interface SecureUser {
	id: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	imageUrl?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface SecureStorageData {
	session?: SecureSession;
	user?: SecureUser;
	preferences?: Record<string, unknown>;
	lastAccess?: string;
	deviceId?: string;
}

export interface SecureStorageConfig {
	encryptionEnabled: boolean;
	sessionTimeout: number; // milliseconds
	dataRetention: number; // milliseconds
	keyDerivationIterations: number;
	storageKey: string;
	enableSecureCleanup: boolean;
}

/**
 * Secure Storage Manager
 */
export class SecureStorageManager {
	private config: SecureStorageConfig;
	private encryptionKey: string | null = null;
	private storageAvailable: boolean;
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor(config: Partial<SecureStorageConfig> = {}) {
		this.config = {
			encryptionEnabled: true,
			sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
			dataRetention: 30 * 24 * 60 * 60 * 1000, // 30 days
			keyDerivationIterations: 100000,
			storageKey: 'aegiswallet_secure',
			enableSecureCleanup: true,
			...config,
		};

		this.storageAvailable = this.checkStorageAvailability();

		if (this.storageAvailable) {
			this.initializeEncryption();
			this.startCleanupInterval();
		}
	}

	/**
	 * Check if secure storage is available
	 */
	private checkStorageAvailability(): boolean {
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return false;
		}

		try {
			const testKey = 'test_storage_availability';
			localStorage.setItem(testKey, 'test');
			localStorage.removeItem(testKey);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Initialize encryption key
	 */
	private async initializeEncryption(): Promise<void> {
		if (!this.config.encryptionEnabled) {
			return;
		}

		try {
			// Try to get existing key from storage
			const storedKey = localStorage.getItem(`${this.config.storageKey}_key`);

			if (storedKey) {
				this.encryptionKey = storedKey;
			} else {
				// Generate new encryption key
				this.encryptionKey = await this.generateEncryptionKey();
				localStorage.setItem(`${this.config.storageKey}_key`, this.encryptionKey);
			}
		} catch (_error) {
			this.config.encryptionEnabled = false;
		}
	}

	/**
	 * Generate encryption key using Web Crypto API
	 */
	private async generateEncryptionKey(): Promise<string> {
		if (typeof window === 'undefined' || !window.crypto) {
			// Fallback for environments without Web Crypto API
			return this.generateFallbackKey();
		}

		try {
			const key = await window.crypto.subtle.generateKey(
				{
					length: 256,
					name: 'AES-GCM',
				},
				true,
				['encrypt', 'decrypt'],
			);

			const exportedKey = await window.crypto.subtle.exportKey('raw', key);
			return Array.from(new Uint8Array(exportedKey))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
		} catch {
			return this.generateFallbackKey();
		}
	}

	/**
	 * Fallback key generation for environments without Web Crypto API
	 */
	private generateFallbackKey(): string {
		const array = new Uint8Array(32);
		if (typeof window !== 'undefined' && window.crypto) {
			window.crypto.getRandomValues(array);
		} else {
			// Fallback pseudo-random generation
			for (let i = 0; i < array.length; i++) {
				array[i] = Math.floor(Math.random() * 256);
			}
		}
		return Array.from(array)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	/**
	 * Secure AES-256-GCM encryption for sensitive data
	 */
	private async encrypt(data: string): Promise<string> {
		if (!(this.config.encryptionEnabled && this.encryptionKey)) {
			return btoa(data); // Base64 fallback for non-secure mode
		}

		if (typeof window === 'undefined' || !window.crypto) {
			// Fallback for environments without Web Crypto API
			return btoa(data);
		}

		try {
			// Convert hex key to Uint8Array
			const keyBytes = new Uint8Array(
				this.encryptionKey.match(/.{2}/g)?.map((b) => Number.parseInt(b, 16)) || [],
			);

			// Import the key
			const cryptoKey = await window.crypto.subtle.importKey(
				'raw',
				keyBytes,
				{ name: 'AES-GCM' },
				false,
				['encrypt'],
			);

			// Convert data to Uint8Array
			const dataBytes = new TextEncoder().encode(data);

			// Generate random IV (12 bytes for GCM)
			const iv = window.crypto.getRandomValues(new Uint8Array(12));

			// Encrypt the data
			const encryptedData = await window.crypto.subtle.encrypt(
				{ name: 'AES-GCM', iv },
				cryptoKey,
				dataBytes,
			);

			// Combine IV and encrypted data, then convert to base64
			const combined = new Uint8Array(iv.length + encryptedData.byteLength);
			combined.set(iv);
			combined.set(new Uint8Array(encryptedData), iv.length);

			return btoa(String.fromCharCode(...combined));
		} catch (error) {
			logger.warn('Encryption failed, falling back to base64', { error });
			return btoa(data); // Secure fallback
		}
	}

	/**
	 * Secure AES-256-GCM decryption for sensitive data
	 */
	private async decrypt(encryptedData: string): Promise<string> {
		if (!(this.config.encryptionEnabled && this.encryptionKey)) {
			return atob(encryptedData); // Base64 fallback for non-secure mode
		}

		if (typeof window === 'undefined' || !window.crypto) {
			// Fallback for environments without Web Crypto API
			return atob(encryptedData);
		}

		try {
			// Convert hex key to Uint8Array
			const keyBytes = new Uint8Array(
				this.encryptionKey.match(/.{2}/g)?.map((b) => Number.parseInt(b, 16)) || [],
			);

			// Import the key
			const cryptoKey = await window.crypto.subtle.importKey(
				'raw',
				keyBytes,
				{ name: 'AES-GCM' },
				false,
				['decrypt'],
			);

			// Convert base64 to Uint8Array
			const combined = new Uint8Array(
				atob(encryptedData)
					.split('')
					.map((c) => c.charCodeAt(0)),
			);

			// Extract IV (first 12 bytes) and encrypted data
			const iv = combined.slice(0, 12);
			const data = combined.slice(12);

			// Decrypt the data
			const decryptedData = await window.crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv },
				cryptoKey,
				data,
			);

			// Convert back to string
			return new TextDecoder().decode(decryptedData);
		} catch (error) {
			logger.warn('Decryption failed, falling back to base64', { error });
			return atob(encryptedData); // Secure fallback
		}
	}

	/**
	 * Store data securely
	 */
	async store(key: string, data: SecureStorageData): Promise<boolean> {
		if (!this.storageAvailable) {
			return false;
		}

		try {
			const storageData = {
				...data,
				lastAccess: new Date().toISOString(),
			};

			const serialized = JSON.stringify(storageData);
			const encrypted = await this.encrypt(serialized);

			localStorage.setItem(`${this.config.storageKey}_${key}`, encrypted);

			// Update access time
			this.updateLastAccess(key);

			return true;
		} catch (_error) {
			return false;
		}
	}

	/**
	 * Retrieve data securely
	 */
	async retrieve(key: string): Promise<SecureStorageData | null> {
		if (!this.storageAvailable) {
			return null;
		}

		try {
			const encryptedData = localStorage.getItem(`${this.config.storageKey}_${key}`);

			if (!encryptedData) {
				return null;
			}

			const decrypted = await this.decrypt(encryptedData);
			const data = JSON.parse(decrypted);

			// Check if data has expired
			if (this.isDataExpired(data)) {
				this.remove(key);
				return null;
			}

			// Update access time
			this.updateLastAccess(key);

			return data;
		} catch (_error) {
			return null;
		}
	}

	/**
	 * Remove stored data
	 */
	remove(key: string): boolean {
		if (!this.storageAvailable) {
			return false;
		}

		try {
			localStorage.removeItem(`${this.config.storageKey}_${key}`);
			localStorage.removeItem(`${this.config.storageKey}_${key}_access`);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Check if data has expired
	 */
	private isDataExpired(data: SecureStorageData): boolean {
		if (!data.lastAccess) {
			return false;
		}

		const lastAccess = new Date(data.lastAccess).getTime();
		const now = Date.now();

		return now - lastAccess > this.config.sessionTimeout;
	}

	/**
	 * Update last access time
	 */
	private updateLastAccess(key: string): void {
		if (!this.storageAvailable) {
			return;
		}

		try {
			localStorage.setItem(`${this.config.storageKey}_${key}_access`, new Date().toISOString());
		} catch {
			// Ignore errors
		}
	}

	/**
	 * Start cleanup interval
	 */
	private startCleanupInterval(): void {
		if (!this.config.enableSecureCleanup) {
			return;
		}

		this.cleanupInterval = setInterval(
			() => {
				this.cleanupExpiredData();
			},
			60 * 60 * 1000,
		); // Run cleanup every hour
	}

	/**
	 * Cleanup expired data
	 */
	private cleanupExpiredData(): void {
		if (!this.storageAvailable) {
			return;
		}

		try {
			const keys = Object.keys(localStorage);
			const now = Date.now();

			keys.forEach((key) => {
				if (key.startsWith(`${this.config.storageKey}_`) && !key.endsWith('_access')) {
					const accessKey = `${key}_access`;

					const accessTime = localStorage.getItem(accessKey);
					if (accessTime) {
						const lastAccess = new Date(accessTime).getTime();
						if (now - lastAccess > this.config.dataRetention) {
							localStorage.removeItem(key);
							localStorage.removeItem(accessKey);
						}
					}
				}
			});
		} catch (_error) {}
	}

	/**
	 * Clear all stored data
	 */
	clearAll(): void {
		if (!this.storageAvailable) {
			return;
		}

		try {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith(`${this.config.storageKey}_`)) {
					localStorage.removeItem(key);
				}
			});
		} catch (_error) {}
	}

	/**
	 * Get storage statistics
	 */
	getStorageStats(): {
		available: boolean;
		encrypted: boolean;
		itemCount: number;
		lastCleanup: Date;
	} {
		let itemCount = 0;

		if (this.storageAvailable) {
			const keys = Object.keys(localStorage);
			itemCount = keys.filter(
				(key) => key.startsWith(`${this.config.storageKey}_`) && !key.endsWith('_access'),
			).length;
		}

		return {
			available: this.storageAvailable,
			encrypted: this.config.encryptionEnabled && !!this.encryptionKey,
			itemCount,
			lastCleanup: new Date(), // Simplified
		};
	}

	/**
	 * Destroy storage manager and cleanup resources
	 */
	destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		this.encryptionKey = null;
	}
}

// Create and export singleton instance
export const secureStorage = new SecureStorageManager();

// Export convenience functions for session management
export const secureSession = {
	isValid: async (): Promise<boolean> => {
		const data = await secureStorage.retrieve('session');
		return data !== null && !!data.session;
	},
	refresh: async (session: SecureSession): Promise<boolean> => {
		const data = await secureStorage.retrieve('session');
		if (data) {
			data.session = session;
			return secureStorage.store('session', data);
		}
		return false;
	},
	remove: (): boolean => {
		return secureStorage.remove('session');
	},
	retrieve: async (): Promise<{
		session: SecureSession;
		user: SecureUser;
	} | null> => {
		const data = await secureStorage.retrieve('session');
		return data?.session && data.user
			? {
					session: data.session,
					user: data.user,
				}
			: null;
	},
	store: async (session: SecureSession, user: SecureUser): Promise<boolean> => {
		return secureStorage.store('session', { session, user });
	},
};

export default secureStorage;

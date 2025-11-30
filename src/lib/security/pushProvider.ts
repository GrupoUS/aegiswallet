/**
 * Web Push Provider - Story 01.04
 *
 * Web Push notification system for authentication and security alerts
 * VAPID authentication with LGPD compliance
 *
 * NOTE: Uses API-based operations with NeonDB
 */

import { apiClient } from '@/lib/api-client';
import logger from '@/lib/logging/secure-logger';

export interface PushConfig {
	vapidPublicKey: string;
	vapidPrivateKey: string;
	vapidSubject: string;
	gcmApiKey?: string;
	ttl: number;
	urgency: 'very-low' | 'low' | 'normal' | 'high';
}

interface StoredPushSubscription {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}

export interface PushMessage {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	image?: string;
	actions?: {
		action: string;
		title: string;
		icon?: string;
	}[];
	data?: Record<string, unknown>;
	requireInteraction?: boolean;
	silent?: boolean;
	tag?: string;
	url?: string;
}

export interface PushResult {
	success: boolean;
	messageId?: string;
	error?: string;
	processingTime: number;
}

export interface AuthPushRequest {
	id: string;
	userId: string;
	pushToken: string;
	expiresAt: Date;
	status: 'pending' | 'approved' | 'denied' | 'expired';
	createdAt: Date;
	respondedAt?: Date;
	metadata?: Record<string, unknown>;
}

/**
 * Web Push Provider Service
 */
export class PushProvider {
	private config: PushConfig;
	private subscriptions: Map<string, StoredPushSubscription> = new Map();

	constructor(config: PushConfig) {
		this.config = config;
		this.initializeServiceWorker();
	}

	private async initializeServiceWorker(): Promise<void> {
		if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
			return;
		}

		try {
			await navigator.serviceWorker.register('/sw.js');
		} catch (_error) {
			// Silent fail - service worker may not be available
		}
	}

	private base64UrlToUint8Array(base64UrlData: string): Uint8Array {
		const padding = '='.repeat((4 - (base64UrlData.length % 4)) % 4);
		const base64 = (base64UrlData + padding)
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		const rawData = atob(base64);
		const buffer = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			buffer[i] = rawData.charCodeAt(i);
		}
		return buffer;
	}

	/**
	 * Subscribe to push notifications
	 */
	async subscribe(userId: string): Promise<StoredPushSubscription | null> {
		if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
			throw new Error('Service Worker not supported');
		}
		const registration = await navigator.serviceWorker.ready;
		const serverKey = this.base64UrlToUint8Array(this.config.vapidPublicKey);
		const normalizedServerKey =
			serverKey.buffer instanceof ArrayBuffer
				? serverKey.buffer
				: serverKey.slice().buffer;
		const subscription = await registration.pushManager.subscribe({
			applicationServerKey: normalizedServerKey,
			userVisibleOnly: true,
		});

		const subscriptionJson = subscription.toJSON();
		if (!subscriptionJson.keys?.auth || !subscriptionJson.keys?.p256dh) {
			throw new Error('Push subscription keys are missing');
		}

		// Store subscription via API
		try {
			await apiClient.post('/v1/security/push-subscriptions', {
				auth_key: subscriptionJson.keys.auth,
				created_at: new Date().toISOString(),
				endpoint: subscription.endpoint,
				is_active: true,
				p256dh_key: subscriptionJson.keys.p256dh,
				updated_at: new Date().toISOString(),
				user_id: userId,
			});
		} catch (error) {
			logger.debug('Push subscription endpoint not available', {
				component: 'pushProvider',
				action: 'subscribe',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}

		const stored: StoredPushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				auth: subscriptionJson.keys.auth,
				p256dh: subscriptionJson.keys.p256dh,
			},
		};

		this.subscriptions.set(userId, stored);
		return stored;
	}

	/**
	 * Unsubscribe from push notifications
	 */
	async unsubscribe(userId: string): Promise<boolean> {
		try {
			this.subscriptions.delete(userId);

			// Deactivate via API
			await apiClient.post('/v1/security/push-subscriptions/deactivate', {
				user_id: userId,
			});

			return true;
		} catch (_error) {
			return false;
		}
	}

	/**
	 * Get user's subscription
	 */
	async getUserSubscription(
		userId: string,
	): Promise<StoredPushSubscription | null> {
		// Check in-memory cache first
		if (this.subscriptions.has(userId)) {
			return this.subscriptions.get(userId) as StoredPushSubscription;
		}

		// Fetch from API
		try {
			const response = await apiClient.get<{
				data: {
					endpoint: string;
					auth_key: string;
					p256dh_key: string;
				} | null;
			}>('/v1/security/push-subscriptions/active', {
				params: { user_id: userId },
			});

			if (response.data) {
				const subscription: StoredPushSubscription = {
					endpoint: response.data.endpoint,
					keys: {
						auth: response.data.auth_key,
						p256dh: response.data.p256dh_key,
					},
				};
				this.subscriptions.set(userId, subscription);
				return subscription;
			}
		} catch {
			// Endpoint may not exist yet
		}

		return null;
	}

	/**
	 * Send push notification
	 */
	async sendPushNotification(
		userId: string,
		message: PushMessage,
	): Promise<PushResult> {
		const startTime = Date.now();

		try {
			const subscription = await this.getUserSubscription(userId);
			if (!subscription) {
				return {
					error: 'No active push subscription found',
					processingTime: Date.now() - startTime,
					success: false,
				};
			}

			const payload = JSON.stringify({
				actions: message.actions,
				badge: message.badge || '/badge-72x72.png',
				body: message.body,
				data: {
					...message.data,
					url: message.url || '/',
					timestamp: Date.now(),
				},
				icon: message.icon || '/icon-192x192.png',
				image: message.image,
				requireInteraction: message.requireInteraction || false,
				silent: message.silent || false,
				tag: message.tag,
				title: message.title,
			});

			const response = await fetch('/api/push/send', {
				body: JSON.stringify({
					options: {
						ttl: this.config.ttl,
						urgency: this.config.urgency,
						vapidDetails: {
							privateKey: this.config.vapidPrivateKey,
							publicKey: this.config.vapidPublicKey,
							subject: this.config.vapidSubject,
						},
					},
					payload,
					subscription,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'POST',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Push notification failed');
			}

			const data = await response.json();

			// Log push notification via API
			await this.logPushNotification(userId, message, data.messageId, 'sent');

			return {
				messageId: data.messageId,
				processingTime: Date.now() - startTime,
				success: true,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			await this.logPushNotification(
				userId,
				message,
				undefined,
				'failed',
				errorMessage,
			);

			return {
				error: errorMessage,
				processingTime: Date.now() - startTime,
				success: false,
			};
		}
	}

	private async logPushNotification(
		userId: string,
		message: PushMessage,
		messageId?: string,
		status: 'sent' | 'failed' | 'delivered' = 'sent',
		error?: string,
	): Promise<void> {
		try {
			await apiClient.post('/v1/security/push-logs', {
				created_at: new Date().toISOString(),
				data: message.data,
				error,
				message_body: message.body,
				message_id: messageId,
				message_title: message.title,
				status,
				tag: message.tag,
				user_id: userId,
			});
		} catch {
			// Silent fail - logging endpoint may not exist
		}
	}

	/**
	 * Create authentication push request
	 */
	async createAuthPushRequest(userId: string): Promise<AuthPushRequest> {
		const pushToken = this.generateSecureToken(16);
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

		const request: AuthPushRequest = {
			createdAt: new Date(),
			expiresAt,
			id: this.generateSecureToken(8),
			pushToken,
			status: 'pending',
			userId,
		};

		// Store via API
		try {
			await apiClient.post('/v1/security/push-auth-requests', {
				created_at: request.createdAt.toISOString(),
				expires_at: expiresAt.toISOString(),
				id: request.id,
				push_token: pushToken,
				status: 'pending',
				user_id: userId,
			});
		} catch {
			// Silent fail
		}

		return request;
	}

	/**
	 * Send authentication push notification
	 */
	async sendAuthPush(userId: string, phoneNumber: string): Promise<PushResult> {
		try {
			const authRequest = await this.createAuthPushRequest(userId);

			const message: PushMessage = {
				actions: [
					{
						action: 'approve',
						icon: '/icons/checkmark.png',
						title: 'Aprovar',
					},
					{
						action: 'deny',
						icon: '/icons/close.png',
						title: 'Negar',
					},
				],
				badge: '/badge-72x72.png',
				body: 'Nova tentativa de login detectada. Aprove ou negue para continuar.',
				data: {
					phoneNumber,
					requestId: authRequest.id,
					type: 'auth-request',
				},
				icon: '/icon-192x192.png',
				requireInteraction: true,
				tag: 'auth-request',
				title: 'AegisWallet - Aprovação de Login',
			};

			return this.sendPushNotification(userId, message);
		} catch (error) {
			return {
				error: error instanceof Error ? error.message : 'Unknown error',
				processingTime: 0,
				success: false,
			};
		}
	}

	/**
	 * Handle push notification response
	 */
	async handlePushResponse(
		requestId: string,
		approved: boolean,
		userId: string,
	): Promise<void> {
		try {
			await apiClient.post('/v1/security/push-auth-requests/respond', {
				request_id: requestId,
				approved,
				responded_at: new Date().toISOString(),
			});

			await this.logPushNotification(
				userId,
				{
					body: `Authentication ${approved ? 'approved' : 'denied'}`,
					data: { approved, requestId },
					title: 'Auth Response',
				},
				undefined,
				'delivered',
			);
		} catch (_error) {
			// Silent fail
		}
	}

	private generateSecureToken(length: number): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		const randomValues = new Uint8Array(length);

		if (typeof window !== 'undefined' && window.crypto) {
			window.crypto.getRandomValues(randomValues);
		} else {
			for (let i = 0; i < length; i++) {
				randomValues[i] = Math.floor(Math.random() * 256);
			}
		}

		for (let i = 0; i < length; i++) {
			result += chars[randomValues[i] % chars.length];
		}

		return result;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<PushConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): PushConfig {
		return { ...this.config };
	}

	/**
	 * Clean up expired push requests
	 */
	async cleanupExpiredRequests(): Promise<void> {
		try {
			await apiClient.post('/v1/security/push-auth-requests/cleanup', {
				before: new Date().toISOString(),
			});
		} catch (_error) {
			// Silent fail
		}
	}
}

/**
 * Create push provider instance
 */
export function createPushProvider(config: PushConfig): PushProvider {
	return new PushProvider(config);
}

/**
 * Quick auth push function
 */
export async function sendAuthPushNotification(
	userId: string,
	phoneNumber: string,
	config: PushConfig,
): Promise<PushResult> {
	const provider = createPushProvider(config);
	return provider.sendAuthPush(userId, phoneNumber);
}

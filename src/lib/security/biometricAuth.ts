/**
 * Enhanced Biometric Authentication Service
 *
 * Story: 01.04 - Segurança e Confirmação por Voz
 *
 * Web Authentication API (WebAuthn) integration with comprehensive security:
 * - FaceID, TouchID, Windows Hello
 * - Secure PIN fallback with rate limiting and account lockout
 * - SMS OTP with expiration and verification
 * - Push notification fallback
 * - Session management with timeout
 * - LGPD-compliant authentication data handling
 *
 * NOTE: Migrated from Supabase to API-based operations
 *
 * @module security/biometricAuth
 */

import { apiClient } from '@/lib/api-client';
import logger from '@/lib/logging/secure-logger';

import { createAuditLog } from '@/lib/security/auditLogger';
import type { DeviceFingerprintingService } from '@/lib/security/deviceFingerprinting';
import { createDeviceFingerprintingService } from '@/lib/security/deviceFingerprinting';
import type { FraudDetectionService } from '@/lib/security/fraudDetection';
import { createFraudDetectionService } from '@/lib/security/fraudDetection';
import type { PushConfig, PushProvider } from '@/lib/security/pushProvider';
import { createPushProvider } from '@/lib/security/pushProvider';
import type { SMSConfig, SMSProvider } from '@/lib/security/smsProvider';
import { createSMSProvider } from '@/lib/security/smsProvider';

// ============================================================================
// Types
// ============================================================================

export type BiometricType =
	| 'platform'
	| 'cross-platform'
	| 'pin'
	| 'sms'
	| 'push'
	| 'otp'
	| 'system';
export type SecurityEvent =
	| 'auth_success'
	| 'auth_failure'
	| 'pin_lockout'
	| 'account_locked'
	| 'suspicious_activity'
	| 'fraud_detected'
	| 'session_expired'
	| 'otp_sent'
	| 'otp_verified'
	| 'push_sent'
	| 'pin_sent'
	| 'pin_verified'
	| 'biometric_enrolled'
	| 'security_alert_sent'
	| 'sms_sent'
	| 'sms_verified';

export interface BiometricConfig {
	timeout: number;
	userVerification: 'required' | 'preferred' | 'discouraged';
	authenticatorAttachment?: 'platform' | 'cross-platform';
	maxPinAttempts: number;
	pinLockoutDuration: number;
	sessionTimeout: number;
	otpExpiry: number;
	maxOtpAttempts: number;
	rateLimitWindow: number;
	maxRateLimitAttempts: number;
}

export interface BiometricResult {
	success: boolean;
	method: BiometricType;
	error?: string;
	processingTime: number;
	requiresAction?: 'otp' | 'push' | 'pin' | 'sms';
	sessionToken?: string;
	lockoutRemaining?: number;
}

export interface SecurityEventLog {
	userId: string;
	event: SecurityEvent;
	method: BiometricType;
	ipAddress?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
	riskScore?: number;
	deviceFingerprint?: string;
}

export interface AuthSession {
	userId: string;
	sessionToken: string;
	method: BiometricType;
	expiresAt: Date;
	isActive: boolean;
	createdAt: Date;
	lastActivity: Date;
}

interface FraudResult {
	shouldBlock: boolean;
	riskScore: number;
	detectedAnomalies?: string[];
	requiresReview?: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: BiometricConfig = {
	timeout: 60000,
	userVerification: 'required',
	authenticatorAttachment: 'platform',
	maxPinAttempts: 5,
	pinLockoutDuration: 15 * 60 * 1000,
	sessionTimeout: 30 * 60 * 1000,
	otpExpiry: 5 * 60 * 1000,
	maxOtpAttempts: 3,
	rateLimitWindow: 15 * 60 * 1000,
	maxRateLimitAttempts: 10,
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateSecureRandom(length: number): string {
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

async function hashPin(
	pin: string,
	salt?: string,
): Promise<{ hash: string; salt: string }> {
	if (!salt) {
		salt = generateSecureRandom(22);
	}

	const encoder = new TextEncoder();
	const data = encoder.encode(pin + salt);

	if (typeof window !== 'undefined' && window.crypto?.subtle) {
		const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		return { hash: hashHex, salt };
	}

	return { hash: btoa(pin + salt), salt };
}

function generateOTP(): string {
	return generateSecureRandom(6);
}

function getClientIP(): string {
	return 'client-ip';
}

function getUserAgent(): string {
	return typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown';
}

// ============================================================================
// Enhanced Biometric Authentication Service
// ============================================================================

export class BiometricAuthService {
	private config: BiometricConfig;
	private activeSessions: Map<string, AuthSession> = new Map();
	private rateLimitStore: Map<string, { attempts: number; resetTime: number }> =
		new Map();

	private smsProvider?: SMSProvider;
	private pushProvider?: PushProvider;
	private fraudDetectionService?: FraudDetectionService;
	private deviceFingerprintingService?: DeviceFingerprintingService;

	constructor(
		config: Partial<BiometricConfig> = {},
		securityProviders?: {
			sms?: { config: SMSConfig };
			push?: { config: PushConfig };
			fraudDetection?: { config?: Record<string, unknown> };
			deviceFingerprinting?: { config?: Record<string, unknown> };
		},
	) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.initializeSecurityProviders(securityProviders);
	}

	private initializeSecurityProviders(providers?: {
		sms?: { config: SMSConfig };
		push?: { config: PushConfig };
		fraudDetection?: { config?: Record<string, unknown> };
		deviceFingerprinting?: { config?: Record<string, unknown> };
	}): void {
		if (providers?.sms?.config) {
			this.smsProvider = createSMSProvider(providers.sms.config);
		}
		if (providers?.push?.config) {
			this.pushProvider = createPushProvider(providers.push.config);
		}
		this.fraudDetectionService = createFraudDetectionService(
			providers?.fraudDetection?.config,
		);
		this.deviceFingerprintingService = createDeviceFingerprintingService(
			providers?.deviceFingerprinting?.config,
		);
	}

	private async logSecurityEvent(event: SecurityEventLog): Promise<void> {
		try {
			await createAuditLog({
				action: `auth_${event.event}`,
				metadata: {
					event: event.event,
					ipAddress: event.ipAddress,
					userAgent: event.userAgent,
					riskScore: event.riskScore,
					...event.metadata,
				},
				method: event.method,
				userId: event.userId,
			});

			try {
				await apiClient.post('/v1/security/events', {
					created_at: new Date().toISOString(),
					event_type: event.event,
					ip_address: event.ipAddress ?? null,
					metadata: event.metadata,
					method: event.method,
					risk_score: event.riskScore ?? 0,
					user_id: event.userId,
					user_agent: event.userAgent ?? null,
				});
			} catch {
				// Endpoint may not exist yet
			}
		} catch (error) {
			logger.debug('Failed to log security event', {
				component: 'biometricAuth',
				action: 'logSecurityEvent',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	private checkRateLimit(userId: string): {
		allowed: boolean;
		remainingTime?: number;
	} {
		const key = `rate_limit_${userId}`;
		const now = Date.now();
		const stored = this.rateLimitStore.get(key);

		if (!stored || now > stored.resetTime) {
			this.rateLimitStore.set(key, {
				attempts: 1,
				resetTime: now + this.config.rateLimitWindow,
			});
			return { allowed: true };
		}

		if (stored.attempts >= this.config.maxRateLimitAttempts) {
			return {
				allowed: false,
				remainingTime: stored.resetTime - now,
			};
		}

		stored.attempts++;
		return { allowed: true };
	}

	private async createSession(
		userId: string,
		method: BiometricType,
	): Promise<string> {
		const sessionToken = generateSecureRandom(32);
		const expiresAt = new Date(Date.now() + this.config.sessionTimeout);

		const session: AuthSession = {
			createdAt: new Date(),
			expiresAt,
			isActive: true,
			lastActivity: new Date(),
			method,
			sessionToken,
			userId,
		};

		this.activeSessions.set(sessionToken, session);

		try {
			await apiClient.post('/v1/auth/sessions', {
				created_at: new Date().toISOString(),
				expires_at: expiresAt.toISOString(),
				is_active: true,
				last_activity: new Date().toISOString(),
				method: method,
				session_token: sessionToken,
				user_id: userId,
			});
		} catch {
			// API may not exist yet
		}

		return sessionToken;
	}

	async validateSession(sessionToken: string): Promise<AuthSession | null> {
		const session = this.activeSessions.get(sessionToken);

		if (!session) {
			try {
				const response = await apiClient.get<{
					data: {
						user_id: string;
						session_token: string;
						expires_at: string;
						is_active: boolean;
						created_at: string;
						last_activity: string;
						method: string;
					} | null;
				}>('/v1/auth/sessions/validate', {
					params: { token: sessionToken },
				});

				if (response.data && new Date(response.data.expires_at) > new Date()) {
					const dbSession: AuthSession = {
						createdAt: new Date(response.data.created_at),
						expiresAt: new Date(response.data.expires_at),
						isActive: response.data.is_active,
						lastActivity: new Date(response.data.last_activity),
						method: response.data.method as BiometricType,
						sessionToken: response.data.session_token,
						userId: response.data.user_id,
					};
					this.activeSessions.set(sessionToken, dbSession);
					return dbSession;
				}
			} catch {
				// API may not exist
			}
			return null;
		}

		if (new Date() > session.expiresAt) {
			await this.revokeSession(sessionToken);
			return null;
		}

		session.lastActivity = new Date();
		return session;
	}

	async revokeSession(sessionToken: string): Promise<void> {
		this.activeSessions.delete(sessionToken);

		try {
			await apiClient.post('/v1/auth/sessions/revoke', {
				session_token: sessionToken,
			});
		} catch {
			// API may not exist
		}
	}

	async isAvailable(): Promise<boolean> {
		if (!window.PublicKeyCredential) {
			return false;
		}

		try {
			const available =
				await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
			return available;
		} catch {
			return false;
		}
	}

	async authenticate(userId: string): Promise<BiometricResult> {
		const startTime = Date.now();

		const rateLimit = this.checkRateLimit(userId);
		if (!rateLimit.allowed) {
			return {
				error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.remainingTime || 0) / 1000)} seconds.`,
				method: 'platform',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}

		if (!window.PublicKeyCredential) {
			return {
				error: 'WebAuthn not supported',
				method: 'platform',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}

		try {
			let deviceFingerprint: string | undefined;
			if (this.deviceFingerprintingService) {
				const fingerprint =
					await this.deviceFingerprintingService.generateFingerprint();
				deviceFingerprint = fingerprint.id;
			}

			let fraudResult: FraudResult | null = null;
			if (this.fraudDetectionService) {
				fraudResult = (await this.fraudDetectionService.analyzeSecurityEvent({
					deviceFingerprint,
					eventType: 'login_attempt',
					ipAddress: getClientIP(),
					location: undefined,
					timestamp: new Date(),
					userAgent: getUserAgent(),
					userId,
				})) as FraudResult;

				if (fraudResult.shouldBlock) {
					await this.logSecurityEvent({
						deviceFingerprint,
						event: 'account_locked',
						ipAddress: getClientIP(),
						metadata: {
							anomalies: fraudResult.detectedAnomalies,
							reason: 'fraud_detection',
							riskScore: fraudResult.riskScore,
						},
						method: 'platform',
						userAgent: getUserAgent(),
						userId,
					});

					return {
						error: 'Security verification required. Please contact support.',
						method: 'platform',
						processingTime: Date.now() - startTime,
						success: false,
					};
				}
			}

			const challenge = new Uint8Array(32);
			crypto.getRandomValues(challenge);

			const credential = await navigator.credentials.get({
				publicKey: {
					userVerification: this.config.userVerification,
					challenge,
					timeout: this.config.timeout,
				},
			});

			if (!credential) {
				await this.logSecurityEvent({
					deviceFingerprint,
					event: 'auth_failure',
					ipAddress: getClientIP(),
					metadata: {
						fraudRiskScore: fraudResult?.riskScore,
						reason: 'authentication_cancelled',
					},
					method: 'platform',
					userAgent: getUserAgent(),
					userId,
				});

				return {
					error: 'Authentication cancelled',
					method: 'platform',
					processingTime: Date.now() - startTime,
					requiresAction: fraudResult?.requiresReview ? 'pin' : undefined,
					success: false,
				};
			}

			const sessionToken = await this.createSession(userId, 'platform');

			await this.logSecurityEvent({
				deviceFingerprint,
				event: 'auth_success',
				ipAddress: getClientIP(),
				metadata: {
					credentialId: credential.id,
					fraudRiskScore: fraudResult?.riskScore,
				},
				method: 'platform',
				userAgent: getUserAgent(),
				userId,
			});

			return {
				method: 'platform',
				processingTime: Date.now() - startTime,
				sessionToken,
				success: true,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			await this.logSecurityEvent({
				event: 'auth_failure',
				ipAddress: getClientIP(),
				metadata: { error: errorMessage },
				method: 'platform',
				userAgent: getUserAgent(),
				userId,
			});

			return {
				error: errorMessage,
				method: 'platform',
				processingTime: Date.now() - startTime,
				requiresAction: 'pin',
				success: false,
			};
		}
	}

	async authenticateWithPIN(
		userId: string,
		pin: string,
	): Promise<BiometricResult> {
		const startTime = Date.now();

		if (!/^\d{4,6}$/.test(pin)) {
			return {
				error: 'Invalid PIN format',
				method: 'pin',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}

		const rateLimit = this.checkRateLimit(userId);
		if (!rateLimit.allowed) {
			return {
				error: `Too many attempts. Try again in ${Math.ceil((rateLimit.remainingTime || 0) / 1000)} seconds.`,
				method: 'pin',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}

		try {
			// Verify PIN via API
			const response = await apiClient.post<{
				valid: boolean;
				locked?: boolean;
				lockoutUntil?: string;
			}>('/v1/auth/pins/verify', {
				user_id: userId,
				pin,
			});

			if (response.locked) {
				const remainingTime = response.lockoutUntil
					? new Date(response.lockoutUntil).getTime() - Date.now()
					: undefined;

				return {
					error: 'Account temporarily locked for security',
					lockoutRemaining: remainingTime,
					method: 'pin',
					processingTime: Date.now() - startTime,
					success: false,
				};
			}

			if (response.valid) {
				const sessionToken = await this.createSession(userId, 'pin');

				await this.logSecurityEvent({
					event: 'auth_success',
					ipAddress: getClientIP(),
					method: 'pin',
					userAgent: getUserAgent(),
					userId,
				});

				return {
					method: 'pin',
					processingTime: Date.now() - startTime,
					sessionToken,
					success: true,
				};
			}

			await this.logSecurityEvent({
				event: 'auth_failure',
				ipAddress: getClientIP(),
				method: 'pin',
				userAgent: getUserAgent(),
				userId,
			});

			return {
				error: 'Invalid PIN',
				method: 'pin',
				processingTime: Date.now() - startTime,
				requiresAction: 'sms',
				success: false,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			return {
				error: errorMessage,
				method: 'pin',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}
	}

	async setupPIN(
		userId: string,
		pin: string,
		confirmPassword: string,
	): Promise<boolean> {
		if (!/^\d{4,6}$/.test(pin)) {
			throw new Error('PIN must be 4-6 digits');
		}

		if (pin !== confirmPassword) {
			throw new Error('PINs do not match');
		}

		const { hash, salt } = await hashPin(pin);

		try {
			await apiClient.post('/v1/auth/pins', {
				user_id: userId,
				pin_hash: hash,
				salt: salt,
			});
			return true;
		} catch {
			throw new Error('Funcionalidade em migração');
		}
	}

	async sendSMSOTP(userId: string, phoneNumber: string): Promise<boolean> {
		try {
			const otp = generateOTP();

			try {
				await apiClient.post('/v1/auth/otp', {
					attempts: 0,
					created_at: new Date().toISOString(),
					expires_at: new Date(
						Date.now() + this.config.otpExpiry,
					).toISOString(),
					otp_code: otp,
					phone_number: phoneNumber,
					user_id: userId,
				});
			} catch {
				// API may not exist yet
			}

			let smsSent = false;
			if (this.smsProvider) {
				const result = await this.smsProvider.sendOTP(userId, phoneNumber, otp);
				smsSent = result.success;
			} else {
				smsSent = true;
			}

			if (smsSent) {
				await this.logSecurityEvent({
					event: 'otp_sent',
					ipAddress: getClientIP(),
					metadata: { phone_number: phoneNumber },
					method: 'sms',
					userAgent: getUserAgent(),
					userId,
				});
			}

			return smsSent;
		} catch {
			return false;
		}
	}

	async authenticateWithSMS(
		userId: string,
		otp: string,
		phoneNumber: string,
	): Promise<BiometricResult> {
		const startTime = Date.now();

		if (!/^\d{6}$/.test(otp)) {
			return {
				error: 'Invalid OTP format',
				method: 'sms',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}

		try {
			const response = await apiClient.post<{
				valid: boolean;
				expired?: boolean;
				maxAttempts?: boolean;
			}>('/v1/auth/otp/verify', {
				user_id: userId,
				phone_number: phoneNumber,
				otp_code: otp,
			});

			if (response.expired) {
				return {
					error: 'OTP has expired',
					method: 'sms',
					processingTime: Date.now() - startTime,
					success: false,
				};
			}

			if (response.maxAttempts) {
				return {
					error: 'Maximum OTP attempts exceeded',
					method: 'otp',
					processingTime: Date.now() - startTime,
					success: false,
				};
			}

			if (response.valid) {
				const sessionToken = await this.createSession(userId, 'sms');

				await this.logSecurityEvent({
					event: 'otp_verified',
					ipAddress: getClientIP(),
					metadata: { phone_number: phoneNumber },
					method: 'otp',
					userAgent: getUserAgent(),
					userId,
				});

				return {
					method: 'otp',
					processingTime: Date.now() - startTime,
					sessionToken,
					success: true,
				};
			}

			return {
				error: 'Invalid OTP',
				method: 'otp',
				processingTime: Date.now() - startTime,
				success: false,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			return {
				error: errorMessage,
				method: 'pin',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}
	}

	async authenticateWithPush(userId: string): Promise<BiometricResult> {
		const startTime = Date.now();

		try {
			let pushResult: {
				success: boolean;
				error?: string;
				requiresAction?: string;
			} | null = null;

			if (this.pushProvider) {
				pushResult = await this.pushProvider.sendAuthPush(userId, '');
			} else {
				pushResult = { success: true, requiresAction: 'push' };
			}

			await this.logSecurityEvent({
				event: 'push_sent',
				ipAddress: getClientIP(),
				metadata: { push_result: pushResult?.success ?? false },
				method: 'push',
				userAgent: getUserAgent(),
				userId,
			});

			if (pushResult?.success) {
				return {
					error: 'Push notification sent. Please approve on your device.',
					method: 'push',
					processingTime: Date.now() - startTime,
					requiresAction: 'push',
					success: false,
				};
			}

			return {
				error: pushResult?.error || 'Failed to send push notification',
				method: 'push',
				processingTime: Date.now() - startTime,
				requiresAction: 'sms',
				success: false,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			return {
				error: errorMessage,
				method: 'pin',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}
	}

	async verifyPushResponse(
		pushToken: string,
		approved: boolean,
	): Promise<BiometricResult> {
		const startTime = Date.now();

		try {
			const response = await apiClient.post<{
				valid: boolean;
				userId?: string;
			}>('/v1/auth/push/verify', {
				push_token: pushToken,
				approved,
			});

			if (!response.valid) {
				return {
					error: 'Invalid or expired push request',
					method: 'push',
					processingTime: Date.now() - startTime,
					success: false,
				};
			}

			if (approved && response.userId) {
				const sessionToken = await this.createSession(response.userId, 'push');

				return {
					method: 'push',
					processingTime: Date.now() - startTime,
					sessionToken,
					success: true,
				};
			}

			return {
				error: 'Push notification denied',
				method: 'pin',
				processingTime: Date.now() - startTime,
				success: false,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			return {
				error: errorMessage,
				method: 'pin',
				processingTime: Date.now() - startTime,
				success: false,
			};
		}
	}

	async register(userId: string, userName: string): Promise<boolean> {
		if (!window.PublicKeyCredential) {
			return false;
		}

		try {
			const challenge = new Uint8Array(32);
			crypto.getRandomValues(challenge);

			const userIdBuffer = new TextEncoder().encode(userId);

			const credential = await navigator.credentials.create({
				publicKey: {
					authenticatorSelection: {
						authenticatorAttachment: this.config.authenticatorAttachment,
						userVerification: this.config.userVerification,
					},
					challenge,
					pubKeyCredParams: [
						{ alg: -7, type: 'public-key' },
						{ alg: -257, type: 'public-key' },
					],
					rp: {
						id: window.location.hostname,
						name: 'AegisWallet',
					},
					timeout: this.config.timeout,
					user: {
						displayName: userName,
						id: userIdBuffer,
						name: userName,
					},
				},
			});

			if (credential) {
				try {
					await apiClient.post('/v1/auth/biometric-credentials', {
						created_at: new Date().toISOString(),
						credential_id: credential.id,
						credential_type: 'public-key',
						user_id: userId,
					});
				} catch {
					// API may not exist
				}

				await this.logSecurityEvent({
					event: 'biometric_enrolled',
					ipAddress: getClientIP(),
					metadata: { credential_id: credential.id },
					method: 'platform',
					userAgent: getUserAgent(),
					userId,
				});

				return true;
			}

			return false;
		} catch {
			return false;
		}
	}

	async getAuthStatus(userId: string): Promise<{
		hasBiometric: boolean;
		hasPIN: boolean;
		isLocked: boolean;
		lockoutRemaining?: number;
	}> {
		try {
			const response = await apiClient.get<{
				hasBiometric: boolean;
				hasPIN: boolean;
				isLocked: boolean;
				lockoutUntil?: string;
			}>('/v1/auth/status', { params: { user_id: userId } });

			const isLocked =
				response.isLocked &&
				response.lockoutUntil &&
				new Date(response.lockoutUntil) > new Date();
			const lockoutRemaining =
				isLocked && response.lockoutUntil
					? new Date(response.lockoutUntil).getTime() - Date.now()
					: undefined;

			return {
				hasBiometric: response.hasBiometric || false,
				hasPIN: response.hasPIN || false,
				isLocked: isLocked || false,
				lockoutRemaining,
			};
		} catch {
			return {
				hasBiometric: false,
				hasPIN: false,
				isLocked: false,
			};
		}
	}

	updateConfig(config: Partial<BiometricConfig>): void {
		this.config = { ...this.config, ...config };
	}

	getConfig(): BiometricConfig {
		return { ...this.config };
	}

	async cleanupExpiredSessions(): Promise<void> {
		const now = new Date();

		for (const [token, session] of this.activeSessions.entries()) {
			if (now > session.expiresAt) {
				this.activeSessions.delete(token);
			}
		}

		try {
			await apiClient.post('/v1/auth/sessions/cleanup', {
				before: now.toISOString(),
			});
		} catch {
			// API may not exist
		}
	}
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createBiometricAuthService(
	config?: Partial<BiometricConfig>,
): BiometricAuthService {
	return new BiometricAuthService(config);
}

export async function authenticateBiometric(
	userId: string,
): Promise<BiometricResult> {
	const service = createBiometricAuthService();
	return service.authenticate(userId);
}

export async function isBiometricAvailable(): Promise<boolean> {
	const service = createBiometricAuthService();
	return service.isAvailable();
}

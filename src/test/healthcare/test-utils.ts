import type { Mock } from 'vitest';
import { vi } from 'vitest';

// Define callable mock function types
type MockAsyncFn<T = unknown> = Mock<(...args: unknown[]) => Promise<T>>;
type MockSyncFn<T = unknown> = Mock<(...args: unknown[]) => T>;

export interface TestUtils {
	checkMockRateLimit: MockAsyncFn<{
		allowed: boolean;
		remaining: number;
		resetTime?: number;
	}>;
	createMockAuditLog: MockAsyncFn<{ id: string }>;
	createMockLGPDConsent: MockSyncFn<{
		consentType: string;
		deviceId: string;
		ip: string;
		timestamp: string;
		version: string;
	}>;
	createMockVoiceCommand: MockSyncFn<{
		command: string;
		confidence: number;
		timestamp: string;
	}>;
	encryptMockClientData: MockAsyncFn<string>;
	encryptMockData: MockAsyncFn<{
		algorithm: string;
		encryptedData: string;
		iv: string;
	} | null>;
	generateMockCSRFToken: MockSyncFn<string>;
	generateMockSecureKey: MockAsyncFn<string>;
	validateMockAuthentication: MockAsyncFn<{
		success?: boolean;
		isAuthenticated?: boolean;
		user?: {
			id?: string;
			email?: string;
			role?: string;
			expiresAt?: string;
			sessionToken?: string;
		};
		error?: string;
	}>;
	validateMockCSRFToken: MockAsyncFn<boolean>;
	validateMockInput: MockSyncFn<string | boolean | { valid: boolean }>;
}

declare global {
	// eslint-disable-next-line no-var
	var testUtils: TestUtils | undefined;
}

export const ensureTestUtils = (): TestUtils => {
	const existing = global.testUtils;
	if (existing) {
		return existing;
	}

	const testUtils = {
		checkMockRateLimit: vi
			.fn()
			.mockResolvedValue({ allowed: true, remaining: 9 }),
		createMockAuditLog: vi.fn().mockResolvedValue({ id: 'audit-1' }),
		createMockLGPDConsent: vi.fn().mockReturnValue({
			consentType: 'treatment',
			deviceId: 'test-device-001',
			ip: '127.0.0.1',
			timestamp: new Date().toISOString(),
			version: '1.0',
		}),
		createMockVoiceCommand: vi
			.fn()
			.mockImplementation((command?: string, confidence?: number) => ({
				command: command ?? 'test command',
				confidence: confidence ?? 0.95,
				timestamp: new Date().toISOString(),
			})),
		encryptMockClientData: vi.fn().mockResolvedValue('encrypted-client-data'),
		encryptMockData: vi.fn().mockResolvedValue({
			algorithm: 'AES-256-GCM',
			encryptedData: 'encrypted-payload',
			iv: 'mock-iv',
		}),
		generateMockCSRFToken: vi.fn().mockReturnValue('csrf-token-123'),
		generateMockSecureKey: vi.fn().mockResolvedValue('secure-key-123'),
		validateMockAuthentication: vi
			.fn()
			.mockResolvedValue({ isAuthenticated: true }),
		validateMockCSRFToken: vi.fn().mockResolvedValue(true),
		validateMockInput: vi.fn().mockReturnValue({ valid: true }),
	} as TestUtils;

	Object.defineProperty(global, 'testUtils', {
		configurable: true,
		value: testUtils,
		writable: true,
	});

	return testUtils;
};

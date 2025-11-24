import { vi } from 'vitest';

export type TestUtils = {
  checkMockRateLimit: ReturnType<typeof vi.fn>;
  createMockAuditLog: ReturnType<typeof vi.fn>;
  encryptMockClientData: ReturnType<typeof vi.fn>;
  encryptMockData: ReturnType<typeof vi.fn>;
  generateMockCSRFToken: ReturnType<typeof vi.fn>;
  generateMockSecureKey: ReturnType<typeof vi.fn>;
  validateMockAuthentication: ReturnType<typeof vi.fn>;
  validateMockCSRFToken: ReturnType<typeof vi.fn>;
  validateMockInput: ReturnType<typeof vi.fn>;
};

export const ensureTestUtils = (): TestUtils => {
  const existing = (global as Record<string, unknown>).testUtils as TestUtils | undefined;
  if (existing) return existing;

  const testUtils: TestUtils = {
    checkMockRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
    createMockAuditLog: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    encryptMockClientData: vi.fn().mockResolvedValue('encrypted-client-data'),
    encryptMockData: vi.fn().mockResolvedValue('encrypted-payload'),
    generateMockCSRFToken: vi.fn().mockReturnValue('csrf-token-123'),
    generateMockSecureKey: vi.fn().mockResolvedValue('secure-key-123'),
    validateMockAuthentication: vi.fn().mockResolvedValue({ isAuthenticated: true }),
    validateMockCSRFToken: vi.fn().mockResolvedValue(true),
    validateMockInput: vi.fn().mockResolvedValue({ valid: true }),
  };

  Object.defineProperty(global, 'testUtils', {
    configurable: true,
    value: testUtils,
    writable: true,
  });

  return testUtils;
};

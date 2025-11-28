/**
 * Database Mock Utilities for Testing
 *
 * Provides Drizzle-compatible mock database client for integration tests
 * Includes Brazilian financial data factories and PIX transaction mocks
 */

import { vi } from 'vitest';

import * as schema from '@/db/schema';

// ========================================
// MOCK DATABASE CLIENT
// ========================================

/**
 * Mock Neon SQL function that returns predefined results
 */
const createMockSql = () => {
	const mockResults = new Map<string, unknown[]>();

	return vi.fn().mockImplementation((query: string, _params?: unknown[]) => {
		// Extract table name from query for simple matching
		const tableMatch =
			query.match(/FROM\s+(\w+)/i) || query.match(/INTO\s+(\w+)/i);
		const tableName = tableMatch ? tableMatch[1] : 'unknown';

		// Return mock data based on table
		const mockData = mockResults.get(tableName) || [];

		// Mock query result interface
		return {
			rows: mockData,
			rowCount: mockData.length,
			fields: [],
			command: query.includes('SELECT') ? 'SELECT' : 'INSERT',
			oid: 0,
		};
	});
};

/**
 * Mock Drizzle database client with Drizzle-compatible interface
 */
export const createMockDatabase = () => {
	const mockSql = createMockSql();

	const mockDb = {
		// Core Drizzle methods
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		offset: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),

		// Mock execution methods
		all: vi.fn().mockResolvedValue([]),
		execute: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockReturnThis(),

		// Transaction support
		transaction: vi
			.fn()
			.mockImplementation(
				async <T>(callback: (tx: typeof mockDb) => Promise<T>): Promise<T> => {
					return callback(mockDb);
				},
			),

		// Insert/Update/Delete operations
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),

		// Raw SQL access
		$: mockSql,

		// Schema access
		schema,
	};

	return mockDb;
};

// Singleton mock database instance
export const mockDatabase = createMockDatabase();

// ========================================
// BRAZILIAN FINANCIAL DATA FACTORIES
// ========================================

/**
 * Create mock Brazilian PIX transaction matching actual schema
 */
export const createMockPixTransaction = (
	overrides: Partial<schema.PixTransaction> = {},
): schema.PixTransaction => ({
	id: crypto.randomUUID(),
	userId: 'user-123',
	transactionId: null,
	endToEndId: 'E1234567890123456789012345678901',
	pixKey: '12345678900',
	pixKeyType: 'CPF',
	recipientName: 'Maria Santos',
	recipientDocument: '98765432100',
	recipientBank: 'Nubank',
	amount: '150.50',
	description: 'Pagamento via PIX',
	transactionDate: new Date('2024-01-15T10:30:00Z'),
	status: 'completed',
	transactionType: 'sent',
	scheduledFor: null,
	processedAt: new Date('2024-01-15T10:30:00Z'),
	qrCodeId: null,
	externalId: null,
	errorMessage: null,
	feeAmount: '0',
	createdAt: new Date('2024-01-15T10:30:00Z'),
	updatedAt: new Date('2024-01-15T10:30:00Z'),
	...overrides,
});

/**
 * Create mock Brazilian bank account matching actual schema
 */
export const createMockBankAccount = (
	overrides: Partial<schema.BankAccount> = {},
): schema.BankAccount => ({
	id: crypto.randomUUID(),
	userId: 'user-123',
	belvoAccountId: 'belvo-account-123',
	institutionId: 'nubank-br',
	institutionName: 'Nubank',
	accountType: 'CHECKING',
	accountNumber: '12345-6',
	accountMask: '****5-6',
	accountHolderName: 'João Silva',
	balance: '2500.75',
	availableBalance: '2400.50',
	currency: 'BRL',
	isActive: true,
	isPrimary: true,
	lastSync: new Date('2024-01-15T10:30:00Z'),
	syncStatus: 'success',
	syncErrorMessage: null,
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-15T10:30:00Z'),
	...overrides,
});

/**
 * Create mock Brazilian transaction matching actual schema
 */
export const createMockTransaction = (
	overrides: Partial<schema.Transaction> = {},
): schema.Transaction => ({
	id: crypto.randomUUID(),
	userId: 'user-123',
	accountId: null,
	categoryId: null,
	amount: '-89.90',
	originalAmount: null,
	currency: 'BRL',
	description: 'Compra no supermercado',
	merchantName: 'Extra Supermercados',
	transactionDate: new Date('2024-01-15T14:30:00Z'),
	postedDate: new Date('2024-01-15T14:30:00Z'),
	transactionType: 'debit',
	paymentMethod: 'debit_card',
	status: 'posted',
	isRecurring: false,
	recurringRule: null,
	tags: null,
	notes: null,
	attachments: null,
	confidenceScore: null,
	isCategorized: false,
	isManualEntry: false,
	externalId: null,
	externalSource: null,
	createdAt: new Date('2024-01-15T14:30:00Z'),
	updatedAt: new Date('2024-01-15T14:30:00Z'),
	...overrides,
});

/**
 * Create mock Brazilian user with CPF matching actual schema
 */
export const createMockUser = (
	overrides: Partial<schema.User> = {},
): schema.User => ({
	id: 'user-123',
	email: 'joao.silva@email.com',
	fullName: 'João Silva',
	cpf: '12345678900',
	phone: '+5511999999999',
	birthDate: '1990-05-15',
	profileImageUrl: null,
	language: 'pt-BR',
	currency: 'BRL',
	timezone: 'America/Sao_Paulo',
	autonomyLevel: 1,
	voiceCommandEnabled: true,
	isActive: true,
	lastLogin: null,
	createdAt: new Date('2024-01-01T00:00:00Z'),
	updatedAt: new Date('2024-01-15T10:30:00Z'),
	...overrides,
});

// ========================================
// MOCK TRANSACTION FACTORY
// ========================================

/**
 * Create mock database transaction with database operations
 */
export const createMockDbTransaction = () => {
	const mockTx = createMockDatabase();

	// Mock transaction methods
	mockTx.insert.mockReturnValue({
		values: vi.fn().mockReturnValue({
			returning: vi.fn().mockResolvedValue([createMockTransaction()]),
			execute: vi.fn().mockResolvedValue({
				rows: [createMockTransaction()],
				rowCount: 1,
			}),
		}),
	});

	mockTx.select.mockReturnValue({
		from: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				limit: vi.fn().mockResolvedValue([createMockTransaction()]),
				execute: vi.fn().mockResolvedValue([createMockTransaction()]),
			}),
		}),
	});

	return mockTx;
};

// ========================================
// INTEGRATION TEST HELPERS
// ========================================

/**
 * Setup mock database for integration tests
 */
export const setupMockDatabase = () => {
	// Mock the database module
	vi.mock('@/db', () => ({
		db: mockDatabase,
		getHttpClient: vi.fn(() => mockDatabase),
		getPoolClient: vi.fn(() => mockDatabase),
		closePool: vi.fn(),
		schema,
	}));

	// Mock the client module
	vi.mock('@/db/client', () => ({
		db: mockDatabase,
		getHttpClient: vi.fn(() => mockDatabase),
		getPoolClient: vi.fn(() => mockDatabase),
		closePool: vi.fn(),
		createHttpClient: vi.fn(() => mockDatabase),
		createPoolClient: vi.fn(() => mockDatabase),
		getOrganizationClient: vi.fn(() => mockDatabase),
	}));
};

/**
 * Reset mock database state between tests
 */
export const resetMockDatabase = () => {
	vi.clearAllMocks();
};

// ========================================
// BRAZILIAN COMPLIANCE MOCKS
// ========================================

/**
 * Mock BCB (Central Bank of Brazil) PIX API response
 */
export const mockPixResponse = {
	status: 'success',
	data: {
		id: 'pix-123',
		endToEndId: 'E1234567890123456789012345678901',
		valor: '150.50',
		horario: '2024-01-15T10:30:00.000Z',
		pagador: {
			cpf: '12345678900',
			nome: 'João Silva',
		},
		recebedor: {
			cpf: '98765432100',
			nome: 'Maria Santos',
		},
	},
};

/**
 * Mock LGPD compliance audit log matching actual schema
 */
export const createMockComplianceAuditLog = (
	overrides: Partial<schema.ComplianceAuditLog> = {},
): schema.ComplianceAuditLog => ({
	id: crypto.randomUUID(),
	userId: 'user-123',
	eventType: 'data_accessed',
	resourceType: 'transaction',
	resourceId: crypto.randomUUID(),
	description: 'User accessed transaction data',
	metadata: {
		reason: 'User dashboard view',
		complianceCheck: 'LGPD Article 7',
	},
	previousState: null,
	newState: null,
	ipAddress: '192.168.1.100',
	userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
	sessionId: null,
	retentionUntil: null,
	createdAt: new Date(),
	...overrides,
});

export default mockDatabase;

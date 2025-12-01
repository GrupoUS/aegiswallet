import { eq, inArray } from 'drizzle-orm';

import { db, getPoolClient, type HttpClient, type PoolClient } from '@/db/client';
import {
	bankAccounts,
	complianceAuditLogs,
	consentTemplates,
	dataDeletionRequests,
	financialEvents,
	lgpdConsents,
	lgpdExportRequests,
	transactionLimits,
	users,
} from '@/db/schema';

// Re-export types for convenience
export type DbClient = HttpClient | PoolClient;

/**
 * Check if integration test environment variables are configured
 */
export const hasIntegrationTestEnv = (): boolean => {
	const databaseUrl = process.env.DATABASE_URL;
	return Boolean(databaseUrl);
};

/**
 * Get a Drizzle database client for integration tests
 */
export const getTestDbClient = (): DbClient => {
	return db;
};

/**
 * Get the pool client for transactions (use when you need transaction support)
 */
export const getTestPoolClient = (): PoolClient => {
	return getPoolClient();
};

export interface TestUser {
	email: string;
	id: string;
}

/**
 * Create a test user for integration tests
 */
export const createTestUser = async (client: DbClient = db): Promise<TestUser> => {
	const email = `integration_${Date.now()}_${Math.random().toString(36).slice(2)}@aegiswallet.dev`;
	const id = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;

	await client.insert(users).values({
		id,
		email,
		fullName: 'Integration Tester',
		autonomyLevel: 50,
		isActive: true,
	});

	return { email, id };
};

/**
 * Clean up test user data after tests
 */
export const cleanupTestUser = async (userId: string, client: DbClient = db): Promise<void> => {
	await client.delete(users).where(eq(users.id, userId));
};

/**
 * Clean up all test user data including related records (for test cleanup)
 * Deletes in proper order to respect foreign key constraints
 */
export const cleanupUserData = async (userId: string, client: DbClient = db): Promise<void> => {
	// Clean up LGPD/compliance related tables first
	await client.delete(complianceAuditLogs).where(eq(complianceAuditLogs.userId, userId));
	await client.delete(lgpdExportRequests).where(eq(lgpdExportRequests.userId, userId));
	await client.delete(dataDeletionRequests).where(eq(dataDeletionRequests.userId, userId));
	await client.delete(lgpdConsents).where(eq(lgpdConsents.userId, userId));
	await client.delete(transactionLimits).where(eq(transactionLimits.userId, userId));

	// Clean up financial data
	await client.delete(financialEvents).where(eq(financialEvents.userId, userId));
	await client.delete(bankAccounts).where(eq(bankAccounts.userId, userId));

	// Finally delete the user (this will also cascade other relations)
	await client.delete(users).where(eq(users.id, userId));
};

/**
 * Clean up bank accounts by IDs
 */
export const cleanupBankAccounts = async (
	accountIds: string[],
	client: DbClient = db,
): Promise<void> => {
	if (accountIds.length === 0) return;
	await client.delete(bankAccounts).where(inArray(bankAccounts.id, accountIds));
};

/**
 * Clean up financial events by IDs
 */
export const cleanupFinancialEvents = async (
	eventIds: string[],
	client: DbClient = db,
): Promise<void> => {
	if (eventIds.length === 0) return;
	await client.delete(financialEvents).where(inArray(financialEvents.id, eventIds));
};

// Re-export schema tables for tests
export {
	bankAccounts,
	complianceAuditLogs,
	consentTemplates,
	dataDeletionRequests,
	financialEvents,
	lgpdConsents,
	lgpdExportRequests,
	transactionLimits,
	users,
};

import { eq } from 'drizzle-orm';

import { db, getPoolClient, type PoolClient } from '@/db/client';
import { users } from '@/db/schema';

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
export const getTestDbClient = (): PoolClient => {
	return getPoolClient();
};

export interface TestUser {
	email: string;
	id: string;
}

/**
 * Create a test user for integration tests
 */
export const createTestUser = async (
	client = db,
): Promise<TestUser> => {
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
export const cleanupTestUser = async (
	userId: string,
	client = db,
): Promise<void> => {
	await client.delete(users).where(eq(users.id, userId));
};

/**
 * Clean up all test user data (for test cleanup)
 */
export const cleanupUserData = async (
	userId: string,
	client = db,
): Promise<void> => {
	// Delete user will cascade to related tables due to foreign key constraints
	await client.delete(users).where(eq(users.id, userId));
};

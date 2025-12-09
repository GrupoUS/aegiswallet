/**
 * Organization Service
 *
 * Handles creation and management of organizations for users
 * Each Clerk user gets their own organization for data isolation
 */

import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';

import { getPoolClient } from '@/db/client';
import type * as schema from '@/db/schema';
import {
	organizationMembers,
	organizationSettings,
	organizations,
} from '@/db/schema/organizations';
import { users } from '@/db/schema/users';
import { secureLogger } from '@/lib/logging/secure-logger';

type Transaction = PgTransaction<
	PostgresJsQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;

export class OrganizationService {
	/**
	 * Create a personal organization for a user
	 * This creates:
	 * 1. An organization record
	 * 2. An organization member record (user as admin)
	 * 3. Default organization settings
	 *
	 * @param userId - Clerk user ID
	 * @param email - User email
	 * @param name - User full name (optional)
	 * @param tx - Optional database transaction (if provided, uses it instead of creating a new transaction)
	 * @returns Organization ID
	 */
	static async createUserOrganization(
		userId: string,
		email: string,
		name?: string,
		tx?: Transaction,
	): Promise<string> {
		const db = tx || getPoolClient();

		try {
			// Check if user already has an organization
			const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

			if (existingUser?.organizationId && existingUser.organizationId !== 'default') {
				secureLogger.info('User already has organization', {
					userId,
					organizationId: existingUser.organizationId,
				});
				return existingUser.organizationId;
			}

			// Check if organization already exists for this user
			const [existingOrg] = await db
				.select()
				.from(organizations)
				.where(eq(organizations.email, email))
				.limit(1);

			if (existingOrg) {
				secureLogger.info('Organization already exists for email', {
					userId,
					organizationId: existingOrg.id,
					email,
				});
				return existingOrg.id;
			}

			// Generate organization ID
			const organizationId = crypto.randomUUID();

			// Create organization name from user name or email
			const orgName = name || email.split('@')[0] || `User ${userId.slice(-8)}`;

			// If transaction is provided, use it directly; otherwise create a new transaction
			if (tx) {
				// Use provided transaction
				await tx.insert(organizations).values({
					id: organizationId,
					name: orgName,
					fantasyName: orgName,
					email,
					organizationType: 'individual',
					status: 'active',
					memberLimit: 1, // Personal organization
				});

				await tx.insert(organizationMembers).values({
					organizationId,
					userId,
					role: 'admin',
					status: 'active',
				});

				await tx.insert(organizationSettings).values({
					organizationId,
					defaultLanguage: 'pt-BR',
					timezone: 'America/Sao_Paulo',
					currency: 'BRL',
					dateFormat: 'dd/MM/yyyy',
				});
			} else {
				// Create new transaction
				await db.transaction(async (transaction) => {
					// 1. Create organization
					await transaction.insert(organizations).values({
						id: organizationId,
						name: orgName,
						fantasyName: orgName,
						email,
						organizationType: 'individual',
						status: 'active',
						memberLimit: 1, // Personal organization
					});

					// 2. Create organization member (user as admin)
					await transaction.insert(organizationMembers).values({
						organizationId,
						userId,
						role: 'admin',
						status: 'active',
					});

					// 3. Create default organization settings
					await transaction.insert(organizationSettings).values({
						organizationId,
						defaultLanguage: 'pt-BR',
						timezone: 'America/Sao_Paulo',
						currency: 'BRL',
						dateFormat: 'dd/MM/yyyy',
					});
				});
			}

			secureLogger.info('Organization created for user', {
				userId,
				organizationId,
				email,
				name: orgName,
			});

			return organizationId;
		} catch (error) {
			secureLogger.error('Failed to create organization for user', {
				userId,
				email,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw new Error('Falha ao criar organização para o usuário');
		}
	}

	/**
	 * Get organization ID for a user
	 * @param userId - Clerk user ID
	 * @returns Organization ID or null if not found
	 */
	static async getUserOrganizationId(userId: string): Promise<string | null> {
		const db = getPoolClient();

		try {
			const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

			if (!user) {
				return null;
			}

			return user.organizationId || null;
		} catch (error) {
			secureLogger.error('Failed to get user organization', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		}
	}

	/**
	 * Verify user is member of organization
	 * @param userId - Clerk user ID
	 * @param organizationId - Organization ID
	 * @returns True if user is a member
	 */
	static async isUserMember(userId: string, organizationId: string): Promise<boolean> {
		const db = getPoolClient();

		try {
			const [member] = await db
				.select()
				.from(organizationMembers)
				.where(eq(organizationMembers.userId, userId))
				.limit(1);

			return member?.organizationId === organizationId && member.status === 'active';
		} catch (error) {
			secureLogger.error('Failed to verify organization membership', {
				userId,
				organizationId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return false;
		}
	}
}

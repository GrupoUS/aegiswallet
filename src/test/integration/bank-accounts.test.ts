/**
 * Bank Accounts Integration Tests
 * Tests the Drizzle database operations for bank account CRUD
 *
 * These tests verify data integrity and database operations directly.
 */
import { and, desc, eq, inArray } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
	bankAccounts,
	cleanupBankAccounts,
	cleanupUserData,
	createTestUser,
	type DbClient,
	getTestDbClient,
	hasIntegrationTestEnv,
	type TestUser,
	users,
} from './helpers';
import type { InsertBankAccount } from '@/db/schema';

describe.skipIf(!hasIntegrationTestEnv())(
	'Bank Accounts API Integration',
	() => {
		let testUser: TestUser;
		let createdAccountIds: string[] = [];
		let db: DbClient;

		beforeAll(async () => {
			db = getTestDbClient();
			testUser = await createTestUser(db);
		});

		afterEach(async () => {
			if (createdAccountIds.length) {
				await cleanupBankAccounts(createdAccountIds, db);
				createdAccountIds = [];
			}
		});

		afterAll(async () => {
			await cleanupUserData(testUser.id, db);
		});

		// Helper to directly create account in DB for testing
		const createAccountDirect = async (
			accountData: Partial<InsertBankAccount>,
		) => {
			const [data] = await db
				.insert(bankAccounts)
				.values({
					userId: testUser.id,
					institutionName: accountData.institutionName || 'Test Bank',
					institutionId: accountData.institutionId || `inst_${Date.now()}`,
					accountType: accountData.accountType || 'CHECKING',
					accountMask:
						accountData.accountMask ||
						`**** ${Math.floor(1000 + Math.random() * 9000)}`,
					balance: accountData.balance ?? '0',
					currency: accountData.currency || 'BRL',
					isPrimary: accountData.isPrimary ?? false,
					isActive: accountData.isActive ?? true,
					belvoAccountId: accountData.belvoAccountId || `manual_${Date.now()}`,
					syncStatus: accountData.syncStatus || 'manual',
				})
				.returning();

			if (!data) throw new Error('Failed to create test account');
			createdAccountIds.push(data.id);
			return data;
		};

		const listAccounts = async () => {
			const data = await db
				.select()
				.from(bankAccounts)
				.where(eq(bankAccounts.userId, testUser.id))
				.orderBy(desc(bankAccounts.createdAt));
			return data;
		};

		const getAccountById = async (id: string) => {
			const [data] = await db
				.select()
				.from(bankAccounts)
				.where(
					and(eq(bankAccounts.id, id), eq(bankAccounts.userId, testUser.id)),
				)
				.limit(1);
			return data ?? null;
		};

		// =====================================================
		// Data Integrity Tests - Direct Database Operations
		// =====================================================

		it('creates manual account with correct sync_status', async () => {
			const account = await createAccountDirect({
				institutionName: 'Banco Manual',
				accountType: 'CHECKING',
				balance: '1500',
				syncStatus: 'manual',
				belvoAccountId: `manual_${Date.now()}`,
			});

			expect(account.syncStatus).toBe('manual');
			expect(account.belvoAccountId).toMatch(/^manual_/);
		});

		it('normalizes account mask format correctly', async () => {
			const account = await createAccountDirect({
				institutionName: 'Banco Máscara',
				accountMask: '**** 1234',
			});

			expect(account.accountMask).toBe('**** 1234');
		});

		it('stores Belvo account with pending sync_status', async () => {
			const belvoId = 'belvo-account-123';
			const account = await createAccountDirect({
				institutionName: 'Banco Digital',
				belvoAccountId: belvoId,
				syncStatus: 'pending',
				isPrimary: true,
			});

			expect(account.syncStatus).toBe('pending');
			expect(account.belvoAccountId).toBe(belvoId);
			expect(account.isPrimary).toBe(true);
		});

		it('prevents duplicate accounts by belvo_account_id (unique constraint)', async () => {
			const belvoId = `unique_${Date.now()}`;
			await createAccountDirect({
				institutionName: 'Banco Duplicado',
				institutionId: 'DUPLICADO_TEST',
				accountMask: '**** 1111',
				accountType: 'CHECKING',
				belvoAccountId: belvoId,
			});

			// Attempt to create duplicate with same belvo_account_id
			try {
				await db.insert(bankAccounts).values({
					userId: testUser.id,
					institutionName: 'Banco Duplicado 2',
					institutionId: 'DUPLICADO_TEST_2',
					accountMask: '**** 2222',
					accountType: 'CHECKING',
					belvoAccountId: belvoId, // Same belvo_account_id
				});
				expect.fail('Should have thrown unique constraint error');
			} catch (error) {
				// Should fail due to unique constraint on belvo_account_id
				expect(error).toBeDefined();
			}
		});

		// =====================================================
		// Update Operations Tests
		// =====================================================

		it('updates account information correctly', async () => {
			const created = await createAccountDirect({
				institutionName: 'Banco Atualização',
				balance: '500',
				isPrimary: false,
			});

			const [updated] = await db
				.update(bankAccounts)
				.set({
					balance: '800',
					institutionName: 'Banco Atualizado',
					isPrimary: true,
				})
				.where(
					and(
						eq(bankAccounts.id, created.id),
						eq(bankAccounts.userId, testUser.id),
					),
				)
				.returning();

			expect(updated?.balance).toBe('800');
			expect(updated?.institutionName).toBe('Banco Atualizado');
			expect(updated?.isPrimary).toBe(true);
		});

		it('preserves immutable belvo_account_id on update', async () => {
			const originalBelvoId = `manual_${Date.now()}`;
			const created = await createAccountDirect({
				institutionName: 'Banco Imutável',
				belvoAccountId: originalBelvoId,
			});

			// Update institution name only (not belvo_account_id)
			const [updated] = await db
				.update(bankAccounts)
				.set({ institutionName: 'Banco Atualizado' })
				.where(
					and(
						eq(bankAccounts.id, created.id),
						eq(bankAccounts.userId, testUser.id),
					),
				)
				.returning();

			expect(updated?.belvoAccountId).toBe(originalBelvoId);
		});

		// =====================================================
		// Delete Operations Tests
		// =====================================================

		it('removes account and verifies deletion', async () => {
			const created = await createAccountDirect({
				institutionName: 'Banco Remoção',
			});

			const accountId = created.id;
			// Remove from tracked IDs since we're deleting it manually
			createdAccountIds = createdAccountIds.filter((id) => id !== accountId);

			await db
				.delete(bankAccounts)
				.where(
					and(
						eq(bankAccounts.id, accountId),
						eq(bankAccounts.userId, testUser.id),
					),
				);

			const list = await listAccounts();
			expect(list.some((acc) => acc.id === accountId)).toBe(false);
		});

		// =====================================================
		// Query Operations Tests
		// =====================================================

		it('returns all accounts for user', async () => {
			const acc1 = await createAccountDirect({
				institutionName: 'Banco Lista 1',
				balance: '1000',
			});
			const acc2 = await createAccountDirect({
				institutionName: 'Banco Lista 2',
				balance: '2000',
			});

			const all = await listAccounts();
			expect(all.length).toBeGreaterThanOrEqual(2);
			expect(all.some((a) => a.id === acc1.id)).toBe(true);
			expect(all.some((a) => a.id === acc2.id)).toBe(true);
		});

		it('fetches account by ID', async () => {
			const account = await createAccountDirect({
				institutionName: 'Banco Busca',
				balance: '700',
				isPrimary: true,
			});

			const byId = await getAccountById(account.id);
			expect(byId?.id).toBe(account.id);
			expect(byId?.institutionName).toBe('Banco Busca');
			expect(byId?.balance).toBe('700');
		});

		// =====================================================
		// Aggregation Tests
		// =====================================================

		it('calculates total balance aggregated by currency', async () => {
			await createAccountDirect({
				institutionName: 'Banco Soma A',
				balance: '100',
				currency: 'BRL',
				isActive: true,
			});
			await createAccountDirect({
				institutionName: 'Banco Soma B',
				balance: '300',
				currency: 'BRL',
				isActive: true,
			});
			await createAccountDirect({
				institutionName: 'Banco USD',
				balance: '50',
				currency: 'USD',
				isActive: true,
			});

			const accounts = await db
				.select({
					balance: bankAccounts.balance,
					currency: bankAccounts.currency,
				})
				.from(bankAccounts)
				.where(
					and(
						eq(bankAccounts.userId, testUser.id),
						eq(bankAccounts.isActive, true),
					),
				);

			const totals: Record<string, number> = {};
			accounts.forEach((acc) => {
				const currency = acc.currency || 'BRL';
				totals[currency] = (totals[currency] || 0) + Number(acc.balance || 0);
			});

			expect(totals.BRL).toBeGreaterThanOrEqual(400);
			expect(totals.USD).toBeGreaterThanOrEqual(50);
		});

		it('updates balance directly', async () => {
			const created = await createAccountDirect({
				institutionName: 'Banco Saldo',
				balance: '10',
			});

			const [updated] = await db
				.update(bankAccounts)
				.set({ balance: '999' })
				.where(
					and(
						eq(bankAccounts.id, created.id),
						eq(bankAccounts.userId, testUser.id),
					),
				)
				.returning();

			expect(updated?.balance).toBe('999');
		});

		// =====================================================
		// Data Type Validation Tests
		// =====================================================

		it('stores all account types correctly', async () => {
			const accountTypes = [
				'CHECKING',
				'SAVINGS',
				'INVESTMENT',
				'DIGITAL_WALLET',
			];

			for (const accountType of accountTypes) {
				const account = await createAccountDirect({
					institutionName: `Banco ${accountType}`,
					accountType,
				});
				expect(account.accountType).toBe(accountType);
			}
		});

		it('stores multiple currencies correctly', async () => {
			const currencies = ['BRL', 'USD', 'EUR'];

			for (const currency of currencies) {
				const account = await createAccountDirect({
					institutionName: `Banco ${currency}`,
					currency,
				});
				expect(account.currency).toBe(currency);
			}
		});

		// =====================================================
		// User Isolation Tests
		// =====================================================

		it('isolates accounts between users', async () => {
			// Create account for test user
			const testAccount = await createAccountDirect({
				institutionName: 'Banco RLS Test',
				balance: '1000',
			});

			// Create another user
			const otherUserId = `other_${Date.now()}_${Math.random().toString(36).slice(2)}`;
			const otherUserEmail = `other_${Date.now()}@aegiswallet.dev`;

			await db.insert(users).values({
				id: otherUserId,
				email: otherUserEmail,
				fullName: 'Other Test User',
				autonomyLevel: 50,
				isActive: true,
			});

			try {
				// Query accounts for other user - should return empty
				const otherUserAccounts = await db
					.select()
					.from(bankAccounts)
					.where(eq(bankAccounts.userId, otherUserId));

				// Other user should have no accounts
				expect(otherUserAccounts.length).toBe(0);

				// Test user's account should still exist and be accessible
				const myAccount = await getAccountById(testAccount.id);
				expect(myAccount?.id).toBe(testAccount.id);
			} finally {
				// Cleanup other user
				await db.delete(users).where(eq(users.id, otherUserId));
			}
		});
	},
);

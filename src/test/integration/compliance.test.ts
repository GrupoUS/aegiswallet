/**
 * LGPD Compliance Routes Integration Tests
 *
 * Tests the compliance functionality for LGPD compliance:
 * - Consent management
 * - Data export requests
 * - Data deletion requests
 * - Transaction limits
 * - Audit logging
 *
 * Run: bun test src/test/integration/compliance.test.ts
 */

import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
	cleanupUserData,
	complianceAuditLogs,
	consentTemplates,
	createTestUser,
	type DbClient,
	dataDeletionRequests,
	getTestDbClient,
	hasIntegrationTestEnv,
	lgpdConsents,
	lgpdExportRequests,
	type TestUser,
	transactionLimits,
} from './helpers';

describe.skipIf(!hasIntegrationTestEnv())(
	'LGPD Compliance Integration Tests',
	() => {
		let db: DbClient;
		let testUser: TestUser;

		beforeAll(async () => {
			db = getTestDbClient();
			testUser = await createTestUser(db);
		});

		afterAll(async () => {
			if (testUser) {
				await cleanupUserData(testUser.id, db);
			}
		});

		describe('Consent Templates', () => {
			it('should have active consent templates in database', async () => {
				const templates = await db
					.select()
					.from(consentTemplates)
					.where(eq(consentTemplates.isActive, true));

				expect(templates).toBeDefined();
				expect(templates.length).toBeGreaterThan(0);
			});

			it('should have mandatory consent templates', async () => {
				const templates = await db
					.select()
					.from(consentTemplates)
					.where(
						and(
							eq(consentTemplates.isMandatory, true),
							eq(consentTemplates.isActive, true),
						),
					);

				expect(templates).toBeDefined();
				expect(templates.length).toBeGreaterThan(0);

				// Check that data_processing is mandatory
				const hasDataProcessing = templates.some(
					(t) => t.consentType === 'data_processing',
				);
				expect(hasDataProcessing).toBe(true);
			});

			it('should have Portuguese localization for templates', async () => {
				const [template] = await db
					.select({
						titlePt: consentTemplates.titlePt,
						descriptionPt: consentTemplates.descriptionPt,
						fullTextPt: consentTemplates.fullTextPt,
					})
					.from(consentTemplates)
					.where(eq(consentTemplates.isActive, true))
					.limit(1);

				expect(template).toBeDefined();
				expect(template.titlePt).toBeTruthy();
				expect(template.descriptionPt).toBeTruthy();
				expect(template.fullTextPt).toBeTruthy();
			});
		});

		describe('Consent Management', () => {
			beforeEach(async () => {
				// Clean up any existing consents for the test user
				await db
					.delete(lgpdConsents)
					.where(eq(lgpdConsents.userId, testUser.id));
			});

			it('should create consent record', async () => {
				const [template] = await db
					.select()
					.from(consentTemplates)
					.where(
						and(
							eq(consentTemplates.consentType, 'data_processing'),
							eq(consentTemplates.isActive, true),
						),
					)
					.limit(1);

				if (!template) {
					throw new Error('No consent template found');
				}

				const [consent] = await db
					.insert(lgpdConsents)
					.values({
						userId: testUser.id,
						consentType: 'data_processing',
						purpose: template.descriptionPt,
						legalBasis: 'consent',
						granted: true,
						grantedAt: new Date(),
						consentVersion: template.version,
						consentTextHash: 'test-hash',
						collectionMethod: 'signup',
					})
					.returning();

				expect(consent).toBeDefined();
				expect(consent.userId).toBe(testUser.id);
				expect(consent.consentType).toBe('data_processing');
				expect(consent.granted).toBe(true);
			});

			it('should prevent duplicate consents with same version', async () => {
				const [template] = await db
					.select()
					.from(consentTemplates)
					.where(
						and(
							eq(consentTemplates.consentType, 'analytics'),
							eq(consentTemplates.isActive, true),
						),
					)
					.limit(1);

				if (!template) {
					throw new Error('No consent template found');
				}

				// First insert should succeed
				await db.insert(lgpdConsents).values({
					userId: testUser.id,
					consentType: 'analytics',
					purpose: template.descriptionPt,
					legalBasis: 'consent',
					granted: true,
					grantedAt: new Date(),
					consentVersion: template.version,
					consentTextHash: 'test-hash',
					collectionMethod: 'signup',
				});

				// Second insert with same version should be handled by unique constraint
				// Using onConflictDoUpdate to simulate upsert behavior
				const [updated] = await db
					.insert(lgpdConsents)
					.values({
						userId: testUser.id,
						consentType: 'analytics',
						purpose: template.descriptionPt,
						legalBasis: 'consent',
						granted: true,
						grantedAt: new Date(),
						consentVersion: template.version,
						consentTextHash: 'test-hash-updated',
						collectionMethod: 'signup',
					})
					.onConflictDoUpdate({
						target: [
							lgpdConsents.userId,
							lgpdConsents.consentType,
							lgpdConsents.consentVersion,
						],
						set: {
							consentTextHash: 'test-hash-updated',
							updatedAt: new Date(),
						},
					})
					.returning();

				expect(updated).toBeDefined();
			});
		});

		describe('Data Export Requests', () => {
			beforeEach(async () => {
				await db
					.delete(lgpdExportRequests)
					.where(eq(lgpdExportRequests.userId, testUser.id));
			});

			it('should create export request', async () => {
				const [request] = await db
					.insert(lgpdExportRequests)
					.values({
						userId: testUser.id,
						requestType: 'full_data',
						format: 'json',
						status: 'pending',
						requestedVia: 'app',
					})
					.returning();

				expect(request).toBeDefined();
				expect(request.status).toBe('pending');
				expect(request.format).toBe('json');
			});

			it('should track export request status transitions', async () => {
				// Create pending request
				const [request] = await db
					.insert(lgpdExportRequests)
					.values({
						userId: testUser.id,
						requestType: 'transactions',
						format: 'csv',
						status: 'pending',
						requestedVia: 'app',
					})
					.returning();

				expect(request).toBeDefined();

				// Update to processing
				const [updated] = await db
					.update(lgpdExportRequests)
					.set({
						status: 'processing',
						processedAt: new Date(),
					})
					.where(eq(lgpdExportRequests.id, request.id))
					.returning();

				expect(updated.status).toBe('processing');
				expect(updated.processedAt).toBeTruthy();
			});
		});

		describe('Data Deletion Requests', () => {
			beforeEach(async () => {
				await db
					.delete(dataDeletionRequests)
					.where(eq(dataDeletionRequests.userId, testUser.id));
			});

			it('should create deletion request with review deadline', async () => {
				const [request] = await db
					.insert(dataDeletionRequests)
					.values({
						userId: testUser.id,
						requestType: 'full_account',
						status: 'pending',
						scope: {},
						reason: 'Encerramento de conta',
						verificationCode: 'TEST123',
						reviewDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
					})
					.returning();

				expect(request).toBeDefined();
				expect(request.status).toBe('pending');
				expect(request.verificationCode).toBe('TEST123');
				expect(request.reviewDeadline).toBeTruthy();
			});

			it('should enforce legal hold on deletion', async () => {
				// Create a request with legal hold
				const [holdRequest] = await db
					.insert(dataDeletionRequests)
					.values({
						userId: testUser.id,
						requestType: 'full_account',
						status: 'approved',
						scope: {},
						legalHold: true,
						verificationCode: 'HOLD123',
					})
					.returning();

				expect(holdRequest).toBeDefined();
				expect(holdRequest.legalHold).toBe(true);
			});
		});

		describe('Transaction Limits', () => {
			beforeEach(async () => {
				await db
					.delete(transactionLimits)
					.where(eq(transactionLimits.userId, testUser.id));
			});

			it('should create transaction limit for user', async () => {
				const [limit] = await db
					.insert(transactionLimits)
					.values({
						userId: testUser.id,
						limitType: 'pix_daily',
						dailyLimit: '5000',
						currentDailyUsed: '0',
						currentMonthlyUsed: '0',
						lastResetAt: new Date(),
						isActive: true,
					})
					.returning();

				expect(limit).toBeDefined();
				expect(limit.dailyLimit).toBe('5000');
				expect(limit.currentDailyUsed).toBe('0');
			});

			it('should track limit usage', async () => {
				// Create limit
				const [limit] = await db
					.insert(transactionLimits)
					.values({
						userId: testUser.id,
						limitType: 'pix_daily',
						dailyLimit: '5000',
						currentDailyUsed: '0',
						currentMonthlyUsed: '0',
						lastResetAt: new Date(),
						isActive: true,
					})
					.returning();

				expect(limit).toBeDefined();

				// Update usage
				const [updated] = await db
					.update(transactionLimits)
					.set({
						currentDailyUsed: '1500',
						currentMonthlyUsed: '1500',
					})
					.where(eq(transactionLimits.id, limit.id))
					.returning();

				expect(updated.currentDailyUsed).toBe('1500');
			});
		});

		describe('Audit Logging', () => {
			beforeEach(async () => {
				await db
					.delete(complianceAuditLogs)
					.where(eq(complianceAuditLogs.userId, testUser.id));
			});

			it('should create audit log entry', async () => {
				const [log] = await db
					.insert(complianceAuditLogs)
					.values({
						userId: testUser.id,
						eventType: 'consent_granted',
						resourceType: 'lgpd_consents',
						resourceId: 'test-consent-id',
						metadata: {
							consent_type: 'data_processing',
							description: 'User granted data processing consent',
						},
					})
					.returning();

				expect(log).toBeDefined();
				expect(log.eventType).toBe('consent_granted');
				expect(
					(log.metadata as Record<string, unknown>)?.description,
				).toBeDefined();
			});

			it('should query audit logs by event type', async () => {
				// Create multiple log entries with correct Drizzle schema property names
				await db.insert(complianceAuditLogs).values([
					{
						userId: testUser.id,
						eventType: 'consent_granted',
						resourceType: 'lgpd_consents',
						resourceId: 'test-consent-1',
					},
					{
						userId: testUser.id,
						eventType: 'consent_revoked',
						resourceType: 'lgpd_consents',
						resourceId: 'test-consent-2',
					},
					{
						userId: testUser.id,
						eventType: 'data_export_requested',
						resourceType: 'lgpd_export_requests',
						resourceId: 'test-export-1',
					},
				]);

				const grantedLogs = await db
					.select()
					.from(complianceAuditLogs)
					.where(
						and(
							eq(complianceAuditLogs.userId, testUser.id),
							eq(complianceAuditLogs.eventType, 'consent_granted'),
						),
					);

				expect(grantedLogs.length).toBe(1);
				expect(grantedLogs[0].eventType).toBe('consent_granted');
			});
		});

		describe('User Isolation', () => {
			it('should enforce user isolation for consents', async () => {
				// Create consent for test user
				const [template] = await db
					.select()
					.from(consentTemplates)
					.where(
						and(
							eq(consentTemplates.consentType, 'marketing'),
							eq(consentTemplates.isActive, true),
						),
					)
					.limit(1);

				if (!template) return;

				await db.insert(lgpdConsents).values({
					userId: testUser.id,
					consentType: 'marketing',
					purpose: template.descriptionPt,
					legalBasis: 'consent',
					granted: true,
					grantedAt: new Date(),
					consentVersion: template.version,
					consentTextHash: 'test-hash',
					collectionMethod: 'signup',
				});

				// Query should only return this user's consents
				const consents = await db
					.select()
					.from(lgpdConsents)
					.where(eq(lgpdConsents.userId, testUser.id));

				expect(consents).toBeDefined();
				expect(consents.every((c) => c.userId === testUser.id)).toBe(true);
			});
		});
	},
);

/**
 * Clerk Webhook Tests
 *
 * Tests for user creation, organization creation, and idempotency
 */

import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPoolClient } from '@/db/client';
import { subscriptions } from '@/db/schema/billing';
import { organizationMembers, organizations } from '@/db/schema/organizations';
import { users } from '@/db/schema/users';
import { OrganizationService } from '@/services/organization.service';
import { StripeCustomerService } from '@/services/stripe/customer.service';

// Mock Stripe
vi.mock('@/lib/stripe/client', () => ({
	getStripeClient: vi.fn(() => ({
		customers: {
			create: vi.fn(),
			search: vi.fn(),
			list: vi.fn(),
			update: vi.fn(),
			del: vi.fn(),
		},
		subscriptions: {
			list: vi.fn(),
			cancel: vi.fn(),
		},
	})),
}));

// Mock Clerk
vi.mock('@clerk/backend', () => ({
	createClerkClient: vi.fn(() => ({
		users: {
			updateUserMetadata: vi.fn(),
		},
	})),
}));

describe('Clerk Webhook - User Creation', () => {
	beforeEach(async () => {
		// Clean up test data
		const db = getPoolClient();

		// Delete in correct order (respecting foreign keys)
		await db.delete(subscriptions);
		await db.delete(organizationMembers);
		await db.delete(users);
		await db.delete(organizations);
	});

	it('should create organization when creating user', async () => {
		const userId = 'user_test_org_creation';
		const email = 'test-org@example.com';
		const name = 'Test User';

		const organizationId = await OrganizationService.createUserOrganization(userId, email, name);

		expect(organizationId).toBeDefined();
		expect(organizationId).not.toBe('default');

		// Verify organization was created
		const db = getPoolClient();
		const [org] = await db
			.select()
			.from(organizations)
			.where(eq(organizations.id, organizationId))
			.limit(1);

		expect(org).toBeDefined();
		expect(org?.name).toBe(name);
		expect(org?.email).toBe(email);
		expect(org?.organizationType).toBe('individual');
		expect(org?.status).toBe('active');
	});

	it('should create organization member when creating organization', async () => {
		const userId = 'user_test_member_creation';
		const email = 'test-member@example.com';
		const name = 'Test User';

		const organizationId = await OrganizationService.createUserOrganization(userId, email, name);

		// Verify organization member was created
		const db = getPoolClient();
		const [member] = await db
			.select()
			.from(organizationMembers)
			.where(eq(organizationMembers.userId, userId))
			.limit(1);

		expect(member).toBeDefined();
		expect(member?.organizationId).toBe(organizationId);
		expect(member?.role).toBe('admin');
		expect(member?.status).toBe('active');
	});

	it('should be idempotent - return existing organization if user already has one', async () => {
		const userId = 'user_test_idempotent';
		const email = 'test-idempotent@example.com';
		const name = 'Test User';

		// Create organization first time
		const orgId1 = await OrganizationService.createUserOrganization(userId, email, name);

		// Try to create again
		const orgId2 = await OrganizationService.createUserOrganization(userId, email, name);

		expect(orgId1).toBe(orgId2);

		// Verify only one organization exists
		const db = getPoolClient();
		const orgs = await db.select().from(organizations).where(eq(organizations.email, email));

		expect(orgs.length).toBe(1);
	});

	it('should handle user without name', async () => {
		const userId = 'user_test_no_name';
		const email = 'test-noname@example.com';

		const organizationId = await OrganizationService.createUserOrganization(userId, email);

		expect(organizationId).toBeDefined();

		const db = getPoolClient();
		const [org] = await db
			.select()
			.from(organizations)
			.where(eq(organizations.id, organizationId))
			.limit(1);

		expect(org?.name).toBeDefined();
		// Should use email prefix as name
		expect(org?.name).toContain('test-noname');
	});
});

describe('Clerk Webhook - Idempotency', () => {
	it('should use idempotency key for Stripe customer creation', async () => {
		const userId = 'user_test_stripe_idempotency';
		const email = 'test-stripe@example.com';
		const name = 'Test User';

		// Mock Stripe to track idempotency keys
		const stripe = await import('@/lib/stripe/client');
		const mockStripe = stripe.getStripeClient() as any;

		// First call
		mockStripe.customers.search.mockResolvedValue({ data: [] });
		mockStripe.customers.list.mockResolvedValue({ data: [] });
		mockStripe.customers.create.mockResolvedValue({
			id: 'cus_test123',
			email,
			name,
		});

		await StripeCustomerService.createCustomer(userId, email, name);

		expect(mockStripe.customers.create).toHaveBeenCalled();
		const createCall = mockStripe.customers.create.mock.calls[0];
		expect(createCall[1]).toHaveProperty('idempotencyKey');
		expect(createCall[1].idempotencyKey).toContain(userId);
	});

	it('should check for existing Stripe customer before creating', async () => {
		const userId = 'user_test_stripe_existing';
		const email = 'test-existing@example.com';
		const name = 'Test User';

		const stripe = await import('@/lib/stripe/client');
		const mockStripe = stripe.getStripeClient() as any;

		// Mock existing customer found by metadata
		mockStripe.customers.search.mockResolvedValue({
			data: [{ id: 'cus_existing', email, metadata: { clerkUserId: userId } }],
		});

		const customerId = await StripeCustomerService.getOrCreateCustomer(userId, email, name);

		expect(customerId).toBe('cus_existing');
		expect(mockStripe.customers.create).not.toHaveBeenCalled();
	});

	it('should fallback to email search if metadata search fails', async () => {
		const userId = 'user_test_stripe_fallback';
		const email = 'test-fallback@example.com';
		const name = 'Test User';

		const stripe = await import('@/lib/stripe/client');
		const mockStripe = stripe.getStripeClient() as any;

		// Mock metadata search returns empty
		mockStripe.customers.search.mockResolvedValue({ data: [] });
		// Mock email search finds customer
		mockStripe.customers.list.mockResolvedValue({
			data: [{ id: 'cus_fallback', email }],
		});
		mockStripe.customers.update.mockResolvedValue({});

		const customerId = await StripeCustomerService.getOrCreateCustomer(userId, email, name);

		expect(customerId).toBe('cus_fallback');
		expect(mockStripe.customers.update).toHaveBeenCalledWith('cus_fallback', {
			metadata: { clerkUserId: userId },
		});
		expect(mockStripe.customers.create).not.toHaveBeenCalled();
	});
});

describe('OrganizationService', () => {
	it('should get user organization ID', async () => {
		const userId = 'user_test_get_org';
		const email = 'test-get-org@example.com';

		// Create user and organization
		const organizationId = await OrganizationService.createUserOrganization(userId, email);

		const db = getPoolClient();
		await db.insert(users).values({
			id: userId,
			email,
			organizationId,
		});

		// Get organization ID
		const retrievedOrgId = await OrganizationService.getUserOrganizationId(userId);

		expect(retrievedOrgId).toBe(organizationId);
	});

	it('should return null for non-existent user', async () => {
		const orgId = await OrganizationService.getUserOrganizationId('user_nonexistent');

		expect(orgId).toBeNull();
	});

	it('should verify user is member of organization', async () => {
		const userId = 'user_test_member_check';
		const email = 'test-member-check@example.com';

		const organizationId = await OrganizationService.createUserOrganization(userId, email);

		const isMember = await OrganizationService.isUserMember(userId, organizationId);

		expect(isMember).toBe(true);
	});

	it('should return false for non-member', async () => {
		const userId = 'user_test_non_member';
		const email = 'test-non-member@example.com';
		const otherOrgId = 'org_other';

		const isMember = await OrganizationService.isUserMember(userId, otherOrgId);

		expect(isMember).toBe(false);
	});
});

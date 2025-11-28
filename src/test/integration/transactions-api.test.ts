import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { hasIntegrationTestEnv } from './helpers';
import { apiClient } from '@/lib/api-client';

// Mock Clerk auth for integration tests
vi.mock('@clerk/clerk-react', () => ({
	useAuth: () => ({
		isLoaded: true,
		isSignedIn: true,
		userId: 'test-user-id',
		getToken: vi.fn().mockResolvedValue('test-token'),
	}),
	useUser: () => ({
		user: {
			id: 'test-user-id',
			emailAddresses: [{ emailAddress: 'test@aegiswallet.com' }],
		},
		isLoaded: true,
	}),
}));

describe.skipIf(!hasIntegrationTestEnv())(
	'Transactions API Integration',
	() => {
		let authToken: string;
		let testTransactionId: string;

		beforeAll(async () => {
			// For integration tests, we use a mock token
			// In a real integration test environment, this would be obtained from Clerk
			authToken = 'test-integration-token';
		});

		it('should create a new transaction via API', async () => {
			if (!authToken) return;

			const transaction = {
				title: 'Teste de Transação',
				amount: 100.5,
				type: 'expense',
				category: 'ALIMENTACAO', // Ensure this category exists or is valid string
				status: 'pending',
			};

			const response = await apiClient.post<any>(
				'/v1/transactions',
				transaction,
			);
			expect(response.data).toBeDefined();
			expect(response.data.title).toBe(transaction.title);
			testTransactionId = response.data.id;
		});

		it('should list transactions via API', async () => {
			if (!authToken) return;
			const response = await apiClient.get<any>('/v1/transactions');
			expect(response.data).toBeInstanceOf(Array);
			expect(response.data.length).toBeGreaterThan(0);
		});

		it('should update transaction via API', async () => {
			if (!authToken || !testTransactionId) return;
			const updates = { status: 'completed' };
			const response = await apiClient.put<any>(
				`/v1/transactions/${testTransactionId}`,
				updates,
			);
			expect(response.data.status).toBe('completed');
		});

		it('should delete transaction via API', async () => {
			if (!authToken || !testTransactionId) return;
			const response = await apiClient.delete<any>(
				`/v1/transactions/${testTransactionId}`,
			);
			expect(response.data.success).toBe(true);
		});

		afterAll(async () => {
			// Cleanup is handled by the test framework
		});
	},
);

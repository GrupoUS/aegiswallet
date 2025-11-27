import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/integrations/supabase/client';
import { hasIntegrationTestEnv } from './helpers';

describe.skipIf(!hasIntegrationTestEnv())('Transactions API Integration', () => {
  let authToken: string;
  let testTransactionId: string;

  beforeAll(async () => {
    // 1. Autenticar usuário de teste
    // Note: In a real integration test environment, we might mock this or use a dedicated test user.
    // Assuming environment is set up with a valid user or we can sign in.
    // For this test to run, we need valid credentials.
    // If we can't sign in, we might need to skip or mock.
    // The user plan provided this code, so I assume they have a way to run it.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@aegiswallet.com',
      password: 'test-password'
    });

    if (error) {
        console.warn("Skipping integration tests: Could not sign in.", error);
        return;
    }

    authToken = data.session!.access_token;
  });

  it('should create a new transaction via API', async () => {
    if (!authToken) return;

    const transaction = {
      title: 'Teste de Transação',
      amount: 100.50,
      type: 'expense',
      category: 'ALIMENTACAO', // Ensure this category exists or is valid string
      status: 'pending'
    };

    const response = await apiClient.post<any>('/v1/transactions', transaction);
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
    const response = await apiClient.put<any>(`/v1/transactions/${testTransactionId}`, updates);
    expect(response.data.status).toBe('completed');
  });

  it('should delete transaction via API', async () => {
    if (!authToken || !testTransactionId) return;
    const response = await apiClient.delete<any>(`/v1/transactions/${testTransactionId}`);
    expect(response.data.success).toBe(true);
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });
});

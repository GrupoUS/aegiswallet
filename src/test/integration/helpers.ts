import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database.types';

/**
 * Check if integration test environment variables are configured
 */
export const hasIntegrationTestEnv = (): boolean => {
	const url = process.env.SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	return Boolean(url && serviceKey);
};

export const getSupabaseAdminClient = (): SupabaseClient<Database> => {
	const url = process.env.SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceKey) {
		throw new Error(
			'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários para testes de integração.',
		);
	}

	return createClient<Database>(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
};

export interface TestUser {
	email: string;
	id: string;
}

export const createTestUser = async (
	client: ReturnType<typeof getSupabaseAdminClient>,
) => {
	const email = `integration_${Date.now()}_${Math.random().toString(36).slice(2)}@aegiswallet.dev`;
	const { data, error } = await client.auth.admin.createUser({
		email,
		email_confirm: true,
		user_metadata: {
			full_name: 'Integration Tester',
		},
	});

	if (error || !data.user) {
		throw new Error(`Falha ao criar usuário de teste: ${error?.message}`);
	}

	await client.from('users').insert({
		autonomy_level: 50,
		email,
		full_name: 'Integration Tester',
		id: data.user.id,
	});

	return { email, id: data.user.id };
};

export const cleanupUserData = async (
	client: ReturnType<typeof getSupabaseAdminClient>,
	userId: string,
) => {
	await client.from('financial_events').delete().eq('user_id', userId);
	await client.from('bank_accounts').delete().eq('user_id', userId);
	await client.from('users').delete().eq('id', userId);
	await client.auth.admin.deleteUser(userId);
};

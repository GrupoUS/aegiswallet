import type { SupabaseClient } from '@supabase/supabase-js';

import { createAccountTools } from './accounts';
import { createCategoryTools } from './categories';
import { createTransactionTools } from './transactions';

export function createAllTools(userId: string, supabase: SupabaseClient) {
	return {
		...createTransactionTools(userId, supabase),
		...createAccountTools(userId, supabase),
		...createCategoryTools(userId, supabase),
	};
}

export type AITools = ReturnType<typeof createAllTools>;

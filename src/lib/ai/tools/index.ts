import type { HttpClient } from '@/db';

import { createAccountTools } from './accounts';
import { createCategoryTools } from './categories';
import { createTransactionTools } from './transactions';

export function createAllTools(userId: string, db: HttpClient) {
	return {
		...createTransactionTools(userId, db),
		...createAccountTools(userId, db),
		...createCategoryTools(userId, db),
	};
}

export type AITools = ReturnType<typeof createAllTools>;

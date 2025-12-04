import { createAccountTools } from './accounts';
import { createCategoryTools } from './categories';
import { createInsightTools } from './insights';
import { createTransactionTools } from './transactions';
import type { DbClient } from '@/db/client';

export function createAllTools(userId: string, db: DbClient) {
	return {
		...createTransactionTools(userId, db),
		...createAccountTools(userId, db),
		...createCategoryTools(userId, db),
		...createInsightTools(userId, db),
	};
}

export type AITools = ReturnType<typeof createAllTools>;

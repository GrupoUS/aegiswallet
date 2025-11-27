import { createAccountTools } from './accounts';
import { createCategoryTools } from './categories';
import { createTransactionTools } from './transactions';

export function createAllTools(userId: string) {
  return {
    ...createTransactionTools(userId),
    ...createAccountTools(userId),
    ...createCategoryTools(userId),
  };
}

export type AITools = ReturnType<typeof createAllTools>;

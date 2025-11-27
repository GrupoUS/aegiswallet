import { createTransactionTools } from './transactions';
import { createAccountTools } from './accounts';
import { createCategoryTools } from './categories';

export function createAllTools(userId: string) {
  return {
    ...createTransactionTools(userId),
    ...createAccountTools(userId),
    ...createCategoryTools(userId),
  };
}

export type AITools = ReturnType<typeof createAllTools>;

import { createAccountTools } from './accounts';
import { createCategoryTools } from './categories';
import { createTransactionTools } from './transactions';
import { createEnhancedTools } from './enhanced';

export function createAllTools(userId: string) {
  return {
    // Core tools
    ...createTransactionTools(userId),
    ...createAccountTools(userId),
    ...createCategoryTools(userId),
    
    // Enhanced Brazilian financial tools
    ...createEnhancedTools(userId),
  };
}

export type AITools = ReturnType<typeof createAllTools>;

// Re-export enhanced tools for direct access
export { createEnhancedTools, type EnhancedTools } from './enhanced';

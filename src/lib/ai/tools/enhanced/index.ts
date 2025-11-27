import { createBoletoTools } from './boletos';
import { createContactsTools } from './contacts';
import { createInsightsTools } from './insights';
import { createMultimodalTools } from './multimodal';
import { createPixTools } from './pix';

export function createEnhancedTools(userId: string) {
	return {
		// Brazilian Financial Operations
		...createPixTools(userId),
		...createBoletoTools(userId),
		...createContactsTools(userId),

		// Advanced Analytics & Insights
		...createInsightsTools(userId),

		// Multi-modal Responses
		...createMultimodalTools(userId),
	};
}

export type EnhancedTools = ReturnType<typeof createEnhancedTools>;

// Re-export types for external use
export * from './types';

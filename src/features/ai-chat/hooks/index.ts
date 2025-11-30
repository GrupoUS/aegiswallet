/**
 * AI Chat Hooks
 * React hooks for managing AI chat interactions
 */

// Core chat controller
export {
	type UseChatControllerOptions,
	type UseChatControllerReturn,
	useChatController,
} from './useChatController';
// Financial Agent hook
export {
	isFinancialAgentAvailable,
	type UseFinancialAgentOptions,
	useFinancialAgent,
} from './useFinancialAgent';

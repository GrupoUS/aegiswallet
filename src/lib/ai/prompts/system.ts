import {
  ENHANCED_FINANCIAL_ASSISTANT_SYSTEM_PROMPT,
  getSystemPromptWithCustomization,
} from './enhanced-system-prompt';

// Legacy system prompt for backward compatibility
export const FINANCIAL_ASSISTANT_SYSTEM_PROMPT = ENHANCED_FINANCIAL_ASSISTANT_SYSTEM_PROMPT;

// Enhanced system prompt with Brazilian market specialization
export { ENHANCED_FINANCIAL_ASSISTANT_SYSTEM_PROMPT, getSystemPromptWithCustomization };

import { createBoletoTools } from './boletos';
import { createContactsTools } from './contacts';
import { createInsightsTools } from './insights';
import { createMultimodalTools } from './multimodal';
import { createNotificationsTools } from './notifications';
import { createPixTools } from './pix';
import { createSecurityTools } from './security';
import { createVoiceTools } from './voice';

export function createEnhancedTools(userId: string) {
  return {
    // Brazilian Financial Operations
    ...createPixTools(userId),
    ...createBoletoTools(userId),
    ...createContactsTools(userId),

    // Advanced Analytics & Insights
    ...createInsightsTools(userId),

    // Enhanced Security & Compliance
    ...createSecurityTools(userId),

    // Voice-First Features
    ...createVoiceTools(userId),

    // Notifications & Alerts
    ...createNotificationsTools(userId),

    // Multi-modal Responses
    ...createMultimodalTools(userId),
  };
}

export type EnhancedTools = ReturnType<typeof createEnhancedTools>;

// Re-export types for external use
export * from './types';

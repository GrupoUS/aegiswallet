import { createPixTools } from './pix';
import { createBoletoTools } from './boletos';
import { createContactsTools } from './contacts';
import { createInsightsTools } from './insights';
// TODO: Implement other tools
// import { createSecurityTools } from './security';
// import { createVoiceTools } from './voice';
// import { createNotificationsTools } from './notifications';
// import { createMultimodalTools } from './multimodal';

export function createEnhancedTools(userId: string) {
  return {
    // Brazilian Financial Operations
    ...createPixTools(userId),
    ...createBoletoTools(userId),
    ...createContactsTools(userId),
    ...createInsightsTools(userId),
    
    // TODO: Add other tool categories when implemented
    // ...createSecurityTools(userId),
    // ...createVoiceTools(userId),
    // ...createNotificationsTools(userId),
    // ...createMultimodalTools(userId),
  };
}

export type EnhancedTools = ReturnType<typeof createEnhancedTools>;

// Re-export types for external use
export * from './types';

import { AgUiBackend, type AgUiBackendConfig } from './AgUiBackend';
import { type ChatBackend } from './ChatBackend';
import { CopilotKitBackend, type CopilotKitBackendConfig } from './CopilotKitBackend';
import { GeminiBackend, type GeminiBackendConfig } from './GeminiBackend';
import { OttomatorBackend, type OttomatorBackendConfig } from './OttomatorBackend';

export type BackendType = 'gemini' | 'copilotkit' | 'ag-ui' | 'ottomator';

export type BackendConfig =
  | ({ type: 'gemini' } & GeminiBackendConfig)
  | ({ type: 'copilotkit' } & CopilotKitBackendConfig)
  | ({ type: 'ag-ui' } & AgUiBackendConfig)
  | ({ type: 'ottomator' } & OttomatorBackendConfig);

export function createChatBackend(config: BackendConfig): ChatBackend {
  switch (config.type) {
    case 'gemini':
      return new GeminiBackend(config);
    case 'copilotkit':
      return new CopilotKitBackend(config);
    case 'ag-ui':
      return new AgUiBackend(config);
    case 'ottomator':
      return new OttomatorBackend(config);
    default:
      throw new Error(`Unknown backend type: ${(config as any).type}`);
  }
}

export function getDefaultBackend(): ChatBackend {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
  }

  return new GeminiBackend({
    apiKey: apiKey || '',
    model: import.meta.env.VITE_DEFAULT_AI_MODEL || 'gemini-pro',
  });
}

export * from './AgUiBackend';
export * from './ChatBackend';
export * from './CopilotKitBackend';
export * from './GeminiBackend';
export * from './OttomatorBackend';

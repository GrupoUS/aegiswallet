import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const AIProviderSchema = z.enum(['openai', 'anthropic', 'google']);
export type AIProvider = z.infer<typeof AIProviderSchema>;

const providerConfigs = {
  openai: {
    default: () => openai('gpt-4o'),
    fast: () => openai('gpt-4o-mini'),
    envKey: 'OPENAI_API_KEY',
  },
  anthropic: {
    default: () => anthropic('claude-3-5-sonnet-latest'),
    fast: () => anthropic('claude-3-5-haiku-latest'),
    envKey: 'ANTHROPIC_API_KEY',
  },
  google: {
    default: () => google('gemini-1.5-pro-latest'),
    fast: () => google('gemini-1.5-flash-latest'),
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
  },
} as const;

export function getModel(provider: AIProvider, tier: 'default' | 'fast' = 'default') {
  const config = providerConfigs[provider];
  return config[tier]();
}

export function getAvailableProviders(): AIProvider[] {
  const available: AIProvider[] = [];

  if (process.env.OPENAI_API_KEY) available.push('openai');
  if (process.env.ANTHROPIC_API_KEY) available.push('anthropic');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) available.push('google');

  return available.length > 0 ? available : ['google'];
}

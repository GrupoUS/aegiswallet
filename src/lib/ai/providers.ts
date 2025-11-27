import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
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
    default: () => google('gemini-2.0-flash'),
    fast: () => google('gemini-1.5-flash'),
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
  },
} as const;

export function getModel(provider: AIProvider, tier: 'default' | 'fast' = 'default') {
  const config = providerConfigs[provider];
  // Note: We don't throw here if env is missing, as the SDK might handle it or it might be set globally.
  // But checking it is good practice if we want fail-fast.
  // For now, we trust the SDK to throw if key is missing.
  return config[tier]();
}

export function getAvailableProviders(): AIProvider[] {
  // In a real app, we might check process.env, but in client-side or edge context,
  // we might not have direct access to check existence easily without exposing keys.
  // However, for the server-side logic, we can check.
  const available: AIProvider[] = [];

  if (process.env.OPENAI_API_KEY) available.push('openai');
  if (process.env.ANTHROPIC_API_KEY) available.push('anthropic');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY) available.push('google');

  return available.length > 0 ? available : ['google']; // Fallback to google as it is the default
}

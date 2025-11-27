import { useChat } from '@ai-sdk/react';
import { useCallback, useState } from 'react';

interface UseAIChatOptions {
  provider?: 'openai' | 'anthropic' | 'google';
  tier?: 'default' | 'fast';
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [provider, setProvider] = useState(options.provider ?? 'google');
  const [tier, setTier] = useState(options.tier ?? 'default');

  const chat = useChat({
    api: '/api/v1/ai/chat',
    body: {
      provider,
      tier,
    },
    onError: (error) => {
      console.error('AI Chat error:', error);
    },
  });

  const switchProvider = useCallback((newProvider: 'openai' | 'anthropic' | 'google') => {
    setProvider(newProvider);
  }, []);

  const switchTier = useCallback((newTier: 'default' | 'fast') => {
    setTier(newTier);
  }, []);

  return {
    ...chat,
    provider,
    tier,
    switchProvider,
    switchTier,
  };
}

import { useChat } from '@ai-sdk/react';
import { useCallback, useState } from 'react';

interface UseAIChatOptions {
  provider?: 'openai' | 'anthropic';
  tier?: 'default' | 'fast';
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [provider, setProvider] = useState(options.provider ?? 'anthropic');
  const [tier, setTier] = useState(options.tier ?? 'default');

  const chat = useChat({
    onError: (error) => {
      console.error('AI Chat error:', error);
    },
  });

  const switchProvider = useCallback((newProvider: 'openai' | 'anthropic') => {
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

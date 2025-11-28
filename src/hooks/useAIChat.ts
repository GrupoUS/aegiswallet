import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useState } from 'react';

import { logger } from '@/lib/logging/logger';

interface UseAIChatOptions {
	provider?: 'openai' | 'anthropic' | 'google';
	tier?: 'default' | 'fast';
}

export function useAIChat(options: UseAIChatOptions = {}) {
	const [provider, setProvider] = useState(options.provider ?? 'google');
	const [tier, setTier] = useState(options.tier ?? 'default');

	const chat = useChat({
		transport: new DefaultChatTransport({
			api: '/api/v1/ai/chat',
			body: () => ({
				provider,
				tier,
			}),
		}),
		onError: (error: Error) => {
			// TODO: Implement proper error handling
			logger.error('Chat error', { error: error.message });
		},
	});

	const switchProvider = useCallback(
		(newProvider: 'openai' | 'anthropic' | 'google') => {
			setProvider(newProvider);
		},
		[],
	);

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

import { createLazyFileRoute } from '@tanstack/react-router';

import AiChatPage from '@/features/ai-chat/pages/AiChatPage';

export const Route = createLazyFileRoute('/ai-chat')({
	component: AiChatPage,
});

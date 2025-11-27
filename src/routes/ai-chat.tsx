import { createFileRoute } from '@tanstack/react-router';

import { ChatContainer } from '@/features/ai-chat/components';

export const Route = createFileRoute('/ai-chat')({
	component: AiChatPage,
});

function AiChatPage() {
	return (
		<div className="container py-6 h-screen max-h-screen flex flex-col">
			<ChatContainer />
		</div>
	);
}

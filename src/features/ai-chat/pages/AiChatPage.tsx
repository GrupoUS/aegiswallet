import { Lock, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

import { GeminiBackend } from '../backends/GeminiBackend';
import { ChatConversation } from '../components/conversation/ChatConversation';
import { ChatSuggestions } from '../components/feedback/ChatSuggestions';
import { ChatPromptInput } from '../components/input/ChatPromptInput';
import { ChatLayout } from '../components/layout/ChatLayout';
import { useChatController } from '../hooks/useChatController';
import { usePaywall } from '@/components/billing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/billing';

// Vite uses import.meta.env for environment variables (prefix with VITE_)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export default function AiChatPage() {
	const { data: subscription, isLoading: subLoading } = useSubscription();
	const { showPaywall, PaywallModal } = usePaywall();

	const backend = useMemo(
		() => new GeminiBackend({ apiKey: GEMINI_API_KEY }),
		[],
	);

	const {
		messages,
		isLoading,
		streamingContent,
		streamingReasoning,
		sendMessage,
	} = useChatController(backend);

	const suggestions = [
		'Explain how this wallet works',
		'Analyze my recent transactions',
		'What is the current exchange rate?',
		'Help me set a budget',
	];

	// Check if user has access to AI
	const canAccessAI = subscription?.canAccessAI ?? false;
	const _currentPlan = subscription?.plan?.name || 'Gratuito';

	const handleSendMessage = (message: string) => {
		if (!canAccessAI) {
			showPaywall('Chat com IA');
			return;
		}
		sendMessage(message);
	};

	if (subLoading) {
		return (
			<div className="container mx-auto p-4 max-w-4xl h-screen flex items-center justify-center">
				<Skeleton className="w-full h-[600px] rounded-lg" />
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 max-w-4xl h-screen flex items-center justify-center">
			<ChatLayout
				header={
					<div className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						<CardTitle>Aegis AI Assistant</CardTitle>
						{!canAccessAI && <Lock className="h-4 w-4 text-muted-foreground" />}
					</div>
				}
				footer={
					<div className="flex flex-col gap-2 w-full">
						{!canAccessAI && (
							<Alert>
								<Lock className="h-4 w-4" />
								<AlertDescription>
									O Chat com IA está disponível a partir do plano Básico.{' '}
									<button
										type="button"
										onClick={() => showPaywall('Chat com IA')}
										className="underline font-medium hover:no-underline"
									>
										Fazer upgrade
									</button>
								</AlertDescription>
							</Alert>
						)}
						{messages.length === 0 && canAccessAI && (
							<ChatSuggestions
								suggestions={suggestions}
								onSelect={handleSendMessage}
								disabled={isLoading}
							/>
						)}
						<ChatPromptInput
							onSend={handleSendMessage}
							isLoading={isLoading}
							disabled={!canAccessAI}
						/>
						<div className="text-[10px] text-center text-muted-foreground mt-1">
							AI can make mistakes. Please verify important financial
							information.
						</div>
					</div>
				}
			>
				<ChatConversation
					messages={messages}
					streamingContent={streamingContent}
					streamingReasoning={streamingReasoning}
				/>
			</ChatLayout>
			<PaywallModal />
		</div>
	);
}

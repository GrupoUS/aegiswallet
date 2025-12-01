import { useNavigate } from '@tanstack/react-router';
import { Lock, Minimize2 } from 'lucide-react';

import { ChatContainer } from '../components/ChatContainer';
import { useChatContext } from '../context/ChatContext';
import { PaywallModal, usePaywall } from '@/components/billing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubscription } from '@/hooks/billing';
import '../components/chat-widget.css';

export default function AiChatPage() {
	const navigate = useNavigate();
	const { closeWidget } = useChatContext();
	const { data: subscription, isLoading: subLoading } = useSubscription();
	const { showPaywall, paywallProps } = usePaywall();

	// Check if user has access to AI
	const canAccessAI = subscription?.canAccessAI ?? false;

	const handleMinimize = () => {
		closeWidget(); // Close widget if open
		void navigate({ to: '/dashboard' });
	};

	if (subLoading) {
		return (
			<div className="flex-1 flex items-center justify-center p-4">
				<Skeleton className="w-full max-w-5xl h-[calc(100vh-6rem)] rounded-lg" />
			</div>
		);
	}

	if (!canAccessAI) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
				<Alert className="max-w-md">
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
				<PaywallModal {...paywallProps} />
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-4 chat-fullscreen-container">
			{/* Fullscreen Header Actions */}
			<div className="absolute top-20 right-8 z-10">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8"
							onClick={handleMinimize}
							aria-label="Minimizar chat"
						>
							<Minimize2 className="h-4 w-4" />
							<span className="sr-only">Minimizar chat</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Voltar ao dashboard</p>
					</TooltipContent>
				</Tooltip>
			</div>

			<ChatContainer isWidget={false} backendType="gemini" />
			<PaywallModal {...paywallProps} />
		</div>
	);
}

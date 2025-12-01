import { useNavigate } from '@tanstack/react-router';
import { Expand, MessageCircle, X } from 'lucide-react';

import { useChatContext } from '../context/ChatContext';
import { ChatContainer } from './ChatContainer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ChatWidget() {
	const { isWidgetOpen, closeWidget, toggleWidget } = useChatContext();
	const navigate = useNavigate();

	const handleExpand = () => {
		closeWidget();
		void navigate({ to: '/ai-chat' });
	};

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
			{/* Chat Window */}
			<div
				className={cn(
					'transition-all duration-300 ease-in-out origin-bottom-right',
					isWidgetOpen
						? 'opacity-100 scale-100 translate-y-0'
						: 'opacity-0 scale-95 translate-y-4 pointer-events-none h-0 w-0 overflow-hidden',
				)}
			>
				<div className="w-[90vw] sm:w-[400px] h-[80vh] sm:h-[600px] shadow-2xl rounded-lg overflow-hidden border bg-background flex flex-col chat-widget-window">
					{/* Expand Button */}
					<div className="absolute top-2 right-12 z-10">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
									onClick={handleExpand}
									aria-label="Expandir para tela cheia"
								>
									<Expand className="h-4 w-4" />
									<span className="sr-only">Expandir para tela cheia</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Abrir em tela cheia</p>
							</TooltipContent>
						</Tooltip>
					</div>
					{isWidgetOpen && <ChatContainer isWidget onClose={closeWidget} />}
				</div>
			</div>

			{/* Toggle Button */}
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={toggleWidget}
						size="icon"
						className={cn(
							'h-14 w-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-105',
							isWidgetOpen
								? 'bg-destructive hover:bg-destructive/90'
								: 'bg-primary hover:bg-primary/90',
						)}
						aria-label={isWidgetOpen ? 'Fechar Chat' : 'Abrir Assistente AI'}
					>
						{isWidgetOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
						<span className="sr-only">{isWidgetOpen ? 'Fechar Chat' : 'Abrir Chat'}</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="left">
					<p>{isWidgetOpen ? 'Fechar Chat' : 'Abrir Assistente AI'}</p>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}

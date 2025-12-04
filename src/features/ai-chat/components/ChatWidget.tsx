import { useNavigate } from '@tanstack/react-router';
import { Expand, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useChatContext } from '../context/ChatContext';
import { ChatContainer } from './ChatContainer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Hook para detectar altura disponível (especialmente útil em iOS com teclado virtual)
function useAvailableHeight() {
	const [height, setHeight] = useState<string>('var(--chat-widget-height)');

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const updateHeight = () => {
			// Usa visualViewport para considerar teclado virtual
			const vh = window.visualViewport?.height ?? window.innerHeight;
			// Limita a altura máxima para não cobrir toda a tela em desktop
			// mas usa mais espaço em mobile se necessário
			const isMobile = window.innerWidth < 640;
			const maxHeight = isMobile ? vh * 0.85 : Math.min(vh * 0.8, 600);

			setHeight(`${maxHeight}px`);
		};

		updateHeight();
		window.visualViewport?.addEventListener('resize', updateHeight);
		window.addEventListener('resize', updateHeight);

		return () => {
			window.visualViewport?.removeEventListener('resize', updateHeight);
			window.removeEventListener('resize', updateHeight);
		};
	}, []);

	return height;
}

export function ChatWidget() {
	const { isWidgetOpen, closeWidget, toggleWidget } = useChatContext();
	const navigate = useNavigate();
	const dynamicHeight = useAvailableHeight();

	const handleExpand = () => {
		closeWidget();
		void navigate({ to: '/ai-chat' });
	};

	return (
		<>
			{/* Chat Window - Separado do botão para garantir z-index e posicionamento corretos */}
			<div
				className={cn(
					'fixed bottom-20 right-4 z-40',
					'transition-all duration-300 ease-in-out origin-bottom-right',
					isWidgetOpen
						? 'opacity-100 scale-100 translate-y-0'
						: 'opacity-0 scale-95 translate-y-4 pointer-events-none',
				)}
				// Previne renderização/interação quando fechado
				aria-hidden={!isWidgetOpen}
			>
				{isWidgetOpen && (
					<div
						className={cn(
							'relative', // Não fixed!
							'w-[var(--chat-widget-width)]',
							'shadow-2xl rounded-lg border bg-background',
							'flex flex-col overflow-hidden',
							'chat-widget-window',
						)}
						style={{ height: dynamicHeight }}
					>
						{/* Header Actions */}
						<div className="absolute top-2 right-2 z-10 flex gap-1">
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
									</Button>
								</TooltipTrigger>
								<TooltipContent>Abrir em tela cheia</TooltipContent>
							</Tooltip>
						</div>

						<ChatContainer isWidget onClose={closeWidget} />
					</div>
				)}
			</div>

			{/* Toggle Button - Separado para manter sempre visível e acima de tudo */}
			<div className="fixed bottom-4 right-4 z-50">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={toggleWidget}
							size="icon"
							className={cn(
								'h-14 w-14 rounded-full shadow-lg',
								'transition-transform duration-200 hover:scale-105',
								isWidgetOpen
									? 'bg-destructive hover:bg-destructive/90'
									: 'bg-primary hover:bg-primary/90',
							)}
							aria-label={isWidgetOpen ? 'Fechar Chat' : 'Abrir Assistente AI'}
							aria-expanded={isWidgetOpen}
						>
							{isWidgetOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left">
						{isWidgetOpen ? 'Fechar Chat' : 'Abrir Assistente AI'}
					</TooltipContent>
				</Tooltip>
			</div>
		</>
	);
}

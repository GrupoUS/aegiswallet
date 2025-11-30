import { useUser } from '@clerk/clerk-react';
import { Bot, MessageCircle, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import { useFinancialAgent } from '../hooks/useFinancialAgent';
import { ChatContainer } from './ChatContainer';
import { FinancialQuickActions } from './FinancialQuickActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinancialAgentWidgetProps {
	/** Initial open state */
	defaultOpen?: boolean;
	/** Number of pending alerts to show in badge */
	alertCount?: number;
	/** Custom class name for positioning */
	className?: string;
}

/**
 * Financial Agent Chat Widget
 *
 * Floating widget that provides access to the AI financial assistant.
 * Shows alert badge when there are pending financial alerts.
 */
export function FinancialAgentWidget({
	defaultOpen = false,
	alertCount = 0,
	className,
}: FinancialAgentWidgetProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const { user, isLoaded } = useUser();

	const { messages, sendMessage, isStreaming, isLoading } = useFinancialAgent({
		userId: user?.id || '',
		enabled: !!user?.id,
	});

	const handleQuickAction = useCallback(
		(query: string) => {
			sendMessage(query);
		},
		[sendMessage],
	);

	const handleClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	// Don't render until Clerk is loaded
	if (!isLoaded) {
		return null;
	}

	// Don't render if user is not authenticated
	if (!user) {
		return null;
	}

	const showQuickActions = messages.length === 0 && !isLoading && !isStreaming;
	const hasAlerts = alertCount > 0;

	return (
		<div
			className={cn(
				'fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2',
				className,
			)}
		>
			{/* Chat Window */}
			<div
				className={cn(
					'transition-all duration-300 ease-in-out origin-bottom-right',
					isOpen
						? 'opacity-100 scale-100 translate-y-0'
						: 'opacity-0 scale-95 translate-y-4 pointer-events-none h-0 w-0 overflow-hidden',
				)}
			>
				<div className="w-[90vw] sm:w-[420px] h-[80vh] sm:h-[600px] shadow-2xl rounded-lg overflow-hidden border bg-background flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between p-3 border-b bg-primary/5">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
								<Bot className="h-4 w-4 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold text-sm">Aegis</h3>
								<p className="text-xs text-muted-foreground">
									Seu assistente financeiro
								</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleClose}
							className="h-8 w-8"
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Fechar</span>
						</Button>
					</div>

					{/* Quick Actions (shown when empty) */}
					{showQuickActions && (
						<div className="border-b">
							<div className="p-3 pb-1">
								<p className="text-xs text-muted-foreground">
									Pergunte sobre suas finanças:
								</p>
							</div>
							<FinancialQuickActions
								onActionSelect={handleQuickAction}
								disabled={isLoading || isStreaming}
							/>
						</div>
					)}

					{/* Chat Container */}
					<div className="flex-1 overflow-hidden">
						{isOpen && (
							<ChatContainer isWidget onClose={handleClose} hideHeader />
						)}
					</div>
				</div>
			</div>

			{/* Toggle Button with Alert Badge */}
			<Button
				onClick={() => setIsOpen(!isOpen)}
				size="icon"
				className={cn(
					'h-14 w-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-105 relative',
					isOpen
						? 'bg-destructive hover:bg-destructive/90'
						: 'bg-primary hover:bg-primary/90',
				)}
			>
				{isOpen ? (
					<X className="h-6 w-6" />
				) : (
					<MessageCircle className="h-6 w-6" />
				)}
				<span className="sr-only">
					{isOpen ? 'Fechar Aegis' : 'Abrir Aegis'}
				</span>

				{/* Alert Badge */}
				{!isOpen && hasAlerts && (
					<Badge
						variant="destructive"
						className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold animate-pulse"
					>
						{alertCount > 9 ? '9+' : alertCount}
					</Badge>
				)}
			</Button>
		</div>
	);
}

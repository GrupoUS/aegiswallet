import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

import { ChatContainer } from './ChatContainer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChatWidget() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
			{/* Chat Window */}
			<div
				className={cn(
					'transition-all duration-300 ease-in-out origin-bottom-right',
					isOpen
						? 'opacity-100 scale-100 translate-y-0'
						: 'opacity-0 scale-95 translate-y-4 pointer-events-none h-0 w-0 overflow-hidden',
				)}
			>
				<div className="w-[90vw] sm:w-[400px] h-[80vh] sm:h-[600px] shadow-2xl rounded-lg overflow-hidden border bg-background">
					{isOpen && (
						<ChatContainer isWidget onClose={() => setIsOpen(false)} />
					)}
				</div>
			</div>

			{/* Toggle Button */}
			<Button
				onClick={() => setIsOpen(!isOpen)}
				size="icon"
				className={cn(
					'h-14 w-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-105',
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
				<span className="sr-only">{isOpen ? 'Fechar Chat' : 'Abrir Chat'}</span>
			</Button>
		</div>
	);
}

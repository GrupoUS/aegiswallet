import { Bot, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

import type { ChatMessage } from '../../domain/types';
import { ChatReasoning } from './ChatReasoning';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatConversationProps {
	messages: ChatMessage[];
	streamingContent?: string;
	streamingReasoning?: string;
}

export function ChatConversation({
	messages,
	streamingContent,
	streamingReasoning,
}: ChatConversationProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	return (
		<div className="flex flex-col gap-6 pb-4">
			{messages.map((msg) => (
				<div
					key={msg.id}
					className={cn(
						'flex gap-3 text-sm',
						msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
					)}
				>
					<Avatar className="h-8 w-8 border">
						{msg.role === 'assistant' ? (
							<>
								<AvatarImage src="/bot-avatar.png" />
								<AvatarFallback>
									<Bot className="h-4 w-4" />
								</AvatarFallback>
							</>
						) : (
							<>
								<AvatarImage src="/user-avatar.png" />
								<AvatarFallback>
									<User className="h-4 w-4" />
								</AvatarFallback>
							</>
						)}
					</Avatar>

					<div
						className={cn(
							'flex flex-col gap-2 max-w-[80%]',
							msg.role === 'user' ? 'items-end' : 'items-start',
						)}
					>
						{msg.reasoning && <ChatReasoning content={msg.reasoning} />}

						<div
							className={cn(
								'rounded-lg px-4 py-2',
								msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
							)}
						>
							{msg.content}
						</div>
					</div>
				</div>
			))}

			{/* Streaming Response */}
			{(streamingContent || streamingReasoning) && (
				<div className="flex gap-3 text-sm flex-row">
					<Avatar className="h-8 w-8 border">
						<AvatarFallback>
							<Bot className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>

					<div className="flex flex-col gap-2 max-w-[80%] items-start">
						{streamingReasoning && <ChatReasoning content={streamingReasoning} isOpen={true} />}

						{streamingContent && (
							<div className="rounded-lg px-4 py-2 bg-muted animate-pulse-subtle">
								{streamingContent}
							</div>
						)}
					</div>
				</div>
			)}

			<div ref={bottomRef} />
		</div>
	);
}

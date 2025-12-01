import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bot, User } from 'lucide-react';

import type { ChatMessage, ChatReasoningChunk } from '../domain/types';
import { ChatReasoning } from './ChatReasoning';
import { ChatResponse } from './ChatResponse';
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from '@/components/ai-elements';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Portuguese accessibility labels
const ARIA_LABELS = {
	chat: 'Conversa com assistente financeiro',
	userMessage: 'Mensagem do usuário',
	assistantMessage: 'Resposta do assistente',
	scrollToBottom: 'Rolar para a última mensagem',
	typingIndicator: 'Assistente está digitando',
	reasoningExpanded: 'Raciocínio expandido',
	reasoningCollapsed: 'Raciocínio recolhido',
	messageTime: (time: string) => `Enviada ${time}`,
} as const;

interface ChatConversationProps {
	messages: ChatMessage[];
	reasoning: ChatReasoningChunk[];
	isStreaming: boolean;
	showReasoning?: boolean;
}

export function ChatConversation({
	messages,
	reasoning,
	isStreaming,
	showReasoning = true,
}: ChatConversationProps) {
	// Announce new messages to screen readers
	const messageCount = messages.length;
	const lastMessageRole = messages[messageCount - 1]?.role;
	const isUserTurn = lastMessageRole === 'user';

	return (
		<>
			{/* Screen reader announcements */}
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{messageCount > 0 && (
					<>
						{isStreaming && isUserTurn && <p>{ARIA_LABELS.typingIndicator}</p>}
						{!isStreaming && lastMessageRole === 'assistant' && <p>Nova resposta recebida</p>}
					</>
				)}
			</div>

			<Conversation
				className="flex-1 min-h-0 chat-conversation-scroll"
				data-streaming={isStreaming}
				data-message-count={messageCount}
				role="log"
				aria-label={ARIA_LABELS.chat}
				aria-live={isStreaming ? 'polite' : 'off'}
				aria-atomic={false}
			>
				<ConversationContent className="max-w-3xl mx-auto pb-4">
					{messages.length === 0 && (
						<ConversationEmptyState
							title="Olá! Como posso ajudar com suas finanças hoje?"
							description="Posso analisar gastos, sugerir economias, explicar investimentos e muito mais."
						/>
					)}

					{messages.map((message) => (
						<div
							key={message.id}
							className={cn(
								'flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300',
								message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
							)}
						>
							{/* Avatar */}
							<Avatar
								className={cn(
									'w-8 h-8 border shadow-sm flex-shrink-0',
									message.role === 'assistant' ? 'bg-primary/10' : 'bg-muted',
								)}
							>
								<AvatarFallback className="text-xs">
									{message.role === 'user' ? (
										<User className="w-4 h-4" />
									) : (
										<Bot className="w-4 h-4 text-primary" />
									)}
								</AvatarFallback>
							</Avatar>

							{/* Message Content */}
							<div
								className={cn(
									'flex flex-col gap-1 max-w-[85%]',
									message.role === 'user' ? 'items-end' : 'items-start',
								)}
							>
								<div className="flex items-center gap-2 px-1">
									<span className="text-xs font-medium text-muted-foreground">
										{message.role === 'user' ? 'Você' : 'Aegis'}
									</span>
									<span className="text-[10px] text-muted-foreground/60">
										{formatDistanceToNow(message.timestamp, {
											addSuffix: true,
											locale: ptBR,
										})}
									</span>
								</div>

								<div
									className={cn(
										'rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed',
										message.role === 'user'
											? 'bg-primary text-primary-foreground rounded-tr-none'
											: 'bg-card border rounded-tl-none',
									)}
								>
									{typeof message.content === 'string' ? (
										message.role === 'assistant' ? (
											<ChatResponse
												message={message}
												isStreaming={isStreaming && message === messages[messages.length - 1]}
											/>
										) : (
											<p className="whitespace-pre-wrap">{message.content}</p>
										)
									) : null}
								</div>

								{/* Reasoning Display (only for assistant) */}
								{message.role === 'assistant' &&
									showReasoning &&
									reasoning.length > 0 &&
									isStreaming &&
									message === messages[messages.length - 1] && (
										<div className="w-full mt-2">
											<ChatReasoning reasoning={reasoning} isStreaming={isStreaming} />
										</div>
									)}
							</div>
						</div>
					))}

					{/* Streaming Indicator */}
					{isStreaming && messages[messages.length - 1]?.role === 'user' && (
						<output className="flex gap-4 w-full animate-in fade-in" aria-live="polite">
							<Avatar className="w-8 h-8 border bg-primary/10 flex-shrink-0">
								<AvatarFallback>
									<Bot className="w-4 h-4 text-primary" aria-hidden="true" />
								</AvatarFallback>
							</Avatar>
							<div className="flex items-center gap-1 h-10 px-4 bg-card border rounded-2xl rounded-tl-none">
								<span
									className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"
									aria-hidden="true"
								/>
								<span
									className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"
									aria-hidden="true"
								/>
								<span
									className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
									aria-hidden="true"
								/>
								<span className="sr-only">Assistente está processando sua mensagem</span>
							</div>
						</output>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
		</>
	);
}

'use client';

import { ArrowDownIcon, Bot } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Legacy types for backward compatibility
export interface ConversationMessage {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string | ReactNode;
	timestamp?: number;
}

export type ConversationProps = ComponentProps<typeof StickToBottom> & {
	/** @deprecated Use children pattern instead */
	messages?: ConversationMessage[];
	/** @deprecated Use data-streaming attribute */
	isStreaming?: boolean;
	/** @deprecated Not needed with new implementation */
	ariaLive?: 'polite' | 'assertive' | 'off';
};

/**
 * AI SDK Elements Conversation wrapper
 * Uses use-stick-to-bottom for automatic scroll management
 * @see https://ai-sdk.dev/elements/components/conversation
 */
export const Conversation = ({ className, ...props }: ConversationProps) => (
	<StickToBottom
		className={cn('relative flex-1 overflow-y-auto', className)}
		initial="smooth"
		resize="smooth"
		role="log"
		aria-label="Conversa com assistente de IA"
		{...props}
	/>
);

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>;

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
	<StickToBottom.Content className={cn('flex flex-col gap-6 p-4', className)} {...props} />
);

export type ConversationEmptyStateProps = ComponentProps<'div'> & {
	title?: string;
	description?: string;
	icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
	className,
	title = 'Como posso ajudar hoje?',
	description = 'Pergunte sobre suas finanças, transações ou peça conselhos de investimento.',
	icon,
	children,
	...props
}: ConversationEmptyStateProps) => (
	<div
		className={cn(
			'flex size-full flex-col items-center justify-center gap-3 p-8 text-center h-[40vh]',
			className,
		)}
		{...props}
	>
		{children ?? (
			<>
				{icon ?? (
					<div className="p-4 bg-primary/5 rounded-full">
						<Bot className="w-12 h-12 text-primary/50" />
					</div>
				)}
				<div className="space-y-2">
					<h3 className="text-lg font-medium">{title}</h3>
					{description && (
						<p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
					)}
				</div>
			</>
		)}
	</div>
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
	className,
	...props
}: ConversationScrollButtonProps) => {
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();

	const handleScrollToBottom = useCallback(() => {
		void scrollToBottom();
	}, [scrollToBottom]);

	return (
		!isAtBottom && (
			<Button
				className={cn(
					'absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full shadow-lg',
					'focus:ring-2 focus:ring-primary focus:ring-offset-2',
					className,
				)}
				onClick={handleScrollToBottom}
				size="icon"
				type="button"
				variant="outline"
				aria-label="Rolar para a última mensagem"
				title="Rolar para a última mensagem"
				{...props}
			>
				<ArrowDownIcon className="size-4" aria-hidden="true" />
			</Button>
		)
	);
};

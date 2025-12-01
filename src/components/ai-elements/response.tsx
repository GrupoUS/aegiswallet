import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface ResponseMessage {
	id: string;
	role: string;
	content: unknown;
	timestamp?: number;
}

export interface ResponseProps {
	message?: ResponseMessage;
	isStreaming?: boolean;
	className?: string;
	children?: ReactNode;
}

/**
 * ai-sdk.dev Elements Response wrapper
 * Provides semantic structure for AI response content
 */
export function Response({ message, isStreaming = false, className, children }: ResponseProps) {
	return (
		<article
			aria-label={message?.role === 'assistant' ? 'Resposta do assistente' : 'Mensagem'}
			className={cn('ai-response', className)}
			data-streaming={isStreaming}
			data-role={message?.role}
		>
			{children}
		</article>
	);
}

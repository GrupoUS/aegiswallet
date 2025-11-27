import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface ReasoningChunk {
	content: string;
	timestamp?: number;
	type?: string;
}

export interface ReasoningProps {
	reasoning?: ReasoningChunk[];
	isStreaming?: boolean;
	className?: string;
	children?: ReactNode;
	/** Whether reasoning is expanded by default */
	defaultExpanded?: boolean;
}

/**
 * ai-sdk.dev Elements Reasoning wrapper
 * Provides semantic structure for AI reasoning/thinking display
 */
export function Reasoning({
	reasoning = [],
	isStreaming = false,
	className,
	children,
	defaultExpanded = false,
}: ReasoningProps) {
	return (
		<aside
			aria-label="Processo de raciocínio da IA"
			className={cn('ai-reasoning', className)}
			data-streaming={isStreaming}
			data-expanded={defaultExpanded}
			data-chunk-count={reasoning.length}
		>
			{children}
		</aside>
	);
}

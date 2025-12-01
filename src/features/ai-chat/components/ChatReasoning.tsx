import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

import type { ChatReasoningChunk } from '../domain/types';
import { Reasoning } from '@/components/ai-elements';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ChatReasoningProps {
	reasoning: ChatReasoningChunk[];
	isStreaming?: boolean;
}

export function ChatReasoning({ reasoning, isStreaming }: ChatReasoningProps) {
	const [isOpen, setIsOpen] = React.useState(isStreaming);

	// Auto-expand during streaming
	React.useEffect(() => {
		if (isStreaming) {
			setIsOpen(true);
		}
	}, [isStreaming]);

	if (reasoning.length === 0) return null;

	return (
		<Reasoning reasoning={reasoning} isStreaming={isStreaming} defaultExpanded={isStreaming}>
			<Collapsible
				open={isOpen}
				onOpenChange={setIsOpen}
				className="w-full border rounded-lg bg-muted/30"
			>
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="w-full flex justify-between items-center p-3 h-auto hover:bg-muted/50"
					>
						<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
							<Brain className="w-3.5 h-3.5" />
							<span>Processo de raciocínio</span>
							{isStreaming && <span className="animate-pulse text-primary">●</span>}
						</div>
						{isOpen ? (
							<ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
						) : (
							<ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
						)}
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="px-3 pb-3 pt-0 space-y-2">
						{reasoning.map((chunk, index) => (
							<div
								key={`reasoning-${chunk.timestamp ?? Date.now()}-${index}`}
								className="text-xs font-mono text-muted-foreground/80 pl-6 border-l-2 border-muted relative"
							>
								<span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-muted border-2 border-background" />
								{chunk.content}
							</div>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Reasoning>
	);
}

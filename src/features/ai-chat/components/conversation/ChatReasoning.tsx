import { BrainCircuit, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ChatReasoningProps {
	content: string;
	isOpen?: boolean;
}

export function ChatReasoning({ content, isOpen: defaultOpen = false }: ChatReasoningProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
				>
					<BrainCircuit className="h-3 w-3" />
					{isOpen ? 'Hide reasoning' : 'Show reasoning'}
					{isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-1">
				<div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap border-l-2 border-primary/20">
					{content}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

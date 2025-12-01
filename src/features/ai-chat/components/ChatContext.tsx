import { Database } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChatContextProps {
	tokenUsage: { input: number; output: number; total: number };
	contextLimit: number;
	className?: string;
}

export function ChatContext({ tokenUsage, contextLimit, className }: ChatContextProps) {
	const percentage = Math.min((tokenUsage.total / contextLimit) * 100, 100);
	const isWarning = percentage > 80;
	const isCritical = percentage > 95;

	return (
		<div className={cn('flex flex-col gap-1 text-xs text-muted-foreground', className)}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1">
					<Database className="w-3 h-3" />
					<span>Contexto</span>
				</div>
				<span>
					{tokenUsage.total} / {contextLimit} tokens
				</span>
			</div>
			<Progress
				value={percentage}
				className={cn('h-1', isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : '')}
			/>
		</div>
	);
}

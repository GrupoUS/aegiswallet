import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FeatureListProps {
	features: string[];
	className?: string;
}

export function FeatureList({ features, className }: FeatureListProps) {
	return (
		<ul className={cn('space-y-3', className)}>
			{features.map((feature) => (
				<li key={feature} className="flex items-start gap-3">
					<Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
					<span className="text-sm text-muted-foreground">{feature}</span>
				</li>
			))}
		</ul>
	);
}

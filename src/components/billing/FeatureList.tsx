import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FeatureListProps {
	features: string[];
	className?: string;
	'aria-label'?: string;
	'aria-describedby'?: string;
}

export function FeatureList({
	features,
	className,
	'aria-label': ariaLabel = 'Lista de recursos',
	'aria-describedby': ariaDescribedBy,
}: FeatureListProps) {
	const listId = `feature-list-${Math.random().toString(36).substr(2, 9)}`;

	if (!features || features.length === 0) {
		return (
			<div
				role="status"
				aria-live="polite"
				className="text-muted-foreground text-sm p-4 border border-dashed border-muted-foreground/30 rounded-md"
			>
				Nenhum recurso específico listado para este plano.
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<h3 id={listId} className="text-sm font-medium text-foreground mb-3">
				{ariaLabel}
			</h3>
			<ul
				className={cn('space-y-3', className)}
				aria-labelledby={listId}
				aria-describedby={ariaDescribedBy}
			>
				{features.map((feature, index) => {
					const featureId = `${listId}-item-${index}`;
					const isLongFeature = feature.length > 80;

					return (
						<li key={featureId} className="flex items-start gap-3">
							<div className="flex-shrink-0 mt-0.5" aria-hidden="true">
								<Check className="h-5 w-5 text-primary" focusable="false" />
							</div>
							<span
								id={featureId}
								className={cn(
									'text-sm leading-relaxed',
									isLongFeature && 'text-xs',
									'text-muted-foreground',
								)}
								aria-label={isLongFeature ? `Recurso ${index + 1}: ${feature}` : undefined}
							>
								{feature}
							</span>
						</li>
					);
				})}
			</ul>

			{/* Screen reader summary */}
			<div className="sr-only" role="status" aria-live="polite">
				{features.length > 0 && `Esta lista contém ${features.length} recursos disponíveis.`}
			</div>
		</div>
	);
}

import { cn } from '@/lib/utils';

export type AiLoadingVariant = 'dots' | 'pulse' | 'spinner';

interface AiLoadingProps {
	isLoading: boolean;
	message?: string;
	variant?: AiLoadingVariant;
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export function AiLoading({
	isLoading,
	message,
	variant = 'dots',
	size = 'md',
	className,
}: AiLoadingProps) {
	if (!isLoading) return null;

	const sizeClasses = {
		sm: 'w-1 h-1',
		md: 'w-1.5 h-1.5',
		lg: 'w-2 h-2',
	};

	const containerClasses = {
		sm: 'gap-0.5',
		md: 'gap-1',
		lg: 'gap-1.5',
	};

	return (
		<div
			className={cn('flex items-center gap-3 text-muted-foreground animate-in fade-in', className)}
		>
			{variant === 'dots' && (
				<div className={cn('flex items-center', containerClasses[size])}>
					<span
						className={cn(
							'bg-current rounded-full animate-bounce [animation-delay:-0.3s]',
							sizeClasses[size],
						)}
					/>
					<span
						className={cn(
							'bg-current rounded-full animate-bounce [animation-delay:-0.15s]',
							sizeClasses[size],
						)}
					/>
					<span className={cn('bg-current rounded-full animate-bounce', sizeClasses[size])} />
				</div>
			)}

			{variant === 'pulse' && (
				<div className={cn('bg-current rounded-full animate-pulse', sizeClasses[size])} />
			)}

			{variant === 'spinner' && (
				<div
					className={cn(
						'border-2 border-current border-t-transparent rounded-full animate-spin',
						size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5',
					)}
				/>
			)}

			{message && <span className="text-xs font-medium">{message}</span>}
		</div>
	);
}

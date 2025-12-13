import type { ExperimentalGeneratedImage } from '@/lib/ai/compatibility';
import { cn } from '@/lib/utils';

export type ImageProps = ExperimentalGeneratedImage & {
	className?: string;
	alt?: string;
};

export const Image = ({ base64, uint8Array, mediaType, ...props }: ImageProps) => (
	<img
		{...props}
		alt={props.alt}
		className={cn('h-auto max-w-full overflow-hidden rounded-md', props.className)}
		src={`data:${mediaType};base64,${base64}`}
	/>
);

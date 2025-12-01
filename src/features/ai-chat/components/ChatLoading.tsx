import { AiLoading, type AiLoadingVariant } from '@/components/kokonutui';

interface ChatLoadingProps {
	isLoading: boolean;
	message?: string;
	variant?: AiLoadingVariant;
	/** Size of the loading indicator */
	size?: 'sm' | 'md' | 'lg';
}

/**
 * ChatLoading - AI chat loading indicator
 * Delegates to KokonutUI AiLoading for consistent loading states
 */
export function ChatLoading({
	isLoading,
	message,
	variant = 'dots',
	size = 'md',
}: ChatLoadingProps) {
	return <AiLoading isLoading={isLoading} message={message} variant={variant} size={size} />;
}

import { AiInputSearch } from '@/components/kokonutui';

interface ChatSearchBarProps {
	/** Callback when search is submitted */
	onSearch: (query: string) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Additional CSS classes */
	className?: string;
	/** Whether the search is disabled */
	disabled?: boolean;
	/** Auto-focus on mount */
	autoFocus?: boolean;
}

/**
 * ChatSearchBar - Search-oriented input for AI chat
 * Wraps KokonutUI AiInputSearch for search-driven chat flows
 *
 * Use this when you want a dedicated search interface that feeds
 * queries into the chat controller via sendMessage.
 *
 * @example
 * ```tsx
 * <ChatSearchBar
 *   onSearch={(query) => sendMessage(query)}
 *   placeholder="Buscar em suas finanças..."
 * />
 * ```
 */
export function ChatSearchBar({
	onSearch,
	placeholder = 'Pesquisar nas finanças...',
	className,
	disabled = false,
	autoFocus = false,
}: ChatSearchBarProps) {
	return (
		<AiInputSearch
			onSearch={onSearch}
			placeholder={placeholder}
			className={className}
			disabled={disabled}
			autoFocus={autoFocus}
		/>
	);
}

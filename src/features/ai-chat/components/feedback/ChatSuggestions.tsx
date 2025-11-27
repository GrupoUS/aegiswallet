import { Button } from '@/components/ui/button';

interface ChatSuggestionsProps {
	suggestions: string[];
	onSelect: (suggestion: string) => void;
	disabled?: boolean;
}

export function ChatSuggestions({
	suggestions,
	onSelect,
	disabled,
}: ChatSuggestionsProps) {
	if (!suggestions.length) return null;

	return (
		<div className="flex flex-wrap gap-2 mt-2">
			{suggestions.map((suggestion) => (
				<Button
					key={suggestion}
					variant="outline"
					size="sm"
					className="h-7 text-xs rounded-full bg-background hover:bg-accent/50"
					onClick={() => onSelect(suggestion)}
					disabled={disabled}
				>
					{suggestion}
				</Button>
			))}
		</div>
	);
}

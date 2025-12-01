import { PromptInput } from '@/components/ai-elements';
import { AiPrompt } from '@/components/kokonutui';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';

interface ChatPromptInputProps {
	onSend: (content: string, attachments?: File[]) => void;
	onStop?: () => void;
	isStreaming: boolean;
	placeholder?: string;
	enableAttachments?: boolean;
	enableVoiceInput?: boolean;
}

/**
 * ChatPromptInput - AI chat input with voice support
 * Wraps KokonutUI AiPrompt with ai-sdk.dev Elements PromptInput for semantic structure
 */
export function ChatPromptInput({
	onSend,
	onStop,
	isStreaming,
	placeholder = 'Digite uma mensagem...',
	enableAttachments = false,
	enableVoiceInput = true,
}: ChatPromptInputProps) {
	const { isListening, startListening, stopListening, lastTranscript } = useVoiceCommand();

	const handleVoiceToggle = () => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	};

	return (
		<PromptInput isStreaming={isStreaming}>
			<AiPrompt
				onSubmit={onSend}
				onStop={onStop}
				placeholder={placeholder}
				isStreaming={isStreaming}
				enableAttachments={enableAttachments}
				enableVoice={enableVoiceInput}
				isListening={isListening}
				onVoiceToggle={handleVoiceToggle}
				voiceTranscript={lastTranscript ?? undefined}
			/>
		</PromptInput>
	);
}

import { Mic, MicOff, Paperclip, Send, Square } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface AiPromptProps {
	onSubmit: (value: string, attachments?: File[]) => void;
	onStop?: () => void;
	placeholder?: string;
	isStreaming?: boolean;
	enableAttachments?: boolean;
	enableVoice?: boolean;
	isListening?: boolean;
	onVoiceToggle?: () => void;
	voiceTranscript?: string;
	className?: string;
}

export function AiPrompt({
	onSubmit,
	onStop,
	placeholder = 'Type a message...',
	isStreaming = false,
	enableAttachments = false,
	enableVoice = false,
	isListening = false,
	onVoiceToggle,
	voiceTranscript,
	className,
}: AiPromptProps) {
	const [value, setValue] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = () => {
		if (!value.trim()) return;
		onSubmit(value);
		setValue('');
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	// Update value when voice transcript changes
	if (voiceTranscript && voiceTranscript !== value && isListening) {
		setValue(voiceTranscript);
	}

	return (
		<div
			className={cn(
				'relative flex items-end gap-2 p-2 border rounded-xl bg-background shadow-sm',
				className,
			)}
		>
			{enableAttachments && (
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
				>
					<Paperclip className="w-4 h-4" />
					<span className="sr-only">Attach file</span>
				</Button>
			)}

			<Textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={isListening ? 'Listening...' : placeholder}
				className="min-h-[44px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-2 py-2.5 text-sm"
				rows={1}
			/>

			<div className="flex items-center gap-1 shrink-0 pb-0.5">
				{enableVoice && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onVoiceToggle}
						className={cn(
							'h-9 w-9 transition-colors',
							isListening
								? 'text-red-500 hover:text-red-600 bg-red-50'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{isListening ? (
							<MicOff className="w-4 h-4" />
						) : (
							<Mic className="w-4 h-4" />
						)}
						<span className="sr-only">Voice input</span>
					</Button>
				)}

				{isStreaming ? (
					<Button
						size="icon"
						variant="secondary"
						onClick={onStop}
						className="h-9 w-9 shrink-0 rounded-lg animate-in fade-in zoom-in"
					>
						<Square className="w-4 h-4 fill-current" />
						<span className="sr-only">Stop generation</span>
					</Button>
				) : (
					<Button
						size="icon"
						onClick={handleSubmit}
						disabled={!value.trim()}
						className="h-9 w-9 shrink-0 rounded-lg"
					>
						<Send className="w-4 h-4" />
						<span className="sr-only">Send message</span>
					</Button>
				)}
			</div>
		</div>
	);
}

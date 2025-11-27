import { ExternalLink, Share2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { OpenInChat } from '@/components/ai-elements';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ChatProvider = 'chatgpt' | 'claude' | 'gemini';

interface ChatOpenInChatLinkProps {
	/** Content to share or open in external chat */
	content: string;
	/** Target chat provider */
	provider?: ChatProvider;
	/** Callback when content is shared */
	onShare?: (provider: ChatProvider) => void;
	/** Additional CSS classes */
	className?: string;
	/** Show as dropdown with multiple providers */
	showProviderMenu?: boolean;
}

const PROVIDER_CONFIG: Record<
	ChatProvider,
	{ name: string; url: string; icon?: string }
> = {
	chatgpt: {
		name: 'ChatGPT',
		url: 'https://chat.openai.com/',
	},
	claude: {
		name: 'Claude',
		url: 'https://claude.ai/',
	},
	gemini: {
		name: 'Gemini',
		url: 'https://gemini.google.com/',
	},
};

/**
 * ChatOpenInChatLink - Share or open conversation content in external chat providers
 * Wraps the ai-sdk.dev Elements OpenInChat for semantic structure
 *
 * @example
 * ```tsx
 * <ChatOpenInChatLink
 *   content={message.content}
 *   provider="chatgpt"
 *   onShare={(provider) => console.log(`Shared to ${provider}`)}
 * />
 * ```
 */
export function ChatOpenInChatLink({
	content,
	provider = 'chatgpt',
	onShare,
	className,
	showProviderMenu = false,
}: ChatOpenInChatLinkProps) {
	const [isCopying, setIsCopying] = useState(false);

	const handleShare = useCallback(
		async (targetProvider: ChatProvider) => {
			setIsCopying(true);

			try {
				// Copy content to clipboard
				await navigator.clipboard.writeText(content);

				// Open provider in new tab
				const config = PROVIDER_CONFIG[targetProvider];
				window.open(config.url, '_blank', 'noopener,noreferrer');

				toast.success('Conteúdo copiado!', {
					description: `Abra ${config.name} e cole sua mensagem.`,
				});

				onShare?.(targetProvider);
			} catch {
				toast.error('Falha ao copiar', {
					description: 'Não foi possível copiar o conteúdo.',
				});
			} finally {
				setIsCopying(false);
			}
		},
		[content, onShare],
	);

	const handleCopyOnly = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(content);
			toast.success('Conteúdo copiado para a área de transferência');
		} catch {
			toast.error('Falha ao copiar');
		}
	}, [content]);

	if (showProviderMenu) {
		return (
			<OpenInChat provider={provider} className={className}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs gap-1.5"
						>
							<Share2 className="w-3 h-3" />
							<span>Abrir em</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
							<DropdownMenuItem
								key={key}
								onClick={() => handleShare(key as ChatProvider)}
								className="gap-2"
							>
								<ExternalLink className="w-3.5 h-3.5" />
								{config.name}
							</DropdownMenuItem>
						))}
						<DropdownMenuItem onClick={handleCopyOnly} className="gap-2">
							<Share2 className="w-3.5 h-3.5" />
							Copiar apenas
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</OpenInChat>
		);
	}

	return (
		<OpenInChat provider={provider} className={className}>
			<Button
				variant="ghost"
				size="sm"
				className={cn('h-7 px-2 text-xs gap-1.5', className)}
				onClick={() => handleShare(provider)}
				disabled={isCopying}
			>
				<ExternalLink className="w-3 h-3" />
				<span>Abrir no {PROVIDER_CONFIG[provider].name}</span>
			</Button>
		</OpenInChat>
	);
}

import { Check, Copy } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { ChatMessage } from '../domain/types';
import { Response, type ResponseMessage } from '@/components/ai-elements';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatResponseProps {
	message: ChatMessage;
	isStreaming?: boolean;
}

export function ChatResponse({ message, isStreaming }: ChatResponseProps) {
	const [copied, setCopied] = React.useState(false);

	const handleCopy = () => {
		if (typeof message.content === 'string') {
			navigator.clipboard.writeText(message.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (typeof message.content !== 'string') return null;

	return (
		<Response
			message={message as unknown as ResponseMessage}
			isStreaming={isStreaming}
		>
			<div className="group relative">
				<div className="markdown-prose prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							// biome-ignore lint/suspicious/noExplicitAny: React Markdown components type
							code({ node, inline, className, children, ...props }: any) {
								const match = /language-(\w+)/.exec(className || '');
								return !inline && match ? (
									<div className="relative my-4 rounded-lg border bg-muted/50 overflow-hidden">
										<div className="flex items-center justify-between px-4 py-2 bg-muted/80 border-b text-xs text-muted-foreground">
											<span>{match[1]}</span>
										</div>
										<div className="p-4 overflow-x-auto">
											<code className={className} {...props}>
												{children}
											</code>
										</div>
									</div>
								) : (
									<code
										className={cn(
											'bg-muted px-1.5 py-0.5 rounded-md font-mono text-xs',
											className,
										)}
										{...props}
									>
										{children}
									</code>
								);
							},
						}}
					>
						{message.content}
					</ReactMarkdown>
					{isStreaming && (
						<span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse" />
					)}
				</div>

				<div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={handleCopy}
					>
						{copied ? (
							<Check className="w-3 h-3 text-green-500" />
						) : (
							<Copy className="w-3 h-3" />
						)}
					</Button>
				</div>
			</div>
		</Response>
	);
}

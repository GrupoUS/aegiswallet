import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Chat context available for future state sharing between widget and fullscreen
// import { useChatContext } from '../context/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { type BackendType, createChatBackend, MockBackend } from '@/features/ai-chat/backends';
import {
	AIConsentModal,
	ChatConversation,
	ChatLayout,
	ChatPromptInput,
	ChatSuggestions,
	ChatTasks,
	ModelSelector,
} from '@/features/ai-chat/components';
import { DEFAULT_MODEL, type GeminiModel } from '@/features/ai-chat/config/models';
import type { ChatSuggestion } from '@/features/ai-chat/domain/types';
import { useChatController } from '@/features/ai-chat/hooks/useChatController';
import './chat-widget.css';

interface ChatContainerProps {
	isWidget?: boolean;
	onClose?: () => void;
	/** Backend type to use for AI chat */
	backendType?: BackendType;
	/** Hide the header bar (useful when embedding in custom containers) */
	hideHeader?: boolean;
}

export function ChatContainer({
	isWidget = false,
	onClose,
	backendType = 'aegis', // Default to Aegis backend
	hideHeader = false,
}: ChatContainerProps) {
	const { user } = useAuth();
	// Chat context available for future state sharing between widget and fullscreen
	// const chatContext = useChatContext();

	const [showConsentModal, setShowConsentModal] = useState(false);

	// Use context state or fallback to local state for widget mode
	const [selectedModel, setSelectedModel] = useState<GeminiModel>(
		(import.meta.env.VITE_DEFAULT_AI_MODEL as GeminiModel) || DEFAULT_MODEL,
	);
	const [enableVoiceInput, setEnableVoiceInput] = useState(true);
	// Initialize backend using factory
	const backend = useMemo(() => {
		const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

		// Fallback to MockBackend if key is missing for Gemini
		if (backendType === 'gemini' && !apiKey) {
			toast.error('API Key not found', {
				description: 'Using Mock Backend. Please set VITE_GEMINI_API_KEY.',
			});
			return new MockBackend();
		}

		// Create backend config with proper type literal
		if (backendType === 'gemini') {
			return createChatBackend({
				type: 'gemini' as const,
				apiKey: apiKey || '',
				model: selectedModel,
				userId: user?.id,
			});
		}

		if (backendType === 'aegis') {
			return createChatBackend({
				type: 'aegis' as const,
				endpoint: '/api/v1/ai/chat',
			});
		}

		// Default fallback to MockBackend for unsupported types
		return new MockBackend();
	}, [backendType, selectedModel, user?.id]);

	// Initialize controller
	const {
		messages,
		isStreaming,
		suggestions,
		tasks,
		reasoning,
		enableReasoningView,
		sendMessage,
		stopStreaming,
		applySuggestion,
	} = useChatController(backend, {
		enableVoiceFeedback: true,
		enableReasoningView: import.meta.env.VITE_ENABLE_AI_REASONING === 'true',
		onError: (err) => {
			// Check for consent requirement
			if ('code' in err && err.code === 'CONSENT_REQUIRED') {
				setShowConsentModal(true);
				return;
			}

			toast.error('Erro na conversa', {
				description: err.message,
			});
		},
	});

	// Default suggestions if none
	const defaultSuggestions: ChatSuggestion[] = [
		{ id: '1', text: 'Analise meus gastos deste mês', icon: 'chart' },
		{ id: '2', text: 'Como posso economizar mais?', icon: 'piggy-bank' },
		{ id: '3', text: 'Explique meu último investimento', icon: 'trending-up' },
	];

	const activeSuggestions =
		suggestions.length > 0 ? suggestions : messages.length === 0 ? defaultSuggestions : [];

	const [showReasoning, setShowReasoning] = useState(enableReasoningView);

	return (
		<>
			<ChatLayout
				title="Assistente Financeiro Aegis"
				isWidget={isWidget}
				onClose={onClose}
				className="flex-1"
				hideHeader={hideHeader}
				modelSelector={
					!isWidget ? (
						<ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
					) : undefined
				}
				enableVoice={enableVoiceInput}
				onVoiceToggle={setEnableVoiceInput}
				enableReasoning={showReasoning}
				onReasoningToggle={setShowReasoning}
			>
				<div className="flex flex-1 h-full overflow-hidden">
					{/* Main Chat Area */}
					<div className="flex-1 flex flex-col min-w-0">
						<ChatConversation
							messages={messages}
							reasoning={reasoning}
							isStreaming={isStreaming}
							showReasoning={showReasoning}
						/>

						{/* Suggestions Overlay */}
						{!isStreaming && activeSuggestions.length > 0 && (
							<div className="px-4 pb-2 animate-in slide-in-from-bottom-2 fade-in">
								<ChatSuggestions suggestions={activeSuggestions} onSelect={applySuggestion} />
							</div>
						)}

						<ChatPromptInput
							onSend={(content) => sendMessage(content)}
							onStop={stopStreaming}
							isStreaming={isStreaming}
							placeholder="Pergunte sobre suas finanças..."
							enableVoiceInput={enableVoiceInput}
							enableAttachments={false} // Disabled for MVP
						/>
					</div>

					{/* Sidebar for Tasks (Desktop only, hidden in widget mode) */}
					{!isWidget && tasks.length > 0 && (
						<div className="hidden lg:block w-80 border-l bg-muted/10 p-4 overflow-y-auto">
							<h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
								Tarefas Ativas
							</h3>
							<ChatTasks tasks={tasks} />
						</div>
					)}
				</div>
			</ChatLayout>

			<AIConsentModal
				open={showConsentModal}
				onOpenChange={setShowConsentModal}
				onConsentGranted={() => {
					setShowConsentModal(false);
					// Optionally retry the last message or just let user type again
					toast.success('Agora você pode usar o assistente!');
				}}
			/>
		</>
	);
}

'use client';

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import type {
	ChatMessage,
	ChatReasoningChunk,
	ChatSuggestion,
	ChatTask,
} from '@/features/ai-chat/domain/types';
import { logger } from '@/lib/logging';

interface ChatState {
	isWidgetOpen: boolean;
	messages: ChatMessage[];
	isStreaming: boolean;
	reasoning: ChatReasoningChunk[];
	suggestions: ChatSuggestion[];
	tasks: ChatTask[];
	enableReasoning: boolean;
	enableVoice: boolean;
	selectedBackend: string;
}

interface ChatContextType extends ChatState {
	openWidget: () => void;
	closeWidget: () => void;
	toggleWidget: () => void;
	setMessages: (messages: ChatMessage[]) => void;
	addMessage: (message: ChatMessage) => void;
	setStreaming: (isStreaming: boolean) => void;
	setReasoning: (reasoning: ChatReasoningChunk[]) => void;
	setSuggestions: (suggestions: ChatSuggestion[]) => void;
	setTasks: (tasks: ChatTask[]) => void;
	setEnableReasoning: (enable: boolean) => void;
	setEnableVoice: (enable: boolean) => void;
	setSelectedBackend: (backend: string) => void;
	clearMessages: () => void;
	preserveState: () => ChatState;
	restoreState: (state: ChatState) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
	children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
	const [state, setState] = useState<ChatState>({
		isWidgetOpen: false,
		messages: [],
		isStreaming: false,
		reasoning: [],
		suggestions: [],
		tasks: [],
		enableReasoning: import.meta.env.VITE_ENABLE_AI_REASONING === 'true',
		enableVoice: true,
		selectedBackend: 'gemini',
	});

	// Save state to sessionStorage for persistence across page reloads
	useEffect(() => {
		const savedState = sessionStorage.getItem('aegis-chat-state');
		if (savedState) {
			try {
				const parsed = JSON.parse(savedState);
				// Only restore non-sensitive state
				setState((prev) => ({
					...prev,
					messages: parsed.messages || [],
					enableReasoning: parsed.enableReasoning ?? prev.enableReasoning,
					enableVoice: parsed.enableVoice ?? prev.enableVoice,
					selectedBackend: parsed.selectedBackend ?? prev.selectedBackend,
				}));
			} catch (error) {
				logger.warn('Failed to parse saved chat state from sessionStorage', {
					error: error instanceof Error ? error.message : String(error),
					savedStateLength: savedState.length,
				});
				// Clear corrupted state from sessionStorage
				sessionStorage.removeItem('aegis-chat-state');
			}
		}
	}, []);

	// Auto-save state changes
	useEffect(() => {
		sessionStorage.setItem(
			'aegis-chat-state',
			JSON.stringify({
				messages: state.messages,
				enableReasoning: state.enableReasoning,
				enableVoice: state.enableVoice,
				selectedBackend: state.selectedBackend,
			}),
		);
	}, [state.messages, state.enableReasoning, state.enableVoice, state.selectedBackend]);

	const actions = {
		openWidget: () => setState((prev) => ({ ...prev, isWidgetOpen: true })),
		closeWidget: () => setState((prev) => ({ ...prev, isWidgetOpen: false })),
		toggleWidget: () => setState((prev) => ({ ...prev, isWidgetOpen: !prev.isWidgetOpen })),

		setMessages: (messages: ChatMessage[]) => setState((prev) => ({ ...prev, messages })),
		addMessage: (message: ChatMessage) =>
			setState((prev) => ({
				...prev,
				messages: [...prev.messages, message],
			})),
		setStreaming: (isStreaming: boolean) => setState((prev) => ({ ...prev, isStreaming })),
		setReasoning: (reasoning: ChatReasoningChunk[]) => setState((prev) => ({ ...prev, reasoning })),
		setSuggestions: (suggestions: ChatSuggestion[]) =>
			setState((prev) => ({ ...prev, suggestions })),
		setTasks: (tasks: ChatTask[]) => setState((prev) => ({ ...prev, tasks })),

		setEnableReasoning: (enable: boolean) =>
			setState((prev) => ({ ...prev, enableReasoning: enable })),
		setEnableVoice: (enable: boolean) => setState((prev) => ({ ...prev, enableVoice: enable })),
		setSelectedBackend: (backend: string) =>
			setState((prev) => ({ ...prev, selectedBackend: backend })),

		clearMessages: () =>
			setState((prev) => ({ ...prev, messages: [], reasoning: [], suggestions: [], tasks: [] })),

		preserveState: (): ChatState => ({ ...state }),
		restoreState: (newState: ChatState) => setState(newState),
	};

	return <ChatContext.Provider value={{ ...state, ...actions }}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error('useChatContext must be used within ChatProvider');
	}
	return context;
}

// Export types for external use
export type { ChatContextType, ChatState };

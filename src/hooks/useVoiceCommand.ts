import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useVoiceLogger } from '@/hooks/useLogger';
import type { VoiceRecognitionResult, VoiceServiceErrorInfo } from '@/services/voiceService';
import { getVoiceService, VOICE_FEEDBACK } from '@/services/voiceService';

export interface UseVoiceCommandOptions {
	autoNavigate?: boolean;
	onCommandDetected?: (result: VoiceRecognitionResult) => void;
	onError?: (error: Error) => void;
	enableFeedback?: boolean;
	autoRetryOnNoSpeech?: boolean;
	maxRetryAttempts?: number;
	retryDelay?: number;
}

export interface UseVoiceCommandReturn {
	isListening: boolean;
	isSupported: boolean;
	startListening: () => void;
	stopListening: () => void;
	speak: (text: string) => Promise<void>;
	lastTranscript: string | null;
	lastCommand: string | null;
	canRetry: boolean;
	retryCount: number;
	retry: () => void;
	getLastError: () => VoiceServiceErrorInfo | null;
}

/**
 * Custom hook for voice command integration
 * Provides voice recognition and text-to-speech capabilities
 */
export function useVoiceCommand(options: UseVoiceCommandOptions = {}): UseVoiceCommandReturn {
	const {
		autoNavigate = true,
		onCommandDetected,
		onError,
		enableFeedback = true,
		autoRetryOnNoSpeech = false,
		maxRetryAttempts = 3,
		retryDelay = 1000,
	} = options;

	const navigate = useNavigate();
	const [isListening, setIsListening] = useState(false);
	const [lastTranscript, setLastTranscript] = useState<string | null>(null);
	const [lastCommand, setLastCommand] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const [canRetry, setCanRetry] = useState(false);

	const logger = useVoiceLogger();
	logger.setContext({ autoNavigate, enableFeedback, hook: 'useVoiceCommand' });

	const voiceService = getVoiceService({
		autoRetry: autoRetryOnNoSpeech,
		maxRetryAttempts,
		retryDelay,
	});
	const isSupported =
		typeof window !== 'undefined' &&
		('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

	/**
	 * Handle voice recognition result
	 */
	const handleResult = useCallback(
		(result: VoiceRecognitionResult) => {
			setLastTranscript(result.transcript);
			setIsListening(false);

			// Show transcript in toast
			if (enableFeedback) {
				toast.info(`Você disse: "${result.transcript}"`, {
					duration: 3000,
				});
			}

			// If command detected
			if (result.command && result.intent) {
				setLastCommand(result.command);

				// Notify callback
				onCommandDetected?.(result);

				// Auto-navigate if enabled
				if (autoNavigate) {
					const destination = getDestinationName(result.intent);

					if (enableFeedback) {
						toast.success(VOICE_FEEDBACK.NAVIGATING(destination), {
							duration: 2000,
						});
					}

					// Navigate after a short delay for feedback
					setTimeout(() => {
						void navigate({ to: String(result.intent) });
					}, 500);
				}
			} else if (enableFeedback) {
				// No command detected
				toast.error(VOICE_FEEDBACK.ERROR, {
					duration: 3000,
				});
			}
		},
		[navigate, autoNavigate, onCommandDetected, enableFeedback],
	);

	/**
	 * Handle voice recognition error with retry logic
	 */
	const handleError = useCallback(
		(error: Error & { isNoSpeech?: boolean }) => {
			setIsListening(false);

			// Special handling for 'no-speech' error - treat as informational, not critical
			if (error.isNoSpeech || error.message === 'no-speech') {
				logger.info('No speech detected - user did not speak or spoke too quietly', {
					action: 'handleNoSpeech',
					enableFeedback,
					retryCount,
					maxRetryAttempts,
				});

				// Update retry state
				const newRetryCount = retryCount + 1;
				setRetryCount(newRetryCount);
				setCanRetry(newRetryCount <= maxRetryAttempts);

				// Auto-retry if configured and within limits
				if (autoRetryOnNoSpeech && newRetryCount <= maxRetryAttempts) {
					logger.info('Auto-retrying voice recognition', {
						action: 'autoRetry',
						retryAttempt: newRetryCount,
						maxRetryAttempts,
						retryDelay,
					});

					setTimeout(() => {
						if (!isListening) {
							voiceService.startListening(handleResult, handleError);
							setIsListening(true);
						}
					}, retryDelay);
				} else if (enableFeedback) {
					// Show user feedback and enable manual retry
					const retryMessage =
						newRetryCount <= maxRetryAttempts
							? `Não detectei sua voz. Tente falar mais alto ou mais perto do microfone. (${newRetryCount}/${maxRetryAttempts})`
							: 'Não detectei sua voz. Toque para tentar novamente.';

					toast.info(retryMessage, {
						duration: 4000,
					});
				}
				// Don't call onError for no-speech - it's a normal use case, not a critical error
				return;
			}

			logger.voiceError(error.message, {
				action: 'handleRecognitionError',
				enableFeedback,
				errorMessage: error.message,
				stack: error.stack,
			});

			if (enableFeedback) {
				toast.error(`Erro: ${error.message}`, {
					duration: 3000,
				});
			}

			onError?.(error);
		},
		[
			onError,
			enableFeedback,
			logger,
			retryCount,
			maxRetryAttempts,
			autoRetryOnNoSpeech,
			retryDelay,
			isListening,
			voiceService,
			handleResult,
		],
	);

	/**
	 * Start listening for voice commands
	 */
	const startListening = useCallback(() => {
		if (!isSupported) {
			if (enableFeedback) {
				toast.error(VOICE_FEEDBACK.NOT_SUPPORTED, {
					duration: 3000,
				});
			}
			return;
		}

		if (isListening) {
			return;
		}

		// Reset retry state when starting fresh
		setRetryCount(0);
		setCanRetry(true);
		voiceService.clearLastError();

		setIsListening(true);

		if (enableFeedback) {
			toast.info(VOICE_FEEDBACK.LISTENING, {
				duration: 2000,
			});
		}

		voiceService.startListening(handleResult, handleError);
	}, [isSupported, isListening, voiceService, handleResult, handleError, enableFeedback]);

	/**
	 * Stop listening for voice commands
	 */
	const stopListening = useCallback(() => {
		if (isListening) {
			voiceService.stopListening();
			setIsListening(false);
		}
	}, [isListening, voiceService]);

	/**
	 * Speak text using text-to-speech
	 */
	const speak = useCallback(
		async (text: string) => {
			try {
				logger.voiceCommand('Speaking text', 1.0, {
					action: 'speak',
					textLength: text.length,
				});
				await voiceService.speak(text);
			} catch (error) {
				logger.voiceError('Speech synthesis error', {
					action: 'speak',
					enableFeedback,
					error: error instanceof Error ? error.message : String(error),
					textLength: text.length,
				});
				if (enableFeedback) {
					toast.error('Erro ao falar', {
						duration: 2000,
					});
				}
			}
		},
		[voiceService, enableFeedback, logger],
	);

	/**
	 * Cleanup on unmount
	 */
	useEffect(() => {
		return () => {
			if (isListening) {
				voiceService.stopListening();
			}
		};
	}, [isListening, voiceService]);

	/**
	 * Manual retry function
	 */
	const retry = useCallback(() => {
		if (canRetry && !isListening) {
			setRetryCount(0);
			setCanRetry(true);
			voiceService.clearLastError();
			startListening();
		}
	}, [canRetry, isListening, voiceService, startListening]);

	/**
	 * Get last error from voice service
	 */
	const getLastError = useCallback(() => {
		return voiceService.getLastError();
	}, [voiceService]);

	return {
		isListening,
		isSupported,
		lastCommand,
		lastTranscript,
		speak,
		startListening,
		stopListening,
		canRetry,
		retryCount,
		retry,
		getLastError,
	};
}

/**
 * Get user-friendly destination name
 */
function getDestinationName(path: string): string {
	const names: Record<string, string> = {
		'/contas': 'Contas',
		'/dashboard': 'Dashboard',
		'/orcamento': 'Orçamento',
		'/pix': 'PIX',
		'/saldo': 'Saldo',
		'/transactions': 'Transações',
	};
	return names[path] || path;
}

/**
 * Hook for voice feedback only (no navigation)
 */
export function useVoiceFeedback() {
	const voiceService = getVoiceService();
	const logger = useVoiceLogger();
	logger.setContext({ hook: 'useVoiceFeedback' });

	const speak = useCallback(
		async (text: string) => {
			try {
				logger.voiceCommand('Voice feedback speaking', 1.0, {
					action: 'voiceFeedback',
					textLength: text.length,
				});
				await voiceService.speak(text);
			} catch (error) {
				logger.voiceError('Voice feedback synthesis error', {
					action: 'voiceFeedback',
					error: error instanceof Error ? error.message : String(error),
					textLength: text.length,
				});
			}
		},
		[voiceService, logger],
	);

	const stopSpeaking = useCallback(() => {
		voiceService.stopSpeaking();
	}, [voiceService]);

	return {
		isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
		speak,
		stopSpeaking,
	};
}

export default useVoiceCommand;

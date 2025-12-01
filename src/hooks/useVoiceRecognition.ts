import { useCallback, useEffect, useRef, useState } from 'react';

import { createAudioProcessor } from '@/lib/stt/audioProcessor';
import type { VoiceActivityDetector } from '@/lib/stt/voiceActivityDetection';
import { createVAD } from '@/lib/stt/voiceActivityDetection';

// Voice recognition state interface
interface VoiceState {
	isListening: boolean;
	isProcessing: boolean;
	transcript: string;
	confidence: number;
	error: string | null;
	supported: boolean;
	processingTimeMs?: number;
	recognizedCommand?: VoiceCommand | null;
}

// Voice command interface
interface VoiceCommand {
	command: string;
	parameters: Record<string, string | number | boolean | null | undefined>;
	confidence: number;
}

interface SpeechRecognitionResult {
	[index: number]: {
		transcript: string;
		confidence: number;
	};
	length: number;
	isFinal: boolean;
}

interface SpeechRecognitionEvent extends Event {
	results: {
		[index: number]: SpeechRecognitionResult;
		length: number;
	};
	resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
	error: string;
	message?: string;
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	onstart: (() => void) | null;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
}

// Brazilian Portuguese voice commands patterns
const VOICE_COMMANDS = {
	BALANCE: [
		'qual é o meu saldo',
		'quanto tenho na conta',
		'meu saldo',
		'ver saldo',
		'saldo da conta',
	],
	TRANSFER: ['transferir para', 'enviar para', 'pagar para'],
} as const;

interface VoiceRecognitionOptions {
	onTranscript?: (transcript: string, confidence: number) => void;
	onCommand?: (command: VoiceCommand) => void;
	onError?: (error: string) => void;
	autoRestart?: boolean;
	maxDuration?: number;
	autoStopTimeoutMs?: number;
}

export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
	const [state, setState] = useState<VoiceState>({
		confidence: 0,
		error: null,
		isListening: false,
		isProcessing: false,
		recognizedCommand: null,
		supported: false,
		transcript: '',
	});

	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const audioProcessorRef = useRef<{ dispose: () => void } | null>(null);
	const vadRef = useRef<VoiceActivityDetector | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Enhanced voice command processing with performance optimizations
	const ProcessVoiceCommand = useCallback(
		(transcript: string, confidence: number) => {
			const startTime = performance.now();

			const normalizedTranscript = transcript.toLowerCase().trim();

			// Simple command matching for Brazilian Portuguese
			for (const [intent, patterns] of Object.entries(VOICE_COMMANDS)) {
				for (const pattern of patterns) {
					if (normalizedTranscript.includes(pattern)) {
						const command: VoiceCommand = {
							command: intent,
							confidence,
							parameters: { originalTranscript: transcript, transcript },
						};

						const processingTime = performance.now() - startTime;
						command.parameters.processingTime = processingTime;

						setState((prev) => ({
							...prev,
							recognizedCommand: command,
							isProcessing: false,
							processingTimeMs: processingTime,
						}));

						options.onCommand?.(command);
						return;
					}
				}
			}

			// If no specific command matched, send as generic transcript
			options.onTranscript?.(transcript, confidence);
		},
		[options],
	);

	// Start listening with performance optimizations
	const startListening = useCallback(async () => {
		if (state.isListening || state.isProcessing) {
			return;
		}

		try {
			setState((prev) => ({
				...prev,
				isListening: true,
				error: null,
				isProcessing: true,
				recognizedCommand: null,
			}));

			// Initialize VAD for better performance
			if (!vadRef.current) {
				vadRef.current = createVAD({
					minSpeechDuration: 0.3,
					silenceDuration: 1500,
				});
			}

			// Initialize audio processor with optimizations
			if (!audioProcessorRef.current) {
				const processor = createAudioProcessor({
					sampleRate: 16000,
				});
				// Ensure the processor matches the expected type
				audioProcessorRef.current = processor as { dispose: () => void };
			}

			// Initialize STT service with optimized settings (for future use)
			// const _sttService = createSTTService('pt-BR');

			// Use browser SpeechRecognition when available, otherwise fallback to STT service
			const SpeechRecognitionConstructor =
				(
					window as unknown as {
						SpeechRecognition: new () => SpeechRecognition;
					}
				).SpeechRecognition ||
				(
					window as unknown as {
						webkitSpeechRecognition: new () => SpeechRecognition;
					}
				).webkitSpeechRecognition;

			if (SpeechRecognitionConstructor) {
				recognitionRef.current = new SpeechRecognitionConstructor();
				recognitionRef.current.continuous = false;
				recognitionRef.current.interimResults = true;
				recognitionRef.current.lang = 'pt-BR';

				recognitionRef.current.onstart = () => {
					// Speech recognition started
				};

				recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
					const result = event.results[0][0];
					if (result) {
						ProcessVoiceCommand(result.transcript, result.confidence);
					}
				};

				recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
					setState((prev) => ({
						...prev,
						error: `Speech recognition error: ${event.error}`,
						isListening: false,
						isProcessing: false,
					}));
					options.onError?.(`Speech recognition error: ${event.error}`);
				};

				recognitionRef.current.onend = () => {
					setState((prev) => ({
						...prev,
						isListening: false,
					}));
				};
			} else {
				// Fallback to mock for testing
				recognitionRef.current = {
					addEventListener: () => {},
					continuous: false,
					dispatchEvent: () => false,
					interimResults: false,
					lang: '',
					onend: null,
					onerror: null,
					onresult: null,
					onstart: null,
					removeEventListener: () => {},
					start: () => {},
					stop: () => {},
				} as SpeechRecognition;
			}

			// Start the recognition
			if (recognitionRef.current?.start) {
				recognitionRef.current.start();
			}

			const autoStopTimeout = options.autoStopTimeoutMs ?? 3000;

			// Set timeout for auto-stop
			timeoutRef.current = setTimeout(() => {
				if (recognitionRef.current) {
					recognitionRef.current.stop();
					recognitionRef.current = null;
				}

				setState((prev) => ({
					...prev,
					isListening: false,
					isProcessing: false,
					error: 'Tempo esgotado. Tente novamente.',
				}));
			}, autoStopTimeout);
		} catch (error) {
			setState((prev) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to start recognition',
				isListening: false,
				isProcessing: false,
			}));
			options.onError?.(error instanceof Error ? error.message : 'Failed to start recognition');
		}
	}, [state.isListening, state.isProcessing, options, ProcessVoiceCommand]);

	// Stop listening with proper cleanup
	const stopListening = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		if (recognitionRef.current) {
			recognitionRef.current.stop();
			recognitionRef.current = null;
		}

		if (audioProcessorRef.current) {
			audioProcessorRef.current.dispose();
			audioProcessorRef.current = null;
		}

		if (vadRef.current) {
			vadRef.current = null;
		}

		setState((prev) => ({
			...prev,
			isListening: false,
			isProcessing: false,
		}));
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopListening();
		};
	}, [stopListening]);

	// Check browser support
	useEffect(() => {
		const checkSupport = async () => {
			const supported = !!navigator.mediaDevices?.getUserMedia;
			setState((prev) => ({ ...prev, supported }));
		};

		checkSupport();
	}, []);

	return {
		...state,
		startListening,
		stopListening,
		toggleListening: () => (state.isListening ? stopListening() : startListening()),
	};
}

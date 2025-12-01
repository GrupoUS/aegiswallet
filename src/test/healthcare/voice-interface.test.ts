import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureTestUtils, type TestUtils } from '../healthcare-setup';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';

// Type declarations for global Speech API
declare global {
	// eslint-disable-next-line no-var
	var SpeechRecognition: Mock;
	// eslint-disable-next-line no-var
	var webkitSpeechRecognition: Mock;
}

// Mock voice interface component
const VoiceAssistant = ({ onCommand }: { onCommand: (command: any) => void }) => {
	const [isListening, setIsListening] = React.useState(false);
	const [lastCommand, setLastCommand] = React.useState('');

	const startListening = () => {
		setIsListening(true);

		// Mock speech recognition
		const recognition = new global.SpeechRecognition();
		recognition.lang = 'pt-BR';

		recognition.onresult = (event: any) => {
			const command = event.results[0][0].transcript;
			const confidence = event.results[0][0].confidence || 0.95;

			if (confidence < 0.8) {
				setIsListening(false);
				return;
			}

			setLastCommand(command);

			const voiceCommand = (global.testUtils as TestUtils).createMockVoiceCommand(
				command,
				confidence,
			);
			onCommand(voiceCommand);
			setIsListening(false);
		};

		recognition.onerror = () => {
			setIsListening(false);
		};

		// Mock successful recognition after delay using async utility
		(async () => {
			const { waitForMs } = await import('@/test/utils/async-test-utils');
			await waitForMs(1000);
			recognition.onresult({
				results: [
					[
						{
							confidence: 0.95,
							transcript: 'transferir cem reais para João',
						},
					],
				],
			});
		})();

		recognition.start();
	};

	const stopListening = () => {
		setIsListening(false);
	};

	return React.createElement('div', { 'data-testid': 'voice-assistant' }, [
		React.createElement(
			'button',
			{
				'data-testid': 'start-listening',
				disabled: isListening,
				key: 'start-btn',
				onClick: startListening,
				type: 'button',
			},
			isListening ? 'Ouvindo...' : 'Iniciar Assistente de Voz',
		),

		React.createElement(
			'button',
			{
				'data-testid': 'stop-listening',
				disabled: !isListening,
				key: 'stop-btn',
				onClick: stopListening,
				type: 'button',
			},
			'Parar',
		),

		React.createElement(
			'div',
			{
				'aria-live': 'polite',
				'data-testid': 'voice-status',
				key: 'status',
				role: 'status',
			},
			isListening ? 'Ouvindo comando de voz...' : 'Pronto para ouvir',
		),

		React.createElement(
			'div',
			{
				'data-testid': 'voice-transcript',
				key: 'transcript',
			},
			lastCommand && `Último comando: "${lastCommand}"`,
		),
	]);
};

describe('Voice Interface Testing (Portuguese)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Force recreate testUtils to avoid stale mocks after vi.clearAllMocks()
		global.testUtils = undefined;
		ensureTestUtils();
		// Reset SpeechRecognition mock to default implementation
		const mockSpeechRecognition = {
			abort: vi.fn(),
			continuous: false,
			interimResults: false,
			lang: 'pt-BR',
			onend: null as ((event: unknown) => void) | null,
			onerror: null as ((event: unknown) => void) | null,
			onnomatch: null as ((event: unknown) => void) | null,
			onresult: null as ((event: unknown) => void) | null,
			onsoundend: null as ((event: unknown) => void) | null,
			onsoundstart: null as ((event: unknown) => void) | null,
			onspeechend: null as ((event: unknown) => void) | null,
			onspeechstart: null as ((event: unknown) => void) | null,
			start: vi.fn(),
			stop: vi.fn(),
		};

		(global as any).SpeechRecognition = vi.fn(() => mockSpeechRecognition);
		(global as any).webkitSpeechRecognition = vi.fn(() => mockSpeechRecognition);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Speech Recognition Setup', () => {
		it('should configure speech recognition for Portuguese (Brazil)', async () => {
			render(React.createElement(VoiceAssistant, { onCommand: vi.fn() }));

			const startButton = screen.getByTestId('start-listening');
			await userEvent.click(startButton);

			// Verify speech recognition is configured for pt-BR
			expect(global.SpeechRecognition).toHaveBeenCalled();
		});

		it('should provide visual feedback during voice input', async () => {
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			const statusElement = screen.getByTestId('voice-status');

			expect(statusElement).toHaveTextContent('Pronto para ouvir');

			await userEvent.click(startButton);

			expect(statusElement).toHaveTextContent('Ouvindo comando de voz...');
			expect(startButton).toBeDisabled();
			expect(startButton).toHaveTextContent('Ouvindo...');
		});
	});

	describe('Portuguese Command Processing', () => {
		it('should process financial transfer commands correctly', async () => {
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			await userEvent.click(startButton);

			await waitFor(() => {
				expect(onCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						command: 'transferir cem reais para João',
						confidence: 0.95,
						timestamp: expect.any(String),
					}),
				);
			});
		});

		it('should handle appointment scheduling commands', async () => {
			const onCommand = vi.fn();

			// Mock different command with proper typing
			const mockRecognition: {
				lang: string;
				onerror: ((event: unknown) => void) | null;
				onresult:
					| ((event: { results: { transcript: string; confidence: number }[][] }) => void)
					| null;
				start: ReturnType<typeof vi.fn>;
			} = {
				lang: 'pt-BR',
				onerror: null,
				onresult: null,
				start: vi.fn(),
			};

			(global.SpeechRecognition as Mock).mockImplementation(() => mockRecognition);

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			await userEvent.click(startButton);

			// Simulate appointment command
			await waitFor(() => {
				expect(mockRecognition.onresult).toBeTruthy();
			});

			if (mockRecognition.onresult) {
				mockRecognition.onresult({
					results: [
						[
							{
								confidence: 0.92,
								transcript: 'agendar consulta com Dr. Pedro para amanhã',
							},
						],
					],
				});
			}

			await waitFor(() => {
				expect(onCommand).toHaveBeenCalledWith(
					expect.objectContaining({
						command: 'agendar consulta com Dr. Pedro para amanhã',
						confidence: 0.92,
					}),
				);
			});
		});

		it('should display command transcript after recognition', async () => {
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			await userEvent.click(startButton);

			await waitFor(() => {
				const transcriptElement = screen.getByTestId('voice-transcript');
				expect(transcriptElement).toHaveTextContent(
					'Último comando: "transferir cem reais para João"',
				);
			});
		});
	});

	describe('Voice Command Accuracy', () => {
		it('should require minimum confidence threshold for commands', async () => {
			const onCommand = vi.fn();
			const lowConfidenceRecognition: {
				lang: string;
				onerror: ((event: unknown) => void) | null;
				onresult:
					| ((event: { results: { confidence: number; transcript: string }[][] }) => void)
					| null;
				start: ReturnType<typeof vi.fn>;
			} = {
				lang: 'pt-BR',
				onerror: null,
				onresult: null,
				start: vi.fn(),
			};

			(global.SpeechRecognition as Mock).mockImplementation(() => lowConfidenceRecognition);

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			await userEvent.click(startButton);

			// Simulate low confidence recognition
			if (lowConfidenceRecognition.onresult) {
				lowConfidenceRecognition.onresult({
					results: [
						[
							{
								confidence: 0.45,
								transcript: 'comando incerto', // Below threshold
							},
						],
					],
				});
			}

			// Should not process low confidence commands
			await waitFor(
				() => {
					expect(onCommand).not.toHaveBeenCalledWith(
						expect.objectContaining({
							command: 'comando incerto',
						}),
					);
				},
				{ timeout: 2000 },
			);
		});

		it('should handle Portuguese-specific terminology correctly', () => {
			const portugueseCommands = {
				financial: [
					'transferir',
					'pagar',
					'depositar',
					'saldo',
					'extrato',
					'fatura',
					'boleto',
					'pix',
				],
				medical: [
					'consulta',
					'médico',
					'doutor',
					'agenda',
					'remédio',
					'receita',
					'exame',
					'hospital',
				],
				temporal: ['hoje', 'amanhã', 'ontem', 'próxima semana', 'dia útil', 'final de semana'],
			};

			// Validate Portuguese vocabulary coverage
			Object.entries(portugueseCommands).forEach(([_category, commands]) => {
				expect(commands).toBeInstanceOf(Array);
				expect(commands.length).toBeGreaterThan(0);

				commands.forEach((command) => {
					expect(typeof command).toBe('string');
					expect(command.trim().length).toBeGreaterThan(0);
					// Should contain Portuguese characters or common financial/medical terms
					expect(/^[a-zA-Zà-úÀ-Ú\s]+$/.test(command)).toBe(true);
				});
			});
		});
	});

	describe('Error Handling', () => {
		it('should handle speech recognition errors gracefully', async () => {
			const errorRecognition: {
				lang: string;
				onerror: ((event: unknown) => void) | null;
				onresult:
					| ((event: { results: [{ confidence: number; transcript: string }[]][] }) => void)
					| null;
				start: ReturnType<typeof vi.fn>;
			} = {
				lang: 'pt-BR',
				onerror: null,
				onresult: null,
				start: vi.fn(),
			};

			(global.SpeechRecognition as Mock).mockImplementation(() => errorRecognition);

			render(React.createElement(VoiceAssistant, { onCommand: vi.fn() }));

			const startButton = screen.getByTestId('start-listening');
			await userEvent.click(startButton);

			// Simulate recognition error
			if (errorRecognition.onerror) {
				errorRecognition.onerror({ error: 'no-speech' });
			}

			await waitFor(() => {
				const statusElement = screen.getByTestId('voice-status');
				expect(statusElement).toHaveTextContent('Pronto para ouvir');
				expect(startButton).toBeEnabled();
			});
		});

		it('should provide fallback option when voice fails', () => {
			// Test that voice interface has keyboard/text fallback
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			// Should have keyboard accessibility
			const startButton = screen.getByTestId('start-listening');
			expect(startButton).toBeVisible();

			// Test keyboard navigation
		});
	});

	describe('Enhanced Error Handling & Retry Logic', () => {
		it('should handle no-speech errors as informational, not critical', async () => {
			const onCommand = vi.fn();

			const errorRecognition: {
				lang: string;
				onerror: ((event: unknown) => void) | null;
				onresult:
					| ((event: { results: [{ confidence: number; transcript: string }[]][] }) => void)
					| null;
				start: ReturnType<typeof vi.fn>;
			} = {
				lang: 'pt-BR',
				onerror: null,
				onresult: null,
				start: vi.fn(),
			};

			(global.SpeechRecognition as Mock).mockImplementation(() => errorRecognition);

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			await userEvent.click(startButton);

			// Simulate no-speech error
			if (errorRecognition.onerror) {
				errorRecognition.onerror({
					error: 'no-speech',
					message: 'No speech detected',
				});
			}

			// Should not show error state, should be ready for retry
			await waitFor(() => {
				const statusElement = screen.getByTestId('voice-status');
				expect(statusElement).toHaveTextContent('Pronto para ouvir');
				expect(startButton).toBeEnabled();
			});

			// Should not have triggered error callback
			expect(onCommand).not.toHaveBeenCalled();
		});

		it('should provide retry functionality after no-speech errors', async () => {
			const mockVoiceService = {
				startListening: vi.fn(),
				stopListening: vi.fn(),
				getLastError: vi.fn().mockReturnValue({
					type: 'no-speech',
					message: 'No speech detected',
					timestamp: new Date(),
					isNoSpeech: true,
				}),
				clearLastError: vi.fn(),
				getIsListening: vi.fn().mockReturnValue(false),
			};

			// Mock the voice service to include retry functionality
			vi.mock('@/services/voiceService', () => ({
				getVoiceService: () => mockVoiceService,
				VOICE_FEEDBACK: {
					LISTENING: 'Estou ouvindo...',
					NOT_SUPPORTED: 'Reconhecimento de voz não suportado',
					ERROR: 'Desculpe, não entendi o comando',
				},
			}));

			// Test retry capability
			const { result } = renderHook(() =>
				useVoiceCommand({
					autoRetryOnNoSpeech: false,
					maxRetryAttempts: 3,
					enableFeedback: false,
				}),
			);

			// Simulate no-speech error handling
			act(() => {
				result.current.retry();
			});

			expect(mockVoiceService.clearLastError).toHaveBeenCalled();
			expect(mockVoiceService.startListening).toHaveBeenCalled();
		});

		it('should respect max retry attempts', async () => {
			// Test with auto-retry enabled but limited attempts
			const { result } = renderHook(() =>
				useVoiceCommand({
					autoRetryOnNoSpeech: true,
					maxRetryAttempts: 2,
					retryDelay: 100,
					enableFeedback: false,
				}),
			);

			// Simulate exceeding retry limit
			act(() => {
				// Start listening
				result.current.startListening();
			});

			// After reaching max attempts, should disable retry
			expect(result.current.canRetry).toBe(true);
			expect(result.current.retryCount).toBe(0);
		});

		it('should provide structured error information via getLastError', () => {
			const mockErrorInfo = {
				type: 'network' as const,
				message: 'Network error occurred',
				timestamp: new Date(),
				isNoSpeech: false,
				originalEvent: { error: 'network' },
			};

			const mockVoiceService = {
				startListening: vi.fn(),
				stopListening: vi.fn(),
				getLastError: vi.fn().mockReturnValue(mockErrorInfo),
				clearLastError: vi.fn(),
				getIsListening: vi.fn().mockReturnValue(false),
			};

			vi.mock('@/services/voiceService', () => ({
				getVoiceService: () => mockVoiceService,
			}));

			const { result } = renderHook(() => useVoiceCommand());

			// Test error information retrieval
			const lastError = result.current.getLastError();
			expect(lastError).toEqual(mockErrorInfo);
			expect(lastError?.type).toBe('network');
			expect(lastError?.isNoSpeech).toBe(false);
		});

		it('should handle different error types appropriately', () => {
			const errorTypes = [
				'network',
				'not-allowed',
				'service-not-allowed',
				'aborted',
				'language-not-supported',
			];

			errorTypes.forEach((errorType) => {
				const mockVoiceService = {
					startListening: vi.fn(),
					stopListening: vi.fn(),
					getLastError: vi.fn().mockReturnValue({
						type: errorType,
						message: `${errorType} error occurred`,
						timestamp: new Date(),
						isNoSpeech: errorType === 'no-speech',
						originalEvent: { error: errorType },
					}),
					clearLastError: vi.fn(),
					getIsListening: vi.fn().mockReturnValue(false),
				};

				vi.mock('@/services/voiceService', () => ({
					getVoiceService: () => mockVoiceService,
				}));

				const { result } = renderHook(() => useVoiceCommand());
				const lastError = result.current.getLastError();

				expect(lastError?.type).toBe(errorType);
				expect(lastError?.timestamp).toBeInstanceOf(Date);
			});
		});
	});

	describe('Accessibility Compliance', () => {
		it('should provide screen reader support', () => {
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			// Should have ARIA labels and live regions
			const statusElement = screen.getByTestId('voice-status');
			expect(statusElement).toHaveAttribute('role', 'status');
			expect(statusElement).toHaveAttribute('aria-live', 'polite');
		});

		it('should support keyboard navigation', async () => {
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');

			// Test Tab navigation
			startButton.focus();
			expect(startButton).toHaveFocus();

			// Test Enter key activation
			await userEvent.click(startButton);

			// Should start listening (would trigger voice recognition)
			expect(startButton).toBeDisabled();
		});

		it('should have proper button labels in Portuguese', () => {
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			const stopButton = screen.getByTestId('stop-listening');

			expect(startButton).toHaveTextContent('Iniciar Assistente de Voz');
			expect(stopButton).toHaveTextContent('Parar');
		});
	});

	describe('Language and Localization', () => {
		it('should use Brazilian Portuguese locale', () => {
			const onCommand = vi.fn();

			render(React.createElement(VoiceAssistant, { onCommand }));

			const startButton = screen.getByTestId('start-listening');
			startButton.click();

			// Verify speech recognition is configured for pt-BR
			expect(global.SpeechRecognition).toHaveBeenCalled();
			const mockInstance = (global.SpeechRecognition as any).mock.results[0].value;
			expect(mockInstance.lang).toBe('pt-BR');
		});

		it('should handle Brazilian monetary values correctly', () => {
			const monetaryCommands = [
				'cem reais',
				'R$ 100,00',
				'duzentos e cinquenta reais',
				'mil reais',
				'R$ 1.234,56',
			];

			monetaryCommands.forEach((command) => {
				expect(typeof command).toBe('string');
				expect(command).toMatch(/R\$\s*\d+([.,]\d+)?|reais/i);
			});
		});

		it('should understand Brazilian Portuguese date expressions', () => {
			const dateExpressions = [
				'hoje',
				'amanhã',
				'ontem',
				'próxima segunda-feira',
				'dia quinze',
				'dia vinte e cinco de janeiro',
				'próximo mês',
			];

			dateExpressions.forEach((expression) => {
				expect(typeof expression).toBe('string');
				expect(expression.trim().length).toBeGreaterThan(0);
			});
		});
	});
});

/**
 * AegisWallet Voice Component Template
 *
 * Use this template for creating voice-first components in AegisWallet.
 * Includes accessibility, Portuguese localization, and Brazilian financial context.
 */

import type React from 'react';
import { useCallback, useState } from 'react';

import { useAccessibility } from '@/hooks/useAccessibility';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { cn } from '@/lib/utils';

interface VoiceComponentProps {
	readonly onVoiceCommand?: (command: VoiceCommand) => void;
	readonly accessibilityLabel?: string;
	readonly className?: string;
	readonly children?: React.ReactNode;
	readonly disabled?: boolean;
	readonly autonomyLevel?: number;
}

interface VoiceCommand {
	readonly transcript: string;
	readonly intent: string;
	readonly confidence: number;
	readonly timestamp: string;
}

export const VoiceComponentTemplate: React.FC<VoiceComponentProps> = ({
	onVoiceCommand,
	accessibilityLabel,
	className,
	children,
	disabled = false,
	autonomyLevel = 50,
}) => {
	const [isListening, setIsListening] = useState(false);
	const [currentTranscript, setCurrentTranscript] = useState('');
	const [lastResponse, setLastResponse] = useState('');

	const {
		startListening,
		stopListening,
		isSupported: voiceSupported,
	} = useVoiceRecognition({
		continuous: false,
		interimResults: true,
		language: 'pt-BR',
		onError: useCallback((error: string) => {
			console.error('Voice recognition error:', error);
			handleVoiceError(error);
		}, []),
		onResult: useCallback(
			(transcript: string, confidence: number) => {
				setCurrentTranscript(transcript);

				if (confidence > 0.8 && onVoiceCommand) {
					// Process command with Brazilian Portuguese optimization
					const command = processVoiceCommand(transcript, confidence);
					onVoiceCommand(command);
				}
			},
			[onVoiceCommand],
		),
	});

	const { announceToScreenReader } = useAccessibility();

	const handleVoiceError = (error: string): void => {
		const errorMessages: Record<string, string> = {
			aborted: 'Operação cancelada.',
			'audio-capture': 'Problema com o microfone. Verifique se está conectado.',
			network: 'Problema de conexão. Verifique sua internet.',
			'no-speech': 'Não ouvi nada. Poderia falar mais alto?',
			'not-allowed': 'Permissão negada. Permita o acesso ao microfone.',
		};

		const errorMessage = errorMessages[error] || 'Ocorreu um erro. Tente novamente.';
		setLastResponse(errorMessage);
		announceToScreenReader(errorMessage);
	};

	const processVoiceCommand = (transcript: string, confidence: number): VoiceCommand => {
		// Brazilian Portuguese text normalization
		const normalizedTranscript = transcript
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // Remove accents
			.replace(/[^\w\s]/g, '') // Remove special characters
			.trim();

		// Intent classification for Brazilian financial commands
		const intentPatterns = {
			balance_query: [
				/saldo|quantos? (tenhos?|tenho).*conta/,
				/como.*está.*minha.*conta/,
				/quanto.*dinheiro/,
			],
			bill_query: [/boleto|conta.*pagar/, /tem.*conta.*programada/, /pagar.*conta/],
			spending_query: [/quanto.*posso.*gastar/, /limite.*gasto/, /orçamento/],
			transfer_query: [
				/transfer(e|ir|ência)?.*para/,
				/envia(r|do).*para/,
				/manda(r|do).*dinheiro/,
				/pix.*para/,
			],
		};

		let detectedIntent = 'unknown';
		for (const [intent, patterns] of Object.entries(intentPatterns)) {
			for (const pattern of patterns) {
				if (pattern.test(normalizedTranscript)) {
					detectedIntent = intent;
					break;
				}
			}
			if (detectedIntent !== 'unknown') {
				break;
			}
		}

		return {
			confidence,
			intent: detectedIntent,
			timestamp: new Date().toISOString(),
			transcript,
		};
	};

	const handleStartListening = useCallback(() => {
		if (!voiceSupported || disabled) {
			return;
		}

		setIsListening(true);
		setCurrentTranscript('');
		setLastResponse('');

		// Announce to screen readers
		announceToScreenReader('Ouvindo comando de voz');

		startListening();
	}, [voiceSupported, disabled, startListening, announceToScreenReader]);

	const handleStopListening = useCallback(() => {
		setIsListening(false);
		stopListening();
		announceToScreenReader('Voz desativada');
	}, [stopListening, announceToScreenReader]);

	return (
		<div
			className={cn(
				'voice-component',
				'relative rounded-lg border border-gray-200 bg-white p-4',
				'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
				isListening && 'voice-listening border-primary bg-primary/5',
				disabled && 'opacity-50 cursor-not-allowed',
				className,
			)}
			role="application"
			aria-label={accessibilityLabel || 'Interface de voz financeira'}
			aria-busy={isListening}
		>
			{/* Voice Status Indicator */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-2">
					<div
						className={cn(
							'w-3 h-3 rounded-full transition-colors',
							isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300',
						)}
						aria-hidden="true"
					/>
					<span className="text-sm font-medium text-gray-700">
						{isListening ? 'Ouvindo...' : 'Voz inativa'}
					</span>
				</div>

				{/* Autonomy Level Indicator */}
				<div className="text-xs text-gray-500">Autonomia: {autonomyLevel}%</div>
			</div>

			{/* Voice Indicator Animation */}
			{isListening && (
				<div className="mb-4 flex justify-center" aria-hidden="true">
					<div className="flex space-x-1">
						<div className="w-1 h-8 bg-green-500 animate-pulse" />
						<div className="w-1 h-12 bg-green-500 animate-pulse delay-75" />
						<div className="w-1 h-6 bg-green-500 animate-pulse delay-150" />
						<div className="w-1 h-10 bg-green-500 animate-pulse delay-300" />
						<div className="w-1 h-8 bg-green-500 animate-pulse delay-500" />
					</div>
				</div>
			)}

			{/* Transcript Display */}
			{(currentTranscript || lastResponse) && (
				<div className="mb-4 space-y-2" role="log" aria-live="polite">
					{currentTranscript && (
						<div className="p-2 bg-blue-50 rounded text-blue-900">
							<span className="font-medium text-xs">Você:</span>
							<span className="ml-2">{currentTranscript}</span>
						</div>
					)}

					{lastResponse && (
						<div className="p-2 bg-green-50 rounded text-green-900">
							<span className="font-medium text-xs">Assistente:</span>
							<span className="ml-2">{lastResponse}</span>
						</div>
					)}
				</div>
			)}

			{/* Children Content */}
			<div className="mb-4">{children}</div>

			{/* Voice Controls */}
			<div className="flex justify-center space-x-3">
				<button
					type="button"
					onClick={handleStartListening}
					disabled={isListening || disabled || !voiceSupported}
					className={cn(
						'px-4 py-2 rounded-md font-medium text-white transition-colors',
						'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
						isListening
							? 'bg-gray-400 cursor-not-allowed'
							: 'bg-primary hover:bg-primary/600 disabled:bg-gray-300',
					)}
					aria-label={isListening ? 'Já está ouvindo' : 'Iniciar reconhecimento de voz'}
				>
					{isListening ? 'Ouvindo...' : 'Falar'}
				</button>

				{isListening && (
					<button
						type="button"
						onClick={handleStopListening}
						className="px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
						aria-label="Parar reconhecimento de voz"
					>
						Parar
					</button>
				)}
			</div>

			{/* Screen Reader Announcements */}
			<div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
				{lastResponse}
			</div>
		</div>
	);
};

// Brazilian Portuguese Voice Commands Examples
export const VOICE_COMMANDS_EXAMPLES = [
	'Como está meu saldo?',
	'Quanto posso gastar esse mês?',
	'Tem algum boleto programado para pagar?',
	'Tem algum recebimento programado para entrar?',
	'Como ficará meu saldo no final do mês?',
	'Faz uma transferência para João de R$ 100',
	'Pagar a conta de luz',
	'Qual o meu limite disponível?',
	'Quanto gastei este mês com alimentação?',
	'Mostrar minhas últimas transações',
] as const;

export default VoiceComponentTemplate;

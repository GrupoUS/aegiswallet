import { Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceIndicatorProps {
	isActive: boolean;
	isProcessing: boolean;
	isSupported: boolean;
	transcript: string;
	error: string | null;
	onStart: () => void;
	onStop: () => void;
	className?: string;
}

// Memoize the command hints array to prevent recreation on every render
const COMMAND_HINTS = [
	'Meu saldo',
	'Orçamento',
	'Contas a pagar',
	'Recebimentos',
	'Projeção',
	'Transferência',
] as const;

// Memoize the UnsupportedState component
const UnsupportedState = React.memo(function UnsupportedState() {
	return (
		<div className="flex flex-col items-center justify-center p-6">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<MicOff className="h-8 w-8 text-destructive" />
			</div>
			<p className="text-center text-destructive text-sm">
				Seu navegador não suporta reconhecimento de voz
			</p>
			<p className="mt-2 text-center text-gray-500 text-xs">
				Use um navegador moderno como Chrome, Edge ou Safari
			</p>
		</div>
	);
});

// Memoize the CommandHints component
const CommandHints = React.memo(function CommandHints() {
	return (
		<div className="mt-6 text-center">
			<p className="mb-2 text-gray-500 text-xs">Comandos disponíveis:</p>
			<div className="flex max-w-xs flex-wrap justify-center gap-1">
				{Array.isArray(COMMAND_HINTS) &&
					COMMAND_HINTS.map((hint) => (
						<span key={hint} className="rounded-full bg-gray-100 px-2 py-1 text-gray-600 text-xs">
							{hint}
						</span>
					))}
			</div>
		</div>
	);
});

// Memoize the VisualFeedback component
const VisualFeedback = React.memo(function VisualFeedback() {
	return (
		<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div className="h-24 w-24 animate-ping rounded-full border-4 border-warning opacity-20" />
			<div className="animation-delay-200 h-20 w-20 animate-ping rounded-full border-4 border-warning opacity-20" />
		</div>
	);
});

// Memoize the TranscriptDisplay component
const TranscriptDisplay = React.memo(function TranscriptDisplay({
	transcript,
}: {
	transcript: string;
}) {
	return (
		<div className="mt-4 max-w-xs rounded-lg bg-gray-50 p-3">
			<p className="text-gray-600 text-sm italic">"{transcript}"</p>
		</div>
	);
});

export const VoiceIndicator = React.memo(function VoiceIndicator({
	isActive,
	isProcessing,
	isSupported,
	transcript,
	error,
	onStart,
	onStop,
	className,
}: VoiceIndicatorProps) {
	// Memoize the state color to prevent recalculation
	const stateColor = React.useMemo(() => {
		if (error) {
			return 'bg-destructive';
		}
		if (isProcessing) {
			return 'bg-info';
		}
		if (isActive) {
			return 'bg-warning';
		}
		return 'bg-gray-400';
	}, [error, isProcessing, isActive]);

	// Memoize the state text to prevent recalculation
	const stateText = React.useMemo(() => {
		if (error) {
			return error;
		}
		if (isProcessing) {
			return 'Processando comando...';
		}
		if (isActive) {
			return 'Ouvindo...';
		}
		return 'Toque para falar';
	}, [error, isProcessing, isActive]);

	// Memoize the state icon to prevent recalculation
	const stateIcon = React.useMemo(() => {
		if (isProcessing) {
			return <Loader2 className="h-6 w-6 animate-spin" />;
		}
		if (isActive) {
			return <Volume2 className="h-6 w-6" />;
		}
		return <Mic className="h-6 w-6" />;
	}, [isProcessing, isActive]);

	// Memoize the button click handler
	const handleButtonClick = React.useCallback(() => {
		if (isActive) {
			onStop();
		} else {
			onStart();
		}
	}, [isActive, onStart, onStop]);

	// Memoize the button className
	const buttonClassName = React.useMemo(() => {
		return cn(
			'w-20 h-20 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95',
			stateColor,
			isActive && 'animate-pulse ring-4 ring-opacity-30',
			isProcessing && 'cursor-not-allowed',
		);
	}, [stateColor, isActive, isProcessing]);

	// Memoize the status text className
	const statusTextClassName = React.useMemo(() => {
		return cn(
			'text-sm font-medium transition-colors',
			error ? 'text-destructive' : 'text-gray-700',
		);
	}, [error]);

	if (!isSupported) {
		return (
			<div className={cn('flex flex-col items-center justify-center p-6', className)}>
				<UnsupportedState />
			</div>
		);
	}

	return (
		<div className={cn('flex flex-col items-center justify-center', className)}>
			{/* Voice Activation Button */}
			<Button
				onClick={handleButtonClick}
				disabled={isProcessing}
				size="lg"
				className={buttonClassName}
				variant="ghost"
			>
				<div className="text-white">{stateIcon}</div>
			</Button>

			{/* Status Text */}
			<div className="mt-4 text-center">
				<p className={statusTextClassName}>{stateText}</p>
			</div>

			{/* Transcript Display */}
			{transcript && <TranscriptDisplay transcript={transcript} />}

			{/* Visual Feedback Animation */}
			{isActive && <VisualFeedback />}

			{/* Voice Command Hints */}
			{!(isActive || isProcessing || error) && <CommandHints />}
		</div>
	);
});

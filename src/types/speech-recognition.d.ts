/**
 * Web Speech API Type Declarations
 *
 * Provides TypeScript type definitions for the Web Speech API
 * including SpeechRecognition and related interfaces.
 */

interface SpeechRecognitionErrorEvent extends Event {
	readonly error:
		| 'aborted'
		| 'audio-capture'
		| 'bad-grammar'
		| 'language-not-supported'
		| 'network'
		| 'no-speech'
		| 'not-allowed'
		| 'service-not-allowed';
	readonly message: string;
}

interface SpeechRecognitionAlternative {
	readonly confidence: number;
	readonly transcript: string;
}

interface SpeechRecognitionResult {
	readonly isFinal: boolean;
	readonly length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
	readonly length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
	readonly resultIndex: number;
	readonly results: SpeechRecognitionResultList;
}

interface SpeechGrammar {
	src: string;
	weight: number;
}

interface SpeechGrammarList {
	readonly length: number;
	addFromString(string: string, weight?: number): void;
	addFromURI(src: string, weight?: number): void;
	item(index: number): SpeechGrammar;
	[index: number]: SpeechGrammar;
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	grammars: SpeechGrammarList;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	serviceURI: string;

	abort(): void;
	start(): void;
	stop(): void;

	onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
	onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
	onend: ((this: SpeechRecognition, ev: Event) => void) | null;
	onerror:
		| ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
		| null;
	onnomatch:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
		| null;
	onresult:
		| ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
		| null;
	onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
	onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
	onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
	onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
	onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognition;
	prototype: SpeechRecognition;
}

declare global {
	interface Window {
		SpeechRecognition?: SpeechRecognitionConstructor;
		webkitSpeechRecognition?: SpeechRecognitionConstructor;
	}
}

export type {
	SpeechRecognition,
	SpeechRecognitionAlternative,
	SpeechRecognitionConstructor,
	SpeechRecognitionErrorEvent,
	SpeechRecognitionEvent,
	SpeechRecognitionResult,
	SpeechRecognitionResultList,
	SpeechGrammar,
	SpeechGrammarList,
};

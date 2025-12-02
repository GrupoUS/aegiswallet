/// <reference types="vite/client" />

// Speech Recognition API types for voice accessibility
interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	grammars: SpeechGrammarList;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	serviceURI: string;

	start(): void;
	stop(): void;
	abort(): void;

	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
	onstart: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message?: string;
}

interface SpeechRecognitionResultList {
	readonly length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	readonly isFinal: boolean;
	readonly length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
	readonly transcript: string;
	readonly confidence: number;
}

interface SpeechGrammarList {
	readonly length: number;
	addFromString(grammar: string, weight?: number): void;
	addFromURI(src: string, weight?: number): void;
	item(index: number): SpeechGrammar;
	[index: number]: SpeechGrammar;
}

interface SpeechGrammar {
	src: string;
	weight: number;
}

interface Window {
	SpeechRecognition: typeof SpeechRecognition;
	webkitSpeechRecognition: typeof SpeechRecognition;
}

interface ImportMetaEnv {
	readonly VITE_CLERK_PUBLISHABLE_KEY: string;
	readonly VITE_NEON_DATABASE_URL: string;
	readonly VITE_APP_URL: string;
	readonly VITE_API_URL: string;
	readonly VITE_GOOGLE_CLIENT_ID?: string;
	readonly VITE_GOOGLE_CALENDAR_API_KEY?: string;
	readonly VITE_STT_PROVIDER: string;
	readonly VITE_TTS_PROVIDER: string;
	readonly VITE_OPENAI_API_KEY?: string;
	readonly VITE_ELEVENLABS_API_KEY?: string;
	readonly VITE_GROQ_API_KEY?: string;
	readonly VITE_DEEPGRAM_API_KEY?: string;
	readonly VITE_GOOGLE_CLOUD_API_KEY?: string;
	readonly VITE_AZURE_SPEECH_KEY?: string;
	readonly VITE_AZURE_SPEECH_REGION?: string;
	readonly VITE_LOG_LEVEL?: string;
	readonly MODE: string;
	readonly DEV: boolean;
	readonly PROD: boolean;
	readonly SSR: boolean;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

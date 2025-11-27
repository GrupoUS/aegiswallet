// CRITICAL: Setup DOM APIs immediately at module load time
// This prevents "Element is not defined" errors in test files

import { JSDOM } from 'jsdom';

// Declare SpeechRecognition interface for test environment
interface SpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
	length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	isFinal: boolean;
	length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: Event) => void) | null;
	onend: (() => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}

// Extend Window interface for Speech API polyfills
declare global {
	interface Window {
		SpeechRecognition: SpeechRecognitionConstructor;
		webkitSpeechRecognition: SpeechRecognitionConstructor;
	}
}

if (typeof globalThis.Element === 'undefined') {
	(globalThis as Record<string, unknown>).Element = class Element {
		scrollIntoView() {}
		getBoundingClientRect() {
			return {
				bottom: 0,
				height: 0,
				left: 0,
				right: 0,
				top: 0,
				width: 0,
				x: 0,
				y: 0,
			};
		}
	};
}

if (typeof globalThis.HTMLElement === 'undefined') {
	const GlobalElement = (globalThis as Record<string, unknown>)
		.Element as typeof Element;
	(globalThis as Record<string, unknown>).HTMLElement =
		class HTMLElement extends GlobalElement {
			style: Record<string, unknown>;
			constructor() {
				super();
				this.style = {};
			}
		};
}

// Create comprehensive document mock if not available
if (typeof globalThis.document === 'undefined') {
	const dom = new JSDOM(
		'<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div></body></html>',
		{
			pretendToBeVisual: true,
			resources: 'usable',
			url: 'http://localhost:3000',
		},
	);

	// Set up global DOM objects
	globalThis.window = dom.window;
	globalThis.document = dom.window.document;
	globalThis.navigator = dom.window.navigator;
	globalThis.HTMLElement = dom.window.HTMLElement;
	globalThis.Element = dom.window.Element;

	// Set global document for Testing Library
	global.document = dom.window.document;
	global.window = dom.window;
}

import '@testing-library/jest-dom';

import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Import healthcare test utilities to ensure global.testUtils is available
import { ensureTestUtils } from './healthcare/test-utils';

// Initialize global testUtils immediately
ensureTestUtils();

type MutableGlobal = typeof globalThis & {
	localStorage?: Storage;
	SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
	speechSynthesis?: SpeechSynthesis;
	SpeechRecognition?: unknown;
	webkitSpeechRecognition?: unknown;
	AudioContext?: typeof AudioContext;
	webkitAudioContext?: typeof AudioContext;
	requestAnimationFrame?: typeof requestAnimationFrame;
	cancelAnimationFrame?: typeof cancelAnimationFrame;
	vi?: typeof vi;
	screen?: Screen;
};

const globalObj = globalThis as MutableGlobal;

// NOTE: Do NOT enable fake timers globally - it breaks waitFor and userEvent
// Use vi.useFakeTimers() only in specific tests that need it
// vi.useFakeTimers();

// Set required environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Ensure DOM is available immediately (before tests run)
if (typeof globalThis.document === 'undefined') {
	const { JSDOM } = require('jsdom');
	const dom = new JSDOM(
		'<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div></body></html>',
		{
			pretendToBeVisual: true,
			resources: 'usable',
			url: 'http://localhost:3000',
		},
	);

	globalThis.window = dom.window;
	globalThis.document = dom.window.document;
	globalThis.navigator = dom.window.navigator;
	globalThis.HTMLElement = dom.window.HTMLElement;
	globalThis.Element = dom.window.Element;

	// Set up global document for Testing Library
	global.document = dom.window.document;
	global.window = dom.window;
}

// Mock audio processor, VAD, and STT services at module level
vi.mock('@/lib/stt/audioProcessor', () => {
	const mockAudioProcessor = {
		dispose: vi.fn(),
		processAudio: vi.fn().mockResolvedValue({
			averageVolume: 0.5,
			blob: new Blob(),
			duration: 1000,
			hasVoice: true,
			peakVolume: 0.8,
			sampleRate: 16000,
		}),
		validateAudio: vi.fn().mockResolvedValue({ valid: true }),
	};

	return {
		AudioProcessor: vi.fn(() => mockAudioProcessor),
		createAudioProcessor: vi.fn(() => mockAudioProcessor),
	};
});

vi.mock('@/lib/stt/voiceActivityDetection', () => {
	const createMockVAD = () => {
		let active = false;

		return {
			detectVoiceActivity: vi.fn().mockResolvedValue({ hasVoice: true }),
			dispose: vi.fn(() => {
				active = false;
			}),
			getCurrentState: vi.fn(() => ({
				energy: active ? 0.6 : 0,
				isSpeaking: active,
				speechDuration: active ? 320 : 0,
				speechStartTime: active ? Date.now() : null,
			})),
			initialize: vi.fn(async () => {
				active = true;
			}),
			isActive: vi.fn(() => active),
			onSpeechEndCallback: vi.fn(),
			onSpeechStartCallback: vi.fn(),
			setEnergyThreshold: vi.fn(),
			stop: vi.fn(() => {
				active = false;
			}),
		};
	};

	return {
		VoiceActivityDetector: vi.fn(() => createMockVAD()),
		createVAD: vi.fn(() => createMockVAD()),
	};
});

vi.mock('@/lib/stt/speechToTextService', () => {
	const createMockSTTService = () => ({
		config: {
			apiKey: 'test-key',
			language: 'pt',
			model: 'whisper-1',
			temperature: 0,
			timeout: 8000,
		},
		dispose: vi.fn(),
		startRecognition: vi.fn(),
		stopRecognition: vi.fn(),
		transcribe: vi.fn(async (audio: Blob) => {
			const maxBytes = 5 * 1024 * 1024;

			if (audio.size > maxBytes) {
				throw new Error('Audio file too large');
			}

			return {
				confidence: 0.95,
				duration: 1.1,
				language: 'pt-BR',
				processingTimeMs: 150,
				text: 'comando teste',
				timestamp: new Date(),
			};
		}),
	});

	return {
		SpeechToTextService: vi.fn(() => createMockSTTService()),
		createSTTService: vi.fn(() => createMockSTTService()),
	};
});

// Setup global DOM environment for Vitest
beforeAll(() => {
	// Mock window.matchMedia
	Object.defineProperty(window, 'matchMedia', {
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(), // deprecated
			removeListener: vi.fn(), // deprecated
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
		writable: true,
	});

	// Mock ResizeObserver
	global.ResizeObserver = vi.fn().mockImplementation(() => ({
		disconnect: vi.fn(),
		observe: vi.fn(),
		unobserve: vi.fn(),
	}));

	// Mock localStorage
	const localStorageMock = {
		clear: vi.fn(),
		getItem: vi.fn(),
		removeItem: vi.fn(),
		setItem: vi.fn(),
	};
	Object.defineProperty(globalObj, 'localStorage', {
		value: localStorageMock,
		writable: true,
	});

	// Mock Speech Synthesis API for voice service tests
	const mockSpeechSynthesis = {
		addEventListener: vi.fn(),
		cancel: vi.fn(),
		dispatchEvent: vi.fn(),
		getVoices: vi.fn(() => [
			{
				default: false,
				lang: 'pt-BR',
				localService: false,
				name: 'Google português do Brasil',
				voiceURI: 'Google português do Brasil',
			},
			{
				default: true,
				lang: 'pt-BR',
				localService: true,
				name: 'Microsoft Maria Desktop - Portuguese (Brazil)',
				voiceURI: 'Microsoft Maria Desktop - Portuguese (Brazil)',
			},
		]),
		onvoiceschanged: null,
		pause: vi.fn(),
		paused: false,
		pending: false,
		removeEventListener: vi.fn(),
		resume: vi.fn(),
		speak: vi.fn(),
		speaking: false,
	};

	// Mock Speech Synthesis Utterance
	const mockSpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
		lang: 'pt-BR',
		onboundary: null,
		onend: null,
		onerror: null,
		onmark: null,
		onpause: null,
		onresume: null,
		onstart: null,
		pitch: 1,
		rate: 1,
		text,
		voice: null,
		volume: 1,
	}));

	// Mock Speech Recognition API
	const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
		abort: vi.fn(),
		continuous: false,
		interimResults: false,
		lang: 'pt-BR',
		maxAlternatives: 1,
		onaudioend: null,
		onaudiostart: null,
		onend: null,
		onerror: null,
		onnomatch: null,
		onresult: null,
		onsoundend: null,
		onsoundstart: null,
		onspeechend: null,
		onspeechstart: null,
		onstart: null,
		start: vi.fn(),
		stop: vi.fn(),
	}));

	// Set up global Speech API mocks (avoid redefinition)
	if (!globalObj.SpeechSynthesisUtterance) {
		globalObj.SpeechSynthesisUtterance =
			mockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;
	}
	if (!globalObj.speechSynthesis) {
		globalObj.speechSynthesis =
			mockSpeechSynthesis as unknown as SpeechSynthesis;
	}
	if (!globalObj.SpeechRecognition) {
		globalObj.SpeechRecognition = mockSpeechRecognition;
	}
	if (!globalObj.webkitSpeechRecognition) {
		globalObj.webkitSpeechRecognition = mockSpeechRecognition;
	}

	// Ensure window object has Speech API
	if (typeof window !== 'undefined') {
		window.speechSynthesis = mockSpeechSynthesis;
		window.SpeechSynthesisUtterance = mockSpeechSynthesisUtterance;
		window.SpeechRecognition = mockSpeechRecognition;
		window.webkitSpeechRecognition = mockSpeechRecognition;
	}

	// Mock navigator for tests
	Object.defineProperty(navigator, 'userAgent', {
		value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
		writable: true,
	});

	Object.defineProperty(navigator, 'language', {
		value: 'pt-BR',
		writable: true,
	});

	// Mock screen object for device fingerprinting tests
	globalObj.screen = {
		availHeight: 1040,
		availLeft: 0,
		availTop: 40,
		availWidth: 1920,
		colorDepth: 24,
		height: 1080,
		orientation: {
			angle: 0,
			type: 'landscape-primary',
			onchange: null,
			unlock: () => Promise.resolve(),
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => true,
		} as ScreenOrientation,
		pixelDepth: 24,
		width: 1920,
	} as Screen;

	// Mock window.screen to ensure it's available
	if (typeof window !== 'undefined' && globalObj.screen) {
		window.screen = globalObj.screen;
	}

	// Ensure document.body exists for Testing Library
	if (!document.body) {
		document.body = document.createElement('body');
		document.body.innerHTML = '<div id="root"></div>';
	}

	// Mock AudioContext for voice activity detection tests
	const mockAudioContext = vi.fn().mockImplementation(() => ({
		close: vi.fn(),
		createAnalyser: vi.fn().mockReturnValue({
			connect: vi.fn(),
			fftSize: 2048,
			frequencyBinCount: 2048,
			getByteFrequencyData: vi.fn(),
			getFloatTimeDomainData: vi.fn(),
		}),
		createMediaStreamSource: vi.fn().mockReturnValue({
			connect: vi.fn(),
		}),
		decodeAudioData: vi.fn(),
		destination: {},
		resume: vi.fn(),
		sampleRate: 44100,
		state: 'running',
		suspend: vi.fn(),
	}));

	if (!globalObj.AudioContext) {
		globalObj.AudioContext = mockAudioContext;
	}
	if (!globalObj.webkitAudioContext) {
		globalObj.webkitAudioContext = mockAudioContext;
	}

	// Mock requestAnimationFrame for voice activity detection
	globalObj.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
		return setTimeout(
			() => callback(performance.now()),
			16,
		) as unknown as number;
	});
	globalObj.cancelAnimationFrame = vi.fn((id: number) => {
		clearTimeout(id);
	});

	// Mock fetch for remote logging tests
	global.fetch = vi.fn();

	// Note: Supabase mock is configured at module level below using the comprehensive typed mock
});

// Clean up mocks after each test
afterEach(() => {
	vi.clearAllMocks();
});

// Clean up global stubs after all tests
afterAll(() => {
	// Manual cleanup since vi.unstubAllGlobals() might not be available
	(globalObj as Record<string, unknown>).localStorage = undefined;
	(globalObj as Record<string, unknown>).SpeechSynthesisUtterance = undefined;
	(globalObj as Record<string, unknown>).speechSynthesis = undefined;
	(globalObj as Record<string, unknown>).SpeechRecognition = undefined;
	(globalObj as Record<string, unknown>).webkitSpeechRecognition = undefined;
	(globalObj as Record<string, unknown>).AudioContext = undefined;
	(globalObj as Record<string, unknown>).webkitAudioContext = undefined;
	(globalObj as Record<string, unknown>).requestAnimationFrame = undefined;
	(globalObj as Record<string, unknown>).cancelAnimationFrame = undefined;
});

// Export mock helpers for tests
export const createMockSpeechRecognitionEvent = (
	transcript: string,
	confidence: number = 0.95,
) => ({
	resultIndex: 0,
	results: [
		{
			0: { confidence, transcript },
			isFinal: true,
			length: 1,
		},
	],
});

export const createMockSpeechRecognitionError = (
	error: string,
	message?: string,
) => ({
	error,
	message: message || `Speech recognition error: ${error}`,
});

export const createMockSpeechSynthesisEvent = (
	name: string,
	charIndex: number = 0,
) => ({
	charIndex,
	elapsedTime: 0,
	name,
});

// Make vi available globally for test files that don't import it
if (typeof globalObj.vi === 'undefined') {
	globalObj.vi = vi;
}

// Import MSW server setup
import { resetHandlers, startServer, stopServer } from './mocks/server';

// Setup MSW server before all tests
beforeAll(() => {
	startServer();
});

// Reset handlers between tests
afterEach(() => {
	resetHandlers();
	vi.clearAllMocks();
});

// Stop MSW server after all tests
afterAll(() => {
	stopServer();
});

// Mock Supabase with typed configuration using our comprehensive mock
vi.mock('@/integrations/supabase/client', async () => {
	const { supabaseMock } = await import('./mocks/supabase-mock');
	return {
		supabase: supabaseMock,
	};
});

import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Global test setup for healthcare compliance

// Polyfills for jsdom environment
global.TextEncoder = TextEncoder;
// biome-ignore lint/suspicious/noExplicitAny: Polyfill required for jsdom
global.TextDecoder = TextDecoder as any;

// Mock IntersectionObserver for healthcare components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	disconnect: vi.fn(),
	observe: vi.fn(),
	unobserve: vi.fn(),
}));

// Mock ResizeObserver for responsive healthcare components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	disconnect: vi.fn(),
	observe: vi.fn(),
	unobserve: vi.fn(),
}));

// Mock Web Speech API for Portuguese voice interface testing
export const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
	abort: vi.fn(),
	continuous: false,
	interimResults: false,
	lang: 'pt-BR',
	maxAlternatives: 1,
	onend: null,
	onerror: null,
	onnomatch: null,
	onresult: null,
	onstart: null,
	start: vi.fn(),
	stop: vi.fn(),
}));

global.SpeechRecognition = mockSpeechRecognition;
global.webkitSpeechRecognition = mockSpeechRecognition;

// Mock Speech Synthesis for voice feedback
export const mockSpeechSynthesis = {
	cancel: vi.fn(),
	getVoices: vi.fn(() => [
		{
			default: true,
			lang: 'pt-BR',
			localService: true,
			name: 'Microsoft Maria Desktop - Portuguese (Brazil)',
		},
		{
			default: false,
			lang: 'pt-BR',
			localService: false,
			name: 'Google português do Brasil',
		},
	]),
	pause: vi.fn(),
	paused: false,
	pending: false,
	resume: vi.fn(),
	speak: vi.fn(),
	speaking: false,
	onvoiceschanged: null,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn(() => true),
};

global.speechSynthesis = mockSpeechSynthesis as unknown as SpeechSynthesis;
global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
	lang: 'pt-BR',
	onboundary: null,
	onend: null,
	onerror: null,
	onmark: null,
	onpause: null,
	onresume: null,
	onstart: null,
	pitch: 1.0,
	rate: 1.0,
	text,
	voice: mockSpeechSynthesis.getVoices()[0],
	volume: 1.0,
}));

// Mock MediaDevices for voice recording in healthcare
global.MediaDevices = {
	enumerateDevices: vi.fn().mockResolvedValue([]),
	getUserMedia: vi.fn().mockResolvedValue({
		addEventListener: vi.fn(),
		getTracks: () => [{ stop: vi.fn() }],
		removeEventListener: vi.fn(),
	}),
// biome-ignore lint/suspicious/noExplicitAny: Mocking MediaDevices for tests
} as any;

// Mock navigator for healthcare testing
Object.defineProperty(window, 'navigator', {
	value: {
		...window.navigator,
		mediaDevices: global.MediaDevices,
		serviceWorker: {
			ready: Promise.resolve({
				active: {
					postMessage: vi.fn(),
				},
				register: vi.fn(),
				unregister: vi.fn(),
			}),
		},
	},
	writable: true,
});

// Mock WebSocket for real-time healthcare updates
const MockWebSocket = vi.fn().mockImplementation(() => ({
	close: vi.fn(),
	send: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	readyState: 1, // WebSocket.OPEN
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3,
}));
// Add static constants to the constructor
Object.assign(MockWebSocket, {
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3,
});
global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

// Mock localStorage for healthcare data persistence
export const localStorageMock = {
	clear: vi.fn(),
	getItem: vi.fn(),
	key: vi.fn(),
	length: 0,
	removeItem: vi.fn(),
	setItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
});

// Mock sessionStorage for healthcare session management
export const sessionStorageMock = {
	clear: vi.fn(),
	getItem: vi.fn(),
	key: vi.fn(),
	length: 0,
	removeItem: vi.fn(),
	setItem: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
	value: sessionStorageMock,
});

// Mock fetch API for healthcare service calls
global.fetch = vi.fn();

// Mock URL.createObjectURL for file handling in healthcare
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLCanvasElement for charts and visualizations
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
	arc: vi.fn(),
	beginPath: vi.fn(),
	clearRect: vi.fn(),
	clip: vi.fn(),
	closePath: vi.fn(),
	createImageData: vi.fn(() => ({ data: [] })),
	drawImage: vi.fn(),
	fill: vi.fn(),
	fillRect: vi.fn(),
	fillText: vi.fn(),
	getImageData: vi.fn(() => ({ data: [] })),
	lineTo: vi.fn(),
	measureText: vi.fn(() => ({ width: 0 })),
	moveTo: vi.fn(),
	putImageData: vi.fn(),
	rect: vi.fn(),
	restore: vi.fn(),
	rotate: vi.fn(),
	save: vi.fn(),
	scale: vi.fn(),
	setTransform: vi.fn(),
	stroke: vi.fn(),
	transform: vi.fn(),
	translate: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock getComputedStyle for healthcare styling
global.getComputedStyle = vi.fn(() => ({
	getPropertyValue: vi.fn(),
	setProperty: vi.fn(),
})) as unknown as typeof global.getComputedStyle;

// Mock scrollTo for healthcare navigation
window.scrollTo = vi.fn();

// Mock matchMedia for responsive healthcare design
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

// Mock alert and confirm for healthcare user interactions
window.alert = vi.fn();
window.confirm = vi.fn(() => true);
window.prompt = vi.fn(() => 'test-input');

// Test lifecycle hooks
beforeAll(() => {
	// Set test environment variables
	process.env.VITE_ENVIRONMENT = 'test';
	process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
	process.env.VITE_CLERK_PUBLISHABLE_KEY = 'pk_test_example';

	// Mock console methods for cleaner test output
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	// Clean up after each test for healthcare data isolation
	cleanup();
	vi.clearAllMocks();
	localStorageMock.clear();
	sessionStorageMock.clear();
});

afterAll(() => {
	vi.restoreAllMocks();
});

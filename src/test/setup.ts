import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// Setup de ambiente para testes
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
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
  })

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  vi.stubGlobal('localStorage', localStorageMock)

  // Mock SpeechSynthesis API
  const mockSpeechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => [
      {
        name: 'Google português do Brasil',
        lang: 'pt-BR',
        default: false,
        localService: false,
        voiceURI: 'Google português do Brasil',
      },
    ]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  // Mock SpeechSynthesisUtterance
  const mockSpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
    text,
    lang: 'pt-BR',
    voice: null,
    volume: 1,
    rate: 1,
    pitch: 1,
    onstart: null,
    onend: null,
    onerror: null,
    onmark: null,
    onboundary: null,
    onpause: null,
    onresume: null,
  }))

  vi.stubGlobal('SpeechSynthesisUtterance', mockSpeechSynthesisUtterance)
  vi.stubGlobal('speechSynthesis', mockSpeechSynthesis)

  // Ensure window has speechSynthesis
  if (typeof window !== 'undefined') {
    window.speechSynthesis = mockSpeechSynthesis
    window.SpeechSynthesisUtterance = mockSpeechSynthesisUtterance
  }

  // Enhanced document mock for React Testing Library
  if (typeof document === 'undefined') {
    const mockDocument = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        innerHTML: '',
        textContent: '',
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        getElementsByTagName: vi.fn(() => []),
        getElementsByClassName: vi.fn(() => []),
      },
      createElement: vi.fn((tagName: string) => ({
        tagName: tagName.toUpperCase(),
        innerHTML: '',
        textContent: '',
        style: {},
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getElementsByTagName: vi.fn(() => []),
        getElementsByClassName: vi.fn(() => []),
      })),
      getElementById: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      createTextNode: vi.fn((text: string) => ({
        textContent: text,
        nodeValue: text,
      })),
      documentElement: {
        scrollTop: 0,
        scrollLeft: 0,
        style: {},
      },
      head: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        innerHTML: '',
      },
    }
    ;(globalThis as any).document = mockDocument
    ;(globalThis as any).window = {
      ...(globalThis as any).window,
      document: mockDocument,
    }
  }

  // Ensure document is available globally for React Testing Library
  if (typeof globalThis !== 'undefined' && !globalThis.document) {
    globalThis.document = (globalThis as any).window?.document || {}
  }

  // Also set document on global for older testing libraries
  if (typeof global !== 'undefined' && !global.document) {
    global.document = (globalThis as any).document
  }

  // Ensure window is available
  if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
    ;(globalThis as any).window = (globalThis as any).window || {}
  }
})

// Limpar mocks após cada teste
afterEach(() => {
  vi.clearAllMocks()
})

// Cleanup after all tests
afterAll(() => {
  vi.unstubAllGlobals()
})

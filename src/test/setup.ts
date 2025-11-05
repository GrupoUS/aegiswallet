import '@testing-library/jest-dom'
import { JSDOM } from 'jsdom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// Enhanced DOM environment setup for React Testing Library
// Setup globals immediately at module level using JSDOM
const setupGlobalDOM = () => {
  // Check if we're in a Node environment without proper DOM
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Create a new JSDOM instance if it doesn't exist
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      pretendToBeVisual: true,
      resources: 'usable',
      url: 'http://localhost:3000',
    })

    // Set up global DOM objects
    global.window = dom.window as any
    global.document = dom.window.document
    global.navigator = dom.window.navigator
    global.HTMLElement = dom.window.HTMLElement
    global.Element = dom.window.Element
    global.Node = dom.window.Node
    global.NodeList = dom.window.NodeList
    global.HTMLCollection = dom.window.HTMLCollection
    global.Event = dom.window.Event
    global.MouseEvent = dom.window.MouseEvent
    global.KeyboardEvent = dom.window.KeyboardEvent
    global.TouchEvent = dom.window.TouchEvent
    global.FocusEvent = dom.window.FocusEvent
    global.FormEvent = dom.window.FormEvent
    global.InputEvent = dom.window.InputEvent
    global.DragEvent = dom.window.DragEvent
    global.WheelEvent = dom.window.WheelEvent
    global.ProgressEvent = dom.window.ProgressEvent
    global.StorageEvent = dom.window.StorageEvent
    global.UIEvent = dom.window.UIEvent
    global.MessageEvent = dom.window.MessageEvent
    global.ErrorEvent = dom.window.ErrorEvent
    global.CustomEvent = dom.window.CustomEvent
    global.AnimationEvent = dom.window.AnimationEvent
    global.TransitionEvent = dom.window.TransitionEvent
    global.HashChangeEvent = dom.window.HashChangeEvent
    global.PopStateEvent = dom.window.PopStateEvent
    global.PageTransitionEvent = dom.window.PageTransitionEvent

    // Also set on globalThis
    globalThis.window = dom.window as any
    globalThis.document = dom.window.document
    globalThis.navigator = dom.window.navigator
  }
}

// Execute immediately
console.log('Setting up global DOM environment...')
setupGlobalDOM()
console.log('DOM setup completed. Document:', typeof document, 'Window:', typeof window)

// Enhanced document mock with complete DOM structure (fallback)
if (typeof globalThis.window === 'undefined') {
  // @ts-ignore - global window doesn't exist yet
  globalThis.window = globalThis.window || {}
}

if (typeof globalThis.document === 'undefined') {
  // Create a proper document structure for React Testing Library
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
        toggle: vi.fn(),
      },
      getElementsByTagName: vi.fn(() => []),
      getElementsByClassName: vi.fn(() => []),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      click: vi.fn(),
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
        toggle: vi.fn(),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getElementsByTagName: vi.fn(() => []),
      getElementsByClassName: vi.fn(() => []),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      focus: vi.fn(),
      blur: vi.fn(),
      click: vi.fn(),
      dispatchEvent: vi.fn(),
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
    createComment: vi.fn(),
    documentElement: {
      scrollTop: 0,
      scrollLeft: 0,
      style: {},
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    head: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      innerHTML: '',
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
    },
    title: '',
    readyState: 'complete',
    activeElement: null,
    cookie: '',
    referrer: '',
    URL: 'http://localhost:3000',
    domain: 'localhost',
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
    },
  }

  // Set document globally
  ;(globalThis as any).document = mockDocument
  ;(global as any).document = mockDocument

  // Ensure window.document exists
  if (typeof globalThis.window !== 'undefined') {
    globalThis.window.document = mockDocument
  }
}

// Ensure window is properly configured
if (typeof globalThis.window === 'undefined') {
  ;(globalThis as any).window = {}
  ;(global as any).window = {}
}

// Enhanced navigator mock
if (!globalThis.window.navigator) {
  globalThis.window.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'pt-BR',
    languages: ['pt-BR', 'pt', 'en-US', 'en'],
    platform: 'Win32',
    vendor: 'Google Inc.',
    vendorSub: '',
    maxTouchPoints: 0,
    hardwareConcurrency: 8,
    cookieEnabled: true,
    appCodeName: 'Mozilla',
    appName: 'Netscape',
    appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    onLine: true,
    product: 'Gecko',
    productSub: '20030107',
    getGamepads: vi.fn(() => []),
    getVRDisplays: vi.fn(() => []),
    permissions: {
      query: vi.fn(() => Promise.resolve({ state: 'granted' })),
    },
    geolocation: {
      getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 0, longitude: 0 } })),
      getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 0, longitude: 0 } })),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
  }

  // Execute immediately
  console.log('Setting up global DOM environment...')
  setupGlobalDOM()

// Enhanced navigator mock for all tests
if (!globalThis.window.navigator) {
  ;(globalThis as any).window.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'pt-BR',
    languages: ['pt-BR', 'pt', 'en-US', 'en'],
    platform: 'Win32',
    vendor: 'Google Inc.',
    vendorSub: '',
    maxTouchPoints: 0,
    hardwareConcurrency: 8,
    cookieEnabled: true,
    appCodeName: 'Mozilla',
    appName: 'Netscape',
    appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    onLine: true,
    product: 'Gecko',
    productSub: '20030107',
    getGamepads: vi.fn(() => []),
    getVRDisplays: vi.fn(() => []),
    permissions: {
      query: vi.fn(() => Promise.resolve({ state: 'granted' })),
    },
    geolocation: {
      getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 0, longitude: 0 } })),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
  }
}

// Execute immediately
console.log('Setting up global DOM environment...')
setupGlobalDOM()
console.log('DOM setup completed. Document:', typeof document, 'Window:', typeof window)

beforeAll(() => {
  // DOM globals are already set up at module level
  // Additional test-specific setup continues below

  // Setup de ambiente para testes
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

  // Enhanced DOM setup already handled above - no duplicate code needed
})

// Limpar mocks após cada teste
afterEach(() => {
  vi.clearAllMocks()
})

// Cleanup after all tests
afterAll(() => {
  vi.unstubAllGlobals()
})

import { JSDOM } from 'jsdom'
import { beforeAll, describe, expect, it } from 'vitest'

describe('DOM Environment Test', () => {
  beforeAll(() => {
    // Setup DOM if not available
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        pretendToBeVisual: true,
        resources: 'usable',
        url: 'http://localhost:3000',
      })

      global.window = dom.window as any
      global.document = dom.window.document
      global.navigator = dom.window.navigator
      globalThis.window = dom.window as any
      globalThis.document = dom.window.document
      globalThis.navigator = dom.window.navigator
    }
  })

  it('should have access to document', () => {
    expect(document).toBeDefined()
    expect(document.body).toBeDefined()
  })

  it('should have access to window', () => {
    expect(window).toBeDefined()
    expect(typeof window.addEventListener).toBe('function')
  })

  it('should have access to navigator', () => {
    expect(navigator).toBeDefined()
    expect(typeof navigator.userAgent).toBe('string')
  })
})

import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';

describe('DOM Environment Test', () => {
  beforeAll(() => {
    // Setup DOM if not available
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        pretendToBeVisual: true,
        resources: 'usable',
        url: 'http://localhost:3000',
      });

      const jsdomWindow = dom.window as unknown as typeof globalThis.window;
      global.window = jsdomWindow;
      global.document = jsdomWindow.document;
      global.navigator = jsdomWindow.navigator;
      globalThis.window = jsdomWindow;
      globalThis.document = jsdomWindow.document;
      globalThis.navigator = jsdomWindow.navigator;
    }
  });

  it('should have access to document', () => {
    expect(document).toBeDefined();
    expect(document.body).toBeDefined();
  });

  it('should have access to window', () => {
    expect(window).toBeDefined();
    expect(typeof window.addEventListener).toBe('function');
  });

  it('should have access to navigator', () => {
    expect(navigator).toBeDefined();
    expect(typeof navigator.userAgent).toBe('string');
  });
});

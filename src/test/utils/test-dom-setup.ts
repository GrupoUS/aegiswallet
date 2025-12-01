/**
 * Enhanced DOM setup for React Testing Library compatibility
 * Provides comprehensive DOM polyfills for jsdom environment
 */

import { JSDOM } from 'jsdom';

// Create comprehensive DOM environment
const createDOMEnvironment = () => {
	const dom = new JSDOM(
		'<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div></body></html>',
		{
			pretendToBeVisual: true,
			resources: 'usable',
			url: 'http://localhost:3000',
		},
	);

	return dom;
};

// Set up global environment
export function setupTestDOM(): void {
	// Only setup if DOM doesn't exist
	if (typeof globalThis.document === 'undefined') {
		const dom = createDOMEnvironment();

		// Set comprehensive global properties
		Object.defineProperty(globalThis, 'window', {
			value: dom.window,
			writable: true,
			configurable: true,
		});

		Object.defineProperty(globalThis, 'document', {
			value: dom.window.document,
			writable: true,
			configurable: true,
		});

		Object.defineProperty(globalThis, 'navigator', {
			value: dom.window.navigator,
			writable: true,
			configurable: true,
		});

		// Also set on global (not just globalThis) for Testing Library
		(global as any).window = dom.window;
		(global as any).document = dom.window.document;
		(global as any).navigator = dom.window.navigator;

		// Comprehensive Element prototype patching for React Testing Library
		const patchElementPrototype = (ElementClass: any) => {
			if (ElementClass?.prototype) {
				if (!ElementClass.prototype.scrollIntoView) {
					ElementClass.prototype.scrollIntoView = () => {};
				}
				if (!ElementClass.prototype.getBoundingClientRect) {
					ElementClass.prototype.getBoundingClientRect = () => ({
						bottom: 0,
						height: 0,
						left: 0,
						right: 0,
						top: 0,
						width: 0,
						x: 0,
						y: 0,
					});
				}
			}
		};

		// Patch both Element and HTMLElement if they exist
		if (globalThis.Element) {
			patchElementPrototype(globalThis.Element);
		}
		if (globalThis.HTMLElement) {
			patchElementPrototype(globalThis.HTMLElement);
		}

		// Ensure DOM elements created by JSDOM also have the methods
		const originalCreateElement = dom.window.document.createElement;
		dom.window.document.createElement = function (tagName: string, options?: any) {
			const element = originalCreateElement.call(this, tagName, options) as any;
			if (!element.scrollIntoView) {
				element.scrollIntoView = () => {};
			}
			if (!element.getBoundingClientRect) {
				element.getBoundingClientRect = () => ({
					bottom: 0,
					height: 0,
					left: 0,
					right: 0,
					top: 0,
					width: 0,
					x: 0,
					y: 0,
				});
			}
			return element;
		};

		// Ensure document.body exists
		if (!dom.window.document.body) {
			const body = dom.window.document.createElement('body');
			dom.window.document.body = body;
		}
	}
}

// Export for direct usage
export { createDOMEnvironment };

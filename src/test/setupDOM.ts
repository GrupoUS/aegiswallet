/**
 * Setup DOM environment for React Testing Library
 * This should be imported BEFORE importing React Testing Library
 */

import { JSDOM } from 'jsdom';

// Only setup if DOM is not available
if (typeof window === 'undefined' || typeof document === 'undefined') {
	const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
		pretendToBeVisual: true,
		resources: 'usable',
		url: 'http://localhost:3000',
	});
	const domWindow = dom.window as unknown as Window & typeof globalThis;

	// Set global DOM objects
	global.window = domWindow;
	global.document = domWindow.document;
	global.navigator = domWindow.navigator;
	globalThis.window = domWindow;
	globalThis.document = domWindow.document;
	globalThis.navigator = domWindow.navigator;

	// Additional DOM globals that React Testing Library might need
	global.HTMLElement = domWindow.HTMLElement;
	global.Element = domWindow.Element;
	global.Node = domWindow.Node;
	global.NodeList = domWindow.NodeList;
	global.HTMLCollection = domWindow.HTMLCollection;
	global.Event = domWindow.Event;
	global.MouseEvent = domWindow.MouseEvent;
	global.KeyboardEvent = domWindow.KeyboardEvent;
	global.FocusEvent = domWindow.FocusEvent;

	globalThis.HTMLElement = domWindow.HTMLElement;
	globalThis.Element = domWindow.Element;
	globalThis.Node = domWindow.Node;
	globalThis.NodeList = domWindow.NodeList;
	globalThis.HTMLCollection = domWindow.HTMLCollection;
	globalThis.Event = domWindow.Event;
	globalThis.MouseEvent = domWindow.MouseEvent;
	globalThis.KeyboardEvent = domWindow.KeyboardEvent;
	globalThis.FocusEvent = domWindow.FocusEvent;
}

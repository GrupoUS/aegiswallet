/**
 * Setup DOM environment for React Testing Library
 * This should be imported BEFORE importing React Testing Library
 */

import { JSDOM } from 'jsdom'

// Only setup if DOM is not available
if (typeof window === 'undefined' || typeof document === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    pretendToBeVisual: true,
    resources: 'usable',
    url: 'http://localhost:3000',
  })

  // Set global DOM objects
  global.window = dom.window as any
  global.document = dom.window.document
  global.navigator = dom.window.navigator
  globalThis.window = dom.window as any
  globalThis.document = dom.window.document
  globalThis.navigator = dom.window.navigator

  // Additional DOM globals that React Testing Library might need
  global.HTMLElement = dom.window.HTMLElement
  global.Element = dom.window.Element
  global.Node = dom.window.Node
  global.NodeList = dom.window.NodeList
  global.HTMLCollection = dom.window.HTMLCollection
  global.Event = dom.window.Event
  global.MouseEvent = dom.window.MouseEvent
  global.KeyboardEvent = dom.window.KeyboardEvent
  global.FocusEvent = dom.window.FocusEvent

  globalThis.HTMLElement = dom.window.HTMLElement
  globalThis.Element = dom.window.Element
  globalThis.Node = dom.window.Node
  globalThis.NodeList = dom.window.NodeList
  globalThis.HTMLCollection = dom.window.HTMLCollection
  globalThis.Event = dom.window.Event
  globalThis.MouseEvent = dom.window.MouseEvent
  globalThis.KeyboardEvent = dom.window.KeyboardEvent
  globalThis.FocusEvent = dom.window.FocusEvent
}

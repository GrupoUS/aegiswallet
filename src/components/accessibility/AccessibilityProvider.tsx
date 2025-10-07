'use client'

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

// 1. Define the shape of the context data
interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: (key: keyof AccessibilitySettings, value: boolean | number) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  speak: (text: string) => void
  announce: (text: string) => void
}

// 2. Define the settings interface
interface AccessibilitySettings {
  voiceEnabled: boolean
  voiceVolume: number
  voiceSpeed: number
  highContrast: boolean
  autoReadContent: boolean
  autoReadImages: boolean
  keyboardNavigation: boolean
  screenReaderEnabled: boolean
  announcements: boolean
}

// 3. Create the context with a clear error message for misuse
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// 4. Implement the provider
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    voiceEnabled: true,
    voiceVolume: 0.7,
    voiceSpeed: 1.0,
    highContrast: false,
    autoReadContent: false,
    autoReadImages: true,
    keyboardNavigation: true,
    screenReaderEnabled: true,
    announcements: true,
  })
  const [showSettings, setShowSettings] = useState(false)

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const speak = (text: string) => {
    if (settings.voiceEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'pt-BR'
      utterance.volume = settings.voiceVolume
      utterance.rate = settings.voiceSpeed
      speechSynthesis.speak(utterance)
    }
  }

  const announce = (text: string) => {
    if (settings.announcements) {
      // For screen readers, use an ARIA live region
      // This is a simplified example. A real implementation would
      // likely involve a dedicated component with an aria-live region.
      console.log(`[ANNOUNCEMENT]: ${text}`)
      // A more robust solution:
      const announcementEl = document.getElementById('aria-live-announcer')
      if (announcementEl) {
        announcementEl.textContent = text
      }
    }
  }

  // Add a visually hidden element for aria-live announcements
  useEffect(() => {
    let announcer = document.getElementById('aria-live-announcer')
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'aria-live-announcer'
      announcer.style.position = 'absolute'
      announcer.style.width = '1px'
      announcer.style.height = '1px'
      announcer.style.padding = '0'
      announcer.style.margin = '-1px'
      announcer.style.overflow = 'hidden'
      announcer.style.clip = 'rect(0, 0, 0, 0)'
      announcer.style.whiteSpace = 'nowrap'
      announcer.style.border = '0'
      announcer.setAttribute('aria-live', 'assertive')
      announcer.setAttribute('aria-atomic', 'true')
      document.body.appendChild(announcer)
    }
  }, [])

  const value = {
    settings,
    updateSetting,
    showSettings,
    setShowSettings,
    speak,
    announce,
  }

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

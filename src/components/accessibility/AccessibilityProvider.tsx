import { Eye, Keyboard, Volume2 } from 'lucide-react'
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AccessibilitySettings {
  voiceEnabled: boolean
  voiceVolume: number
  voiceSpeed: number
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  keyboardNavigation: boolean
  screenReaderAnnouncements: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (settings: Partial<AccessibilitySettings>) => void
  speak: (text: string) => void
  announce: (text: string) => void
  showSettings: boolean
  setShowSettings: (show: boolean) => void
}

const defaultSettings: AccessibilitySettings = {
  voiceEnabled: true,
  voiceVolume: 1.0,
  voiceSpeed: 1.0,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  keyboardNavigation: true,
  screenReaderAnnouncements: true,
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [showSettings, setShowSettings] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Failed to load accessibility settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Large text
    if (settings.largeText) {
      root.style.fontSize = '18px'
    } else {
      root.style.fontSize = ''
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--transition-duration', '0.01ms')
      root.classList.add('reduce-motion')
    } else {
      root.style.setProperty('--transition-duration', '')
      root.classList.remove('reduce-motion')
    }
  }, [settings])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle voice with Ctrl+Shift+V
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault()
        updateSettings({ voiceEnabled: !settings.voiceEnabled })
      }

      // Toggle settings with Ctrl+Shift+A
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        setShowSettings(!showSettings)
      }

      // Announce current element with Ctrl+Shift+S
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        const element = document.activeElement
        if (element) {
          const text =
            element.textContent || element.getAttribute('aria-label') || 'Elemento sem texto'
          announce(text)
        }
      }
    }

    if (settings.keyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [settings.keyboardNavigation, settings.voiceEnabled, showSettings])

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const speak = (text: string) => {
    if (!settings.voiceEnabled || !('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = settings.voiceSpeed
    utterance.volume = settings.voiceVolume

    // Get Brazilian Portuguese voice if available
    const voices = window.speechSynthesis.getVoices()
    const brazilianVoice = voices.find(
      (voice) => voice.lang.includes('pt') && voice.lang.includes('BR')
    )

    if (brazilianVoice) {
      utterance.voice = brazilianVoice
    }

    window.speechSynthesis.speak(utterance)
  }

  const announce = (text: string) => {
    if (!settings.screenReaderAnnouncements) return

    // Create a live region for screen reader announcements
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    announcement.textContent = text

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Ensure voices are loaded
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices()
      }
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged
      return () => {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        speak,
        announce,
        showSettings,
        setShowSettings,
      }}
    >
      {children}

      {/* Accessibility Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Configurações de Acessibilidade</h3>

              <div className="space-y-4">
                {/* Voice Settings */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Voz
                  </h4>

                  <div className="flex items-center justify-between">
                    <span>Ativar voz</span>
                    <Button
                      variant={settings.voiceEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                    >
                      {settings.voiceEnabled ? 'Sim' : 'Não'}
                    </Button>
                  </div>

                  {settings.voiceEnabled && (
                    <>
                      <div className="space-y-1">
                        <label className="text-sm">
                          Volume: {Math.round(settings.voiceVolume * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.voiceVolume}
                          onChange={(e) =>
                            updateSettings({ voiceVolume: parseFloat(e.target.value) })
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Velocidade: {settings.voiceSpeed}x</label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={settings.voiceSpeed}
                          onChange={(e) =>
                            updateSettings({ voiceSpeed: parseFloat(e.target.value) })
                          }
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Visual Settings */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Visual
                  </h4>

                  <div className="flex items-center justify-between">
                    <span>Alto contraste</span>
                    <Button
                      variant={settings.highContrast ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                    >
                      {settings.highContrast ? 'Sim' : 'Não'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Texto grande</span>
                    <Button
                      variant={settings.largeText ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ largeText: !settings.largeText })}
                    >
                      {settings.largeText ? 'Sim' : 'Não'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Reduzir movimento</span>
                    <Button
                      variant={settings.reducedMotion ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                    >
                      {settings.reducedMotion ? 'Sim' : 'Não'}
                    </Button>
                  </div>
                </div>

                {/* Navigation Settings */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    Navegação
                  </h4>

                  <div className="flex items-center justify-between">
                    <span>Navegação por teclado</span>
                    <Button
                      variant={settings.keyboardNavigation ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateSettings({ keyboardNavigation: !settings.keyboardNavigation })
                      }
                    >
                      {settings.keyboardNavigation ? 'Sim' : 'Não'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Anúncios para leitor de tela</span>
                    <Button
                      variant={settings.screenReaderAnnouncements ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateSettings({
                          screenReaderAnnouncements: !settings.screenReaderAnnouncements,
                        })
                      }
                    >
                      {settings.screenReaderAnnouncements ? 'Sim' : 'Não'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button onClick={() => setShowSettings(false)} className="flex-1">
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => speak('Configurações de acessibilidade salvas com sucesso')}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </AccessibilityContext.Provider>
  )
}

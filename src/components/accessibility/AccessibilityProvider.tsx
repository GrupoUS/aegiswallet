import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardMode: boolean;
  voiceNavigation: boolean;
  announceChanges: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  isKeyboardUser: boolean;
  showSettings: boolean;
  setShowSettings: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    announceChanges: true,
    highContrast: false,
    keyboardMode: false,
    largeText: false,
    reducedMotion: false,
    screenReaderMode: false,
    voiceNavigation: false,
  });

  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  // Detect user's accessibility preferences from system
  useEffect(() => {
    // Detect high contrast mode
    const highContrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
    setSettings((prev) => ({
      ...prev,
      highContrast: highContrastMediaQuery.matches,
    }));

    // Detect reduced motion preference
    const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSettings((prev) => ({
      ...prev,
      reducedMotion: reducedMotionMediaQuery.matches,
    }));

    // Detect if screen reader is being used
    const detectScreenReader = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenReaderPatterns = [/nvda/, /jaws/, /voiceover/, /talkback/, /chromevox/];

      const hasScreenReader = screenReaderPatterns.some((pattern) => pattern.test(userAgent));
      setSettings((prev) => ({ ...prev, screenReaderMode: hasScreenReader }));
    };

    detectScreenReader();

    // Listen for changes in system preferences
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({ ...prev, highContrast: e.matches }));
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({ ...prev, reducedMotion: e.matches }));
    };

    highContrastMediaQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionMediaQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastMediaQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionMediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Detect keyboard navigation usage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only detect keyboard usage for actual navigation keys
      const navigationKeys = [
        'Tab',
        'Enter',
        'Space',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Escape',
      ];
      if (navigationKeys.includes(e.key)) {
        setIsKeyboardUser(true);
        setSettings((prev) => ({ ...prev, keyboardMode: true }));
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const html = document.documentElement;

    // Apply CSS classes for accessibility settings
    html.classList.toggle('high-contrast', settings.highContrast);
    html.classList.toggle('large-text', settings.largeText);
    html.classList.toggle('reduce-motion', settings.reducedMotion);
    html.classList.toggle('keyboard-navigation', settings.keyboardMode);
    html.classList.toggle('voice-navigation', settings.voiceNavigation);

    // Add Brazilian accessibility attributes
    html.setAttribute('lang', 'pt-BR');
    html.setAttribute('xml:lang', 'pt-BR');

    // Add accessibility metadata for Brazilian e-MAG compliance
    const existingMeta = document.querySelector('meta[name="eMAG-compliance"]');
    if (!existingMeta) {
      const meta = document.createElement('meta');
      meta.name = 'eMAG-compliance';
      meta.content = 'Modelo de Acessibilidade para Governo Eletrônico - Versão 3.1';
      document.head.appendChild(meta);
    }

    // Add WCAG compliance meta
    const wcagMeta = document.querySelector('meta[name="wcag-compliance"]');
    if (!wcagMeta) {
      const meta = document.createElement('meta');
      meta.name = 'wcag-compliance';
      meta.content = 'WCAG 2.1 AA';
      document.head.appendChild(meta);
    }
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Save to localStorage for persistence
    try {
      const savedSettings = JSON.parse(
        localStorage.getItem('aegis-accessibility-settings') || '{}'
      );
      savedSettings[key] = value;
      localStorage.setItem('aegis-accessibility-settings', JSON.stringify(savedSettings));
    } catch (_error) {}
  };

  // Load saved settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('aegis-accessibility-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (_error) {}
  }, []);

  // Screen reader announcements
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announceChanges || !settings.screenReaderMode) {
      return;
    }

    // Create or get announcement element
    let announcementElement = document.getElementById('screen-reader-announcements');
    if (!announcementElement) {
      announcementElement = document.createElement('div');
      announcementElement.id = 'screen-reader-announcements';
      announcementElement.setAttribute('aria-live', priority);
      announcementElement.setAttribute('aria-atomic', 'true');
      announcementElement.className = 'sr-only';
      document.body.appendChild(announcementElement);
    }

    // Update announcement
    announcementElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcementElement) {
        announcementElement.textContent = '';
      }
    }, 1000);
  };

  const [showSettings, setShowSettings] = useState(false);

  const value: AccessibilityContextType = {
    announceToScreenReader,
    isKeyboardUser,
    showSettings,
    setShowSettings,
    settings,
    updateSetting,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Utility component for accessibility announcements
interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export function ScreenReaderAnnouncement({
  message,
  priority = 'polite',
}: ScreenReaderAnnouncementProps) {
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    announceToScreenReader(message, priority);
  }, [message, priority, announceToScreenReader]);

  return null; // This component only makes announcements, doesn't render anything
}

// Skip navigation link component for accessibility
export function SkipToMainContent() {
  return (
    <button
      type="button"
      onClick={() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      }}
      aria-label="Pular para o conteúdo principal"
    >
      Pular para o conteúdo principal
    </button>
  );
}

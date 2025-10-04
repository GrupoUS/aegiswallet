# Assistente Financeiro Autônomo - Design System

## Overview

This design system defines the visual and interaction patterns for "Assistente Financeiro Autônomo", a revolutionary voice-first financial assistant for the Brazilian market. The system balances minimal visual interface with sophisticated feedback patterns that convey AI autonomy while building user trust.

## Philosophy

**GPS Financeiro + Smart Home Metaphor**: Users navigate their financial landscape with an AI assistant that anticipates needs and manages autonomously, similar to a smart home system that learns and adapts.

**Voice-First, Visual-Support**: Primary interaction through voice commands with visual elements serving as confirmation, feedback, and emergency access.

**Trust Through Transparency**: Visual elements show AI activity without overwhelming users, building confidence through controlled disclosure of autonomous operations.

## Color System

### Primary Palette - Brazilian Trust & Security

```css
/* Primary - Trust Blue (inspired by Brazilian banking security) */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6; /* Primary brand color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;

/* Secondary - Prosperity Green (Brazilian real accent) */
--secondary-50: #f0fdf4;
--secondary-100: #dcfce7;
--secondary-200: #bbf7d0;
--secondary-300: #86efac;
--secondary-400: #4ade80;
--secondary-500: #22c55e; /* Success/prosperity */
--secondary-600: #16a34a;
--secondary-700: #15803d;
--secondary-800: #166534;
--secondary-900: #14532d;

/* Accent - Brazilian Sunset (warm, energetic) */
--accent-50: #fef7ee;
--accent-100: #fdecd7;
--accent-200: #fbd9a9;
--accent-300: #f7bb6c;
--accent-400: #f59e0b;
--accent-500: #f59e0b; /* Voice activation highlight */
--accent-600: #d97706;
--accent-700: #b45309;
--accent-800: #92400e;
--accent-900: #78350f;
```

### Semantic Colors

```css
/* Financial Status Colors */
--success: #22c55e;    /* Positive balance, received money */
--warning: #f59e0b;    /* Attention needed, pending */
--danger: #ef4444;     /* Negative balance, urgent */
--info: #3b82f6;       /* Information, neutral */

/* Brazilian Financial System Colors */
--pix-green: #00bfa5;   /* Pix instant payment */
--boleto-blue: #1565c0; /* Boleto traditional */
--transfer-purple: #7c3aed; /* Money transfers */

/* Voice Interface Colors */
--voice-active: #f59e0b;     /* Voice listening */
--voice-processing: #3b82f6; /* AI thinking */
--voice-complete: #22c55e;   /* Command completed */
```

## Typography System

### Font Hierarchy

```css
/* Primary Font - Inter (modern, trustworthy, highly legible) */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Display Typography - Screen Titles & Major Headlines */
--display-large: 48px / 56px;
--display-medium: 36px / 44px;
--display-small: 28px / 36px;

/* Headline Typography - Section Headers */
--headline-large: 24px / 32px;
--headline-medium: 20px / 28px;
--headline-small: 18px / 24px;

/* Body Typography - Content Text */
--body-large: 16px / 24px;
--body-medium: 14px / 20px;
--body-small: 12px / 16px;

/* Label Typography - UI Elements */
--label-large: 14px / 20px;
--label-medium: 12px / 16px;
--label-small: 10px / 14px;
```

### Font Weights

```css
--font-weight-thin: 100;
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

## Spacing System

### Scale (8pt base system)

```css
--spacing-0: 0px;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-20: 80px;
--spacing-24: 96px;
```

### Component Spacing

```css
/* Container Padding */
--container-padding: var(--spacing-6);
--screen-padding: var(--spacing-4);

/* Component Gaps */
--component-gap-small: var(--spacing-2);
--component-gap-medium: var(--spacing-4);
--component-gap-large: var(--spacing-6);

/* Touch Targets (WCAG 2.1 AA+ compliance) */
--touch-target-small: 44px;
--touch-target-medium: 48px;
--touch-target-large: 56px;
```

## Component System

### Voice Interface Components

#### Voice Activation Indicator
```typescript
interface VoiceActivationIndicator {
  state: 'idle' | 'listening' | 'processing' | 'responding';
  confidence?: number;
  visualFeedback: boolean;
}

// Visual States
const voiceStates = {
  idle: { color: '--neutral-400', animation: 'pulse-slow' },
  listening: { color: '--voice-active', animation: 'pulse-fast' },
  processing: { color: '--voice-processing', animation: 'rotate' },
  responding: { color: '--voice-complete', animation: 'fade-in' }
};
```

#### AI Status Display
```typescript
interface AIStatusDisplay {
  isWorking: boolean;
  currentTask?: string;
  completedTasks: string[];
  trustLevel: 'high' | 'medium' | 'low';
}
```

### Financial Components

#### Balance Card
```typescript
interface BalanceCard {
  currentBalance: number;
  availableBalance: number;
  projectedBalance: number;
  currency: 'BRL';
  trustIndicator: number; // 0-100
}
```

#### Transaction Status Indicator
```typescript
interface TransactionStatus {
  type: 'pix' | 'boleto' | 'transfer' | 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed' | 'scheduled';
  amount: number;
  date: Date;
  confidence: number; // AI confidence in categorization
}
```

### Navigation Components

#### Quick Command Bar
```typescript
interface QuickCommandBar {
  commands: VoiceCommand[];
  isVoiceActive: boolean;
  accessibilityMode: boolean;
}
```

#### Emergency Access Menu
```typescript
interface EmergencyAccess {
  visualOnlyMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  emergencyContacts: Contact[];
}
```

## Animation System

### Voice Interface Animations

```css
/* Voice Listening Pulse */
@keyframes voice-listening {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* AI Processing Spinner */
@keyframes ai-thinking {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Confidence Wave */
@keyframes confidence-wave {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
}

/* Trust Building Progress */
@keyframes trust-progress {
  0% { width: 0%; }
  100% { width: var(--trust-level); }
}
```

### Animation Durations

```css
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 1000ms;

/* Easing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## Accessibility Standards (WCAG 2.1 AA+)

### Color Contrast Ratios
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: 4.5:1 minimum
- Voice feedback indicators: 7:1 minimum

### Touch Target Sizes
- Minimum touch target: 44x44px
- Recommended touch target: 48x48px
- Voice activation area: 80x80px minimum

### Screen Reader Support
- All voice commands have text equivalents
- AI status announcements available
- Financial data read in Portuguese (BR)
- Emergency mode with enhanced audio cues

### Motion & Animation
- Respect `prefers-reduced-motion`
- Critical animations persist (voice feedback)
- Optional motion settings available
- High contrast mode support

## Brazilian Cultural Adaptations

### Financial Symbols
- **R$** symbol prominently displayed
- **Pix** green color (#00bfa5) for instant payments
- **Boleto** traditional blue (#1565c0) for bills
- **Transferência** purple (#7c3aed) for money movement

### Trust Indicators
- Security seals and certifications
- Brazilian banking partnership badges
- Real-time protection indicators
- AI transparency disclosures

### Date & Time Formatting
- Brazilian Portuguese (pt-BR)
- DD/MM/YYYY date format
- BRL currency formatting
- 24-hour time format

## shadcn/ui Integration

### Component Mapping

```typescript
// Core UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';

// Voice Components
import { VoiceIndicator } from '@/components/voice/indicator';
import { AIStatus } from '@/components/ai/status';
import { CommandHistory } from '@/components/voice/history';

// Financial Components
import { BalanceDisplay } from '@/components/financial/balance';
import { TransactionItem } from '@/components/financial/transaction';
import { PaymentMethod } from '@/components/financial/payment';

// Navigation Components
import { QuickActions } from '@/components/navigation/quick-actions';
import { EmergencyMenu } from '@/components/navigation/emergency';
```

### Theme Configuration

```typescript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brazilian Financial Colors
        primary: { /* Trust Blue palette */ },
        secondary: { /* Prosperity Green palette */ },
        accent: { /* Brazilian Sunset palette */ },
        
        // Financial System Colors
        pix: '#00bfa5',
        boleto: '#1565c0',
        transfer: '#7c3aed',
        
        // Voice Interface Colors
        voice: {
          active: '#f59e0b',
          processing: '#3b82f6',
          complete: '#22c55e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'voice-listening': 'voice-listening 1.5s ease-in-out infinite',
        'ai-thinking': 'ai-thinking 2s linear infinite',
        'confidence-wave': 'confidence-wave 1s ease-in-out infinite',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

## Implementation Guidelines

### Voice-First Implementation Priority
1. **Voice Activation**: Always visible, always accessible
2. **Status Feedback**: Clear AI activity indicators
3. **Trust Building**: Progressive disclosure of AI capabilities
4. **Emergency Access**: Visual-only mode always available

### Performance Considerations
- Voice response time < 500ms for immediate feedback
- AI thinking animation max 3 seconds before timeout
- Offline mode for critical financial information
- Progressive loading for financial data

### Security Integration
- Biometric authentication for sensitive operations
- Voice biometric for command authorization
- Real-time fraud detection indicators
- Secure enclave for financial data storage

This design system provides the foundation for a revolutionary voice-first financial assistant that builds trust through transparent AI autonomy while respecting Brazilian cultural patterns and accessibility requirements.
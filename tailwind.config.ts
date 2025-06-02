import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import daisyui from 'daisyui';

const config: Config = {
  darkMode: ['class'], // Habilitar dark mode via classe
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores base do Horizon UI (inferidas das chamadas ao Figma)
        'horizon-primary': '#4318FF', // Tom mais escuro do gradiente, bom para primário
        'horizon-secondary': '#868CFF', // Tom mais claro do gradiente, bom para secundário
        'horizon-blue-dark': '#052CC9', // Azul da página de introdução
        
        'horizon-background-light': '#FFFFFF',
        'horizon-background-dark': '#0B1437',
        'horizon-sidebar-dark': '#111C44',
        
        'horizon-text-light-primary': '#2B3674',
        'horizon-text-light-secondary': '#A3AED0',
        'horizon-text-light-tertiary': '#707EAE',
        
        'horizon-separator-light': '#E9EDF7',
        'horizon-success-bg': '#C9FBD5',

        // Cores padrão do Tailwind que podem ser úteis
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))', // Será sobrescrito pelo tema Horizon
        foreground: 'hsl(var(--foreground))', // Será sobrescrito pelo tema Horizon
        primary: {
          DEFAULT: 'hsl(var(--primary))', // Será sobrescrito pelo tema Horizon
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))', // Será sobrescrito pelo tema Horizon
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'], // DM Sans como principal
        jakarta: ['Plus Jakarta Display', 'sans-serif'], // Plus Jakarta Display como secundária
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    tailwindcssAnimate, 
    daisyui
  ],
  // Configuração do DaisyUI (opcional, mas o Horizon UI pode ter temas compatíveis)
  daisyui: {
    themes: [
      {
        light: { // Definindo um tema light customizado com base no Horizon
          'primary': '#4318FF',
          'secondary': '#868CFF',
          'accent': '#37CDBE', // Cor de acento genérica, ajustar se encontrarmos no Figma
          'neutral': '#2B3674', // Texto primário como neutro
          'base-100': '#FFFFFF', // Fundo principal
          'info': '#707EAE',
          'success': '#10B981', // Cor de sucesso observada
          'warning': '#FBBD23',
          'error': '#F87272',

          '--rounded-box': '1rem', // Exemplo de variável de tema
          '--rounded-btn': '0.5rem', 
          '--rounded-badge': '1.9rem',
        },
      },
      {
        dark: { // Definindo um tema dark customizado com base no Horizon
          'primary': '#868CFF', // Invertendo primária/secundária para contraste
          'secondary': '#4318FF',
          'accent': '#37CDBE',
          'neutral': '#A3AED0', // Texto secundário light como neutro no dark
          'base-100': '#0B1437', // Fundo principal dark
          'base-200': '#111C44', // Fundo sidebar dark
          'info': '#A3AED0',
          'success': '#10B981',
          'warning': '#FBBD23',
          'error': '#F87272',
        },
      },
    ],
    darkTheme: 'dark', // Habilitar tema dark do DaisyUI
    base: true,
    styled: true,
    utils: true,
    prefix: '', // Sem prefixo para classes DaisyUI (ex: btn em vez de du-btn)
    logs: true, 
  },
};

export default config;

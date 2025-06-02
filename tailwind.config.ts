import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // As definições de cores HSL do shadcn/ui foram removidas.
      // As cores agora são primariamente gerenciadas pelo tema daisyUI.
      // Podemos adicionar cores personalizadas aqui se necessário, que não se encaixam no sistema de temas do daisyUI.
      borderRadius: {
        lg: "var(--radius)", // Esta variável --radius vinha do tema shadcn. Pode precisar ser redefinida ou removida.
        md: "calc(var(--radius) - 2px)", // Idem.
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: { // Adicionando a fonte Plus Jakarta Sans à configuração do Tailwind
        sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("daisyui")
  ],
  daisyui: {
    themes: [
      {
        horizon: { // Tema AegisWallet baseado no Horizon UI
          "primary": "#052CC9",          // Azul Horizon (principal)
          "primary-content": "#FFFFFF",   // Texto sobre o primário (branco)
          "secondary": "#4A5568",        // Cinza escuro para secundário (ajustar com Horizon)
          "secondary-content": "#FFFFFF",
          "accent": "#38B2AC",           // Teal para acento (ajustar com Horizon)
          "accent-content": "#FFFFFF",
          "neutral": "#1A202C",          // Cinza bem escuro para neutro (ajustar com Horizon)
          "neutral-content": "#FFFFFF",
          "base-100": "#F7FAFC",         // Fundo principal claro (ajustar com Horizon)
          "base-200": "#EDF2F7",
          "base-300": "#E2E8F0",
          "base-content": "#2D3748",     // Conteúdo de texto principal
          "info": "#007BFF",
          "info-content": "#FFFFFF",
          "success": "#28A745",
          "success-content": "#FFFFFF",
          "warning": "#FFC107",
          "warning-content": "#212529",
          "error": "#DC3545",
          "error-content": "#FFFFFF",

          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
      "light", // Manter o tema light padrão do daisyUI como fallback
      // "dark", // Removido temporariamente para forçar o tema horizon
               // ou criar um tema horizon-dark dedicado
    ],
    darkTheme: "horizon", // Usará 'horizon' para modo escuro. Idealmente, criar um 'horizon-dark'.
    base: true,
    styled: true,
    utils: true,
    logs: true,
  },
} satisfies Config;

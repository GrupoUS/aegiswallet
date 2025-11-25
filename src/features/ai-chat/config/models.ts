export const GEMINI_MODELS = {
  FLASH_LITE: 'gemini-flash-lite-latest',
  FLASH: 'gemini-1.5-flash',
  FLASH_8B: 'gemini-1.5-flash-8b',
  PRO: 'gemini-1.5-pro',
  PRO_EXPERIMENTAL: 'gemini-exp-1206',
} as const;

export type GeminiModel = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS];

export interface ModelOption {
  id: GeminiModel;
  name: string;
  description: string;
  speed: 'fastest' | 'fast' | 'balanced' | 'thorough';
  cost: 'lowest' | 'low' | 'medium' | 'high';
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: GEMINI_MODELS.FLASH_LITE,
    name: 'Gemini Flash Lite (Latest)',
    description: 'Versão mais leve e rápida sempre atualizada',
    speed: 'fastest',
    cost: 'lowest',
  },
  {
    id: GEMINI_MODELS.FLASH,
    name: 'Gemini 1.5 Flash',
    description: 'Equilibrado entre velocidade e qualidade',
    speed: 'fast',
    cost: 'low',
  },
  {
    id: GEMINI_MODELS.FLASH_8B,
    name: 'Gemini 1.5 Flash 8B',
    description: 'Modelo compacto e eficiente',
    speed: 'fast',
    cost: 'lowest',
  },
  {
    id: GEMINI_MODELS.PRO,
    name: 'Gemini 1.5 Pro',
    description: 'Melhor qualidade para tarefas complexas',
    speed: 'balanced',
    cost: 'medium',
  },
  {
    id: GEMINI_MODELS.PRO_EXPERIMENTAL,
    name: 'Gemini Experimental (Latest)',
    description: 'Versão experimental mais recente',
    speed: 'thorough',
    cost: 'high',
  },
];

export const DEFAULT_MODEL = GEMINI_MODELS.FLASH_LITE;

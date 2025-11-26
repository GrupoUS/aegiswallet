export const GEMINI_MODELS = {
  FLASH_LITE: 'gemini-flash-lite-latest',
  FLASH: 'gemini-flash-latest',
  PRO: 'gemini-3-pro-preview',
} as const;

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

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
    name: 'Gemini Flash Lite',
    description: 'Versão mais leve e rápida sempre atualizada',
    speed: 'fastest',
    cost: 'lowest',
  },
  {
    id: GEMINI_MODELS.FLASH,
    name: 'Gemini Flash',
    description: 'Equilibrado entre velocidade e qualidade',
    speed: 'fast',
    cost: 'low',
  },
  {
    id: GEMINI_MODELS.PRO,
    name: 'Gemini Pro',
    description: 'Melhor qualidade para tarefas complexas',
    speed: 'balanced',
    cost: 'medium',
  },
];

export const DEFAULT_MODEL = GEMINI_MODELS.FLASH_LITE;

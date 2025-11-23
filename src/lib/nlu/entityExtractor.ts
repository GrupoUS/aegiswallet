/**
 * Entity Extraction for Brazilian Portuguese
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Extracts entities from text:
 * - Money amounts (R$ 100, cem reais)
 * - Dates (hoje, amanhã, próxima sexta)
 * - Names (João, Maria Silva)
 * - Categories (energia, água, internet)
 *
 * @module nlu/entityExtractor
 */

import type { EntityPattern, ExtractedEntity } from '@/lib/nlu/types';
import { EntityType } from '@/lib/nlu/types';

// ============================================================================
// Number Words Mapping (Brazilian Portuguese)
// ============================================================================

const NUMBER_WORDS: Record<string, number> = {
  cem: 100,
  cento: 100,
  cinco: 5,
  cinquenta: 50,
  dez: 10,
  dezenove: 19,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dois: 2,
  doze: 12,
  duas: 2,
  duzentos: 200,
  mil: 1000,
  milhao: 1000000,
  milhão: 1000000,
  nove: 9,
  novecentos: 900,
  noventa: 90,
  oitenta: 80,
  oito: 8,
  oitocentos: 800,
  onze: 11,
  quarenta: 40,
  quatorze: 14,
  quatro: 4,
  quatrocentos: 400,
  quinhentos: 500,
  quinze: 15,
  seis: 6,
  seiscentos: 600,
  sessenta: 60,
  sete: 7,
  setecentos: 700,
  setenta: 70,
  tres: 3,
  treze: 13,
  trezentos: 300,
  trinta: 30,
  três: 3,
  um: 1,
  uma: 1,
  vinte: 20,
  zero: 0,
};

// ============================================================================
// Helper Functions
// ============================================================================

const NORMALIZE_DIACRITICS_REGEX = /[\u0300-\u036f]/g;

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(NORMALIZE_DIACRITICS_REGEX, '');
}

const NUMBER_WORD_NORMALIZED_MAP = new Map<string, number>();

Object.entries(NUMBER_WORDS).forEach(([word, value]) => {
  NUMBER_WORD_NORMALIZED_MAP.set(normalizeText(word), value);
});

const NUMBER_WORD_NORMALIZED_KEYS = Array.from(NUMBER_WORD_NORMALIZED_MAP.keys()).sort(
  (a, b) => b.length - a.length
);

const NUMBER_WORD_AMOUNT_PATTERN = new RegExp(
  String.raw`\b(${NUMBER_WORD_NORMALIZED_KEYS.join('|')})(?:\s+e\s+(${NUMBER_WORD_NORMALIZED_KEYS.join('|')}))*\b(?:\s+(reais?|real))?`,
  'gi'
);

const PLAIN_NUMBER_PATTERN = /\b\d{1,4}(?:\.\d{3})*(?:,\d{2})?\b/gi;

const WEEKDAY_MAP: Record<string, number> = {
  domingo: 0,
  quarta: 3,
  quinta: 4,
  sabado: 6,
  segunda: 1,
  sexta: 5,
  terca: 2,
};

function parseNumberWordPhrase(phrase: string): number {
  const cleaned = normalizeText(phrase)
    .replace(/\b(reais?|real)\b/gi, '')
    .trim();
  if (!cleaned) {
    return NaN;
  }

  const tokens = cleaned.split(/\s+e\s+|\s+/).filter((token) => token.length > 0);
  const values = tokens.map((token) => NUMBER_WORD_NORMALIZED_MAP.get(token));

  if (values.some((value) => typeof value !== 'number')) {
    return NaN;
  }

  return (values as number[]).reduce((sum, value) => sum + value, 0);
}

function parseMonetaryValue(raw: string): number {
  // Check if this is a date reference (e.g., "dia 15")
  if (/^\s*dia\s+\d+/i.test(raw)) {
    return NaN;
  }

  const cleaned = raw
    .replace(/R\$\s*/gi, '')
    .replace(/(reais?|real)/gi, '')
    .replace(/\s+/g, '');
  let normalized = cleaned;

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/\./g, '');
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

function daysFromToday(offset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

function getUpcomingWeekday(weekday: string, allowToday = true): Date {
  const normalized = normalizeText(weekday.replace('-feira', ''));
  const dayIndex = WEEKDAY_MAP[normalized];
  const today = new Date();

  if (dayIndex === undefined) {
    return today;
  }

  const currentDay = today.getDay();
  let delta = (dayIndex - currentDay + 7) % 7;
  if (delta === 0 && !allowToday) {
    delta = 7;
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + delta);
  return targetDate;
}

function setDayOfMonth(day: number): Date {
  const date = new Date();
  date.setDate(day);
  return date;
}

function setMonthOffset(offset: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return date;
}
// ============================================================================
// Entity Patterns
// ============================================================================

const ENTITY_PATTERNS: EntityPattern[] = [
  // Money amounts
  {
    normalizer: (match) => parseMonetaryValue(match),
    pattern: /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi,
    type: EntityType.AMOUNT,
  },
  {
    normalizer: (match) => parseMonetaryValue(match),
    pattern: /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)\s*(reais?|real)/gi,
    type: EntityType.AMOUNT,
  },
  {
    normalizer: (match) => parseNumberWordPhrase(match),
    pattern: NUMBER_WORD_AMOUNT_PATTERN,
    type: EntityType.AMOUNT,
  },
  {
    normalizer: (match) => parseMonetaryValue(match),
    pattern: PLAIN_NUMBER_PATTERN,
    type: EntityType.AMOUNT,
  },
  // Dates
  {
    normalizer: () => new Date(),
    pattern: /\b(hoje|agora)\b/gi,
    type: EntityType.DATE,
  },
  {
    normalizer: () => daysFromToday(-1),
    pattern: /\b(ontem)\b/gi,
    type: EntityType.DATE,
  },
  {
    normalizer: () => daysFromToday(-2),
    pattern: /\b(anteontem)\b/gi,
    type: EntityType.DATE,
  },
  {
    normalizer: () => daysFromToday(1),
    pattern: /amanha|amanh[ãÃ]/gi,
    type: EntityType.DATE,
  },
  {
    normalizer: (match) => {
      const weekday = match.replace(/^(?:proxima|pr[\u00f3o]xima)\s+/i, '').replace(/-feira$/i, '');
      return getUpcomingWeekday(weekday, false);
    },
    pattern:
      /\b(?:proxima|pr[\u00f3o]xima)\s+(segunda|ter[\u00e7c]a|quarta|quinta|sexta|s[\u00e1a]bado|domingo)(?:-feira)?\b/gi,
    type: EntityType.DATE,
  },
  {
    normalizer: (match) => getUpcomingWeekday(match, true),
    pattern: /\b(segunda|ter[\u00e7c]a|quarta|quinta|sexta|s[\u00e1a]bado)(?:-feira)?\b/gi,
    type: EntityType.DATE,
  },
  {
    normalizer: (_match, day) => setDayOfMonth(Number(day)),
    pattern: /\bdia\s+(\d{1,2})\b/gi,
    type: EntityType.DATE,
  },
  {
    normalizer: () => setMonthOffset(-1),
    pattern: /\b(m[\u00ea\u00e9e]s\s+passado)\b/gi,
    type: EntityType.DATE,
  },
  // Bill types / Categories
  {
    normalizer: () => 'energia',
    pattern: /\b(energia|luz|eletrica|elétrica)\b/gi,
    type: EntityType.BILL_TYPE,
  },
  {
    normalizer: () => 'agua',
    pattern: /agua|[áÁ]gua/gi,
    type: EntityType.BILL_TYPE,
  },
  {
    normalizer: () => 'internet',
    pattern: /\b(internet|wifi|banda\s+larga)\b/gi,
    type: EntityType.BILL_TYPE,
  },
  {
    normalizer: () => 'telefone',
    pattern: /\b(telefone|celular|fone)\b/gi,
    type: EntityType.BILL_TYPE,
  },
  {
    normalizer: () => 'gas',
    pattern: /\b(gas|gás)\b/gi,
    type: EntityType.BILL_TYPE,
  },
  {
    normalizer: () => 'aluguel',
    pattern: /\b(aluguel|aluguer)\b/gi,
    type: EntityType.BILL_TYPE,
  },
  // Categories
  {
    normalizer: () => 'mercado',
    pattern: /\b(mercado|supermercado|compras)\b/gi,
    type: EntityType.CATEGORY,
  },
  {
    normalizer: () => 'transporte',
    pattern: /\b(transporte|uber|taxi|gasolina|combustivel|combust[\u00edi]vel)\b/gi,
    type: EntityType.CATEGORY,
  },
  {
    normalizer: () => 'saude',
    pattern: /\b(saude|sa[\u00fade]|medico|m[\u00e9e]dico|farmacia|farm[\u00e1a]cia)\b/gi,
    type: EntityType.CATEGORY,
  },
  {
    normalizer: () => 'lazer',
    pattern: /\b(lazer|entretenimento|diversao|divers[\u00e3a]o)\b/gi,
    type: EntityType.CATEGORY,
  },
  // Periods
  {
    normalizer: () => 'month',
    pattern: /\b(mes|mês|mensal)\b/gi,
    type: EntityType.PERIOD,
  },
  {
    normalizer: () => 'week',
    pattern: /\b(semana|semanal)\b/gi,
    type: EntityType.PERIOD,
  },
  {
    normalizer: () => 'year',
    pattern: /\b(ano|anual)\b/gi,
    type: EntityType.PERIOD,
  },
  {
    normalizer: () => 'day',
    pattern: /\b(dia|diario|diário)\b/gi,
    type: EntityType.PERIOD,
  },

  // Recipient (specific context "para ...")
  {
    normalizer: (match) => match.replace(/^(?:para|pra|pro|a)(?:\s+(?:o|a|os|as))?\s+/i, '').trim(),
    pattern:
      /\b(?:para|pra|pro|a)(?:\s+(?:o|a|os|as))?\s+([a-zàáâãéêíóôõúç]+(?:\s+[a-zàáâãéêíóôõúç]+)*)\b/gi,
    type: EntityType.RECIPIENT,
  },

  // Person names (simple pattern - capitalized words)
  {
    normalizer: (match) => match.trim(),
    pattern:
      /\b([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+(?:\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+)*)\b/g,
    type: EntityType.PERSON,
  },
];

// ============================================================================
// Entity Extractor Class
// ============================================================================

export class EntityExtractor {
  /**
   * Extract all entities from text
   */
  extract(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    for (const pattern of ENTITY_PATTERNS) {
      const matches = this.extractWithPattern(text, pattern);
      entities.push(...matches);
    }

    // Remove duplicates and overlapping entities
    return this.deduplicateEntities(entities);
  }

  /**
   * Extract entities using a specific pattern
   */
  private extractWithPattern(text: string, pattern: EntityPattern): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const regex = pattern.pattern instanceof RegExp ? pattern.pattern : new RegExp(pattern.pattern);
    let match: RegExpExecArray | null;

    // Reset regex lastIndex for global regexes
    regex.lastIndex = 0;

    match = regex.exec(text);
    while (match !== null) {
      try {
        const value = match[0];
        const normalizedValue = pattern.normalizer(value);
        if (normalizedValue === undefined || normalizedValue === null) {
          continue;
        }
        if (typeof normalizedValue === 'number' && Number.isNaN(normalizedValue)) {
          continue;
        }

        // Validate if validator exists
        if (pattern.validator && !pattern.validator(normalizedValue)) {
          continue;
        }

        entities.push({
          type: pattern.type,
          value,
          normalizedValue,
          confidence: 0.9, // High confidence for pattern-based extraction
          startIndex: match.index,
          endIndex: match.index + value.length,
        });
      } catch (_error) {}
      match = regex.exec(text);
    }

    return entities;
  }

  /**
   * Remove duplicate and overlapping entities
   */
  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    // Sort by start index
    const sorted = entities.sort((a, b) => a.startIndex - b.startIndex);
    const deduplicated: ExtractedEntity[] = [];

    for (const entity of sorted) {
      // Check if overlaps with any existing entity
      const overlaps = deduplicated.some(
        (existing) =>
          (entity.startIndex >= existing.startIndex && entity.startIndex < existing.endIndex) ||
          (entity.endIndex > existing.startIndex && entity.endIndex <= existing.endIndex)
      );

      if (!overlaps) {
        deduplicated.push(entity);
      }
    }

    return deduplicated;
  }

  /**
   * Extract entities of specific type
   */
  extractByType(text: string, type: EntityType): ExtractedEntity[] {
    return this.extract(text).filter((entity) => entity.type === type);
  }

  /**
   * Check if text contains entity of specific type
   */
  hasEntityType(text: string, type: EntityType): boolean {
    return this.extractByType(text, type).length > 0;
  }

  /**
   * Get first entity of specific type
   */
  getFirstEntity(text: string, type: EntityType): ExtractedEntity | null {
    const entities = this.extractByType(text, type);
    return entities.length > 0 ? entities[0] : null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create entity extractor instance
 */
export function createEntityExtractor(): EntityExtractor {
  return new EntityExtractor();
}

/**
 * Quick extract function
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const extractor = createEntityExtractor();
  return extractor.extract(text);
}

/**
 * Extract money amount from text
 */
export function extractAmount(text: string): number | null {
  const extractor = createEntityExtractor();
  const entity = extractor.getFirstEntity(text, EntityType.AMOUNT);
  return entity ? (entity.normalizedValue as number) : null;
}

/**
 * Extract date from text
 */
export function extractDate(text: string): Date | null {
  const extractor = createEntityExtractor();
  const entity = extractor.getFirstEntity(text, EntityType.DATE);
  return entity ? (entity.normalizedValue as Date) : null;
}

/**
 * Extract bill type from text
 */
export function extractBillType(text: string): string | null {
  const extractor = createEntityExtractor();
  const entity = extractor.getFirstEntity(text, EntityType.BILL_TYPE);
  return entity ? (entity.normalizedValue as string) : null;
}

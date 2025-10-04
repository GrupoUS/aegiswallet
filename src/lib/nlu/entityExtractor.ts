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

import { type EntityPattern, EntityType, type ExtractedEntity } from './types'

// ============================================================================
// Number Words Mapping (Brazilian Portuguese)
// ============================================================================

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  três: 3,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
  mil: 1000,
  milhão: 1000000,
  milhao: 1000000,
}

// ============================================================================
// Entity Patterns
// ============================================================================

const ENTITY_PATTERNS: EntityPattern[] = [
  // Money amounts
  {
    type: EntityType.AMOUNT,
    pattern: /R\$\s*(\d+(?:[.,]\d{2})?)/gi,
    normalizer: (match) => {
      const num = match.replace(/R\$\s*/i, '').replace(',', '.')
      return parseFloat(num)
    },
  },
  {
    type: EntityType.AMOUNT,
    pattern: /(\d+(?:[.,]\d{2})?)\s*(reais?|real)/gi,
    normalizer: (match) => {
      const num = match.replace(/\s*(reais?|real)/gi, '').replace(',', '.')
      return parseFloat(num)
    },
  },
  {
    type: EntityType.AMOUNT,
    pattern:
      /(cem|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|setecentos|oitocentos|novecentos|mil)\s*(reais?|real)?/gi,
    normalizer: (match) => {
      const word = match.replace(/\s*(reais?|real)?/gi, '').toLowerCase()
      return NUMBER_WORDS[word] || 0
    },
  },

  // Dates
  {
    type: EntityType.DATE,
    pattern: /\b(hoje|agora)\b/gi,
    normalizer: () => new Date(),
  },
  {
    type: EntityType.DATE,
    pattern: /\b(amanha|amanhã)\b/gi,
    normalizer: () => {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      return date
    },
  },
  {
    type: EntityType.DATE,
    pattern:
      /\b(proxima|próxima)\s+(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)/gi,
    normalizer: (match) => {
      const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
      const dayName = match.split(/\s+/)[1].toLowerCase().replace('ç', 'c').replace('á', 'a')
      const targetDay = days.indexOf(dayName)

      const date = new Date()
      const currentDay = date.getDay()
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7
      date.setDate(date.getDate() + daysUntil)

      return date
    },
  },

  // Bill types / Categories
  {
    type: EntityType.BILL_TYPE,
    pattern: /\b(energia|luz|eletrica|elétrica)\b/gi,
    normalizer: () => 'energia',
  },
  {
    type: EntityType.BILL_TYPE,
    pattern: /\b(agua|água)\b/gi,
    normalizer: () => 'agua',
  },
  {
    type: EntityType.BILL_TYPE,
    pattern: /\b(internet|wifi|banda\s+larga)\b/gi,
    normalizer: () => 'internet',
  },
  {
    type: EntityType.BILL_TYPE,
    pattern: /\b(telefone|celular|fone)\b/gi,
    normalizer: () => 'telefone',
  },
  {
    type: EntityType.BILL_TYPE,
    pattern: /\b(gas|gás)\b/gi,
    normalizer: () => 'gas',
  },
  {
    type: EntityType.BILL_TYPE,
    pattern: /\b(aluguel|aluguer)\b/gi,
    normalizer: () => 'aluguel',
  },

  // Categories
  {
    type: EntityType.CATEGORY,
    pattern: /\b(mercado|supermercado|compras)\b/gi,
    normalizer: () => 'mercado',
  },
  {
    type: EntityType.CATEGORY,
    pattern: /\b(transporte|uber|taxi|gasolina|combustivel|combustível)\b/gi,
    normalizer: () => 'transporte',
  },
  {
    type: EntityType.CATEGORY,
    pattern: /\b(saude|saúde|medico|médico|farmacia|farmácia)\b/gi,
    normalizer: () => 'saude',
  },
  {
    type: EntityType.CATEGORY,
    pattern: /\b(lazer|entretenimento|diversao|diversão)\b/gi,
    normalizer: () => 'lazer',
  },

  // Periods
  {
    type: EntityType.PERIOD,
    pattern: /\b(mes|mês|mensal)\b/gi,
    normalizer: () => 'month',
  },
  {
    type: EntityType.PERIOD,
    pattern: /\b(semana|semanal)\b/gi,
    normalizer: () => 'week',
  },
  {
    type: EntityType.PERIOD,
    pattern: /\b(ano|anual)\b/gi,
    normalizer: () => 'year',
  },
  {
    type: EntityType.PERIOD,
    pattern: /\b(dia|diario|diário)\b/gi,
    normalizer: () => 'day',
  },

  // Person names (simple pattern - capitalized words)
  {
    type: EntityType.PERSON,
    pattern:
      /\b([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+(?:\s+[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][a-zàáâãéêíóôõúç]+)*)\b/g,
    normalizer: (match) => match.trim(),
  },
]

// ============================================================================
// Entity Extractor Class
// ============================================================================

export class EntityExtractor {
  /**
   * Extract all entities from text
   */
  extract(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []

    for (const pattern of ENTITY_PATTERNS) {
      const matches = this.extractWithPattern(text, pattern)
      entities.push(...matches)
    }

    // Remove duplicates and overlapping entities
    return this.deduplicateEntities(entities)
  }

  /**
   * Extract entities using a specific pattern
   */
  private extractWithPattern(text: string, pattern: EntityPattern): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []
    const regex = new RegExp(pattern.pattern)
    let match: RegExpExecArray | null

    // Reset regex lastIndex
    regex.lastIndex = 0

    while ((match = regex.exec(text)) !== null) {
      try {
        const value = match[0]
        const normalizedValue = pattern.normalizer(value)

        // Validate if validator exists
        if (pattern.validator && !pattern.validator(normalizedValue)) {
          continue
        }

        entities.push({
          type: pattern.type,
          value,
          normalizedValue,
          confidence: 0.9, // High confidence for pattern-based extraction
          startIndex: match.index,
          endIndex: match.index + value.length,
        })
      } catch (error) {
        // Skip invalid extractions
        console.warn('Entity extraction error:', error)
      }
    }

    return entities
  }

  /**
   * Remove duplicate and overlapping entities
   */
  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    // Sort by start index
    const sorted = entities.sort((a, b) => a.startIndex - b.startIndex)
    const deduplicated: ExtractedEntity[] = []

    for (const entity of sorted) {
      // Check if overlaps with any existing entity
      const overlaps = deduplicated.some(
        (existing) =>
          (entity.startIndex >= existing.startIndex && entity.startIndex < existing.endIndex) ||
          (entity.endIndex > existing.startIndex && entity.endIndex <= existing.endIndex)
      )

      if (!overlaps) {
        deduplicated.push(entity)
      }
    }

    return deduplicated
  }

  /**
   * Extract entities of specific type
   */
  extractByType(text: string, type: EntityType): ExtractedEntity[] {
    return this.extract(text).filter((entity) => entity.type === type)
  }

  /**
   * Check if text contains entity of specific type
   */
  hasEntityType(text: string, type: EntityType): boolean {
    return this.extractByType(text, type).length > 0
  }

  /**
   * Get first entity of specific type
   */
  getFirstEntity(text: string, type: EntityType): ExtractedEntity | null {
    const entities = this.extractByType(text, type)
    return entities.length > 0 ? entities[0] : null
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create entity extractor instance
 */
export function createEntityExtractor(): EntityExtractor {
  return new EntityExtractor()
}

/**
 * Quick extract function
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const extractor = createEntityExtractor()
  return extractor.extract(text)
}

/**
 * Extract money amount from text
 */
export function extractAmount(text: string): number | null {
  const extractor = createEntityExtractor()
  const entity = extractor.getFirstEntity(text, EntityType.AMOUNT)
  return entity ? (entity.normalizedValue as number) : null
}

/**
 * Extract date from text
 */
export function extractDate(text: string): Date | null {
  const extractor = createEntityExtractor()
  const entity = extractor.getFirstEntity(text, EntityType.DATE)
  return entity ? (entity.normalizedValue as Date) : null
}

/**
 * Extract bill type from text
 */
export function extractBillType(text: string): string | null {
  const extractor = createEntityExtractor()
  const entity = extractor.getFirstEntity(text, EntityType.BILL_TYPE)
  return entity ? (entity.normalizedValue as string) : null
}

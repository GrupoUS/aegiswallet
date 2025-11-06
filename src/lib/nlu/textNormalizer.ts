/**
 * Text Normalization for Brazilian Portuguese
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Handles preprocessing of Brazilian Portuguese text:
 * - Lowercase conversion
 * - Accent removal
 * - Contraction expansion
 * - Stopword removal
 * - Tokenization
 *
 * @module nlu/textNormalizer
 */

import type { NormalizedText } from '@/lib/nlu/types';

// ============================================================================
// Brazilian Portuguese Stopwords
// ============================================================================

const STOPWORDS = new Set([
  'a',
  'o',
  'e',
  'é',
  'de',
  'da',
  'do',
  'em',
  'um',
  'uma',
  'os',
  'as',
  'dos',
  'das',
  'para',
  'por',
  'com',
  'sem',
  'sob',
  'sobre',
  'ao',
  'aos',
  'à',
  'às',
  'no',
  'na',
  'nos',
  'nas',
  'pelo',
  'pela',
  'pelos',
  'pelas',
  'este',
  'esta',
  'esse',
  'essa',
  'aquele',
  'aquela',
  'isto',
  'isso',
  'aquilo',
  'eu',
  'tu',
  'ele',
  'ela',
  'nós',
  'vós',
  'eles',
  'elas',
  'me',
  'te',
  'se',
  'lhe',
  'nos',
  'vos',
  'lhes',
  'meu',
  'minha',
  'teu',
  'tua',
  'seu',
  'sua',
  'que',
  'qual',
  'quais',
  'quanto',
  'quanta',
  'ser',
  'estar',
  'ter',
  'haver',
  'fazer',
]);

// ============================================================================
// Brazilian Portuguese Contractions
// ============================================================================

const CONTRACTIONS: Record<string, string> = {
  // Common contractions
  tá: 'está',
  tô: 'estou',
  tava: 'estava',
  tive: 'estive',
  pra: 'para',
  pro: 'para o',
  né: 'não é',
  vc: 'você',
  vcs: 'vocês',
  tbm: 'também',
  tb: 'também',
  q: 'que',
  oq: 'o que',
  pq: 'porque',
  blz: 'beleza',

  // Financial slang
  grana: 'dinheiro',
  bufunfa: 'dinheiro',
  tutu: 'dinheiro',
  dim: 'dinheiro',
  pila: 'dinheiro',

  // Regional variations
  pagá: 'pagar',
  comprá: 'comprar',
  gastá: 'gastar',
  recebê: 'receber',
  transferi: 'transferir',
};

// ============================================================================
// Accent Mapping
// ============================================================================

const ACCENT_MAP: Record<string, string> = {
  á: 'a',
  à: 'a',
  ã: 'a',
  â: 'a',
  é: 'e',
  ê: 'e',
  í: 'i',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ú: 'u',
  ü: 'u',
  ç: 'c',
  Á: 'A',
  À: 'A',
  Ã: 'A',
  Â: 'A',
  É: 'E',
  Ê: 'E',
  Í: 'I',
  Ó: 'O',
  Ô: 'O',
  Õ: 'O',
  Ú: 'U',
  Ü: 'U',
  Ç: 'C',
};

// ============================================================================
// Text Normalizer Class
// ============================================================================

export class TextNormalizer {
  private keepAccents: boolean;
  private keepStopwords: boolean;
  private expandContractions: boolean;

  constructor(
    options: {
      keepAccents?: boolean;
      keepStopwords?: boolean;
      expandContractions?: boolean;
    } = {}
  ) {
    this.keepAccents = options.keepAccents ?? false;
    this.keepStopwords = options.keepStopwords ?? false;
    this.expandContractions = options.expandContractions ?? true;
  }

  /**
   * Normalize text with full preprocessing pipeline
   */
  normalize(text: string): NormalizedText {
    const original = text;
    let normalized = text;

    // 1. Lowercase
    normalized = normalized.toLowerCase();

    // 2. Expand contractions
    const expandedContractions: Record<string, string> = {};
    if (this.expandContractions) {
      normalized = this.expandContractionsInText(normalized, expandedContractions);
    }

    // 3. Remove accents
    if (!this.keepAccents) {
      normalized = this.removeAccents(normalized);
    }

    // 4. Clean punctuation (keep only alphanumeric and spaces)
    normalized = normalized.replace(/[^\w\s]/g, ' ');

    // 5. Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // 6. Tokenize
    const tokens = normalized.split(' ').filter((t) => t.length > 0);

    // 7. Remove stopwords
    const removedStopwords: string[] = [];
    const finalTokens = this.keepStopwords
      ? tokens
      : tokens.filter((token) => {
          if (STOPWORDS.has(token)) {
            removedStopwords.push(token);
            return false;
          }
          return true;
        });

    return {
      original,
      normalized: finalTokens.join(' '),
      tokens: finalTokens,
      removedStopwords,
      expandedContractions,
    };
  }

  /**
   * Remove accents from text
   */
  private removeAccents(text: string): string {
    return text
      .split('')
      .map((char) => ACCENT_MAP[char] || char)
      .join('');
  }

  /**
   * Expand contractions in text
   */
  private expandContractionsInText(text: string, tracking: Record<string, string>): string {
    let result = text;

    // Sort by length (longest first) to avoid partial replacements
    const sortedContractions = Object.entries(CONTRACTIONS).sort(([a], [b]) => b.length - a.length);

    for (const [contraction, expansion] of sortedContractions) {
      const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
      if (regex.test(result)) {
        tracking[contraction] = expansion;
        result = result.replace(regex, expansion);
      }
    }

    return result;
  }

  /**
   * Tokenize text into words
   */
  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  /**
   * Check if word is a stopword
   */
  isStopword(word: string): boolean {
    return STOPWORDS.has(word.toLowerCase());
  }

  /**
   * Remove stopwords from token array
   */
  removeStopwords(tokens: string[]): string[] {
    return tokens.filter((token) => !STOPWORDS.has(token.toLowerCase()));
  }

  /**
   * Normalize for comparison (aggressive normalization)
   */
  normalizeForComparison(text: string): string {
    return this.removeAccents(text.toLowerCase())
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create default text normalizer
 */
export function createTextNormalizer(): TextNormalizer {
  return new TextNormalizer({
    keepAccents: false,
    keepStopwords: false,
    expandContractions: true,
  });
}

/**
 * Quick normalize function
 */
export function normalizeText(text: string): string {
  const normalizer = createTextNormalizer();
  return normalizer.normalize(text).normalized;
}

/**
 * Calculate text similarity (simple Jaccard similarity)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const normalizer = createTextNormalizer();
  const tokens1 = new Set(normalizer.normalize(text1).tokens);
  const tokens2 = new Set(normalizer.normalize(text2).tokens);

  const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Extract keywords from text (non-stopwords)
 */
export function extractKeywords(text: string): string[] {
  const normalizer = createTextNormalizer();
  const normalized = normalizer.normalize(text);
  return normalized.tokens;
}

/**
 * Check if text contains any of the keywords
 */
export function containsKeywords(text: string, keywords: string[]): boolean {
  const normalizer = createTextNormalizer();
  const normalized = normalizer.normalizeForComparison(text);

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizer.normalizeForComparison(keyword);
    return normalized.includes(normalizedKeyword);
  });
}

/**
 * Intent Definitions for Brazilian Portuguese Voice Commands
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Defines 6 essential intents with patterns, keywords, and examples
 *
 * @module nlu/intents
 */

import type { IntentDefinition } from '@/lib/nlu/types';
import { EntityType, IntentType } from '@/lib/nlu/types';

// ============================================================================
// Intent Definitions
// ============================================================================

export const INTENT_DEFINITIONS: Record<IntentType, IntentDefinition> = {
  [IntentType.CHECK_BALANCE]: {
    confidence_threshold: 0.7,
    description: 'Check account balance',
    examples: [
      'qual é meu saldo?',
      'quanto tenho de dinheiro?',
      'saldo disponível',
      'quanto sobrou?',
      'me mostra o saldo',
      'tá quanto na conta?',
      'quanto de grana eu tenho?',
    ],
    keywords: ['saldo', 'dinheiro', 'grana', 'tenho', 'sobrou', 'disponivel'],
    name: 'Consultar Saldo',
    optionalSlots: [EntityType.ACCOUNT, EntityType.DATE],
    patterns: [
      // Enhanced patterns for Brazilian Portuguese balance queries
      /\b(qual|quanto|ver|mostrar|consultar|checar)\s+(é|eh|e|o|meu)?\s*(de\s+)?(saldo|dinheiro|grana|bufunfa)\b/i,
      /\b(saldo|dinheiro|grana)\s+(disponivel|atual|hoje|agora)\b/i,
      /\b(tenho|tem|restou)\s+quanto\b/i,
      /\b(sobrou)\s+quanto(\s+de)?\s*(dinheiro|grana)?\b/i,
      /\bme\s+(mostra|fala|diz)\s+(o|meu)?\s*saldo\b/i,
      /\b(t[áÁ]|est[áÁ])\s+quanto\s+(na\s+)?conta\b/i,
      /\bquanto\s+(t[áÁ]|est[áÁ])\s+na\s+conta\b/i,
      /\b(saldo)\s+(da|na)\s+conta\b/i,
      // More specific pattern - avoid overlap with other intents
      /\b(quanto|qual)\s+(tenho|tem|sobrou|ta|esta|est[áÁ])\s+(de\s+)?(dinheiro|grana|saldo|bufunfa)\b/i,
      /\bquanto\s+(de\s+)?(grana|dinheiro)\s+(eu\s+)?tenho\b/i,
      // Enhanced pattern for "qual é meu saldo?" - Exact match priority
      /^qual\s+é\s+(meu|o)?\s*saldo\?*$/i,
      // Additional Brazilian variants
      /^quanto\s+tenho\??$/i,
      /^meu\s+saldo\??$/i,
      /\bmeu\s+saldo\s+(disponivel|atual)\??\b/i,
    ],
    requiredSlots: [],
    type: IntentType.CHECK_BALANCE,
  },

  [IntentType.CHECK_BUDGET]: {
    confidence_threshold: 0.7,
    description: 'Check budget and spending limits',
    examples: [
      'quanto posso gastar?',
      'qual meu orçamento?',
      'quanto sobrou do orçamento?',
      'posso gastar quanto?',
      'limite de gastos',
      'quanto falta do orçamento?',
      'orçamento disponível',
    ],
    keywords: ['orçamento', 'orcamento', 'gastar', 'limite', 'posso', 'consigo', 'teto'],
    name: 'Consultar Orçamento',
    optionalSlots: [EntityType.CATEGORY, EntityType.PERIOD],
    patterns: [
      // Enhanced high confidence patterns for budget queries
      /\b(quanto|qual)\s+(posso|consigo|dá|da|pode)\s+(gastar|usar|pegar)\b/i,
      /\b(orcamento|orçamento|limite|teto)\s+(disponivel|restante|do\s+mes|mensal)\b/i,
      /\b(gastar|usar)\s+quanto\b/i,
      /\b(sobrou|restou|tem)\s+quanto\s+(pra|para)\s+gastar\b/i,
      /\b(quanto|qual)\s+(falta|resta)\s+(do|no)?\s*(orcamento|or[cç]amento)\b/i,
      /\b(quanto|qual)\s+(sobrou|restou)\s+(do|no)?\s*(orcamento|or[cç]amento)\b/i,
      /\b(t[áÁ]|est[áÁ])\s+quanto\s+(no|na)?\s*(orcamento|or[cç]amento)\b/i,
      // Enhanced Brazilian variants
      /^quanto\s+posso\s+gastar\??$/i,
      /^qual\s+meu\s+orçamento\??$/i,
      /\borçamento\s+(disponivel|restante|do\s+m[êê]s)\b/i,
    ],
    requiredSlots: [],
    type: IntentType.CHECK_BUDGET,
  },

  [IntentType.PAY_BILL]: {
    confidence_threshold: 0.75,
    description: 'Pay bills and invoices',
    examples: [
      'pagar conta de energia',
      'paga o boleto da água',
      'quitar fatura do cartão',
      'pagar internet',
      'conta de luz',
      'paga a energia',
      'quitar débito',
    ],
    keywords: [
      'pagar',
      'paga',
      'conta',
      'boleto',
      'fatura',
      'quitar',
      'energia',
      'agua',
      'internet',
    ],
    name: 'Pagar Conta',
    optionalSlots: [EntityType.AMOUNT, EntityType.DATE],
    patterns: [
      // Enhanced patterns for payment commands
      /\b(pagar|paga|quitar|quita)\s+(o|a|meu|minha)?\s*(conta|boleto|fatura)\b/i,
      /\b(pagar|paga)\s+(energia|luz|agua|[áÁ]gua|internet|telefone|gas|aluguel)\b/i,
      /\b(conta|boleto|fatura)\s+(da|de|do)\s+(energia|luz|agua|[áÁ]gua|internet|telefone)\b/i,
      /\b(quitar|quita)\s+(divida|debito|pendencia)\b/i,
      /\b(fazer|faz)\s+pagamento\b/i,
      // More specific Brazilian variants
      /^pagar\s+(conta|boleto|fatura)/i,
      /\bpaga\s+(a|o)?\s*(conta|luz|energia|[áÁ]gua)\b/i,
    ],
    requiredSlots: [EntityType.BILL_TYPE],
    type: IntentType.PAY_BILL,
  },

  [IntentType.CHECK_INCOME]: {
    confidence_threshold: 0.7,
    description: 'Check incoming payments and income',
    examples: [
      'quando vou receber?',
      'recebimentos do mês',
      'quanto vai entrar?',
      'quando cai o salário?',
      'próximos recebimentos',
      'entradas previstas',
      'vai receber quanto?',
    ],
    keywords: [
      'receber',
      'recebimento',
      'entrada',
      'credito',
      'salario',
      'cair',
      'entrar',
      'ganhar',
    ],
    name: 'Consultar Recebimentos',
    optionalSlots: [EntityType.PERIOD, EntityType.DATE],
    patterns: [
      // Enhanced high confidence patterns for income queries
      /\b(quando|qual)\s+(vou|vai)\s+(receber|cair|entrar)\b/i,
      /\b(recebimento|recebimentos|entrada|entradas|credito|sal[áa]rio|salario)\s+(do\s+m[êeê]s|mensal|pr[óo]ximo|pr[óo]xima|pendente|previstas?)\b/i,
      /\b(vai|vou)\s+(ter|receber|entrar)\s+quanto\b/i,
      /\b(quanto|qual)\s+(vou|vai)\s+(ganhar|receber|entrar)\b/i,
      /\b(sal[áa]rio|salario)\s+(cai|entra)\s+quando\b/i,
      /\b(vai|vou)\s+receber\s+quanto\b/i,
      // More specific Brazilian variants
      /^quando\s+(vou|vai)\s+receber\??$/i,
      /\bpr[óo]ximos?\s+(recebimentos?|entradas?)\b/i,
      /\bentradas?\s+previstas?\b/i,
    ],
    requiredSlots: [],
    type: IntentType.CHECK_INCOME,
  },

  [IntentType.FINANCIAL_PROJECTION]: {
    confidence_threshold: 0.7,
    description: 'Financial projections and forecasts',
    examples: [
      'projeção do mês',
      'como vai ficar o mês?',
      'vai sobrar quanto?',
      'previsão financeira',
      'quanto vai faltar?',
      'balanço do mês',
      'estimativa mensal',
    ],
    keywords: [
      'projeção',
      'projecao',
      'previsão',
      'previsao',
      'estimativa',
      'sobrar',
      'faltar',
      'balanço',
    ],
    name: 'Projeção Financeira',
    optionalSlots: [EntityType.CATEGORY],
    patterns: [
      // Enhanced high confidence patterns for projection queries - Fixed regex
      /\b(projec[ãa]o|previs[ãa]o|estimativa)\s+(financeira|do\s+m[eê]s|mensal|anual)\b/i,
      /\b(como|qual)\s+(vai|fica|ficar|esta|est[áÁ])\s+(o\s+)?(meu\s+)?m[eê]s\??\b/i,
      /\b(vou|vai)\s+(sobrar|faltar|ter)\s+quanto\b/i,
      /\b(quanto|qual)\s+(vai|vou)?\s*(sobrar|faltar|resta)\b/i,
      /\b(balan[çc]o|balanco)\s+(do\s+m[eê]s|mensal|previsto)\b/i,
      // More specific Brazilian variants
      /^proje[cç][ãa]o\s+(do\s+)?m[eê]s\??$/i,
      /\bcomo\s+(vai|fica)\s+o\s+m[eê]s\??\b/i,
      /\bvai\s+sobrar\s+quanto\??$/i,
      /\bquanto\s+vai\s+faltar\??$/i,
    ],
    requiredSlots: [EntityType.PERIOD],
    type: IntentType.FINANCIAL_PROJECTION,
  },

  [IntentType.TRANSFER_MONEY]: {
    confidence_threshold: 0.75,
    description: 'Transfer money via PIX or TED',
    examples: [
      'transferir para João',
      'fazer PIX de 100 reais',
      'enviar dinheiro',
      'transfere 50 reais',
      'PIX para Maria',
      'mandar 200 reais',
      'fazer transferência',
    ],
    keywords: [
      'transferir',
      'transfere',
      'pix',
      'ted',
      'enviar',
      'mandar',
      'transferencia',
      'transferência',
    ],
    name: 'Transferir Dinheiro',
    optionalSlots: [EntityType.DATE],
    patterns: [
      // Enhanced patterns for transfer commands
      /\b(transferir|transfere|enviar|envia|mandar|manda)\s+(dinheiro|grana|real|reais)\b/i,
      /\b(fazer|faz)\s+(pix|ted|transfer[êe]ncia|transferencia)\b/i,
      /\b(pix|ted)\s+(para|pra|pro)\b/i,
      /\b(transferir|transfere)\s+(para|pra|pro)\b/i,
      /\b(enviar|envia|mandar|manda)\s+\d+\s*(reais|real|r\$)\b/i,
      /\b(pix|ted)\s+(de|para)\s+\d+/i,
      /\b(transfer[êe]ncia|transferencia|pix)\s+(imediata|urgente)\b/i,
      // More specific Brazilian variants
      /^fazer\s+(pix|ted)/i,
      /\b(pix|ted)\s+para\s+[a-zàáâãéêíóôõúç]+/i,
    ],
    requiredSlots: [EntityType.RECIPIENT, EntityType.AMOUNT],
    type: IntentType.TRANSFER_MONEY,
  },

  [IntentType.UNKNOWN]: {
    confidence_threshold: 0.0,
    description: 'Unknown or unrecognized intent',
    examples: [],
    keywords: [],
    name: 'Desconhecido',
    optionalSlots: [],
    patterns: [],
    requiredSlots: [],
    type: IntentType.UNKNOWN,
  },
};;;

// ============================================================================
// Intent Utilities
// ============================================================================

/**
 * Get all intent types except UNKNOWN
 * Order: More specific intents first for better classification
 */
export function getValidIntents(): IntentType[] {
  return [
    IntentType.CHECK_INCOME, // Prioritize income-related queries
    IntentType.PAY_BILL, // Payment-specific patterns
    IntentType.TRANSFER_MONEY, // Transfer-specific patterns
    IntentType.CHECK_BUDGET, // Budget-specific patterns
    IntentType.FINANCIAL_PROJECTION, // Projection-specific patterns
    IntentType.CHECK_BALANCE, // General balance queries
  ];
}

/**
 * Get intent definition by type
 */
export function getIntentDefinition(intent: IntentType): IntentDefinition {
  return INTENT_DEFINITIONS[intent];
}

/**
 * Get all intent patterns
 */
export function getAllPatterns(): {
  intent: IntentType;
  pattern: RegExp;
}[] {
  const patterns: { intent: IntentType; pattern: RegExp }[] = [];

  for (const intent of getValidIntents()) {
    const definition = INTENT_DEFINITIONS[intent];
    for (const pattern of definition.patterns) {
      patterns.push({ intent, pattern });
    }
  }

  return patterns;
}

/**
 * Get all intent keywords
 */
export function getAllKeywords(): Record<IntentType, string[]> {
  const keywords = Object.fromEntries(
    getValidIntents().map((intent) => [intent, INTENT_DEFINITIONS[intent].keywords])
  ) as Record<IntentType, string[]>;

  return keywords;
}

/**
 * Check if intent requires confirmation
 */
export function requiresConfirmation(intent: IntentType): boolean {
  // Intents that modify financial state require confirmation
  return [IntentType.PAY_BILL, IntentType.TRANSFER_MONEY].includes(intent);
}

/**
 * Get intent display name in Portuguese
 */
export function getIntentDisplayName(intent: IntentType): string {
  return INTENT_DEFINITIONS[intent].name;
}

/**
 * Get intent description
 */

/**
 * Get intent description
 */
export function getIntentDescription(intent: IntentType): string {
  return INTENT_DEFINITIONS[intent].description;
}

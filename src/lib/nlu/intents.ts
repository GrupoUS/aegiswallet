/**
 * Intent Definitions for Brazilian Portuguese Voice Commands
 *
 * Story: 01.02 - NLU dos 6 Comandos Essenciais
 *
 * Defines 6 essential intents with patterns, keywords, and examples
 *
 * @module nlu/intents
 */

import { EntityType, type IntentDefinition, IntentType } from './types'

// ============================================================================
// Intent Definitions
// ============================================================================

export const INTENT_DEFINITIONS: Record<IntentType, IntentDefinition> = {
  [IntentType.CHECK_BALANCE]: {
    type: IntentType.CHECK_BALANCE,
    name: 'Consultar Saldo',
    description: 'Check account balance',
    patterns: [
      /\b(qual|quanto|ver|mostrar|consultar|checar)\s+(é|eh|e|o|meu)?\s*(saldo|dinheiro|grana|bufunfa)\b/i,
      /\b(saldo|dinheiro|grana)\s+(disponivel|atual|hoje|agora)\b/i,
      /\b(tenho|tem|sobrou|restou)\s+quanto\b/i,
      /\b(quanto|qual)\s+(tenho|tem|sobrou|ta|esta|est[áÁ])\b/i,
      /\bme\s+(mostra|fala|diz)\s+(o|meu)?\s*saldo\b/i,
      /\b(t[áÁ]|est[áÁ])\s+quanto\s+(na\s+)?conta\b/i,
      /\bquanto\s+(t[áÁ]|est[áÁ])\s+na\s+conta\b/i,
    ],
    keywords: ['saldo', 'dinheiro', 'grana', 'quanto', 'tenho', 'sobrou', 'disponivel'],
    requiredSlots: [],
    optionalSlots: [EntityType.ACCOUNT, EntityType.DATE],
    examples: [
      'qual é meu saldo?',
      'quanto tenho de dinheiro?',
      'saldo disponível',
      'quanto sobrou?',
      'me mostra o saldo',
      'tá quanto na conta?',
      'quanto de grana eu tenho?',
    ],
    confidence_threshold: 0.7,
  },

  [IntentType.CHECK_BUDGET]: {
    type: IntentType.CHECK_BUDGET,
    name: 'Consultar Orçamento',
    description: 'Check budget and spending limits',
    patterns: [
      /\b(quanto|qual)\s+(posso|consigo|dá|da|pode)\s+(gastar|usar|pegar)\b/i,
      /\b(orcamento|or[çc]amento|limite|teto)\s+(disponivel|restante|do\s+mes|mensal)\b/i,
      /\b(gastar|usar)\s+quanto\b/i,
      /\b(sobrou|restou|tem)\s+quanto\s+(pra|para)\s+gastar\b/i,
      /\b(quanto|qual)\s+(falta|resta)\s+(do|no)?\s*(orcamento|or[çc]amento)\b/i,
    ],
    keywords: ['orçamento', 'orcamento', 'gastar', 'limite', 'posso', 'consigo', 'teto'],
    requiredSlots: [],
    optionalSlots: [EntityType.CATEGORY, EntityType.PERIOD],
    examples: [
      'quanto posso gastar?',
      'qual meu orçamento?',
      'quanto sobrou do orçamento?',
      'posso gastar quanto?',
      'limite de gastos',
      'quanto falta do orçamento?',
      'orçamento disponível',
    ],
    confidence_threshold: 0.7,
  },

  [IntentType.PAY_BILL]: {
    type: IntentType.PAY_BILL,
    name: 'Pagar Conta',
    description: 'Pay bills and invoices',
    patterns: [
      /\b(pagar|paga|quitar|quita)\s+(o|a|meu|minha)?\s*(conta|boleto|fatura)\b/i,
      /\b(pagar|paga)\s+(energia|luz|agua|internet|telefone|gas|aluguel)\b/i,
      /\b(conta|boleto|fatura)\s+(da|de|do)\s+(energia|luz|agua|internet|telefone)\b/i,
      /\b(quitar|quita)\s+(divida|debito|pendencia)\b/i,
      /\b(fazer|faz)\s+pagamento\b/i,
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
    requiredSlots: [EntityType.BILL_TYPE],
    optionalSlots: [EntityType.AMOUNT, EntityType.DATE],
    examples: [
      'pagar conta de energia',
      'paga o boleto da água',
      'quitar fatura do cartão',
      'pagar internet',
      'conta de luz',
      'paga a energia',
      'quitar débito',
    ],
    confidence_threshold: 0.75,
  },

  [IntentType.CHECK_INCOME]: {
    type: IntentType.CHECK_INCOME,
    name: 'Consultar Recebimentos',
    description: 'Check incoming payments and income',
    patterns: [
      /\b(quando|qual)\s+(vou|vai)\s+(receber|cair|entrar)\b/i,
      /\b(recebimento|entrada|credito|sal[áa]rio)\s+(do\s+mes|mensal|proximo|pendente)\b/i,
      /\b(vai|vou)\s+(ter|receber|entrar)\s+quanto\b/i,
      /\b(quanto|qual)\s+(vou|vai)\s+(ganhar|receber)\b/i,
      /\b(sal[áa]rio|pagamento)\s+(cai|entra)\s+quando\b/i,
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
    requiredSlots: [],
    optionalSlots: [EntityType.PERIOD, EntityType.DATE],
    examples: [
      'quando vou receber?',
      'recebimentos do mês',
      'quanto vai entrar?',
      'quando cai o salário?',
      'próximos recebimentos',
      'entradas previstas',
      'vai receber quanto?',
    ],
    confidence_threshold: 0.7,
  },

  [IntentType.FINANCIAL_PROJECTION]: {
    type: IntentType.FINANCIAL_PROJECTION,
    name: 'Projeção Financeira',
    description: 'Financial projections and forecasts',
    patterns: [
      /\b(projec[ãa]o|previs[ãa]o|estimativa)\s+(financeira|do\s+mes|mensal|anual)\b/i,
      /\b(como|qual)\s+(vai|fica|esta|est[áÁ])\s+(meu|o)?\s*(mes|ano|semana)\b/i,
      /\b(vou|vai)\s+(sobrar|faltar|ter)\s+quanto\b/i,
      /\b(quanto|qual)\s+(sobra|falta|resta)\s+(no\s+fim|final)\s+(do\s+mes|mes)\b/i,
      /\b(balan[çc]o|resultado)\s+(do\s+mes|mensal|previsto)\b/i,
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
    requiredSlots: [EntityType.PERIOD],
    optionalSlots: [EntityType.CATEGORY],
    examples: [
      'projeção do mês',
      'como vai ficar o mês?',
      'vai sobrar quanto?',
      'previsão financeira',
      'quanto vai faltar?',
      'balanço do mês',
      'estimativa mensal',
    ],
    confidence_threshold: 0.7,
  },

  [IntentType.TRANSFER_MONEY]: {
    type: IntentType.TRANSFER_MONEY,
    name: 'Transferir Dinheiro',
    description: 'Transfer money via PIX or TED',
    patterns: [
      /\b(transferir|transfere|enviar|envia|mandar|manda)\s+(dinheiro|grana|real|reais)\b/i,
      /\b(fazer|faz)\s+(pix|ted|transfer[êe]ncia)\b/i,
      /\b(pix|ted)\s+(para|pra|pro)\b/i,
      /\b(transferir|transfere)\s+(para|pra|pro)\b/i,
      /\b(enviar|envia|mandar|manda)\s+\d+\s*(reais|real|r\$)\b/i,
      /\b(pix|ted)\s+(de|para)\s+\d+/i,
      /\b(transfer[êe]ncia|pix)\s+(imediata|urgente)\b/i,
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
    requiredSlots: [EntityType.RECIPIENT, EntityType.AMOUNT],
    optionalSlots: [EntityType.DATE],
    examples: [
      'transferir para João',
      'fazer PIX de 100 reais',
      'enviar dinheiro',
      'transfere 50 reais',
      'PIX para Maria',
      'mandar 200 reais',
      'fazer transferência',
    ],
    confidence_threshold: 0.75,
  },

  [IntentType.UNKNOWN]: {
    type: IntentType.UNKNOWN,
    name: 'Desconhecido',
    description: 'Unknown or unrecognized intent',
    patterns: [],
    keywords: [],
    requiredSlots: [],
    optionalSlots: [],
    examples: [],
    confidence_threshold: 0.0,
  },
}

// ============================================================================
// Intent Utilities
// ============================================================================

/**
 * Get all intent types except UNKNOWN
 */
export function getValidIntents(): IntentType[] {
  return Object.values(IntentType).filter((intent) => intent !== IntentType.UNKNOWN)
}

/**
 * Get intent definition by type
 */
export function getIntentDefinition(intent: IntentType): IntentDefinition {
  return INTENT_DEFINITIONS[intent]
}

/**
 * Get all intent patterns
 */
export function getAllPatterns(): Array<{ intent: IntentType; pattern: RegExp }> {
  const patterns: Array<{ intent: IntentType; pattern: RegExp }> = []

  for (const intent of getValidIntents()) {
    const definition = INTENT_DEFINITIONS[intent]
    for (const pattern of definition.patterns) {
      patterns.push({ intent, pattern })
    }
  }

  return patterns
}

/**
 * Get all intent keywords
 */
export function getAllKeywords(): Record<IntentType, string[]> {
  const keywords: Record<IntentType, string[]> = {} as any

  for (const intent of getValidIntents()) {
    keywords[intent] = INTENT_DEFINITIONS[intent].keywords
  }

  return keywords
}

/**
 * Check if intent requires confirmation
 */
export function requiresConfirmation(intent: IntentType): boolean {
  // Intents that modify financial state require confirmation
  return [IntentType.PAY_BILL, IntentType.TRANSFER_MONEY].includes(intent)
}

/**
 * Get intent display name in Portuguese
 */
export function getIntentDisplayName(intent: IntentType): string {
  return INTENT_DEFINITIONS[intent].name
}

/**
 * Get intent description
 */
export function getIntentDescription(intent: IntentType): string {
  return INTENT_DEFINITIONS[intent].description
}

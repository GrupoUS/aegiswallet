/**
 * Brazilian Formatters
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * Comprehensive formatting utilities for Brazilian standards:
 * - Currency (R$ 1.234,56)
 * - Dates (DD/MM/YYYY)
 * - Numbers (1.234,56)
 * - Percentages (12,5%)
 * - Voice-friendly text for TTS
 *
 * @module formatters/brazilianFormatters
 */

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format number as Brazilian currency (R$ 1.234,56)
 */
export function formatCurrency(
  value: number,
  options?: {
    showSymbol?: boolean
    decimals?: number
  }
): string {
  const { showSymbol = true, decimals = 2 } = options || {}

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

  return showSymbol ? formatted : formatted.replace('R$', '').trim()
}

/**
 * Format currency for voice output (TTS)
 * Example: 1234.56 → "mil duzentos e trinta e quatro reais e cinquenta e seis centavos"
 */
export function formatCurrencyForVoice(value: number): string {
  const reais = Math.floor(Math.abs(value))
  const centavos = Math.round((Math.abs(value) - reais) * 100)

  let text = ''

  // Handle negative
  if (value < 0) {
    text += 'menos '
  }

  // Format reais
  if (reais === 0) {
    text += 'zero reais'
  } else {
    text += numberToWords(reais) + (reais === 1 ? ' real' : ' reais')
  }

  // Format centavos
  if (centavos > 0) {
    text += ' e ' + numberToWords(centavos) + (centavos === 1 ? ' centavo' : ' centavos')
  }

  return text
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Format date with time (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format date as relative (hoje, amanhã, ontem, etc.)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(d)
  targetDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'hoje'
  if (diffDays === 1) return 'amanhã'
  if (diffDays === -1) return 'ontem'
  if (diffDays > 1 && diffDays <= 7) return `em ${diffDays} dias`
  if (diffDays < -1 && diffDays >= -7) return `há ${Math.abs(diffDays)} dias`

  return formatDate(d)
}

/**
 * Format date for voice output
 * Example: 2025-01-04 → "quatro de janeiro de dois mil e vinte e cinco"
 */
export function formatDateForVoice(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const day = d.getDate()
  const month = d.getMonth()
  const year = d.getFullYear()

  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]

  return `${numberToWords(day)} de ${months[month]} de ${yearToWords(year)}`
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format number with Brazilian conventions (1.234,56)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format large numbers with abbreviations (1,2 mi, 1,5 mil)
 */
export function formatLargeNumber(value: number): string {
  const absValue = Math.abs(value)

  if (absValue >= 1000000) {
    return formatNumber(value / 1000000, 1) + ' mi'
  }
  if (absValue >= 1000) {
    return formatNumber(value / 1000, 1) + ' mil'
  }

  return formatNumber(value, 0)
}

// ============================================================================
// Percentage Formatting
// ============================================================================

/**
 * Format percentage (12,5%)
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format percentage for voice output
 * Example: 12.5 → "doze vírgula cinco por cento"
 */
export function formatPercentageForVoice(value: number): string {
  const intPart = Math.floor(value)
  const decPart = Math.round((value - intPart) * 10)

  let text = numberToWords(intPart)

  if (decPart > 0) {
    text += ' vírgula ' + numberToWords(decPart)
  }

  text += ' por cento'

  return text
}

// ============================================================================
// Number to Words Conversion (Brazilian Portuguese)
// ============================================================================

const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
const TEENS = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
]
const TENS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
]
const HUNDREDS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
]

/**
 * Convert number to words (Brazilian Portuguese)
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'zero'
  if (num === 100) return 'cem'

  const parts: string[] = []

  // Millions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000)
    parts.push(millions === 1 ? 'um milhão' : `${numberToWords(millions)} milhões`)
    num %= 1000000
  }

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    parts.push(thousands === 1 ? 'mil' : `${numberToWords(thousands)} mil`)
    num %= 1000
  }

  // Hundreds
  if (num >= 100) {
    const hundreds = Math.floor(num / 100)
    parts.push(HUNDREDS[hundreds])
    num %= 100
  }

  // Tens and units
  if (num >= 20) {
    const tens = Math.floor(num / 10)
    const units = num % 10
    parts.push(TENS[tens] + (units > 0 ? ` e ${UNITS[units]}` : ''))
  } else if (num >= 10) {
    parts.push(TEENS[num - 10])
  } else if (num > 0) {
    parts.push(UNITS[num])
  }

  return parts.join(' e ')
}

/**
 * Convert year to words
 */
function yearToWords(year: number): string {
  if (year >= 2000 && year < 2010) {
    return `dois mil e ${numberToWords(year - 2000)}`
  }
  if (year >= 2010) {
    return `dois mil e ${numberToWords(year - 2000)}`
  }
  return numberToWords(year)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse Brazilian currency string to number
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
}

/**
 * Parse Brazilian date string (DD/MM/YYYY) to Date
 */
export function parseDate(value: string): Date {
  const [day, month, year] = value.split('/').map(Number)
  return new Date(year, month - 1, day)
}

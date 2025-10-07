/**
 * Brazilian Formatters for AegisWallet
 *
 * Story: 01.03 - Respostas Multimodais
 *
 * Comprehensive formatters for Brazilian:
 * - Currency (R$)
 * - Dates (DD/MM/YYYY)
 * - Numbers (thousands, millions)
 * - Phone numbers
 * - CPF/CNPJ
 * - CEP
 *
 * @module formatters/brazilianFormatters
 */

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format number as Brazilian currency (R$)
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean
    decimals?: number
    compact?: boolean
  }
): string {
  const { showSymbol = true, decimals = 2, compact = false } = options || {}

  if (compact && Math.abs(amount) >= 1000) {
    return formatCompactCurrency(amount, showSymbol)
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)

  const normalized = formatted.replace(/\u00A0/g, ' ')

  return showSymbol ? normalized : normalized.replace('R$', '').trim()
}

/**
 * Format currency with compact notation (1K, 1M)
 */
export function formatCompactCurrency(amount: number, showSymbol = true): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  const symbol = showSymbol ? 'R$ ' : ''

  if (absAmount >= 1_000_000_000) {
    return `${sign}${symbol}${(absAmount / 1_000_000_000).toFixed(1)}B`
  }

  if (absAmount >= 1_000_000) {
    return `${sign}${symbol}${(absAmount / 1_000_000).toFixed(1)}M`
  }

  if (absAmount >= 1_000) {
    return `${sign}${symbol}${(absAmount / 1_000).toFixed(1)}K`
  }

  return formatCurrency(amount, { showSymbol, decimals: 0 })
}

/**
 * Format currency for voice output (natural speech)
 */
export function formatCurrencyForVoice(amount: number): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? 'menos ' : ''

  if (absAmount === 0) {
    return 'zero reais'
  }

  if (absAmount < 1) {
    const cents = Math.round(absAmount * 100)
    return `${sign}${cents} ${cents === 1 ? 'centavo' : 'centavos'}`
  }

  const reais = Math.floor(absAmount)
  const cents = Math.round((absAmount - reais) * 100)

  if (cents > 0) {
    // For amounts with cents, show both reais and cents
    return `${sign}${numberToWords(reais)} reais e ${cents} centavos`
  }

  // For whole numbers, just convert to words
  return `${sign}${numberToWords(reais)} ${reais === 1 ? 'real' : 'reais'}`
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(
  date: Date | string,
  options?: {
    showTime?: boolean
    showWeekday?: boolean
    relative?: boolean
  }
): string {
  const { showTime = false, showWeekday = false, relative = false } = options || {}

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (relative) {
    const relativeDays = getRelativeDays(dateObj)
    if (relativeDays !== null) return relativeDays
  }

  let formatted = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  if (showWeekday) {
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })
    formatted = `${weekday}, ${formatted}`
  }

  if (showTime) {
    const time = dateObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    formatted += ` às ${time}`
  }

  return formatted
}

/**
 * Get relative date description (hoje, amanhã, etc)
 */
export function getRelativeDays(date: Date): string | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  switch (diffDays) {
    case 0:
      return 'hoje'
    case 1:
      return 'amanhã'
    case -1:
      return 'ontem'
    case 2:
      return 'depois de amanhã'
    case -2:
      return 'anteontem'
    default:
      return null
  }
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const relative = getRelativeDays(dateObj)
  if (relative) {
    return relative
  }

  return formatDate(dateObj)
}

/**
 * Format date for voice output
 */
export function formatDateForVoice(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const relative = getRelativeDays(dateObj)
  if (relative) return relative

  const day = dateObj.getDate()
  const month = dateObj.toLocaleDateString('pt-BR', { month: 'long' })
  const year = dateObj.getFullYear()

  return `dia ${day} de ${month} de ${year}`
}

/**
 * Format time range (e.g., "das 9h às 17h")
 */
export function formatTimeRange(start: Date | string, end: Date | string): string {
  const startTime = (typeof start === 'string' ? new Date(start) : start).toLocaleTimeString(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )

  const endTime = (typeof end === 'string' ? new Date(end) : end).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `das ${startTime} às ${endTime}`
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format number with Brazilian thousands separator
 */
export function formatNumber(
  num: number,
  options?: {
    decimals?: number
    compact?: boolean
  }
): string {
  const { decimals = 0, compact = false } = options || {}

  if (compact && Math.abs(num) >= 1000) {
    return formatCompactNumber(num)
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format number with compact notation
 */
export function formatCompactNumber(num: number): string {
  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absNum >= 1_000_000_000) {
    return `${sign}${(absNum / 1_000_000_000).toFixed(1)}B`
  }

  if (absNum >= 1_000_000) {
    return `${sign}${(absNum / 1_000_000).toFixed(1)}M`
  }

  if (absNum >= 1_000) {
    return `${sign}${(absNum / 1_000).toFixed(1)}K`
  }

  return formatNumber(num)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  const effectiveDecimals = Number.isInteger(value) ? 0 : decimals
  const formatted = value.toFixed(effectiveDecimals)

  // Replace dot with comma for Brazilian format
  const withComma = formatted.replace('.', ',')

  // For integer values, show at least one decimal place if requested decimals > 0
  if (effectiveDecimals === 0 && decimals > 0) {
    return `${withComma},${'0'.repeat(decimals)}%`
  }

  return `${withComma}%`
}

// ============================================================================
// Document Formatting (CPF, CNPJ, etc)
// ============================================================================

/**
 * Format CPF (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) {
    return cpf // Return as-is if invalid
  }

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Format CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) {
    return cnpj
  }

  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Format CEP (00000-000)
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')

  if (cleaned.length !== 8) {
    return cep
  }

  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return phone
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Pluralize word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular

  return plural || `${singular}s`
}

/**
 * Format duration in Portuguese
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} ${pluralize(days, 'dia')}`
  }

  if (hours > 0) {
    return `${hours} ${pluralize(hours, 'hora')}`
  }

  if (minutes > 0) {
    return `${minutes} ${pluralize(minutes, 'minuto')}`
  }

  return `${seconds} ${pluralize(seconds, 'segundo')}`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Ordinal numbers in Portuguese (1º, 2º, 3ª, etc)
 */
export function ordinal(num: number, gender: 'masculine' | 'feminine' = 'masculine'): string {
  const suffix = gender === 'masculine' ? 'º' : 'ª'
  return `${num}${suffix}`
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate CPF format
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleaned)) return false // All same digits

  // Calculate verification digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0

  if (digit !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0

  return digit === parseInt(cleaned.charAt(10))
}

/**
 * Validate CNPJ format
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleaned)) return false

  // CNPJ validation algorithm
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const calculateDigit = (base: string, weights: number[]): number => {
    let sum = 0
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i]) * weights[i]
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const base = cleaned.substring(0, 12)
  const digit1 = calculateDigit(base, weights.slice(1))
  const digit2 = calculateDigit(base + digit1, weights)

  return cleaned === base + digit1 + digit2
}

// ============================================================================
// Exports
// ============================================================================

// Number-to-words converter for Brazilian Portuguese
export function numberToWords(num: number): string {
  if (num === 0) return 'zero'
  if (num === 100) return 'cem'
  if (num === 1000) return 'mil'

  const units = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']

  const teens = [
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

  const tens = [
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

  const hundreds = [
    '',
    'cem',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ]

  if (num < 10) return units[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) {
    const ten = Math.floor(num / 10)
    const unit = num % 10
    return unit > 0 ? `${tens[ten]} e ${units[unit]}` : tens[ten]
  }

  if (num < 1000) {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    if (remainder === 0) return hundreds[hundred]

    // Special case for 100
    if (hundred === 1) return `cem e ${numberToWords(remainder)}`

    return `${hundreds[hundred]} e ${numberToWords(remainder)}`
  }

  if (num < 2000) {
    const thousand = Math.floor(num / 1000)
    const remainder = num % 1000
    if (remainder === 0) return thousand === 1 ? 'mil' : `${numberToWords(thousand)} mil`

    if (thousand === 1) return `mil e ${numberToWords(remainder)}`
    return `${numberToWords(thousand)} mil e ${numberToWords(remainder)}`
  }

  // For larger numbers, return as string for now (can be extended later)
  return num.toString()
}

export const brazilianFormatters = {
  currency: formatCurrency,
  compactCurrency: formatCompactCurrency,
  currencyForVoice: formatCurrencyForVoice,
  date: formatDate,
  dateForVoice: formatDateForVoice,
  relativeDays: getRelativeDays,
  relativeDate: formatRelativeDate,
  timeRange: formatTimeRange,
  number: formatNumber,
  compactNumber: formatCompactNumber,
  percentage: formatPercentage,
  cpf: formatCPF,
  cnpj: formatCNPJ,
  cep: formatCEP,
  phone: formatPhone,
  pluralize,
  duration: formatDuration,
  fileSize: formatFileSize,
  ordinal,
  numberToWords,
}

export const brazilianValidators = {
  cpf: isValidCPF,
  cnpj: isValidCNPJ,
}

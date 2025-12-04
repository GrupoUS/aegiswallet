/**
 * Bank Patterns - Brazilian Bank Identification Constants
 *
 * Contains patterns and configurations for identifying and parsing
 * bank statements from major Brazilian financial institutions.
 */

// ========================================
// TYPES
// ========================================

/**
 * Bank pattern configuration for statement parsing
 */
export interface BankPattern {
	/** Bank name for display */
	name: string;
	/** Bank code (COMPE/ISPB) */
	code?: string;
	/** Keywords for detection (case-insensitive) */
	keywords: string[];
	/** Date format patterns used by this bank */
	dateFormats: string[];
	/** Regex patterns for monetary amounts */
	amountPatterns: RegExp[];
	/** Header patterns typically found in PDFs */
	headerPatterns: string[];
	/** CSV column name variations */
	csvColumnMappings?: {
		date: string[];
		description: string[];
		amount: string[];
		balance: string[];
		type: string[];
	};
}

// ========================================
// SUPPORTED BANKS
// ========================================

/**
 * List of supported Brazilian banks with their identification patterns
 */
export const SUPPORTED_BANKS: BankPattern[] = [
	{
		name: 'Nubank',
		code: '260',
		keywords: ['nubank', 'nu pagamentos', 'nu financeira', 'nubank s.a.'],
		dateFormats: ['DD MMM YYYY', 'DD MMM', 'YYYY-MM-DD'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'fatura', 'movimentação', 'nu pagamentos'],
		csvColumnMappings: {
			date: ['Data', 'data', 'Date'],
			description: ['Descrição', 'descrição', 'Título', 'titulo', 'Description'],
			amount: ['Valor', 'valor', 'Amount'],
			balance: ['Saldo', 'saldo', 'Balance'],
			type: ['Tipo', 'tipo', 'Type'],
		},
	},
	{
		name: 'Itaú',
		code: '341',
		keywords: ['itaú', 'itau', 'itau unibanco', 'itaú unibanco', 'banco itaú'],
		dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD/MM/YY'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'conta corrente', 'agência', 'itaú', 'personalité'],
		csvColumnMappings: {
			date: ['Data', 'data', 'Dt.Mov', 'Data Mov', 'Data Movimento'],
			description: ['Histórico', 'Descrição', 'Lançamento', 'Descrição do Lançamento'],
			amount: ['Valor', 'valor', 'Valor (R$)', 'Débito/Crédito'],
			balance: ['Saldo', 'Saldo (R$)', 'Saldo Disponível'],
			type: ['Tipo', 'D/C', 'Natureza'],
		},
	},
	{
		name: 'Bradesco',
		code: '237',
		keywords: ['bradesco', 'banco bradesco', 'bradesco s.a.'],
		dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD/MM/YY'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'bradesco', 'agência', 'conta corrente', 'net empresa'],
		csvColumnMappings: {
			date: ['Data', 'Data Mov.', 'Data Movimento', 'Dt. Movimento'],
			description: ['Histórico', 'Descrição', 'Lançamento'],
			amount: ['Valor', 'Valor R$', 'Valor (R$)'],
			balance: ['Saldo', 'Saldo R$', 'Saldo (R$)'],
			type: ['D/C', 'Tipo', 'Natureza'],
		},
	},
	{
		name: 'Banco do Brasil',
		code: '001',
		keywords: ['banco do brasil', 'bb', 'bb s.a.', 'banco do brasil s.a.'],
		dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD.MM.YYYY'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'banco do brasil', 'agência', 'conta', 'bb'],
		csvColumnMappings: {
			date: ['Data', 'Data do Movimento', 'Data Mov'],
			description: ['Histórico', 'Descrição', 'Lançamento'],
			amount: ['Valor', 'Valor R$', 'Valor (R$)', 'Débito', 'Crédito'],
			balance: ['Saldo', 'Saldo R$', 'Saldo Disponível'],
			type: ['Tipo', 'D/C'],
		},
	},
	{
		name: 'Santander',
		code: '033',
		keywords: ['santander', 'banco santander', 'santander brasil'],
		dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD/MM/YY'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'santander', 'agência', 'conta corrente', 'van gogh'],
		csvColumnMappings: {
			date: ['Data', 'Data Movimento', 'Data do Lançamento'],
			description: ['Histórico', 'Descrição', 'Lançamento', 'Descrição do Movimento'],
			amount: ['Valor', 'Valor R$', 'Valor (R$)'],
			balance: ['Saldo', 'Saldo R$', 'Saldo Final'],
			type: ['Tipo', 'D/C', 'Nat'],
		},
	},
	{
		name: 'Caixa',
		code: '104',
		keywords: [
			'caixa',
			'caixa econômica',
			'caixa economica federal',
			'cef',
			'caixa econômica federal',
		],
		dateFormats: ['DD/MM/YYYY', 'DD/MM', 'DD/MM/YY'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'caixa', 'cef', 'agência', 'conta'],
		csvColumnMappings: {
			date: ['Data', 'Data Mov', 'Data Movimento'],
			description: ['Histórico', 'Descrição', 'Lançamento'],
			amount: ['Valor', 'Valor R$', 'Valor (R$)'],
			balance: ['Saldo', 'Saldo R$', 'Saldo (R$)'],
			type: ['Tipo', 'D/C'],
		},
	},
	{
		name: 'Inter',
		code: '077',
		keywords: ['banco inter', 'inter', 'bancointer', 'banco inter s.a.'],
		dateFormats: ['DD/MM/YYYY', 'DD MMM YYYY', 'YYYY-MM-DD'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'inter', 'banco inter', 'movimentação'],
		csvColumnMappings: {
			date: ['Data', 'data', 'Data da Transação'],
			description: ['Descrição', 'descrição', 'Histórico'],
			amount: ['Valor', 'valor', 'Valor (R$)'],
			balance: ['Saldo', 'saldo', 'Saldo Disponível'],
			type: ['Tipo', 'tipo', 'Entrada/Saída'],
		},
	},
	{
		name: 'C6 Bank',
		code: '336',
		keywords: ['c6', 'c6 bank', 'c6bank', 'banco c6'],
		dateFormats: ['DD/MM/YYYY', 'DD MMM YYYY', 'YYYY-MM-DD'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'c6', 'c6 bank', 'movimentação'],
		csvColumnMappings: {
			date: ['Data', 'data'],
			description: ['Descrição', 'descrição', 'Histórico'],
			amount: ['Valor', 'valor'],
			balance: ['Saldo', 'saldo'],
			type: ['Tipo', 'tipo'],
		},
	},
	{
		name: 'PicPay',
		code: '380',
		keywords: ['picpay', 'pic pay', 'picpay serviços'],
		dateFormats: ['DD/MM/YYYY', 'DD MMM YYYY'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'picpay', 'movimentação'],
		csvColumnMappings: {
			date: ['Data', 'data'],
			description: ['Descrição', 'descrição'],
			amount: ['Valor', 'valor'],
			balance: ['Saldo', 'saldo'],
			type: ['Tipo', 'tipo'],
		},
	},
	{
		name: 'Mercado Pago',
		code: '323',
		keywords: ['mercado pago', 'mercadopago', 'mp', 'mercado livre'],
		dateFormats: ['DD/MM/YYYY', 'DD MMM YYYY', 'YYYY-MM-DD'],
		amountPatterns: [/R\$\s*-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g],
		headerPatterns: ['extrato', 'mercado pago', 'movimentação', 'atividade'],
		csvColumnMappings: {
			date: ['Data', 'data', 'Fecha'],
			description: ['Descrição', 'descrição', 'Detalle'],
			amount: ['Valor', 'valor', 'Monto'],
			balance: ['Saldo', 'saldo'],
			type: ['Tipo', 'tipo', 'Tipo de operación'],
		},
	},
];

// ========================================
// CONSTANTS
// ========================================

/**
 * Maximum file size allowed for upload (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed MIME types for import
 */
export const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'text/csv',
	'application/vnd.ms-excel',
	'text/plain', // Some CSV files are detected as text/plain
] as const;

/**
 * File extensions allowed for import
 */
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.csv'] as const;

/**
 * Maximum processing timeout in milliseconds (60 seconds)
 */
export const PROCESSING_TIMEOUT_MS = 60000;

/**
 * Minimum confidence threshold for automatic selection (70%)
 */
export const MIN_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Rate limiting configuration
 */
export const IMPORT_RATE_LIMIT = {
	windowMs: 60 * 1000, // 1 minute
	max: 10, // Maximum 10 imports per minute per user
} as const;

/**
 * Vercel Blob storage TTL for temporary files (1 hour)
 */
export const BLOB_TTL_SECONDS = 3600;

/**
 * Maximum number of transactions per import
 */
export const MAX_TRANSACTIONS_PER_IMPORT = 1000;

/**
 * Number of days to look back for duplicate detection
 */
export const DUPLICATE_DETECTION_DAYS = 90;

// ========================================
// TYPE EXPORTS
// ========================================

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export type AllowedFileExtension = (typeof ALLOWED_FILE_EXTENSIONS)[number];

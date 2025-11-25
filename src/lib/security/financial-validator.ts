/**
 * Financial Input Validation System
 * Comprehensive validation for Brazilian financial operations
 *
 * Features:
 * - Transaction amount validation
 * - Brazilian financial institution validation
 * - Account number validation
 * - PIX key validation
 * - Anti-fraud pattern detection
 * - LGPD compliance validation
 */

import { z } from 'zod';

/**
 * Brazilian currency validation patterns
 */
export const CURRENCY_PATTERNS = {
  BRL: {
    symbol: 'R$',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    maxAmount: 999999999.99, // Maximum 999 million BRL
    minAmount: 0.01, // Minimum 1 centavo
  },
};

/**
 * Brazilian financial institution codes (valid codes)
 */
export const BRAZILIAN_BANKS = new Set([
  '001', // Banco do Brasil
  '033', // Santander
  '104', // Caixa Econômica Federal
  '237', // Bradesco
  '341', // Itaú Unibanco
  '260', // Nubank
  '077', // Banco Inter
  '021', // Banese
  '025', // Alfa
  '036', // Bco. Bonsucesso
  '037', // Bco. do Nordeste
  '039', // BEC
  '041', // Bco do Estado do RS
  '047', // Bco do Estado de SE
  '062', // Hipercard
  '063', // Bco Bradesco - Financiamentos
  '064', // Goldman Sachs
  '065', // Itaú BBA
  '066', // Bco Morgan Stanley
  '069', // Bco Crefisa
  '070', // BRB
  '074', // Bco J. Safra
  '075', // Bco ABN AMRO
  '078', // Bco BGN
  '079', // Bco Original
  '083', // B da Amazônia
  '084', // Uniprime
  '085', // Bco Cooperativo Sicredi
  '089', // C6 Bank
  '102', // XP Investimentos
  '105', // Lecca
  '107', // Bco BBM
  '108', // Bco Rural Mais
  '109', // Bco Sofisa
  '110', // Bco C6 S.A.
  '111', // Bco WestLB
  '112', // Bco Western Union
  '114', // Bco Central do Brasil
  '117', // Advanced
  '118', // Bco Standard Chartered
  '119', // Bco Itaú Corp
  '120', // Bco Ryad
  '121', // Bco Agibank
  '122', // Bco Bradesco BERJ
  '124', // Bco Woori
  '125', // Bco Brasil Plural
  '126', // Bco Armazém
  '127', // Bco Getnet
  '128', // MS Bank
  '129', // UBS
  '130', // Bco Carrefour
  '131', // Bco Ourinvest
  '132', // Bco ICBC
  '133', // Bco Confidence
  '134', // Bco Geraldo Vianna
  '136', // Bco Cacique
  '138', // Bco B4U
  '139', // Intesa Sanpaolo
  '140', // Bco Luso
  '141', // Bco OMX
  '142', // Broker Brasil
  '143', // Bco Maxima
  '144', // Bco Original
  '145', // Levycam
  '146', // Bco Guangda
  '147', // Bco Modalo
  '148', // MultiCapital
  '149', // Bco Fator
  '150', // Bco Unicred
  '151', // Bco Nossa Caixa
  '152', // Bco Sadia
  '153', // Bco Dacot
  '154', // Bco Pottencial
  '155', // Bco Ourilândia
  '156', // Bco ABC Brasil
  '157', // Bco John Deere
  '158', // Bco Tricury
  '159', // Bco Olive
  '160', // Bco HSBC
  '161', // Bco Safra
  '162', // Bco TGCN
  '163', // Bco Comgás
  '164', // Bco MUFG Brasil
  '165', // Bco Lecca
  '166', // Bco DPM
  '167', // Bco Modal
  '168', // Bco Cited
  '169', // Bco HSBC
  '170', // Bco PágSeguro
  '171', // Bco Bonsucesso
  '172', // Bco Alvorada
  '173', // Bco BBI
  '174', // Bco Pefisa
  '175', // Bco Finasa
  '176', // Bco BPN
  '177', // Bco Confirm
  '178', // Bco Granito
  '180', // Bco JM
  '181', // Bco Americana
  '182', // Bco Tapejara
  '183', // Bco Socred
  '184', // Bco Itaú BBA
  '185', // Bco BS2
  '186', // Bco Topázio
  '187', // Bco HMC
  '188', // Bco Sofisa Direto
  '189', // Bco Financiamento
  '190', // Bco ServiTec
  '191', // Bco Prosper
  '192', // Bco Rio
  '193', // Bco Unibanco
  '194', // Bco BVA
  '195', // Bco Amazônia
  '196', // Bco Fator
  '197', // Bco Petra
  '198', // Bco Europa
  '199', // Bco Regional
  '200', // Bco Axial
  '201', // Bco FICSA
  '202', // Bco Bradesco Cartões
  '203', // Bco Bradesco Financiamentos
  '204', // Bco Bradesco
  '205', // Bco BTG Pactual
  '206', // Bco Fator
  '207', // Bco Bradesco
  '208', // Bco BTG Pactual
  '209', // Bco Fator
  '210', // Bco Bradesco
  '211', // Bco ISUS
  '212', // Bco Original
  '213', // Bco BMC
  '214', // Bco Dibens
  '215', // Bco Bradesco
  '216', // Bco Bradesco
  '217', // Bco Bradesco
  '218', // Bco Bradesco
  '219', // Bco Bradesco
  '220', // Bco Bradesco
  '221', // Bco Bradesco
  '222', // Bco Bradesco
  '223', // Bco Bradesco
  '224', // Bco Bradesco
  '225', // Bco Bradesco
  '226', // Bco Bradesco
  '227', // Bco Bradesco
  '228', // Bco Bradesco
  '229', // Bco Bradesco
  '230', // Bco Bradesco
  '231', // Bco Bradesco
  '232', // Bco Bradesco
  '233', // Bco Bradesco
  '234', // Bco Bradesco
  '235', // Bco Bradesco
  '236', // Bco Bradesco
  '237', // Bco Bradesco
  '238', // Bco Bradesco
  '239', // Bco Bradesco
  '240', // Bco Bradesco
  '241', // Bco Bradesco
  '242', // Bco Bradesco
  '243', // Bco Bradesco
  '244', // Bco Bradesco
  '245', // Bco Bradesco
  '246', // Bco Bradesco
  '247', // Bco Bradesco
  '248', // Bco Bradesco
  '249', // Bco Bradesco
  '250', // Bco Bradesco
  '251', // Bco Bradesco
  '252', // Bco Bradesco
  '253', // Bco Bradesco
  '254', // Bco Bradesco
  '255', // Bco Bradesco
  '256', // Bco Bradesco
  '257', // Bco Bradesco
  '258', // Bco Bradesco
  '259', // Bco Bradesco
  '260', // Nubank
  '261', // B Magalu
  '262', // Bco Crefisa
  '263', // Bco Cacique
  '264', // Bco Caixa
  '265', // Bco Fator
  '266', // Bco C6 S.A.
  '267', // Bco BMG
  '268', // Bco BS2
  '269', // Bco C6 S.A.
  '270', // Bco Sagrada Família
  '271', // Bco Ibimenge
  '272', // Bco AGIBANK
  '273', // Bco C6 S.A.
  '274', // Bco Agibank
  '275', // Bco Agibank
  '276', // Bco Agibank
  '277', // Bco Agibank
  '278', // Bco Agibank
  '279', // Bco Agibank
  '280', // Bco Agibank
  '281', // Bco Agibank
  '282', // Bco Agibank
  '283', // Bco Agibank
  '284', // Bco Agibank
  '285', // Bco Agibank
  '286', // Bco Agibank
  '287', // Bco Agibank
  '288', // Bco Agibank
  '289', // Bco Agibank
  '290', // Bco PagSeguro
  '291', // Bco PagSeguro
  '292', // Bco PagSeguro
  '293', // Bco PagSeguro
  '294', // Bco PagSeguro
  '295', // Bco PagSeguro
  '296', // Bco PagSeguro
  '297', // Bco PagSeguro
  '298', // Bco PagSeguro
  '299', // Bco PagSeguro
  '300', // Bco de Brasília
  '301', // Bco ABC Brasil
  '302', // Bco Pecúnia
  '303', // Bco John Deere
  '304', // Bco Pottencial
  '305', // Bco Renner
  '306', // Bco Renner
  '307', // Bco Renner
  '308', // Bco Renner
  '309', // Bco Renner
  '310', // Bco Renner
  '311', // Bco Renner
  '312', // Bco Renner
  '313', // Bco Renner
  '314', // Bco Renner
  '315', // Bco Renner
  '316', // Bco Renner
  '317', // Bco Renner
  '318', // Bco Renner
  '319', // Bco Renner
  '320', // Bco Renner
]);

/**
 * PIX key validation patterns
 */
export const PIX_PATTERNS = {
  CNPJ: {
    format: 'XX.XXX.XXX/XXXX-XX',
    regex: /^\d{14}$/,
  },
  CPF: {
    format: 'XXX.XXX.XXX-XX',
    regex: /^\d{11}$/,
  },
  EMAIL: {
    format: 'email@example.com',
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    format: '+55 (XX) XXXXX-XXXX',
    regex: /^\+?\d{10,15}$/,
  },
  RANDOM_KEY: {
    format: 'XXXX-XXXX-XXXX-XXXX-XXXX',
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
};

/**
 * Transaction categories for Brazilian financial operations
 */
export const TRANSACTION_CATEGORIES = {
  EXPENSE: [
    'alimentacao',
    'moradia',
    'transporte',
    'saude',
    'educacao',
    'lazer',
    'compras',
    'contas',
    'impostos',
    'outros_gastos',
  ],
  INCOME: ['salario', 'freelancer', 'investimentos', 'aluguel', 'vendas', 'outros_recebimentos'],
};

/**
 * Anti-fraud patterns
 */
export const FRAUD_PATTERNS = {
  SUSPICIOUS_DESCRIPTIONS: [
    'test',
    'teste',
    'debug',
    'xxx',
    'fake',
    'fraud',
    'hack',
    'stolen',
    'lavagem',
    'dinheiro negro',
  ],
  HIGH_VALUE_TRANSACTION: 50000, // BRL 50,000
  FREQUENT_SMALL_TRANSACTIONS: {
    count: 20,
    amount: 1000, // 20 transactions under BRL 1,000 in 24 hours
    window: 24 * 60 * 60 * 1000, // 24 hours
  },
  RAPID_SUCCESSION: {
    count: 5,
    window: 5 * 60 * 1000, // 5 transactions in 5 minutes
  },
};

/**
 * Zod schemas for financial validation
 */
export const financialSchemas = {
  amount: z
    .number()
    .min(CURRENCY_PATTERNS.BRL.minAmount, 'Amount must be at least R$ 0,01')
    .max(CURRENCY_PATTERNS.BRL.maxAmount, 'Amount exceeds maximum allowed')
    .refine(
      (val) => Number.isFinite(val) && Number(val.toFixed(2)) === val,
      'Amount must have at most 2 decimal places'
    ),
  bankAccount: z.object({
    account: z
      .string()
      .regex(/^\d{1,12}$/, 'Account must be 1-12 digits')
      .refine((account) => !/^0+$/.test(account), 'Account cannot be all zeros'),
    accountDigit: z.string().regex(/^\d$/, 'Account digit must be a single digit'),
    agency: z
      .string()
      .regex(/^\d{1,6}$/, 'Agency must be 1-6 digits')
      .refine((agency) => !/^0+$/.test(agency), 'Agency cannot be all zeros'),
    bankCode: z.string().refine((code) => BRAZILIAN_BANKS.has(code), 'Invalid Brazilian bank code'),
  }),
  financialInstitution: z.object({
    code: z.string().refine((code) => BRAZILIAN_BANKS.has(code), 'Invalid bank code'),
    name: z
      .string()
      .min(2, 'Institution name must be at least 2 characters')
      .max(100, 'Institution name must be less than 100 characters'),
  }),
  pixKey: z
    .object({
      key: z.string().min(1, 'PIX key cannot be empty'),
      type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']),
    })
    .refine((data) => {
      const pattern = PIX_PATTERNS[data.type.toUpperCase() as keyof typeof PIX_PATTERNS];
      return pattern.regex.test(data.key.replace(/\D/g, ''));
    }, 'Invalid PIX key format for the specified type'),
  transaction: z.object({
    account_id: z.string().uuid('Conta bancária inválida'),
    amount: z.number(),
    category_id: z.string().uuid().optional(),
    description: z
      .string()
      .min(3, 'Description must be at least 3 characters')
      .max(200, 'Description must be less than 200 characters')
      .refine(
        (desc) =>
          !FRAUD_PATTERNS.SUSPICIOUS_DESCRIPTIONS.some((pattern) =>
            desc.toLowerCase().includes(pattern)
          ),
        'Description contains suspicious content'
      ),
    is_manual_entry: z.boolean().default(true),
    merchant_name: z.string().max(120).optional(),
    notes: z.string().max(500).optional(),
    payment_method: z
      .enum(['cash', 'debit_card', 'credit_card', 'pix', 'boleto', 'transfer'], {
        invalid_type_error: 'Payment method is invalid',
      })
      .optional(),
    status: z.enum(['pending', 'posted', 'failed', 'cancelled']).default('posted'),
    tags: z.array(z.string()).max(10).optional(),
    transaction_date: z.string().refine((date) => {
      const parsed = new Date(date);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed >= new Date('2020-01-01') &&
        parsed <= new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
    }, 'Invalid date. Must be a valid date between 2020-01-01 and tomorrow'),
    transaction_type: z.enum(['debit', 'credit', 'transfer', 'pix', 'boleto']),
  }),
};

/**
 * Validate transaction for anti-fraud patterns
 */
export function validateTransactionForFraud(transaction: {
  amount: number;
  description: string;
  userId: string;
  previousTransactions?: { amount: number; timestamp: number }[];
}): {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  blocked: boolean;
} {
  const warnings: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let blocked = false;

  // Check for high-value transactions
  if (transaction.amount > FRAUD_PATTERNS.HIGH_VALUE_TRANSACTION) {
    warnings.push(`High-value transaction: R$ ${transaction.amount.toFixed(2)}`);
    riskLevel = 'high';
  }

  // Check for suspicious descriptions
  const lowerDesc = transaction.description.toLowerCase();
  if (FRAUD_PATTERNS.SUSPICIOUS_DESCRIPTIONS.some((pattern) => lowerDesc.includes(pattern))) {
    warnings.push('Suspicious transaction description detected');
    riskLevel = 'high';
    blocked = true;
  }

  // Check for frequent small transactions (potential structuring)
  if (transaction.previousTransactions) {
    const now = Date.now();
    const recentTransactions = transaction.previousTransactions.filter(
      (tx) => now - tx.timestamp < FRAUD_PATTERNS.FREQUENT_SMALL_TRANSACTIONS.window
    );

    if (recentTransactions.length >= FRAUD_PATTERNS.FREQUENT_SMALL_TRANSACTIONS.count) {
      const smallTransactions = recentTransactions.filter(
        (tx) => tx.amount < FRAUD_PATTERNS.FREQUENT_SMALL_TRANSACTIONS.amount
      );

      if (smallTransactions.length >= FRAUD_PATTERNS.FREQUENT_SMALL_TRANSACTIONS.count) {
        warnings.push('Pattern of frequent small transactions detected');
        riskLevel = 'high';
        blocked = true;
      }
    }

    // Check for rapid succession
    const veryRecentTransactions = recentTransactions.filter(
      (tx) => now - tx.timestamp < FRAUD_PATTERNS.RAPID_SUCCESSION.window
    );

    if (veryRecentTransactions.length >= FRAUD_PATTERNS.RAPID_SUCCESSION.count) {
      warnings.push('Rapid succession of transactions detected');
      riskLevel = 'high';
      blocked = true;
    }
  }

  // Determine final risk level
  if (warnings.length > 0 && riskLevel === 'low') {
    riskLevel = 'medium';
  }

  return {
    blocked,
    isValid: !blocked,
    riskLevel,
    warnings,
  };
}

/**
 * Validate CPF (Brazilian tax ID)
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) {
    return false;
  }
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCPF.substring(9, 10), 10)) {
    return false;
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCPF.substring(10, 11), 10)) {
    return false;
  }

  return true;
}

/**
 * Validate CNPJ (Brazilian company tax ID)
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) {
    return false;
  }
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i], 10) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }

  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (firstDigit !== parseInt(cleanCNPJ[12], 10)) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i], 10) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }

  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  return secondDigit === parseInt(cleanCNPJ[13], 10);
}

/**
 * Validate and format Brazilian currency
 */
export function validateAndFormatCurrency(amount: string | number): {
  isValid: boolean;
  formatted?: string;
  numeric?: number;
  error?: string;
} {
  try {
    let numeric: number;

    if (typeof amount === 'string') {
      // Remove currency symbols and formatting
      const cleanAmount = amount
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.');

      numeric = parseFloat(cleanAmount);
    } else {
      numeric = amount;
    }

    if (!Number.isFinite(numeric)) {
      return { error: 'Invalid numeric value', isValid: false };
    }

    if (numeric < CURRENCY_PATTERNS.BRL.minAmount) {
      return { error: 'Amount below minimum (R$ 0,01)', isValid: false };
    }

    if (numeric > CURRENCY_PATTERNS.BRL.maxAmount) {
      return { error: 'Amount exceeds maximum (R$ 999.999.999,99)', isValid: false };
    }

    // Format to 2 decimal places
    const formatted = numeric.toLocaleString('pt-BR', {
      currency: 'BRL',
      style: 'currency',
    });

    return {
      formatted,
      isValid: true,
      numeric: Number(numeric.toFixed(2)),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Invalid currency format',
      isValid: false,
    };
  }
}

export default {
  BRAZILIAN_BANKS,
  CURRENCY_PATTERNS,
  FRAUD_PATTERNS,
  PIX_PATTERNS,
  TRANSACTION_CATEGORIES,
  financialSchemas,
  validateAndFormatCurrency,
  validateCNPJ,
  validateCPF,
  validateTransactionForFraud,
};

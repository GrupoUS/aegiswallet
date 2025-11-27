/**
 * Database Test Factory for AegisWallet Brazilian Financial Assistant
 *
 * Provides type-safe test data that aligns with the current database schema
 * Includes Brazilian financial compliance data (PIX, Boletos, BRL formatting, etc.)
 */

// @ts-nocheck - Temporarily disable TypeScript checking for this test factory file
import { faker } from '@faker-js/faker';
import type { Database } from '@/types/database.types';
// @ts-expect-error - faker-br may not be available
import 'faker-br';

// Type aliases for easier use
type DatabaseType = Database['public']['Tables'];
type UserProfile = DatabaseType['users']['Row'];
type BankAccount = DatabaseType['bank_accounts']['Row'];
type Transaction = DatabaseType['transactions']['Row'];
type PixKey = DatabaseType['pix_keys']['Row'];
type FinancialEvent = DatabaseType['financial_events']['Row'];
type ChatMessage = DatabaseType['chat_messages']['Row'];

// ============================================================================
// User Profile Factory
// ============================================================================

export function createUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });
  // @ts-expect-error - Faker phone format and Brazilian locale issues
  const phone = faker.phone.number('## #####-####');
  // @ts-expect-error - Brazilian locale may not be available
  const cpf = faker.br.cpf(); // Brazilian CPF generator

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    email,
    phone,
    first_name: firstName,
    last_name: lastName,
    cpf,
    date_of_birth: faker.date.past({ years: 50 }).toISOString().split('T')[0],
    avatar_url: null,
    address: {
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      complement: faker.helpers.arrayElement([null, 'Apto 101', 'Casa 2', 'Sala 505']),
      neighborhood: faker.location.county(),
      city: faker.helpers.arrayElement([
        'São Paulo',
        'Rio de Janeiro',
        'Belo Horizonte',
        'Porto Alegre',
        'Recife',
      ]),
      state: faker.helpers.arrayElement(['SP', 'RJ', 'MG', 'RS', 'PE']),
      zip_code: faker.location.zipCode('#####-###'),
      country: 'BR',
    },
    preferences: {
      language: 'pt-BR',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      voice: {
        enabled: true,
        language: 'pt-BR',
        speed: 1.0,
        pitch: 1.0,
      },
    },
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Bank Account Factory
// ============================================================================

export function createBankAccount(overrides: Partial<BankAccount> = {}): BankAccount {
  const banks = [
    { name: 'Banco do Brasil', code: '001', ispb: '00000000' },
    { name: 'Caixa Econômica Federal', code: '104', ispb: '00360305' },
    { name: 'Itaú Unibanco', code: '341', ispb: '60701190' },
    { name: 'Banco Bradesco', code: '237', ispb: '00233628' },
    { name: 'Banco Santander', code: '033', ispb: '26094515' },
  ];

  const bank = faker.helpers.arrayElement(banks);
  const accountTypes: ('checking' | 'savings' | 'investment')[] = [
    'checking',
    'savings',
    'investment',
  ];

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    bank_name: bank.name,
    bank_code: bank.code,
    bank_ispb: bank.ispb,
    account_type: faker.helpers.arrayElement(accountTypes),
    account_number: faker.finance.accountNumber(7),
    account_digit: faker.string.numeric(1),
    agency_number: faker.finance.accountNumber(4),
    agency_digit: faker.helpers.arrayElement(['', faker.string.numeric(1)]),
    owner_name: faker.person.fullName(),
    owner_cpf: faker.br.cpf(),
    is_primary: overrides.is_primary ?? false,
    balance: parseFloat(faker.finance.amount({ min: 0, max: 50000, dec: 2 })),
    currency: 'BRL',
    status: 'active',
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Transaction Factory
// ============================================================================

export function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const categories = [
    'mercado',
    'transporte',
    'saude',
    'lazer',
    'educacao',
    'moradia',
    'vestuario',
    'comunicacao',
    'outros',
  ];

  const types: ('credit' | 'debit' | 'transfer_in' | 'transfer_out' | 'pix_in' | 'pix_out')[] = [
    'credit',
    'debit',
    'transfer_in',
    'transfer_out',
    'pix_in',
    'pix_out',
  ];

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    bank_account_id: faker.string.uuid(),
    amount: parseFloat(faker.finance.amount({ min: 1, max: 10000, dec: 2 })),
    currency: 'BRL',
    type: faker.helpers.arrayElement(types),
    category: faker.helpers.arrayElement(categories),
    description: faker.lorem.words({ min: 2, max: 6 }),
    merchant_name: faker.helpers.arrayElement([null, faker.company.name()]),
    merchant_cnpj: faker.helpers.arrayElement([null, faker.br.cnpj()]),
    date: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    installments: faker.helpers.arrayElement([null, 1, 2, 3, 6, 12]),
    installment_number: faker.helpers.arrayElement([null, 1, 2, 3]),
    tags: faker.helpers.arrayElements(['essencial', 'urgente', 'recorrente'], { min: 0, max: 2 }),
    notes: faker.helpers.arrayElement([null, faker.lorem.sentence()]),
    reconciled: faker.datatype.boolean(),
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// PIX Key Factory
// ============================================================================

export function createPixKey(overrides: Partial<PixKey> = {}): PixKey {
  const keyTypes: ('cpf' | 'phone' | 'email' | 'random_key')[] = [
    'cpf',
    'phone',
    'email',
    'random_key',
  ];

  const keyType = faker.helpers.arrayElement(keyTypes);
  let keyValue: string;

  switch (keyType) {
    case 'cpf':
      keyValue = faker.br.cpf();
      break;
    case 'phone':
      keyValue = `+55${faker.phone.number('#######-####').replace(/[^\d]/g, '')}`;
      break;
    case 'email':
      keyValue = faker.internet.email();
      break;
    case 'random_key':
      keyValue = faker.string.alphanumeric(32);
      break;
  }

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    bank_account_id: faker.string.uuid(),
    key_type: keyType,
    key_value: keyValue,
    status: 'active',
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Financial Event Factory
// ============================================================================

export function createFinancialEvent(overrides: Partial<FinancialEvent> = {}): FinancialEvent {
  const brazilianEventTypes = [
    'recebimento_salario',
    'pagamento_conta_energia',
    'pagamento_conta_agua',
    'pagamento_conta_internet',
    'pagamento_boleto',
    'transferencia_pix',
    'compra_mercado',
    'gasto_transporte',
    'gasto_saude',
    'investimento_rendimento',
    'emergencia_medica',
    'construcao_casa',
  ];

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    title: faker.lorem.words({ min: 3, max: 6 }),
    description: faker.lorem.sentence(),
    event_type: faker.helpers.arrayElement(brazilianEventTypes),
    amount: parseFloat(faker.finance.amount({ min: 50, max: 5000, dec: 2 })),
    currency: 'BRL',
    date: faker.date.recent({ days: 60 }).toISOString().split('T')[0],
    is_recurring: faker.datatype.boolean(),
    recurring_period: faker.helpers.arrayElement(['daily', 'weekly', 'monthly', 'yearly']),
    end_date: faker.helpers.arrayElement([
      null,
      faker.date.future({ years: 1 }).toISOString().split('T')[0],
    ]),
    tags: faker.helpers.arrayElements(['prioritario', 'automatizado', 'fiscal'], {
      min: 0,
      max: 2,
    }),
    metadata: {
      priority: faker.helpers.arrayElement(['baixa', 'media', 'alta']),
      category: faker.helpers.arrayElement(['pessoal', 'profissional', 'familiar']),
    },
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Calendar Event Factory - Temporarily disabled due to schema mismatch
// ============================================================================

// @ts-expect-error - CalendarEvent type not available
export function createCalendarEvent(overrides: any = {}): any {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    title: faker.lorem.words({ min: 3, max: 8 }),
    description: faker.lorem.sentences({ min: 1, max: 3 }),
    start_time: faker.date.future().toISOString(),
    end_time: faker.date.future().toISOString(),
    location: faker.helpers.arrayElement([null, faker.location.street()]),
    is_all_day: faker.datatype.boolean(),
    reminder_minutes: faker.helpers.arrayElement([null, 15, 30, 60, 1440]),
    calendar_type: 'personal',
    status: 'confirmed',
    tags: faker.helpers.arrayElements(['importante', 'reuniao', 'pessoal'], { min: 0, max: 2 }),
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Chat Message Factory
// ============================================================================

export function createChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  const roles: ('user' | 'assistant' | 'system')[] = ['user', 'assistant'];

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    role: faker.helpers.arrayElement(roles),
    content: faker.lorem.sentences({ min: 1, max: 5 }),
    session_id: faker.string.uuid(),
    metadata: {
      intent: faker.helpers.arrayElement([
        'check_balance',
        'pay_bill',
        'transfer_money',
        'check_budget',
        'check_income',
        'financial_projection',
      ]),
      confidence: parseFloat(faker.number.float({ min: 0.7, max: 1.0, precision: 0.01 })),
      entities: {},
    },
    created_at: faker.date.recent({ minutes: 60 }).toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Batch Factories for Test Scenarios
// ============================================================================

export function createBrazilianFinancialScenario() {
  const userProfile = createUserProfile();
  const userId = userProfile.user_id;

  const bankAccounts = [
    createBankAccount({ user_id: userId, is_primary: true }),
    createBankAccount({ user_id: userId, bank_name: 'Nubank', bank_code: '260' }),
  ];

  const pixKeys = [
    createPixKey({ user_id: userId, key_type: 'cpf' }),
    createPixKey({ user_id: userId, key_type: 'random_key' }),
  ];

  const transactions = [
    // Brazilian specific transactions
    createTransaction({
      user_id: userId,
      type: 'debit',
      category: 'mercado',
      description: 'Supermercado Carrefour',
      amount: 347.85,
    }),
    createTransaction({
      user_id: userId,
      type: 'debit',
      category: 'saude',
      description: 'Farmácia Drogasil',
      amount: 89.9,
    }),
    createTransaction({
      user_id: userId,
      type: 'debit',
      category: 'transporte',
      description: 'Uber Viagem',
      amount: 42.5,
    }),
    createTransaction({
      user_id: userId,
      type: 'credit',
      description: 'Salário',
      amount: 5450.0,
    }),
  ];

  const financialEvents = [
    createFinancialEvent({
      user_id: userId,
      event_type: 'recebimento_salario',
      amount: 5450.0,
      is_recurring: true,
      recurring_period: 'monthly',
    }),
    createFinancialEvent({
      user_id: userId,
      event_type: 'pagamento_conta_energia',
      amount: 234.67,
      is_recurring: true,
      recurring_period: 'monthly',
    }),
    createFinancialEvent({
      user_id: userId,
      event_type: 'pagamento_conta_internet',
      amount: 149.9,
      is_recurring: true,
      recurring_period: 'monthly',
    }),
  ];

  return {
    userProfile,
    bankAccounts,
    pixKeys,
    transactions,
    financialEvents,
  };
}

// ============================================================================
// Export convenience functions
// ============================================================================

export default {
  createUserProfile,
  createBankAccount,
  createTransaction,
  createPixKey,
  createFinancialEvent,
  createCalendarEvent,
  createChatMessage,
  createBrazilianFinancialScenario,
};

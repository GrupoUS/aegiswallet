/**
 * Brazilian Financial Data Test Suite
 * 
 * Validates that test fixtures align with the current database schema
 * Tests Brazilian-specific financial data and compliance
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { setupMockDatabase } from '../mocks/supabase-mock';

describe('Brazilian Financial Data Schema Alignment', () => {
  beforeEach(() => {
    // Clear all mock data before each test
    setupMockDatabase.clear('user_profiles');
    setupMockDatabase.clear('bank_accounts');
    setupMockDatabase.clear('transactions');
    setupMockDatabase.clear('pix_keys');
    setupMockDatabase.clear('financial_events');
  });

  describe('User Profile Schema', () => {
    it('should create user profile with Brazilian CPF', async () => {
      const userProfile = {
        id: 'test-user-id',
        user_id: 'user-123',
        email: 'joao.silva@email.com',
        phone: '11 98765-4321',
        first_name: 'João',
        last_name: 'Silva',
        cpf: '123.456.789-00',
        date_of_birth: '1990-01-01',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 101',
          neighborhood: 'Vila Madalena',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '05443-000',
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(userProfile)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.cpf).toBe('123.456.789-00');
      expect(data!.preferences.language).toBe('pt-BR');
      expect(data!.preferences.currency).toBe('BRL');
      expect(data!.address.country).toBe('BR');
    });

    it('should validate Brazilian address structure', async () => {
      const userProfile = {
        user_id: 'user-123',
        email: 'maria.santos@email.com',
        first_name: 'Maria',
        last_name: 'Santos',
        cpf: '987.654.321-00',
        address: {
          street: 'Avenida Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01310-100',
          country: 'BR',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(userProfile)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.address.state).toBe('SP');
      expect(data!.address.zip_code).toMatch(/^\d{5}-\d{3}$/);
    });
  });

  describe('Bank Account Schema', () => {
    it('should create Brazilian bank account with proper codes', async () => {
      const bankAccount = {
        user_id: 'user-123',
        bank_name: 'Banco do Brasil',
        bank_code: '001',
        bank_ispb: '00000000',
        account_type: 'checking',
        account_number: '1234567',
        account_digit: '8',
        agency_number: '1234',
        agency_digit: '1',
        owner_name: 'João Silva',
        owner_cpf: '123.456.789-00',
        is_primary: true,
        balance: 5000.00,
        currency: 'BRL',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(bankAccount)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.bank_code).toBe('001');
      expect(data!.currency).toBe('BRL');
      expect(data!.balance).toBe(5000.00);
      expect(data!.is_primary).toBe(true);
    });
  });

  describe('PIX Keys Schema', () => {
    it('should create PIX keys for Brazilian financial system', async () => {
      const pixKey = {
        user_id: 'user-123',
        bank_account_id: 'bank-account-1',
        key_type: 'cpf' as const,
        key_value: '123.456.789-00',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pix_keys')
        .insert(pixKey)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.key_type).toBe('cpf');
      expect(data!.key_value).toBe('123.456.789-00');
      expect(data!.status).toBe('active');
    });
  });

  describe('Transactions Schema', () => {
    it('should create Brazilian financial transactions', async () => {
      const transaction = {
        user_id: 'user-123',
        bank_account_id: 'bank-account-1',
        amount: 347.85,
        currency: 'BRL',
        type: 'debit' as const,
        category: 'mercado',
        description: 'Supermercado Carrefour',
        merchant_name: 'Carrefour Comércio e Indústria Ltda',
        merchant_cnpj: '00.531.610/0001-54',
        date: new Date().toISOString().split('T')[0],
        tags: ['essencial'],
        notes: 'Compra mensal de supermercado',
        reconciled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.amount).toBe(347.85);
      expect(data!.currency).toBe('BRL');
      expect(data!.type).toBe('debit');
      expect(data!.category).toBe('mercado');
      expect(data!.merchant_cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
    });
  });

  describe('Financial Events Schema', () => {
    it('should create Brazilian financial events', async () => {
      const financialEvent = {
        user_id: 'user-123',
        title: 'Pagamento de Conta de Energia',
        description: 'Conta mensal de energia elétrica',
        event_type: 'pagamento_conta_energia',
        amount: 234.67,
        currency: 'BRL',
        date: new Date().toISOString().split('T')[0],
        is_recurring: true,
        recurring_period: 'monthly',
        tags: ['prioritario', 'automatizado'],
        metadata: {
          priority: 'alta',
          category: 'essencial',
          due_day: 15,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('financial_events')
        .insert(financialEvent)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.event_type).toBe('pagamento_conta_energia');
      expect(data!.amount).toBe(234.67);
      expect(data!.currency).toBe('BRL');
      expect(data!.is_recurring).toBe(true);
      expect(data!.recurring_period).toBe('monthly');
    });
  });
});
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  sanitizeFinancialEventData,
  validateFinancialEventForInsert,
  validateFinancialEventForUpdate,
} from '@/lib/validation/financial-events-validator';
import type { Database } from '@/types/database.types';
import type { FinancialEvent } from '@/types/financial-events';
import { cleanupUserData, createTestUser, getSupabaseAdminClient } from './helpers';

type DbFinancialEventRow = Database['public']['Tables']['financial_events']['Row'];

const supabase = getSupabaseAdminClient();

describe('Financial Events Integration', () => {
  let testUser: { id: string; email: string };
  let createdEventIds: string[] = [];

  beforeAll(async () => {
    testUser = await createTestUser(supabase);
  });

  afterEach(async () => {
    if (createdEventIds.length) {
      await supabase.from('financial_events').delete().in('id', createdEventIds);
      createdEventIds = [];
    }
  });

  afterAll(async () => {
    await cleanupUserData(supabase, testUser.id);
  });

  const createEventRecord = async (event: Partial<FinancialEvent>) => {
    const sanitized = sanitizeFinancialEventData({ ...event, userId: testUser.id });
    const validation = validateFinancialEventForInsert(sanitized);
    if (!validation.valid) {
      throw new Error(validation.errors.map((err) => `${err.field}: ${err.message}`).join(', '));
    }

    if (
      sanitized.title === undefined ||
      sanitized.amount === undefined ||
      !sanitized.start ||
      !sanitized.type
    ) {
      throw new Error('Campos obrigatórios ausentes para criar evento');
    }

    const row = {
      all_day: sanitized.allDay || false, amount: sanitized.amount, attachments: sanitized.attachments || null, brazilian_event_type: sanitized.brazilianEventType || null, category: (sanitized.category as string) || null, color: sanitized.color || 'blue', completed_at: sanitized.completedAt ? sanitized.completedAt.toISOString() : null, created_at: new Date().toISOString(), description: sanitized.description || null, due_date: sanitized.dueDate ? sanitized.dueDate.toISOString().split('T')[0] : null, end_date: (sanitized.end || sanitized.start).toISOString(), event_type: sanitized.type, icon: sanitized.icon || null, installment_info: sanitized.installmentInfo
        ? JSON.stringify(sanitized.installmentInfo)
        : null, is_income: sanitized.type === 'income', is_recurring: sanitized.isRecurring || false, location: sanitized.location || null, merchant_category: sanitized.metadata?.merchantCategory || null, metadata: sanitized.metadata ? JSON.stringify(sanitized.metadata) : null, notes: sanitized.notes || null, parent_event_id: (sanitized as { parentEventId?: string }).parentEventId || null, priority: sanitized.priority || 'NORMAL', recurrence_rule: sanitized.recurrenceRule || null, start_date: sanitized.start.toISOString(), status: sanitized.status || 'pending', tags: sanitized.tags || null, title: sanitized.title, updated_at: new Date().toISOString(), user_id: testUser.id,
    };

    const { data, error } = await supabase.from('financial_events').insert(row).select().single();
    if (error || !data) {
      throw new Error(`Falha ao criar evento: ${error?.message}`);
    }

    createdEventIds.push(data.id);
    return data as DbFinancialEventRow;
  };

  it('cria um evento de receita e persiste todos os campos essenciais', async () => {
    const start = new Date('2025-01-05T12:00:00Z');
    const eventRow = await createEventRecord({
      allDay: false, amount: 9500.5, category: 'RECEITA', color: 'emerald', end: new Date('2025-01-05T12:30:00Z'), start, status: 'paid', title: 'Salário Janeiro', type: 'income',
    });

    expect(eventRow.is_income).toBe(true);
    expect(eventRow.event_type).toBe('income');
    expect(eventRow.amount).toBe(9500.5);
    expect(eventRow.status).toBe('paid');
  });

  it('cria um evento de despesa e marca is_income como false', async () => {
    const eventRow = await createEventRecord({
      amount: -3200, end: new Date('2025-01-01T08:30:00Z'), notes: 'Vencimento dia 1', priority: 'ALTA', start: new Date('2025-01-01T08:00:00Z'), status: 'pending', title: 'Aluguel', type: 'expense',
    });

    expect(eventRow.is_income).toBe(false);
    expect(eventRow.priority).toBe('ALTA');
    expect(eventRow.notes).toBe('Vencimento dia 1');
  });

  it('persiste o campo brazilian_event_type', async () => {
    const eventRow = await createEventRecord({
      amount: 1500, brazilianEventType: 'DECIMO_TERCEIRO', end: new Date('2025-01-10T15:30:00Z'), start: new Date('2025-01-10T15:00:00Z'), title: 'Pagamento 13º', type: 'income',
    });

    expect(eventRow.brazilian_event_type).toBe('DECIMO_TERCEIRO');
  });

  it('armazena installment_info corretamente em JSONB', async () => {
    const eventRow = await createEventRecord({
      amount: -900, end: new Date('2025-02-01T12:30:00Z'), installmentInfo: {
        totalInstallments: 6,
        currentInstallment: 1,
        installmentAmount: 150,
        remainingAmount: 750,
        nextInstallmentDate: new Date('2025-03-01T12:00:00Z').toISOString(),
      }, start: new Date('2025-02-01T12:00:00Z'), title: 'Compra parcelada', type: 'expense',
    });

    expect(eventRow.installment_info).not.toBeNull();
    const parsed =
      typeof eventRow.installment_info === 'string'
        ? JSON.parse(eventRow.installment_info)
        : (eventRow.installment_info as Record<string, unknown>);
    expect(parsed.totalInstallments).toBe(6);
  });

  it('armazena metadata com merchantCategory', async () => {
    const eventRow = await createEventRecord({
      amount: -120.75, end: new Date('2025-02-12T20:30:00Z'), metadata: {
        merchantCategory: 'RESTAURANTE',
        confidence: 0.92,
        dataSource: 'VOICE',
      }, start: new Date('2025-02-12T19:30:00Z'), title: 'Restaurante', type: 'expense',
    });

    expect(eventRow.merchant_category).toBe('RESTAURANTE');
    const parsedMetadata =
      typeof eventRow.metadata === 'string'
        ? JSON.parse(eventRow.metadata)
        : (eventRow.metadata as Record<string, unknown> | null);
    expect(parsedMetadata?.confidence).toBe(0.92);
  });

  it('atualiza campos avançados e atualiza updated_at', async () => {
    const created = await createEventRecord({
      amount: -230, end: new Date('2025-01-20T10:15:00Z'), start: new Date('2025-01-20T10:00:00Z'), status: 'pending', title: 'Conta de Luz', type: 'bill',
    });

    const sanitized = sanitizeFinancialEventData({
      dueDate: new Date('2025-01-25T03:00:00Z'), metadata: { merchantCategory: 'LUZ', confidence: 0.8 }, status: 'paid',
    });
    const validation = validateFinancialEventForUpdate(sanitized);
    expect(validation.valid).toBe(true);

    const { data, error } = await supabase
      .from('financial_events')
      .update({
        due_date: sanitized.dueDate ? sanitized.dueDate.toISOString().split('T')[0] : null, merchant_category: sanitized.metadata?.merchantCategory || null, metadata: sanitized.metadata ? JSON.stringify(sanitized.metadata) : null, status: sanitized.status,
      })
      .eq('id', created.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('paid');
    expect(data?.due_date).toBe('2025-01-25');
    const updatedAt = data?.updated_at ? new Date(data.updated_at).getTime() : 0;
    const createdAt = created.updated_at ? new Date(created.updated_at).getTime() : 0;
    expect(updatedAt).toBeGreaterThan(createdAt);
  });

  it('exclui um evento financeiro e garante remoção', async () => {
    const created = await createEventRecord({
      amount: -50, end: new Date('2025-04-01T09:30:00Z'), start: new Date('2025-04-01T09:00:00Z'), title: 'Evento temporário', type: 'expense',
    });

    const { error } = await supabase.from('financial_events').delete().eq('id', created.id);
    expect(error).toBeNull();
    createdEventIds = createdEventIds.filter((id) => id !== created.id);

    const { data } = await supabase
      .from('financial_events')
      .select('id')
      .eq('id', created.id)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it('bloqueia criação quando faltam campos obrigatórios (validação)', () => {
    const sanitized = sanitizeFinancialEventData({ amount: 100 });
    const validation = validateFinancialEventForInsert(sanitized);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => err.field === 'title')).toBe(true);
  });

  it('reprova eventos com data final anterior à inicial', () => {
    const sanitized = sanitizeFinancialEventData({
      amount: 100, end: new Date('2025-05-09T10:00:00Z'), start: new Date('2025-05-10T10:00:00Z'), title: 'Evento inválido', type: 'income', userId: testUser.id,
    });
    const validation = validateFinancialEventForInsert(sanitized);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => err.field === 'end')).toBe(true);
  });

  it('filtra eventos por intervalo de datas', async () => {
    const dates = [
      new Date('2025-06-01T10:00:00Z'),
      new Date('2025-06-10T10:00:00Z'),
      new Date('2025-07-01T10:00:00Z'),
    ];
    for (const date of dates) {
      await createEventRecord({
        amount: -100, end: new Date(date.getTime() + 15 * 60 * 1000), start: date, title: `Evento ${date.toISOString()}`, type: 'expense',
      });
    }

    const { data, error } = await supabase
      .from('financial_events')
      .select('id, start_date')
      .eq('user_id', testUser.id)
      .gte('start_date', '2025-06-01T00:00:00Z')
      .lte('start_date', '2025-06-30T23:59:59Z');

    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThanOrEqual(2);
  });

  it('filtra eventos por status', async () => {
    await createEventRecord({
      amount: -80, end: new Date('2025-07-05T08:15:00Z'), start: new Date('2025-07-05T08:00:00Z'), status: 'paid', title: 'Conta paga', type: 'bill',
    });
    await createEventRecord({
      amount: -60, end: new Date('2025-07-06T08:15:00Z'), start: new Date('2025-07-06T08:00:00Z'), status: 'pending', title: 'Conta pendente', type: 'bill',
    });

    const { data, error } = await supabase
      .from('financial_events')
      .select('id, status')
      .eq('user_id', testUser.id)
      .eq('status', 'paid');

    expect(error).toBeNull();
    expect(data?.every((row) => row.status === 'paid')).toBe(true);
  });
});

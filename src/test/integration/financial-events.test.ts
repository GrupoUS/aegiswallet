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
      user_id: testUser.id,
      title: sanitized.title,
      description: sanitized.description || null,
      amount: sanitized.amount,
      start_date: sanitized.start.toISOString(),
      end_date: (sanitized.end || sanitized.start).toISOString(),
      event_type: sanitized.type,
      is_income: sanitized.type === 'income',
      category: (sanitized.category as string) || null,
      location: sanitized.location || null,
      is_recurring: sanitized.isRecurring || false,
      all_day: sanitized.allDay || false,
      status: sanitized.status || 'pending',
      color: sanitized.color || 'blue',
      priority: sanitized.priority || 'NORMAL',
      recurrence_rule: sanitized.recurrenceRule || null,
      parent_event_id: (sanitized as { parentEventId?: string }).parentEventId || null,
      due_date: sanitized.dueDate ? sanitized.dueDate.toISOString().split('T')[0] : null,
      completed_at: sanitized.completedAt ? sanitized.completedAt.toISOString() : null,
      notes: sanitized.notes || null,
      tags: sanitized.tags || null,
      icon: sanitized.icon || null,
      attachments: sanitized.attachments || null,
      brazilian_event_type: sanitized.brazilianEventType || null,
      installment_info: sanitized.installmentInfo
        ? JSON.stringify(sanitized.installmentInfo)
        : null,
      metadata: sanitized.metadata ? JSON.stringify(sanitized.metadata) : null,
      merchant_category: sanitized.metadata?.merchantCategory || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      title: 'Salário Janeiro',
      amount: 9500.5,
      start,
      end: new Date('2025-01-05T12:30:00Z'),
      type: 'income',
      status: 'paid',
      category: 'RECEITA',
      color: 'emerald',
      allDay: false,
    });

    expect(eventRow.is_income).toBe(true);
    expect(eventRow.event_type).toBe('income');
    expect(eventRow.amount).toBe(9500.5);
    expect(eventRow.status).toBe('paid');
  });

  it('cria um evento de despesa e marca is_income como false', async () => {
    const eventRow = await createEventRecord({
      title: 'Aluguel',
      amount: -3200,
      start: new Date('2025-01-01T08:00:00Z'),
      end: new Date('2025-01-01T08:30:00Z'),
      type: 'expense',
      status: 'pending',
      priority: 'ALTA',
      notes: 'Vencimento dia 1',
    });

    expect(eventRow.is_income).toBe(false);
    expect(eventRow.priority).toBe('ALTA');
    expect(eventRow.notes).toBe('Vencimento dia 1');
  });

  it('persiste o campo brazilian_event_type', async () => {
    const eventRow = await createEventRecord({
      title: 'Pagamento 13º',
      amount: 1500,
      start: new Date('2025-01-10T15:00:00Z'),
      end: new Date('2025-01-10T15:30:00Z'),
      type: 'income',
      brazilianEventType: 'DECIMO_TERCEIRO',
    });

    expect(eventRow.brazilian_event_type).toBe('DECIMO_TERCEIRO');
  });

  it('armazena installment_info corretamente em JSONB', async () => {
    const eventRow = await createEventRecord({
      title: 'Compra parcelada',
      amount: -900,
      start: new Date('2025-02-01T12:00:00Z'),
      end: new Date('2025-02-01T12:30:00Z'),
      type: 'expense',
      installmentInfo: {
        totalInstallments: 6,
        currentInstallment: 1,
        installmentAmount: 150,
        remainingAmount: 750,
        nextInstallmentDate: new Date('2025-03-01T12:00:00Z').toISOString(),
      },
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
      title: 'Restaurante',
      amount: -120.75,
      start: new Date('2025-02-12T19:30:00Z'),
      end: new Date('2025-02-12T20:30:00Z'),
      type: 'expense',
      metadata: {
        merchantCategory: 'RESTAURANTE',
        confidence: 0.92,
        dataSource: 'VOICE',
      },
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
      title: 'Conta de Luz',
      amount: -230,
      start: new Date('2025-01-20T10:00:00Z'),
      end: new Date('2025-01-20T10:15:00Z'),
      type: 'bill',
      status: 'pending',
    });

    const sanitized = sanitizeFinancialEventData({
      dueDate: new Date('2025-01-25T03:00:00Z'),
      status: 'paid',
      metadata: { merchantCategory: 'LUZ', confidence: 0.8 },
    });
    const validation = validateFinancialEventForUpdate(sanitized);
    expect(validation.valid).toBe(true);

    const { data, error } = await supabase
      .from('financial_events')
      .update({
        due_date: sanitized.dueDate ? sanitized.dueDate.toISOString().split('T')[0] : null,
        status: sanitized.status,
        metadata: sanitized.metadata ? JSON.stringify(sanitized.metadata) : null,
        merchant_category: sanitized.metadata?.merchantCategory || null,
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
      title: 'Evento temporário',
      amount: -50,
      start: new Date('2025-04-01T09:00:00Z'),
      end: new Date('2025-04-01T09:30:00Z'),
      type: 'expense',
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
      title: 'Evento inválido',
      amount: 100,
      start: new Date('2025-05-10T10:00:00Z'),
      end: new Date('2025-05-09T10:00:00Z'),
      type: 'income',
      userId: testUser.id,
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
        title: `Evento ${date.toISOString()}`,
        amount: -100,
        start: date,
        end: new Date(date.getTime() + 15 * 60 * 1000),
        type: 'expense',
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
      title: 'Conta paga',
      amount: -80,
      start: new Date('2025-07-05T08:00:00Z'),
      end: new Date('2025-07-05T08:15:00Z'),
      type: 'bill',
      status: 'paid',
    });
    await createEventRecord({
      title: 'Conta pendente',
      amount: -60,
      start: new Date('2025-07-06T08:00:00Z'),
      end: new Date('2025-07-06T08:15:00Z'),
      type: 'bill',
      status: 'pending',
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

/**
 * Financial Events Integration Tests
 *
 * Tests Drizzle database operations for financial events CRUD
 * including validation and date filtering.
 */
import { and, eq, gte, lte } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
	cleanupFinancialEvents,
	cleanupUserData,
	createTestUser,
	type DbClient,
	financialEvents,
	getTestDbClient,
	hasIntegrationTestEnv,
	type TestUser,
} from './helpers';
import {
	sanitizeFinancialEventData,
	type ValidationError,
	validateFinancialEventForInsert,
	validateFinancialEventForUpdate,
} from '@/lib/validation/financial-events-validator';
import type { FinancialEvent } from '@/types/financial-events';

describe.skipIf(!hasIntegrationTestEnv())('Financial Events Integration', () => {
	let testUser: TestUser;
	let createdEventIds: string[] = [];
	let db: DbClient;

	beforeAll(async () => {
		db = getTestDbClient();
		testUser = await createTestUser(db);
	});

	afterEach(async () => {
		if (createdEventIds.length) {
			await cleanupFinancialEvents(createdEventIds, db);
			createdEventIds = [];
		}
	});

	afterAll(async () => {
		await cleanupUserData(testUser.id, db);
	});

	// Helper to build database row from sanitized data
	const buildEventRow = (
		sanitized: ReturnType<typeof sanitizeFinancialEventData> & {
			title: string;
			amount: number;
			start: Date;
			type: string;
		},
		userId: string,
	) => {
		const now = new Date();
		return {
			userId,
			title: sanitized.title,
			description: sanitized.description ?? null,
			amount: String(sanitized.amount),
			status: sanitized.status ?? 'pending',
			startDate: sanitized.start,
			endDate: sanitized.end ?? sanitized.start,
			allDay: sanitized.allDay ?? false,
			color: sanitized.color ?? 'blue',
			icon: sanitized.icon ?? null,
			isIncome: sanitized.type === 'income',
			isRecurring: sanitized.isRecurring ?? false,
			recurrenceRule: sanitized.recurrenceRule ?? null,
			parentEventId: (sanitized as { parentEventId?: string }).parentEventId ?? null,
			location: sanitized.location ?? null,
			notes: sanitized.notes ?? null,
			dueDate: sanitized.dueDate?.toISOString().split('T')[0] ?? null,
			completedAt: sanitized.completedAt ?? null,
			priority: sanitized.priority ?? 'normal',
			tags: sanitized.tags ?? null,
			attachments: sanitized.attachments ?? null,
			brazilianEventType: sanitized.brazilianEventType ?? null,
			installmentInfo: sanitized.installmentInfo ?? null,
			merchantCategory: sanitized.metadata?.merchantCategory ?? null,
			metadata: sanitized.metadata ?? null,
			createdAt: now,
			updatedAt: now,
		};
	};

	const createEventRecord = async (event: Partial<FinancialEvent>) => {
		const sanitized = sanitizeFinancialEventData({
			...event,
			userId: testUser.id,
		});
		const validation = validateFinancialEventForInsert(sanitized);
		if (!validation.valid) {
			throw new Error(
				validation.errors.map((err: ValidationError) => `${err.field}: ${err.message}`).join(', '),
			);
		}

		if (
			sanitized.title === undefined ||
			sanitized.amount === undefined ||
			!sanitized.start ||
			!sanitized.type
		) {
			throw new Error('Campos obrigatórios ausentes para criar evento');
		}

		// After validation, we know these fields exist
		const validatedSanitized = sanitized as typeof sanitized & {
			title: string;
			amount: number;
			start: Date;
			type: string;
		};

		const row = buildEventRow(validatedSanitized, testUser.id);

		const [data] = await db.insert(financialEvents).values(row).returning();

		if (!data) {
			throw new Error('Falha ao criar evento');
		}

		createdEventIds.push(data.id);
		return data;
	};

	it('cria um evento de receita e persiste todos os campos essenciais', async () => {
		const start = new Date('2025-01-05T12:00:00Z');
		const eventRow = await createEventRecord({
			allDay: false,
			amount: 9500.5,
			category: 'RECEITA',
			color: 'emerald',
			end: new Date('2025-01-05T12:30:00Z'),
			start,
			status: 'paid',
			title: 'Salário Janeiro',
			type: 'income',
		});

		expect(eventRow.isIncome).toBe(true);
		expect(Number(eventRow.amount)).toBe(9500.5);
		expect(eventRow.status).toBe('paid');
	});

	it('cria um evento de despesa e marca is_income como false', async () => {
		const eventRow = await createEventRecord({
			amount: -3200,
			end: new Date('2025-01-01T08:30:00Z'),
			notes: 'Vencimento dia 1',
			priority: 'ALTA',
			start: new Date('2025-01-01T08:00:00Z'),
			status: 'pending',
			title: 'Aluguel',
			type: 'expense',
		});

		expect(eventRow.isIncome).toBe(false);
		expect(eventRow.priority).toBe('ALTA');
		expect(eventRow.notes).toBe('Vencimento dia 1');
	});

	it('persiste o campo brazilian_event_type', async () => {
		const eventRow = await createEventRecord({
			amount: 1500,
			brazilianEventType: 'DECIMO_TERCEIRO',
			end: new Date('2025-01-10T15:30:00Z'),
			start: new Date('2025-01-10T15:00:00Z'),
			title: 'Pagamento 13º',
			type: 'income',
		});

		expect(eventRow.brazilianEventType).toBe('DECIMO_TERCEIRO');
	});

	it('armazena installment_info corretamente em JSONB', async () => {
		const eventRow = await createEventRecord({
			amount: -900,
			end: new Date('2025-02-01T12:30:00Z'),
			installmentInfo: {
				totalInstallments: 6,
				currentInstallment: 1,
				installmentAmount: 150,
				remainingAmount: 750,
				nextInstallmentDate: new Date('2025-03-01T12:00:00Z').toISOString(),
			},
			start: new Date('2025-02-01T12:00:00Z'),
			title: 'Compra parcelada',
			type: 'expense',
		});

		expect(eventRow.installmentInfo).not.toBeNull();
		const parsed =
			typeof eventRow.installmentInfo === 'string'
				? JSON.parse(eventRow.installmentInfo)
				: (eventRow.installmentInfo as Record<string, unknown>);
		expect(parsed.totalInstallments).toBe(6);
	});

	it('armazena metadata com merchantCategory', async () => {
		const eventRow = await createEventRecord({
			amount: -120.75,
			end: new Date('2025-02-12T20:30:00Z'),
			metadata: {
				merchantCategory: 'RESTAURANTE',
				confidence: 0.92,
				dataSource: 'VOICE',
			},
			start: new Date('2025-02-12T19:30:00Z'),
			title: 'Restaurante',
			type: 'expense',
		});

		expect(eventRow.merchantCategory).toBe('RESTAURANTE');
		const parsedMetadata =
			typeof eventRow.metadata === 'string'
				? JSON.parse(eventRow.metadata)
				: (eventRow.metadata as Record<string, unknown> | null);
		expect(parsedMetadata?.confidence).toBe(0.92);
	});

	it('atualiza campos avançados e atualiza updated_at', async () => {
		const created = await createEventRecord({
			amount: -230,
			end: new Date('2025-01-20T10:15:00Z'),
			start: new Date('2025-01-20T10:00:00Z'),
			status: 'pending',
			title: 'Conta de Luz',
			type: 'bill',
		});

		const sanitized = sanitizeFinancialEventData({
			dueDate: '2025-01-25T03:00:00Z',
			metadata: { merchantCategory: 'LUZ', confidence: 0.8 },
			status: 'paid',
		});
		const validation = validateFinancialEventForUpdate(sanitized);
		expect(validation.valid).toBe(true);

		const [data] = await db
			.update(financialEvents)
			.set({
				dueDate: sanitized.dueDate ? sanitized.dueDate.toISOString().split('T')[0] : null,
				merchantCategory: sanitized.metadata?.merchantCategory || null,
				metadata: sanitized.metadata || null,
				status: sanitized.status,
				updatedAt: new Date(),
			})
			.where(eq(financialEvents.id, created.id))
			.returning();

		expect(data?.status).toBe('paid');
		expect(data?.dueDate).toBe('2025-01-25');
		const updatedAt = data?.updatedAt ? new Date(data.updatedAt).getTime() : 0;
		const createdAt = created.updatedAt ? new Date(created.updatedAt).getTime() : 0;
		expect(updatedAt).toBeGreaterThan(createdAt);
	});

	it('exclui um evento financeiro e garante remoção', async () => {
		const created = await createEventRecord({
			amount: -50,
			end: new Date('2025-04-01T09:30:00Z'),
			start: new Date('2025-04-01T09:00:00Z'),
			title: 'Evento temporário',
			type: 'expense',
		});

		await db.delete(financialEvents).where(eq(financialEvents.id, created.id));

		createdEventIds = createdEventIds.filter((id) => id !== created.id);

		const [data] = await db
			.select({ id: financialEvents.id })
			.from(financialEvents)
			.where(eq(financialEvents.id, created.id))
			.limit(1);

		expect(data).toBeUndefined();
	});

	it('bloqueia criação quando faltam campos obrigatórios (validação)', () => {
		const sanitized = sanitizeFinancialEventData({ amount: 100 });
		const validation = validateFinancialEventForInsert(sanitized);
		expect(validation.valid).toBe(false);
		expect(validation.errors.some((err: ValidationError) => err.field === 'title')).toBe(true);
	});

	it('reprova eventos com data final anterior à inicial', () => {
		const sanitized = sanitizeFinancialEventData({
			amount: 100,
			end: new Date('2025-05-09T10:00:00Z'),
			start: new Date('2025-05-10T10:00:00Z'),
			title: 'Evento inválido',
			type: 'income',
			userId: testUser.id,
		});
		const validation = validateFinancialEventForInsert(sanitized);
		expect(validation.valid).toBe(false);
		expect(validation.errors.some((err: ValidationError) => err.field === 'end')).toBe(true);
	});

	it('filtra eventos por intervalo de datas', async () => {
		const dates = [
			new Date('2025-06-01T10:00:00Z'),
			new Date('2025-06-10T10:00:00Z'),
			new Date('2025-07-01T10:00:00Z'),
		];
		for (const date of dates) {
			await createEventRecord({
				amount: -100,
				end: new Date(date.getTime() + 15 * 60 * 1000),
				start: date,
				title: `Evento ${date.toISOString()}`,
				type: 'expense',
			});
		}

		const data = await db
			.select({
				id: financialEvents.id,
				startDate: financialEvents.startDate,
			})
			.from(financialEvents)
			.where(
				and(
					eq(financialEvents.userId, testUser.id),
					gte(financialEvents.startDate, new Date('2025-06-01T00:00:00Z')),
					lte(financialEvents.startDate, new Date('2025-06-30T23:59:59Z')),
				),
			);

		expect(data.length).toBeGreaterThanOrEqual(2);
	});

	it('filtra eventos por status', async () => {
		await createEventRecord({
			amount: -80,
			end: new Date('2025-07-05T08:15:00Z'),
			start: new Date('2025-07-05T08:00:00Z'),
			status: 'paid',
			title: 'Conta paga',
			type: 'bill',
		});
		await createEventRecord({
			amount: -60,
			end: new Date('2025-07-06T08:15:00Z'),
			start: new Date('2025-07-06T08:00:00Z'),
			status: 'pending',
			title: 'Conta pendente',
			type: 'bill',
		});

		const data = await db
			.select({ id: financialEvents.id, status: financialEvents.status })
			.from(financialEvents)
			.where(and(eq(financialEvents.userId, testUser.id), eq(financialEvents.status, 'paid')));

		expect(data.every((row) => row.status === 'paid')).toBe(true);
	});
});

/**
 * MSW (Mock Service Worker) handlers for Hono RPC API endpoints
 * Replaces tRPC mocks with HTTP API mocking for the new architecture
 */

import { HttpResponse, http } from 'msw';
import { z } from 'zod';

// Mock data generators
const createMockBankAccount = (overrides = {}) => ({
	id: 'test-account-id',
	userId: 'test-user-id',
	institutionName: 'Test Bank',
	institutionId: 'test-institution-id',
	accountType: 'checking',
	accountMask: '****1234',
	balance: 5000.0,
	currency: 'BRL',
	isPrimary: true,
	isActive: true,
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-01T00:00:00Z',
	...overrides,
});

const createMockTransaction = (overrides = {}) => ({
	id: 'test-transaction-id',
	user_id: 'test-user-id',
	amount: 100.5,
	type: 'debit',
	status: 'posted',
	description: 'Test transaction',
	category_id: 'test-category-id',
	account_id: 'test-account-id',
	created_at: '2024-01-01T00:00:00Z',
	metadata: {},
	...overrides,
});

const createMockContact = (overrides = {}) => ({
	id: 'test-contact-id',
	user_id: 'test-user-id',
	name: 'Test Contact',
	email: 'test@example.com',
	phone: '+5511999999999',
	cpf: '123.456.789-00',
	notes: 'Test notes',
	is_favorite: false,
	created_at: '2024-01-01T00:00:00Z',
	updated_at: '2024-01-01T00:00:00Z',
	...overrides,
});

const createMockFinancialEvent = (overrides = {}) => ({
	id: 'test-event-id',
	user_id: 'test-user-id',
	title: 'Test Event',
	description: 'Test event description',
	amount: 1000.0,
	type: 'income',
	category: 'salary',
	date: '2024-01-15',
	is_recurring: false,
	recurrence_pattern: null,
	calendar_event_id: null,
	created_at: '2024-01-01T00:00:00Z',
	updated_at: '2024-01-01T00:00:00Z',
	...overrides,
});

const createMockUserProfile = (overrides = {}) => ({
	id: 'test-user-id',
	email: 'test@example.com',
	full_name: 'Test User',
	phone: '+5511999999999',
	is_active: true,
	last_login: '2024-01-01T00:00:00Z',
	created_at: '2024-01-01T00:00:00Z',
	updated_at: '2024-01-01T00:00:00Z',
	user_preferences: [
		{
			user_id: 'test-user-id',
			accessibility_high_contrast: false,
			accessibility_large_text: false,
			accessibility_screen_reader: false,
			autonomy_level: 50,
			currency: 'BRL',
			language: 'pt-BR',
			email_notifications: true,
			notifications_enabled: true,
			push_notifications: true,
			theme: 'light',
			timezone: 'America/Sao_Paulo',
			voice_commands_enabled: true,
			voice_feedback: true,
		},
	],
	...overrides,
});

// Response wrapper helper
const createResponse = (data: unknown, meta: Record<string, unknown> = {}) => ({
	data,
	meta: {
		requestId: 'test-request-id',
		retrievedAt: new Date().toISOString(),
		...meta,
	},
});

// Validation schemas for request bodies
const createBankAccountSchema = z.object({
	institution_name: z.string(),
	account_type: z.enum(['checking', 'savings', 'investment', 'cash']),
	balance: z.number(),
	currency: z.string().default('BRL'),
	is_primary: z.boolean().default(false),
	is_active: z.boolean().default(true),
	account_mask: z.string().optional(),
	institution_id: z.string().optional(),
});

const updateBankAccountSchema = createBankAccountSchema.partial().extend({
	id: z.string(),
});

const createTransactionSchema = z.object({
	amount: z.number(),
	type: z.enum(['transfer', 'debit', 'credit', 'pix', 'boleto'] as const),
	description: z.string().optional(),
	category_id: z.string().optional(),
	account_id: z.string(),
	to_account_id: z.string().optional(),
	status: z.enum(['cancelled', 'failed', 'pending', 'posted'] as const).default('posted'),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

const createContactSchema = z.object({
	name: z.string(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	cpf: z.string().optional(),
	notes: z.string().optional(),
	is_favorite: z.boolean().default(false),
});

const processVoiceCommandSchema = z.object({
	commandText: z.string().optional(),
	sessionId: z.string().uuid(),
	audioData: z.string().optional(),
	language: z.string().default('pt-BR'),
	requireConfirmation: z.boolean().default(false),
});

// MSW Handlers for Hono RPC endpoints
export const handlers = [
	// Bank Accounts API
	http.get('/api/v1/bank-accounts', () => {
		const accounts = [
			createMockBankAccount(),
			createMockBankAccount({
				id: 'test-account-id-2',
				institution_name: 'Another Bank',
				is_primary: false,
			}),
		];

		return HttpResponse.json(createResponse(accounts));
	}),

	http.post('/api/v1/bank-accounts', async ({ request }) => {
		const body = (await request.json()) as z.infer<typeof createBankAccountSchema>;
		const validated = createBankAccountSchema.parse(body);
		const newAccount = createMockBankAccount({
			...validated,
			id: `new-account-${Date.now()}`,
		});

		return HttpResponse.json(createResponse(newAccount), { status: 201 });
	}),

	http.put('/api/v1/bank-accounts/:id', async ({ params, request }) => {
		const { id } = params;
		const body = (await request.json()) as z.infer<typeof updateBankAccountSchema>;
		const validated = updateBankAccountSchema.parse({ ...body, id });

		const updatedAccount = createMockBankAccount({
			...validated,
			updated_at: new Date().toISOString(),
		});

		return HttpResponse.json(createResponse(updatedAccount));
	}),

	http.delete('/api/v1/bank-accounts/:id', ({ params }) => {
		const { id } = params;
		return HttpResponse.json({ success: true, deletedId: id });
	}),

	http.patch('/api/v1/bank-accounts/:id/balance', async ({ params, request }) => {
		const { id } = params;
		const body = (await request.json()) as { balance: number };

		const updatedAccount = createMockBankAccount({
			id,
			balance: body.balance,
			updated_at: new Date().toISOString(),
		});

		return HttpResponse.json(createResponse(updatedAccount));
	}),

	http.get('/api/v1/bank-accounts/total-balance', () => {
		const balances = {
			BRL: 10000.0,
			USD: 2000.0,
			EUR: 1500.0,
		};

		return HttpResponse.json(createResponse(balances));
	}),

	// Transactions API
	http.get('/api/v1/transactions', ({ request }) => {
		const url = new URL(request.url);
		const limit = url.searchParams.get('limit') || '20';
		const offset = url.searchParams.get('offset') || '0';

		const transactions = Array.from({ length: Number.parseInt(limit, 10) }, (_, i) =>
			createMockTransaction({
				id: `transaction-${Number.parseInt(offset, 10) + i}`,
				amount: Math.random() * 1000,
				description: `Transaction ${Number.parseInt(offset, 10) + i + 1}`,
			}),
		);

		return HttpResponse.json(createResponse(transactions, { total: 100 }));
	}),

	http.post('/api/v1/transactions', async ({ request }) => {
		const body = (await request.json()) as z.infer<typeof createTransactionSchema>;
		const validated = createTransactionSchema.parse(body);

		const newTransaction = createMockTransaction({
			...validated,
			id: `new-transaction-${Date.now()}`,
			created_at: new Date().toISOString(),
		});

		return HttpResponse.json(createResponse(newTransaction), { status: 201 });
	}),

	http.delete('/api/v1/transactions/:id', ({ params }) => {
		const { id } = params;
		return HttpResponse.json({ success: true, deletedId: id });
	}),

	http.get('/api/v1/transactions/statistics', ({ request }) => {
		const url = new URL(request.url);
		const period = url.searchParams.get('period') || 'month';

		const stats = {
			balance: 5000.0,
			expenses: 3000.0,
			income: 8000.0,
			period,
			transactionsCount: 45,
		};

		return HttpResponse.json(createResponse(stats));
	}),

	// Contacts API
	http.get('/api/v1/contacts', ({ request }) => {
		const url = new URL(request.url);
		const search = url.searchParams.get('search') || '';
		const limit = url.searchParams.get('limit') || '50';

		const contacts = [
			createMockContact(),
			createMockContact({
				id: 'test-contact-id-2',
				name: 'Another Contact',
				email: 'another@example.com',
			}),
			createMockContact({
				id: 'test-contact-id-3',
				name: 'Favorite Contact',
				is_favorite: true,
			}),
		]
			.filter(
				(contact) =>
					!search ||
					contact.name.toLowerCase().includes(search.toLowerCase()) ||
					contact.email?.toLowerCase().includes(search.toLowerCase()),
			)
			.slice(0, Number.parseInt(limit, 10));

		return HttpResponse.json(createResponse(contacts, { total: contacts.length }));
	}),

	http.post('/api/v1/contacts', async ({ request }) => {
		const body = (await request.json()) as z.infer<typeof createContactSchema>;
		const validated = createContactSchema.parse(body);

		const newContact = createMockContact({
			...(validated as Record<string, unknown>),
			id: `new-contact-${Date.now()}`,
			created_at: new Date().toISOString(),
		});

		return HttpResponse.json(createResponse(newContact), { status: 201 });
	}),

	http.put('/api/v1/contacts/:id', async ({ params, request }) => {
		const { id } = params;
		const body = (await request.json()) as Record<string, unknown>;

		const updatedContact = createMockContact({
			...body,
			id,
			updated_at: new Date().toISOString(),
		});

		return HttpResponse.json(createResponse(updatedContact));
	}),

	http.delete('/api/v1/contacts/:id', ({ params }) => {
		const { id } = params;
		return HttpResponse.json({ success: true, deletedId: id });
	}),

	// Voice Commands API
	http.post('/api/v1/voice/process', async ({ request }) => {
		const body = (await request.json()) as z.infer<typeof processVoiceCommandSchema>;
		const validated = processVoiceCommandSchema.parse(body);

		const result = {
			intent: 'check_balance',
			entities: {
				amount: 100,
				currency: 'BRL',
			},
			confidence: 0.95,
			response: 'Verificando seu saldo...',
			requiresConfirmation: false,
			sessionId: validated.sessionId,
			language: validated.language,
			processedAt: new Date().toISOString(),
		};

		return HttpResponse.json(createResponse(result));
	}),

	http.get('/api/v1/voice/commands', () => {
		const commands = {
			commands: [
				{
					name: 'check_balance',
					description: 'Verificar saldo da conta',
					examples: ['Qual é o meu saldo?', 'Quanto dinheiro eu tenho?', 'Mostrar meu saldo'],
				},
				{
					name: 'transfer_money',
					description: 'Transferir dinheiro para outra conta',
					examples: [
						'Transferir R$ 100 para João',
						'Pagar 50 reais para Maria',
						'Enviar R$ 200 para o email teste@email.com',
					],
				},
				{
					name: 'pay_bill',
					description: 'Pagar contas e boletos',
					examples: ['Pagar conta de luz', 'Pagar boleto do cartão', 'Quitar conta de telefone'],
				},
				{
					name: 'pix_transfer',
					description: 'Fazer transferência PIX',
					examples: [
						'Fazer PIX para o CPF 123.456.789-00',
						'Enviar PIX para o telefone 11999999999',
						'Transferir por PIX para maria@email.com',
					],
				},
				{
					name: 'transaction_history',
					description: 'Ver histórico de transações',
					examples: ['Mostrar minhas transações', 'Ver extrato do mês', 'Histórico de compras'],
				},
			],
			language: 'pt-BR',
		};

		return HttpResponse.json(createResponse(commands));
	}),

	// User Profile API
	http.get('/api/v1/users/me', () => {
		const profile = createMockUserProfile();
		return HttpResponse.json(createResponse(profile));
	}),

	http.put('/api/v1/users/me', async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;

		const updatedProfile = createMockUserProfile({
			...body,
			updated_at: new Date().toISOString(),
		});

		return HttpResponse.json(createResponse(updatedProfile));
	}),

	http.put('/api/v1/users/me/preferences', async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;

		const updatedPreferences = {
			user_id: 'test-user-id',
			...body,
		};

		return HttpResponse.json(createResponse(updatedPreferences));
	}),

	http.post('/api/v1/users/me/last-login', () => {
		return HttpResponse.json(createResponse({ success: true }));
	}),

	http.get('/api/v1/users/me/status', () => {
		const status = {
			is_active: true,
			last_login: '2024-01-01T00:00:00Z',
		};

		return HttpResponse.json(createResponse(status));
	}),

	http.get('/api/v1/users/me/financial-summary', () => {
		const summary = {
			income: 8000.0,
			expenses: 3000.0,
			balance: 5000.0,
		};

		return HttpResponse.json(createResponse(summary));
	}),

	// Calendar Events API
	http.get('/api/v1/calendar/events/search', ({ request }) => {
		const url = new URL(request.url);
		const query = url.searchParams.get('query') || '';

		const events = [
			createMockFinancialEvent({
				title: 'Salário',
				type: 'income',
				amount: 5000.0,
			}),
			createMockFinancialEvent({
				title: 'Aluguel',
				type: 'expense',
				amount: 1500.0,
			}),
		]
			.filter(
				(event) =>
					!query ||
					event.title.toLowerCase().includes(query.toLowerCase()) ||
					event.description?.toLowerCase().includes(query.toLowerCase()),
			)
			.slice(0, 20);

		return HttpResponse.json(createResponse(events, { total: events.length }));
	}),

	http.get('/api/v1/calendar/transactions/search', ({ request }) => {
		const url = new URL(request.url);
		const query = url.searchParams.get('query') || '';

		const transactions = [
			createMockTransaction({
				description: 'Salário',
				type: 'credit',
				amount: 5000.0,
			}),
			createMockTransaction({
				description: 'Aluguel',
				type: 'debit',
				amount: 1500.0,
			}),
		]
			.filter(
				(transaction) =>
					!query || transaction.description?.toLowerCase().includes(query.toLowerCase()),
			)
			.slice(0, 20);

		return HttpResponse.json(createResponse(transactions, { total: transactions.length }));
	}),
];

// Default export for easy import
export default handlers;

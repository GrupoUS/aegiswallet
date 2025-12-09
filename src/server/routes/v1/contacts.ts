/**
 * Contacts API - Hono RPC Implementation
 * Manages contact CRUD, favorites, and stats
 * Using Drizzle ORM with Neon serverless
 */

import { zValidator } from '@hono/zod-validator';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { contacts } from '@/db/schema';
import { secureLogger } from '@/lib/logging/secure-logger';
import { validateCPF } from '@/lib/security/financial-validator';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import { UserSyncService } from '@/services/user-sync.service';

const brazilPhoneRegex = /^\d{10,11}$/;

const normalizeDigits = (value: string | undefined | null) =>
	value ? value.replace(/\D/g, '') : (value ?? undefined);

const sanitizeContactFields = <
	T extends {
		cpf?: string | null;
		email?: string | null;
		phone?: string | null;
	},
>(
	contact: T,
) => ({
	...contact,
	cpf: contact.cpf ? normalizeDigits(contact.cpf) : contact.cpf,
	email: contact.email?.trim().toLowerCase(),
	phone: contact.phone ? normalizeDigits(contact.phone) : contact.phone,
});

const contactsRouter = new Hono<AppEnv>();

// =====================================================
// Validation Schemas
// =====================================================

const createContactSchema = z.object({
	cpf: z.string().optional(),
	email: z.string().email().optional(),
	isFavorite: z.boolean().default(false),
	name: z.string().min(1, 'Nome é obrigatório'),
	notes: z.string().optional(),
	phone: z.string().optional(),
});

const updateContactSchema = z.object({
	cpf: z
		.string()
		.optional()
		.refine((cpf) => !cpf || validateCPF(normalizeDigits(cpf) ?? ''), 'CPF inválido'),
	email: z.string().email().optional(),
	id: z.string().uuid(),
	isFavorite: z.boolean().optional(),
	name: z.string().optional(),
	notes: z.string().optional(),
	phone: z
		.string()
		.optional()
		.refine(
			(phone) => !phone || brazilPhoneRegex.test(normalizeDigits(phone) ?? ''),
			'Telefone inválido',
		),
});

const getAllContactsSchema = z.object({
	isFavorite: z.boolean().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().default(0),
	search: z.string().optional(),
});

const searchContactsSchema = z.object({
	limit: z.number().min(1).max(20).default(10),
	query: z.string().min(1, 'Query de busca é obrigatória'),
});

// =====================================================
// Contacts CRUD Operations
// =====================================================

/**
 * List contacts with pagination, search, and favorite filtering
 */
contactsRouter.get(
	'/',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many requests, please try again later',
	}),
	zValidator('query', getAllContactsSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const input = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			// Build where conditions
			const conditions = [eq(contacts.userId, user.id)];

			if (input.search) {
				const searchPattern = `%${input.search}%`;
				const searchCondition = or(
					ilike(contacts.name, searchPattern),
					ilike(contacts.email, searchPattern),
					ilike(contacts.phone, searchPattern),
				);
				if (searchCondition) {
					conditions.push(searchCondition);
				}
			}

			if (input.isFavorite !== undefined) {
				conditions.push(eq(contacts.isFavorite, input.isFavorite));
			}

			// Get total count
			const [{ total }] = await db
				.select({ total: count() })
				.from(contacts)
				.where(and(...conditions));

			// Get paginated data
			const data = await db
				.select()
				.from(contacts)
				.where(and(...conditions))
				.orderBy(desc(contacts.isFavorite), asc(contacts.name))
				.limit(input.limit)
				.offset(input.offset);

			return c.json({
				data: {
					contacts: data,
					hasMore: total > input.offset + input.limit,
					total,
				},
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get contacts', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CONTACTS_ERROR',
					error: 'Failed to retrieve contacts',
				},
				500,
			);
		}
	},
);

/**
 * Retrieve a single contact by ID scoped to authenticated user
 */
contactsRouter.get(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many requests, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const contactId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			const [data] = await db
				.select()
				.from(contacts)
				.where(and(eq(contacts.id, contactId), eq(contacts.userId, user.id)))
				.limit(1);

			if (!data) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Contato não encontrado',
					},
					404,
				);
			}

			return c.json({
				data,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get contact', {
				contactId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CONTACT_ERROR',
					error: 'Failed to retrieve contact',
				},
				500,
			);
		}
	},
);

/**
 * Create a new contact with CPF/phone validation and duplicate protection
 */
contactsRouter.post(
	'/',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many creation attempts, please try again later',
	}),
	zValidator('json', createContactSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			// Ensure user exists in database before creating contact
			try {
				await UserSyncService.ensureUserExists(user.id);
			} catch (syncError) {
				secureLogger.error('Failed to ensure user exists in database', {
					userId: user.id,
					requestId,
					error: syncError instanceof Error ? syncError.message : 'Unknown error',
				});

				return c.json(
					{
						code: 'USER_SYNC_ERROR',
						error: 'Failed to verify user account. Please try again.',
					},
					500,
				);
			}

			const sanitizedInput = sanitizeContactFields(input);

			const [data] = await db
				.insert(contacts)
				.values({
					userId: user.id,
					name: sanitizedInput.name,
					email: sanitizedInput.email ?? null,
					phone: sanitizedInput.phone ?? null,
					cpf: sanitizedInput.cpf ?? null,
					notes: sanitizedInput.notes ?? null,
					isFavorite: sanitizedInput.isFavorite ?? false,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			secureLogger.info('Contact created', {
				contactId: data.id,
				contactName: input.name,
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					data,
					meta: {
						createdAt: new Date().toISOString(),
						requestId,
					},
				},
				201,
			);
		} catch (error) {
			// Check for unique constraint violation
			if (error instanceof Error && error.message.includes('unique constraint')) {
				return c.json(
					{
						code: 'CONFLICT',
						error: 'Email ou telefone já cadastrado para este usuário',
					},
					409,
				);
			}

			secureLogger.error('Failed to create contact', {
				contactName: input.name,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CONTACT_CREATE_ERROR',
					error: 'Failed to create contact',
				},
				500,
			);
		}
	},
);

/**
 * Update mutable contact fields (name, email, phone, notes, favorites)
 */
contactsRouter.put(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many update attempts, please try again later',
	}),
	zValidator('json', updateContactSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const contactId = c.req.param('id');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		try {
			const { id: _inputId, ...updateData } = input;
			const sanitizedData = sanitizeContactFields(updateData);

			const updatePayload: Partial<typeof contacts.$inferInsert> = {
				updatedAt: new Date(),
			};

			if (sanitizedData.name !== undefined) {
				updatePayload.name = sanitizedData.name;
			}
			if (sanitizedData.email !== undefined) {
				updatePayload.email = sanitizedData.email ?? null;
			}
			if (sanitizedData.phone !== undefined) {
				updatePayload.phone = sanitizedData.phone ?? null;
			}
			if (sanitizedData.cpf !== undefined) {
				updatePayload.cpf = sanitizedData.cpf ?? null;
			}
			if (sanitizedData.notes !== undefined) {
				updatePayload.notes = sanitizedData.notes ?? null;
			}
			if (sanitizedData.isFavorite !== undefined) {
				updatePayload.isFavorite = sanitizedData.isFavorite;
			}

			const [data] = await db
				.update(contacts)
				.set(updatePayload)
				.where(and(eq(contacts.id, contactId), eq(contacts.userId, user.id)))
				.returning();

			if (!data) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Contato não encontrado',
					},
					404,
				);
			}

			secureLogger.info('Contact updated', {
				contactId,
				requestId,
				updatedFields: Object.keys(updateData).filter((field) => field !== 'updatedAt'),
				userId: user.id,
			});

			return c.json({
				data,
				meta: {
					requestId,
					updatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to update contact', {
				contactId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CONTACT_UPDATE_ERROR',
					error: 'Failed to update contact',
				},
				500,
			);
		}
	},
);

/**
 * Delete a contact owned by authenticated user
 */
contactsRouter.delete(
	'/:id',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many deletion attempts, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const contactId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			const [data] = await db
				.delete(contacts)
				.where(and(eq(contacts.id, contactId), eq(contacts.userId, user.id)))
				.returning();

			if (!data) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Contato não encontrado',
					},
					404,
				);
			}

			secureLogger.info('Contact deleted', {
				contactId,
				requestId,
				userId: user.id,
			});

			return c.json({
				data: { id: contactId, success: true },
				meta: {
					deletedAt: new Date().toISOString(),
					requestId,
				},
			});
		} catch (error) {
			secureLogger.error('Failed to delete contact', {
				contactId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CONTACT_DELETE_ERROR',
					error: 'Failed to delete contact',
				},
				500,
			);
		}
	},
);

// =====================================================
// Search and Favorites
// =====================================================

/**
 * Search contacts by name, email, or phone with limit controls
 */
contactsRouter.get(
	'/search',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many search attempts, please try again later',
	}),
	zValidator('query', searchContactsSchema),
	async (c) => {
		const { user, db } = c.get('auth');
		const input = c.req.valid('query');
		const requestId = c.get('requestId');

		try {
			const searchPattern = `%${input.query}%`;

			const data = await db
				.select({
					id: contacts.id,
					name: contacts.name,
					email: contacts.email,
					phone: contacts.phone,
					isFavorite: contacts.isFavorite,
				})
				.from(contacts)
				.where(
					and(
						eq(contacts.userId, user.id),
						or(
							ilike(contacts.name, searchPattern),
							ilike(contacts.email, searchPattern),
							ilike(contacts.phone, searchPattern),
						),
					),
				)
				.orderBy(desc(contacts.isFavorite), asc(contacts.name))
				.limit(input.limit);

			secureLogger.info('Contacts searched', {
				requestId,
				resultsCount: data.length,
				searchQuery: input.query,
				userId: user.id,
			});

			return c.json({
				data,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to search contacts', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				searchQuery: input.query,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CONTACT_SEARCH_ERROR',
					error: 'Failed to search contacts',
				},
				500,
			);
		}
	},
);

/**
 * Retrieve favorite contacts ordered alphabetically
 */
contactsRouter.get(
	'/favorites',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 20,
		message: 'Too many requests, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const requestId = c.get('requestId');

		try {
			const data = await db
				.select()
				.from(contacts)
				.where(and(eq(contacts.userId, user.id), eq(contacts.isFavorite, true)))
				.orderBy(asc(contacts.name));

			secureLogger.info('Favorite contacts retrieved', {
				favoritesCount: data.length,
				requestId,
				userId: user.id,
			});

			return c.json({
				data,
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get favorite contacts', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'FAVORITES_ERROR',
					error: 'Failed to retrieve favorite contacts',
				},
				500,
			);
		}
	},
);

/**
 * Toggle favorite status for a contact
 */
contactsRouter.post(
	'/:id/favorite',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 30,
		message: 'Too many toggle attempts, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const contactId = c.req.param('id');
		const requestId = c.get('requestId');

		try {
			// First get current contact to check if it exists
			const [currentContact] = await db
				.select({ isFavorite: contacts.isFavorite })
				.from(contacts)
				.where(and(eq(contacts.id, contactId), eq(contacts.userId, user.id)))
				.limit(1);

			if (!currentContact) {
				return c.json(
					{
						code: 'NOT_FOUND',
						error: 'Contato não encontrado',
					},
					404,
				);
			}

			// Toggle favorite status
			const [data] = await db
				.update(contacts)
				.set({
					isFavorite: !currentContact.isFavorite,
					updatedAt: new Date(),
				})
				.where(and(eq(contacts.id, contactId), eq(contacts.userId, user.id)))
				.returning();

			secureLogger.info('Contact favorite status toggled', {
				contactId,
				newStatus: !currentContact.isFavorite,
				previousStatus: currentContact.isFavorite,
				requestId,
				userId: user.id,
			});

			return c.json({
				data,
				meta: {
					requestId,
					updatedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to toggle favorite status', {
				contactId,
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'FAVORITE_TOGGLE_ERROR',
					error: 'Failed to toggle favorite status',
				},
				500,
			);
		}
	},
);

// =====================================================
// Statistics
// =====================================================

/**
 * Compute contact statistics (favorites, emails, phones) for dashboards
 */
contactsRouter.get(
	'/stats',
	authMiddleware,
	userRateLimitMiddleware({
		windowMs: 60 * 1000,
		max: 10,
		message: 'Too many requests, please try again later',
	}),
	async (c) => {
		const { user, db } = c.get('auth');
		const requestId = c.get('requestId');

		try {
			const data = await db
				.select({
					isFavorite: contacts.isFavorite,
					email: contacts.email,
					phone: contacts.phone,
				})
				.from(contacts)
				.where(eq(contacts.userId, user.id));

			const totalContacts = data.length;
			const statsFavorites = data.filter((contact) => contact.isFavorite).length;
			const statsWithEmail = data.filter((contact) => contact.email).length;
			const statsWithPhone = data.filter((contact) => contact.phone).length;

			return c.json({
				data: {
					contactsWithEmail: statsWithEmail,
					contactsWithPhone: statsWithPhone,
					favoriteContacts: statsFavorites,
					favoritePercentage: totalContacts > 0 ? (statsFavorites / totalContacts) * 100 : 0,
					totalContacts,
				},
				meta: {
					requestId,
					retrievedAt: new Date().toISOString(),
				},
			});
		} catch (error) {
			secureLogger.error('Failed to get contact statistics', {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				userId: user.id,
			});

			return c.json(
				{
					code: 'CONTACT_STATS_ERROR',
					error: 'Failed to retrieve contact statistics',
				},
				500,
			);
		}
	},
);

export default contactsRouter;

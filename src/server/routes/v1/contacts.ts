/**
 * Contacts API - Hono RPC Implementation
 * Manages contact CRUD, favorites, and stats
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import { validateCPF } from '@/lib/security/financial-validator';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';

const brazilPhoneRegex = /^\d{10,11}$/;

const normalizeDigits = (value: string | undefined | null) =>
  value ? value.replace(/\D/g, '') : (value ?? undefined);

const sanitizeContactFields = <
  T extends { cpf?: string | null; email?: string | null; phone?: string | null },
>(
  contact: T
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
      'Telefone inválido'
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
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  zValidator('query', getAllContactsSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      let query = supabase.from('contacts').select('*').eq('user_id', user.id);

      if (input.search) {
        query = query.or(
          `name.ilike.%${input.search}%,email.ilike.%${input.search}%,phone.ilike.%${input.search}%`
        );
      }

      if (input.isFavorite !== undefined) {
        query = query.eq('is_favorite', input.isFavorite);
      }

      const { data, error, count } = await query
        .order('is_favorite', { ascending: false })
        .order('name', { ascending: true })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new Error(`Erro ao buscar contatos: ${error.message}`);
      }

      return c.json({
        data: {
          contacts: data || [],
          hasMore: (count || 0) > input.offset + input.limit,
          total: count || 0,
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
        500
      );
    }
  }
);

/**
 * Retrieve a single contact by ID scoped to authenticated user
 */
contactsRouter.get(
  '/:id',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const contactId = c.req.param('id');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return c.json(
            {
              code: 'NOT_FOUND',
              error: 'Contato não encontrado',
            },
            404
          );
        }
        throw new Error(`Erro ao buscar contato: ${error.message}`);
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
        500
      );
    }
  }
);

/**
 * Create a new contact with CPF/phone validation and duplicate protection
 */
contactsRouter.post(
  '/',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 creations per minute per user
    message: 'Too many creation attempts, please try again later',
  }),
  zValidator('json', createContactSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const sanitizedInput = sanitizeContactFields(input);

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          cpf: sanitizedInput.cpf ?? null,
          created_at: new Date().toISOString(),
          email: sanitizedInput.email ?? null,
          is_favorite: sanitizedInput.isFavorite,
          name: sanitizedInput.name,
          notes: sanitizedInput.notes ?? null,
          phone: sanitizedInput.phone ?? null,
          updated_at: new Date().toISOString(),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return c.json(
            {
              code: 'CONFLICT',
              error: 'Email ou telefone já cadastrado para este usuário',
            },
            409
          );
        }
        throw new Error(`Erro ao criar contato: ${error.message}`);
      }

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
        201
      );
    } catch (error) {
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
        500
      );
    }
  }
);

/**
 * Update mutable contact fields (name, email, phone, notes, favorites)
 */
contactsRouter.put(
  '/:id',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 updates per minute per user
    message: 'Too many update attempts, please try again later',
  }),
  zValidator('json', updateContactSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const contactId = c.req.param('id');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    try {
      const { id: _inputId, ...updateData } = input;
      const sanitizedData = sanitizeContactFields(updateData);

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
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
        updatePayload.is_favorite = sanitizedData.isFavorite;
      }

      const { data, error } = await supabase
        .from('contacts')
        .update(updatePayload)
        .eq('id', contactId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return c.json(
            {
              code: 'NOT_FOUND',
              error: 'Contato não encontrado',
            },
            404
          );
        }
        throw new Error(`Erro ao atualizar contato: ${error.message}`);
      }

      secureLogger.info('Contact updated', {
        contactId,
        requestId,
        updatedFields: Object.keys(updateData).filter((field) => field !== 'updated_at'),
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
        500
      );
    }
  }
);

/**
 * Delete a contact owned by authenticated user
 */
contactsRouter.delete(
  '/:id',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 deletions per minute per user
    message: 'Too many deletion attempts, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const contactId = c.req.param('id');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return c.json(
            {
              code: 'NOT_FOUND',
              error: 'Contato não encontrado',
            },
            404
          );
        }
        throw new Error(`Erro ao deletar contato: ${error.message}`);
      }

      if (!data) {
        return c.json(
          {
            code: 'NOT_FOUND',
            error: 'Contato não encontrado',
          },
          404
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
        500
      );
    }
  }
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
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 searches per minute per user
    message: 'Too many search attempts, please try again later',
  }),
  zValidator('query', searchContactsSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('query');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, phone, is_favorite')
        .eq('user_id', user.id)
        .or(`name.ilike.%${input.query}%,email.ilike.%${input.query}%,phone.ilike.%${input.query}%`)
        .order('is_favorite', { ascending: false })
        .order('name', { ascending: true })
        .limit(input.limit);

      if (error) {
        throw new Error(`Erro ao buscar contatos: ${error.message}`);
      }

      secureLogger.info('Contacts searched', {
        requestId,
        resultsCount: data?.length || 0,
        searchQuery: input.query,
        userId: user.id,
      });

      return c.json({
        data: data || [],
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
        500
      );
    }
  }
);

/**
 * Retrieve favorite contacts ordered alphabetically
 */
contactsRouter.get(
  '/favorites',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar contatos favoritos: ${error.message}`);
      }

      secureLogger.info('Favorite contacts retrieved', {
        favoritesCount: data?.length || 0,
        requestId,
        userId: user.id,
      });

      return c.json({
        data: data || [],
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
        500
      );
    }
  }
);

/**
 * Toggle favorite status for a contact
 */
contactsRouter.post(
  '/:id/favorite',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 toggles per minute per user
    message: 'Too many toggle attempts, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const contactId = c.req.param('id');
    const requestId = c.get('requestId');

    try {
      // First get current contact to check if it exists
      const { data: currentContact, error: fetchError } = await supabase
        .from('contacts')
        .select('is_favorite')
        .eq('id', contactId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !currentContact) {
        return c.json(
          {
            code: 'NOT_FOUND',
            error: 'Contato não encontrado',
          },
          404
        );
      }

      // Toggle favorite status
      const { data, error } = await supabase
        .from('contacts')
        .update({
          is_favorite: !currentContact.is_favorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao alternar status de favorito: ${error.message}`);
      }

      secureLogger.info('Contact favorite status toggled', {
        contactId,
        newStatus: !currentContact.is_favorite,
        previousStatus: currentContact.is_favorite,
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
        500
      );
    }
  }
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
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('is_favorite, email, phone')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Erro ao buscar estatísticas de contatos: ${error.message}`);
      }

      const contacts = data || [];

      const totalContacts = contacts.length;
      const favoriteContacts = contacts.filter((c) => c.is_favorite).length;
      const contactsWithEmail = contacts.filter((c) => c.email).length;
      const contactsWithPhone = contacts.filter((c) => c.phone).length;

      return c.json({
        data: {
          contactsWithEmail,
          contactsWithPhone,
          favoriteContacts,
          favoritePercentage: totalContacts > 0 ? (favoriteContacts / totalContacts) * 100 : 0,
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
        500
      );
    }
  }
);

export default contactsRouter;

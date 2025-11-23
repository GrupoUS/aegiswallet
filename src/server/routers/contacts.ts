import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { logError, logOperation } from '@/server/lib/logger';
import { protectedProcedure, router } from '@/server/trpc-helpers';

/**
 * Contacts Router - Gerenciamento de contatos
 */
export const contactsRouter = router({
  // Listar todos os contatos
  getAll: protectedProcedure
    .input(
      z.object({
        isFavorite: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        let query = supabase.from('contacts').select('*').eq('user_id', ctx.user.id);

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
          logError('fetch_contacts', ctx.user.id, error, {
            isFavorite: input.isFavorite,
            limit: input.limit,
            offset: input.offset,
            operation: 'getAll',
            resource: 'contacts',
            search: input.search,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar contatos',
          });
        }

        return {
          contacts: data || [],
          hasMore: (count || 0) > input.offset + input.limit,
          total: count || 0,
        };
      } catch (error) {
        logError('fetch_contacts_unexpected', ctx.user.id, error as Error, {
          isFavorite: input.isFavorite,
          limit: input.limit,
          offset: input.offset,
          operation: 'getAll',
          resource: 'contacts',
          search: input.search,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contatos',
        });
      }
    }),

  // Obter contato específico
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('fetch_contact_not_found', ctx.user.id, 'contacts', input.id, {
              reason: 'contact_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Contato não encontrado',
            });
          }
          logError('fetch_contact_by_id', ctx.user.id, error, {
            contactId: input.id,
            operation: 'getById',
            resource: 'contacts',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar contato',
          });
        }

        return data;
      } catch (error) {
        logError('fetch_contact_by_id_unexpected', ctx.user.id, error as Error, {
          contactId: input.id,
          operation: 'getById',
          resource: 'contacts',
        });
        throw error;
      }
    }),

  // Criar novo contato
  create: protectedProcedure
    .input(
      z.object({
        cpf: z.string().optional(),
        email: z.string().email().optional(),
        isFavorite: z.boolean().default(false),
        name: z.string().min(1, 'Nome é obrigatório'),
        notes: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            ...input,
            user_id: ctx.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            logOperation('create_contact_conflict', ctx.user.id, 'contacts', undefined, {
              email: input.email,
              phone: input.phone,
              reason: 'duplicate_email_or_phone',
            });
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email ou telefone já cadastrado para este usuário',
            });
          }
          logError('create_contact', ctx.user.id, error, {
            contactName: input.name,
            hasEmail: !!input.email,
            hasPhone: !!input.phone,
            operation: 'create',
            resource: 'contacts',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar contato',
          });
        }

        logOperation('create_contact_success', ctx.user.id, 'contacts', data?.id, {
          contactName: input.name,
          hasEmail: !!input.email,
          hasPhone: !!input.phone,
          isFavorite: input.isFavorite,
        });

        return data;
      } catch (error) {
        logError('create_contact_unexpected', ctx.user.id, error as Error, {
          contactName: input.name,
          hasEmail: !!input.email,
          hasPhone: !!input.phone,
          operation: 'create',
          resource: 'contacts',
        });
        throw error;
      }
    }),

  // Atualizar contato
  update: protectedProcedure
    .input(
      z.object({
        cpf: z.string().optional(),
        email: z.string().email().optional(),
        id: z.string().uuid(),
        isFavorite: z.boolean().optional(),
        name: z.string().optional(),
        notes: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        const { data, error } = await supabase
          .from('contacts')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('update_contact_not_found', ctx.user.id, 'contacts', input.id, {
              reason: 'contact_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Contato não encontrado',
            });
          }
          if (error.code === '23505') {
            logOperation('update_contact_conflict', ctx.user.id, 'contacts', input.id, {
              email: input.email,
              phone: input.phone,
              reason: 'duplicate_email_or_phone',
            });
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email ou telefone já cadastrado para este usuário',
            });
          }
          logError('update_contact', ctx.user.id, error, {
            contactId: input.id,
            operation: 'update',
            resource: 'contacts',
            updateFields: Object.keys(updateData),
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar contato',
          });
        }

        logOperation('update_contact_success', ctx.user.id, 'contacts', input.id, {
          updateFields: Object.keys(updateData),
        });

        return data;
      } catch (error) {
        logError('update_contact_unexpected', ctx.user.id, error as Error, {
          contactId: input.id,
          operation: 'update',
          resource: 'contacts',
          updateFields: Object.keys(input).filter((k) => k !== 'id'),
        });
        throw error;
      }
    }),

  // Deletar contato
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            logOperation('delete_contact_not_found', ctx.user.id, 'contacts', input.id, {
              reason: 'contact_not_found',
            });
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Contato não encontrado',
            });
          }
          logError('delete_contact', ctx.user.id, error, {
            contactId: input.id,
            operation: 'delete',
            resource: 'contacts',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar contato',
          });
        }

        logOperation('delete_contact_success', ctx.user.id, 'contacts', input.id, {
          deletedContactId: input.id,
        });

        return data;
      } catch (error) {
        logError('delete_contact_unexpected', ctx.user.id, error as Error, {
          contactId: input.id,
          operation: 'delete',
          resource: 'contacts',
        });
        throw error;
      }
    }),

  // Buscar contatos por nome ou email
  search: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        query: z.string().min(1, 'Query de busca é obrigatória'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, name, email, phone, is_favorite')
          .eq('user_id', ctx.user.id)
          .or(
            `name.ilike.%${input.query}%,email.ilike.%${input.query}%,phone.ilike.%${input.query}%`
          )
          .order('is_favorite', { ascending: false })
          .order('name', { ascending: true })
          .limit(input.limit);

        if (error) {
          logError('search_contacts', ctx.user.id, error, {
            limit: input.limit,
            operation: 'search',
            resource: 'contacts',
            searchQuery: input.query,
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar contatos',
          });
        }

        logOperation('search_contacts_success', ctx.user.id, 'contacts', undefined, {
          limit: input.limit,
          resultsCount: data?.length || 0,
          searchQuery: input.query,
        });

        return data || [];
      } catch (error) {
        logError('search_contacts_unexpected', ctx.user.id, error as Error, {
          limit: input.limit,
          operation: 'search',
          resource: 'contacts',
          searchQuery: input.query,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contatos',
        });
      }
    }),

  // Obter contatos favoritos
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', ctx.user.id)
        .eq('is_favorite', true)
        .order('name', { ascending: true });

      if (error) {
        logError('fetch_favorite_contacts', ctx.user.id, error, {
          operation: 'getFavorites',
          resource: 'contacts',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contatos favoritos',
        });
      }

      logOperation('fetch_favorite_contacts_success', ctx.user.id, 'contacts', undefined, {
        favoritesCount: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      logError('fetch_favorite_contacts_unexpected', ctx.user.id, error as Error, {
        operation: 'getFavorites',
        resource: 'contacts',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar contatos favoritos',
      });
    }
  }),

  // Alternar status de favorito
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Primeiro buscar o contato atual para obter o status
        const { data: currentContact, error: fetchError } = await supabase
          .from('contacts')
          .select('is_favorite')
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .single();

        if (fetchError || !currentContact) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contato não encontrado',
          });
        }

        // Alternar o status
        const { data, error } = await supabase
          .from('contacts')
          .update({
            is_favorite: !currentContact.is_favorite,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id)
          .eq('user_id', ctx.user.id)
          .select()
          .single();

        if (error) {
          logError('toggle_favorite_status', ctx.user.id, error, {
            contactId: input.id,
            operation: 'toggleFavorite',
            previousStatus: currentContact.is_favorite,
            resource: 'contacts',
          });
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao alternar status de favorito',
          });
        }

        logOperation('toggle_favorite_success', ctx.user.id, 'contacts', input.id, {
          newStatus: !currentContact.is_favorite,
          previousStatus: currentContact.is_favorite,
        });

        return data;
      } catch (error) {
        logError('toggle_favorite_unexpected', ctx.user.id, error as Error, {
          contactId: input.id,
          operation: 'toggleFavorite',
          resource: 'contacts',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao alternar status de favorito',
        });
      }
    }),

  // Obter estatísticas dos contatos
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('is_favorite, email, phone')
        .eq('user_id', ctx.user.id);

      if (error) {
        logError('fetch_contact_stats', ctx.user.id, error, {
          operation: 'getStats',
          resource: 'contacts',
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar estatísticas de contatos',
        });
      }

      const contacts = data || [];

      const totalContacts = contacts.length;
      const favoriteContacts = contacts.filter((c) => c.is_favorite).length;
      const contactsWithEmail = contacts.filter((c) => c.email).length;
      const contactsWithPhone = contacts.filter((c) => c.phone).length;

      return {
        contactsWithEmail,
        contactsWithPhone,
        favoriteContacts,
        favoritePercentage: totalContacts > 0 ? (favoriteContacts / totalContacts) * 100 : 0,
        totalContacts,
      };
    } catch (error) {
      logError('fetch_contact_stats_unexpected', ctx.user.id, error as Error, {
        operation: 'getStats',
        resource: 'contacts',
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar estatísticas de contatos',
      });
    }
  }),
});

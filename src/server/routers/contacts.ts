import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { protectedProcedure, router } from '../trpc'

/**
 * Contacts Router - Gerenciamento de contatos
 */
export const contactsRouter = router({
  // Listar todos os contatos
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        isFavorite: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        let query = supabase.from('contacts').select('*').eq('user_id', ctx.user.id)

        if (input.search) {
          query = query.or(
            `name.ilike.%${input.search}%,email.ilike.%${input.search}%,phone.ilike.%${input.search}%`
          )
        }
        if (input.isFavorite !== undefined) {
          query = query.eq('is_favorite', input.isFavorite)
        }

        const { data, error, count } = await query
          .order('is_favorite', { ascending: false })
          .order('name', { ascending: true })
          .range(input.offset, input.offset + input.limit - 1)

        if (error) {
          console.error('Error fetching contacts:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar contatos',
          })
        }

        return {
          contacts: data || [],
          total: count || 0,
          hasMore: (count || 0) > input.offset + input.limit,
        }
      } catch (error) {
        console.error('Contacts fetch error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contatos',
        })
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
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Contato não encontrado',
            })
          }
          console.error('Error fetching contact:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar contato',
          })
        }

        return data
      } catch (error) {
        console.error('Contact fetch error:', error)
        throw error
      }
    }),

  // Criar novo contato
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        notes: z.string().optional(),
        isFavorite: z.boolean().default(false),
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
          .single()

        if (error) {
          if (error.code === '23505') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email ou telefone já cadastrado para este usuário',
            })
          }
          console.error('Error creating contact:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao criar contato',
          })
        }

        return data
      } catch (error) {
        console.error('Contact creation error:', error)
        throw error
      }
    }),

  // Atualizar contato
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        notes: z.string().optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input

        const { data, error } = await supabase
          .from('contacts')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select()
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Contato não encontrado',
            })
          }
          if (error.code === '23505') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email ou telefone já cadastrado para este usuário',
            })
          }
          console.error('Error updating contact:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao atualizar contato',
          })
        }

        return data
      } catch (error) {
        console.error('Contact update error:', error)
        throw error
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
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Contato não encontrado',
            })
          }
          console.error('Error deleting contact:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao deletar contato',
          })
        }

        return data
      } catch (error) {
        console.error('Contact deletion error:', error)
        throw error
      }
    }),

  // Buscar contatos por nome ou email
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Query de busca é obrigatória'),
        limit: z.number().min(1).max(20).default(10),
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
          .limit(input.limit)

        if (error) {
          console.error('Error searching contacts:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao buscar contatos',
          })
        }

        return data || []
      } catch (error) {
        console.error('Contact search error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contatos',
        })
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
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching favorite contacts:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar contatos favoritos',
        })
      }

      return data || []
    } catch (error) {
      console.error('Favorite contacts fetch error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar contatos favoritos',
      })
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
          .single()

        if (fetchError || !currentContact) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contato não encontrado',
          })
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
          .single()

        if (error) {
          console.error('Error toggling favorite status:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro ao alternar status de favorito',
          })
        }

        return data
      } catch (error) {
        console.error('Toggle favorite error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao alternar status de favorito',
        })
      }
    }),

  // Obter estatísticas dos contatos
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('is_favorite, email, phone')
        .eq('user_id', ctx.user.id)

      if (error) {
        console.error('Error fetching contact stats:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar estatísticas de contatos',
        })
      }

      const contacts = data || []

      const totalContacts = contacts.length
      const favoriteContacts = contacts.filter((c) => c.is_favorite).length
      const contactsWithEmail = contacts.filter((c) => c.email).length
      const contactsWithPhone = contacts.filter((c) => c.phone).length

      return {
        totalContacts,
        favoriteContacts,
        contactsWithEmail,
        contactsWithPhone,
        favoritePercentage: totalContacts > 0 ? (favoriteContacts / totalContacts) * 100 : 0,
      }
    } catch (error) {
      console.error('Contact stats error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao buscar estatísticas de contatos',
      })
    }
  }),
})

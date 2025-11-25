import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '@/server/trpc';

/**
 * Contact type for type safety
 */
interface Contact {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  pix_key?: string | null;
  bank_account?: string | null;
  is_favorite?: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Contacts router for managing financial contacts
 */
export const contactsRouter = createTRPCRouter({
  // List user contacts
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { data, error } = await ctx.supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch contacts',
      });
    }

    return (data ?? []) as Contact[];
  }),

  // Create contact
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        pix_key: z.string().optional(),
        bank_account: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('contacts')
        .insert({
          ...input,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create contact',
        });
      }

      return data as Contact;
    }),

  // Get contact by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('contacts')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      return data as Contact;
    }),

  // Get favorite contacts
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { data, error } = await ctx.supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('name', { ascending: true });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch favorite contacts',
      });
    }

    return (data ?? []) as Contact[];
  }),

  // Search contacts
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { data, error } = await ctx.supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .or(`name.ilike.%${input.query}%,email.ilike.%${input.query}%,phone.ilike.%${input.query}%`)
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search contacts',
        });
      }

      return (data ?? []) as Contact[];
    }),

  // Get contact stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const { data, error } = await ctx.supabase
      .from('contacts')
      .select('is_favorite, email, phone')
      .eq('user_id', userId);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch contact stats',
      });
    }

    const contacts = data as Pick<Contact, 'is_favorite' | 'email' | 'phone'>[];
    const totalContacts = contacts.length;
    const favoriteContacts = contacts.filter((c) => c.is_favorite).length;
    const contactsWithEmail = contacts.filter((c) => c.email).length;
    const contactsWithPhone = contacts.filter((c) => c.phone).length;

    return {
      totalContacts,
      favoriteContacts,
      contactsWithEmail,
      contactsWithPhone,
      favoritePercentage: totalContacts > 0 ? (favoriteContacts / totalContacts) * 100 : 0,
    };
  }),

  // Update contact
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        pix_key: z.string().optional().nullable(),
        is_favorite: z.boolean().optional(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { id, ...updateData } = input;

      const { data, error } = await ctx.supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update contact',
        });
      }

      return data as Contact;
    }),

  // Delete contact
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      const { error } = await ctx.supabase
        .from('contacts')
        .delete()
        .eq('id', input.id)
        .eq('user_id', userId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete contact',
        });
      }

      return { success: true };
    }),

  // Toggle favorite
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
      }

      // Get current status
      const { data: contact, error: fetchError } = await ctx.supabase
        .from('contacts')
        .select('is_favorite')
        .eq('id', input.id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const currentFavorite = (contact as Pick<Contact, 'is_favorite'>).is_favorite;

      // Toggle
      const { data, error } = await ctx.supabase
        .from('contacts')
        .update({ is_favorite: !currentFavorite })
        .eq('id', input.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to toggle favorite',
        });
      }

      return data as Contact;
    }),
});

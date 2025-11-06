import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from '@/server/context';

export const createAuthRouter = (t: any) => ({
  /**
   * Get current user session
   */
  getSession: t.procedure.query(async ({ ctx }: { ctx: Context }) => {
    return ctx.session?.user ?? null;
  }),

  /**
   * Sign in with email and password
   */
  signIn: t.procedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Sign up with email and password
   */
  signUp: t.procedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      const { data, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            display_name: input.name,
          },
        },
      });

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Sign out
   */
  signOut: t.procedure
    .use(({ ctx, next }: { ctx: Context; next: any }) => {
      if (!ctx.session?.user) {
        throw new Error('Not authenticated');
      }
      return next({
        ctx: {
          ...ctx,
          user: ctx.session.user,
        },
      });
    })
    .mutation(async ({ ctx }: { ctx: any }) => {
      const { error } = await ctx.supabase.auth.signOut();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return { success: true };
    }),
});

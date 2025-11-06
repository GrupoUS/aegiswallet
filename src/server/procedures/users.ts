import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from '@/server/context'

export const createUserRouter = (t: any) => ({
  /**
   * Get user profile
   */
  getProfile: t.procedure.query(async ({ ctx }: { ctx: Context }) => {
    const { data, error } = await ctx.supabase
      .from('profiles')
      .select('*')
      .eq('id', ctx.user.id)
      .single()

    if (error) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Profile not found',
      })
    }

    return data
  }),

  /**
   * Update user profile
   */
  updateProfile: t.procedure
    .input(
      z.object({
        display_name: z.string().min(2).optional(),
        avatar_url: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      const { data, error } = await ctx.supabase
        .from('profiles')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.user.id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return data
    }),
})

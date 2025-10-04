import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from '../context'

export const createVoiceRouter = (t: any) => ({
  /**
   * Process voice command - stub implementation
   */
  processCommand: t.procedure
    .input(
      z.object({
        command: z.string().min(1),
        confidence: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        })
      }

      // Simple stub implementation for voice command processing
      return {
        success: true,
        response: `Comando processado: ${input.command}`,
        confidence: input.confidence || 0.8,
      }
    }),
})
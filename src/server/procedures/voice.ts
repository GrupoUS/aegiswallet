import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import { voiceCommandRateLimit, securityMiddleware } from '@/server/middleware/securityMiddleware';
import type { Context } from '@/server/context';

export const createVoiceRouter = (t: any) => ({
  /**
   * Process voice command
   */
  processCommand: t.procedure
    .use(voiceCommandRateLimit)
    .use(securityMiddleware)
    .input(
      z.object({
        command: z.string().min(1).max(1000),
        sessionId: z.string().uuid().optional(),
        audioData: z.any().optional(), // For future audio file support
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for voice commands',
        });
      }

      try {
        // Log voice command processing
        secureLogger.audit('Voice command processing started', {
          userId: ctx.user.id,
          sessionId: input.sessionId,
          commandLength: input.command.length,
          hasAudioData: !!input.audioData,
          component: 'voice.processCommand',
        });

        // Store command for feedback collection
        const { data: commandData, error: commandError } = await ctx.supabase
          .from('voice_commands')
          .insert({
            user_id: ctx.user.id,
            command_text: input.command,
            session_id: input.sessionId,
            status: 'processing',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (commandError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process voice command',
          });
        }

        // TODO: Integrate with actual NLU processing
        // For now, simulate processing
        const processingResult = {
          intent: 'transaction',
          entities: {
            amount: 100,
            category: 'food',
            description: 'Comida no restaurante',
          },
          confidence: 0.95,
          processed_at: new Date().toISOString(),
        };

        // Update command status
        await ctx.supabase
          .from('voice_commands')
          .update({
            status: 'completed',
            intent: processingResult.intent,
            entities: processingResult.entities,
            confidence: processingResult.confidence,
            processed_at: processingResult.processed_at,
          })
          .eq('id', commandData.id);

        secureLogger.audit('Voice command processed successfully', {
          userId: ctx.user.id,
          commandId: commandData.id,
          intent: processingResult.intent,
          confidence: processingResult.confidence,
          component: 'voice.processCommand',
        });

        return {
          success: true,
          commandId: commandData.id,
          result: processingResult,
        };
      } catch (error) {
        secureLogger.error('Voice command processing failed', {
          userId: ctx.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          command: input.command.substring(0, 100), // Log first 100 chars for debugging
          component: 'voice.processCommand',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process voice command',
        });
      }
    }),

  /**
   * Submit voice feedback
   */
  submitFeedback: t.procedure
    .use(securityMiddleware)
    .input(
      z.object({
        commandId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        feedback: z.string().max(500).optional(),
        wasCorrect: z.boolean().optional(),
        correction: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for feedback submission',
        });
      }

      try {
        // Verify command belongs to user
        const { data: command, error: commandError } = await ctx.supabase
          .from('voice_commands')
          .select('command_text, intent, confidence')
          .eq('id', input.commandId)
          .eq('user_id', ctx.user.id)
          .single();

        if (commandError || !command) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Voice command not found',
          });
        }

        // Store feedback
        const { data: feedbackData, error: feedbackError } = await ctx.supabase
          .from('voice_feedback')
          .insert({
            user_id: ctx.user.id,
            command_text: command.command_text,
            recognized_intent: command.intent,
            confidence_score: command.confidence,
            rating: input.rating,
            feedback_text: input.feedback,
            was_correct: input.wasCorrect,
            correction_made: input.correction,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (feedbackError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to submit feedback',
          });
        }

        secureLogger.audit('Voice feedback submitted', {
          userId: ctx.user.id,
          commandId: input.commandId,
          feedbackId: feedbackData.id,
          rating: input.rating,
          wasCorrect: input.wasCorrect,
          component: 'voice.submitFeedback',
        });

        return {
          success: true,
          feedbackId: feedbackData.id,
        };
      } catch (error) {
        secureLogger.error('Voice feedback submission failed', {
          userId: ctx.user.id,
          commandId: input.commandId,
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'voice.submitFeedback',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit feedback',
        });
      }
    }),

  /**
   * Get voice command history
   */
  getHistory: t.procedure
    .use(securityMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }: { ctx: Context; input: any }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      try {
        const { data, error, count } = await ctx.supabase
          .from('voice_commands')
          .select('id, command_text, intent, confidence, status, created_at, processed_at', {
            count: 'exact',
          })
          .eq('user_id', ctx.user.id)
          .order('created_at', { ascending: false })
          .range(input.offset, input.offset + input.limit - 1);

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch voice command history',
          });
        }

        return {
          commands: data || [],
          totalCount: count || 0,
          hasMore: input.offset + input.limit < (count || 0),
        };
      } catch (error) {
        secureLogger.error('Voice history fetch failed', {
          userId: ctx.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          component: 'voice.getHistory',
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch voice command history',
        });
      }
    }),

  /**
   * Get voice analytics for user
   */
  getAnalytics: t.procedure.use(securityMiddleware).query(async ({ ctx }: { ctx: Context }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    try {
      // Get command statistics
      const { data: commands, error: commandsError } = await ctx.supabase
        .from('voice_commands')
        .select('status, intent, confidence, created_at')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get feedback statistics
      const { data: feedback, error: feedbackError } = await ctx.supabase
        .from('voice_feedback')
        .select('rating, was_correct, created_at')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (commandsError || feedbackError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch voice analytics',
        });
      }

      // Calculate statistics
      const totalCommands = commands?.length || 0;
      const successfulCommands = commands?.filter((c) => c.status === 'completed').length || 0;
      const averageConfidence =
        commands?.reduce((sum, c) => sum + (c.confidence || 0), 0) / totalCommands || 0;
      const averageRating =
        feedback?.reduce((sum, f) => sum + f.rating, 0) / (feedback?.length || 0) || 0;
      const accuracyRate =
        feedback?.filter((f) => f.wasCorrect).length / (feedback?.length || 1) || 0;

      // Get intent distribution
      const intentCounts =
        commands?.reduce(
          (acc, cmd) => {
            acc[cmd.intent || 'unknown'] = (acc[cmd.intent || 'unknown'] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      return {
        totalCommands,
        successfulCommands,
        successRate: totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        averageRating: Math.round(averageRating * 100) / 100,
        accuracyRate: Math.round(accuracyRate * 100),
        intentDistribution: intentCounts,
        totalFeedback: feedback?.length || 0,
      };
    } catch (error) {
      secureLogger.error('Voice analytics fetch failed', {
        userId: ctx.user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        component: 'voice.getAnalytics',
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch voice analytics',
      });
    }
  }),
});

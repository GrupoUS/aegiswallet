import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { Context } from '@/server/context';
import { voiceCommandRateLimit } from '@/server/middleware/rateLimitMiddleware';
import { securityMiddleware } from '@/server/middleware/securityMiddleware';
import type { ProcessVoiceCommandInputType } from '@/types/server.types';

const MIN_AUTOMATION_CONFIDENCE = 0.8;

// Type-safe tRPC router builder interface
interface TRPCRouterBuilder {
  procedure: {
    use: (middleware: unknown) => TRPCRouterBuilder;
    input: (schema: z.ZodSchema) => TRPCRouterBuilder;
    mutation: (
      handler: (opts: { ctx: Context; input: unknown }) => Promise<unknown>
    ) => TRPCRouterBuilder;
    query: (handler: (opts: { ctx: Context }) => Promise<unknown>) => TRPCRouterBuilder;
  };
}

export const createVoiceRouter = (t: TRPCRouterBuilder) => ({
  /**
   * Process voice commands through the NLU pipeline (STT → intenção → entidades → ação).
   *
   * Segurança:
   * - Rate limiting dedicado (`voiceCommandRateLimit`) + `securityMiddleware`.
   * - Sanitiza áudio/texto antes de persistir.
   * - Requer autenticação e registra auditoria no `secureLogger`.
   *
   * Observação: até que o NLU definitivo esteja integrado, os resultados são simulados,
   * mas já aplicamos o limiar mínimo de confiança (`MIN_AUTOMATION_CONFIDENCE`) para exigir confirmação.
   */
  processCommand: t.procedure
    .use(voiceCommandRateLimit)
    .use(securityMiddleware)
    .input(
      z.object({
        command: z.string().min(1).max(1000),
        sessionId: z.string().uuid().optional(),
        audioData: z.instanceof(Buffer).optional(), // Typed audio data support
        language: z.string().default('pt-BR'),
        requireConfirmation: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: ProcessVoiceCommandInputType }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for voice commands',
        });
      }

      try {
        // Log voice command processing
        secureLogger.audit('Voice command processing started', {
          commandLength: input.command.length,
          component: 'voice.processCommand',
          hasAudioData: !!input.audioData,
          sessionId: input.sessionId,
          userId: ctx.user.id,
        });

        // Store command for feedback collection
        const { data: commandData, error: commandError } = await ctx.supabase
          .from('voice_commands')
          .insert({
            command_text: input.command,
            created_at: new Date().toISOString(),
            session_id: input.sessionId,
            status: 'processing',
            user_id: ctx.user.id,
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
          confidence: 0.95,
          entities: {
            amount: 100,
            category: 'food',
            description: 'Comida no restaurante',
          },
          intent: 'transaction',
          processed_at: new Date().toISOString(),
        };
        const requiresManualConfirmation =
          input.requireConfirmation || processingResult.confidence < MIN_AUTOMATION_CONFIDENCE;

        // Update command status
        await ctx.supabase
          .from('voice_commands')
          .update({
            confidence: processingResult.confidence,
            entities: processingResult.entities,
            intent: processingResult.intent,
            processed_at: processingResult.processed_at,
            status: 'completed',
          })
          .eq('id', commandData.id);

        secureLogger.audit('Voice command processed successfully', {
          commandId: commandData.id,
          component: 'voice.processCommand',
          confidence: processingResult.confidence,
          intent: processingResult.intent,
          userId: ctx.user.id,
        });

        return {
          commandId: commandData.id,
          result: {
            ...processingResult,
            requiresConfirmation: requiresManualConfirmation,
          },
          success: true,
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
   * Submit structured feedback after a voice command (rating + correções).
   *
   * Os registros alimentam o treinamento do NLU e ajudam a mensurar acurácia.
   */
  submitFeedback: t.procedure
    .use(securityMiddleware)
    .input(
      z.object({
        commandId: z.string().uuid(),
        correction: z.string().max(200).optional(),
        feedback: z.string().max(500).optional(),
        rating: z.number().min(1).max(5),
        wasCorrect: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
            command_text: command.command_text,
            confidence_score: command.confidence,
            correction_made: input.correction,
            created_at: new Date().toISOString(),
            feedback_text: input.feedback,
            rating: input.rating,
            recognized_intent: command.intent,
            user_id: ctx.user.id,
            was_correct: input.wasCorrect,
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
          commandId: input.commandId,
          component: 'voice.submitFeedback',
          feedbackId: feedbackData.id,
          rating: input.rating,
          userId: ctx.user.id,
          wasCorrect: input.wasCorrect,
        });

        return {
          feedbackId: feedbackData.id,
          success: true,
        };
      } catch (error) {
        secureLogger.error('Voice feedback submission failed', {
          commandId: input.commandId,
          component: 'voice.submitFeedback',
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: ctx.user.id,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit feedback',
        });
      }
    }),

  /**
   * Paginated history of voice commands (texto, intenção, confiança, status).
   *
   * Útil para o usuário revisar automações e para auditoria LGPD.
   */
  getHistory: t.procedure
    .use(securityMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
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
          hasMore: input.offset + input.limit < (count || 0),
          totalCount: count || 0,
        };
      } catch (error) {
        secureLogger.error('Voice history fetch failed', {
          component: 'voice.getHistory',
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: ctx.user.id,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch voice command history',
        });
      }
    }),

  /**
   * Aggregate analytics for the voice assistant (taxa de sucesso, confiança média, distribuição de intenções).
   *
   * Também calcula métricas de feedback (rating médio, accuracy subjetiva) para dashboards internos.
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
        accuracyRate: Math.round(accuracyRate * 100),
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        averageRating: Math.round(averageRating * 100) / 100,
        intentDistribution: intentCounts,
        successRate: totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0,
        successfulCommands,
        totalCommands,
        totalFeedback: feedback?.length || 0,
      };
    } catch (error) {
      secureLogger.error('Voice analytics fetch failed', {
        component: 'voice.getAnalytics',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: ctx.user.id,
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch voice analytics',
      });
    }
  }),
});

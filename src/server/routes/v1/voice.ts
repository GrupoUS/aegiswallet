/**
 * Voice Commands API - Hono RPC Implementation
 * Handles voice command processing and available commands
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { secureLogger } from '@/lib/logging/secure-logger';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware, userRateLimitMiddleware } from '@/server/middleware/auth';
import type { ProcessVoiceCommandInputType } from '@/types/server.types';

const MIN_AUTOMATION_CONFIDENCE = 0.8;
const voiceRouter = new Hono<AppEnv>();

// Input validation schemas
const processCommandSchema = z.object({
  command: z.string().min(1).max(1000),
  sessionId: z.string().uuid().optional(),
  audioData: z.instanceof(Buffer).optional(), // Typed audio data support
  language: z.string().default('pt-BR'),
  requireConfirmation: z.boolean().default(false),
});

export const availableCommandsResponseSchema = z.object({
  commands: z.array(
    z.object({
      description: z.string(),
      examples: z.array(z.string()),
      name: z.string(),
    })
  ),
  language: z.string(),
});

/**
 * Process voice command through NLU pipeline
 *
 * Security:
 * - Rate limiting per user
 * - Sanitize audio/text before persisting
 * - Requires authentication and audit logging
 *
 * Note: Until definitive NLU is integrated, results are simulated,
 * but we already apply minimum confidence threshold for confirmation.
 */
voiceRouter.post(
  '/process',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 commands per minute per user
    message: 'Too many voice commands, please try again later',
  }),
  zValidator('json', processCommandSchema),
  async (c) => {
    const { user, supabase } = c.get('auth');
    const input = c.req.valid('json');
    const requestId = c.get('requestId');

    const { command, sessionId, audioData, language, requireConfirmation } = input;

    try {
      // Log incoming voice command for audit
      secureLogger.audit('Voice command processing started', {
        commandLength: command.length,
        component: 'voice.processCommand',
        requestId,
        userId: user.id,
      });

      // Process voice command through NLU pipeline
      const result = await processVoiceCommand({
        audioData,
        command,
        context: { user, supabase },
        language,
        requireConfirmation,
        sessionId,
        userId: user.id,
      });

      // Log processing result
      secureLogger.audit('Voice command processing completed', {
        command,
        requestId,
        result,
        sessionId,
        timestamp: new Date().toISOString(),
        userId: user.id,
      });

      return c.json({
        data: result,
        meta: {
          processedAt: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      secureLogger.audit('Voice command processing failed', {
        command,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        sessionId,
        timestamp: new Date().toISOString(),
        userId: user.id,
      });

      return c.json(
        {
          code: 'VOICE_PROCESSING_ERROR',
          details: {
            command: command.substring(0, 50), // Limit command length in error
          },
          error: 'Failed to process voice command',
        },
        500
      );
    }
  }
);

/**
 * Get available voice commands and their descriptions
 */
voiceRouter.get(
  '/commands',
  authMiddleware,
  userRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per user
    message: 'Too many requests, please try again later',
  }),
  async (c) => {
    const { user } = c.get('auth');
    const requestId = c.get('requestId');

    try {
      const response = {
        commands: [
          {
            description: 'Verificar saldo da conta',
            examples: ['Qual é o meu saldo?', 'Quanto dinheiro eu tenho?'],
            name: 'check_balance',
          },
          {
            description: 'Transferir dinheiro para outra conta',
            examples: ['Transferir R$ 100 para João', 'Pagar 50 reais para Maria'],
            name: 'transfer_money',
          },
          {
            description: 'Pagar contas e boletos',
            examples: ['Pagar conta de luz', 'Pagar boleto do cartão'],
            name: 'pay_bill',
          },
          {
            description: 'Ver histórico de transações',
            examples: ['Mostrar minhas transações', 'Ver extrato do mês'],
            name: 'transaction_history',
          },
        ],
        language: 'pt-BR',
      };

      // Log command list access
      secureLogger.info('Voice commands list accessed', {
        requestId,
        userId: user.id,
      });

      return c.json({
        data: response,
        meta: {
          requestId,
          retrievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      secureLogger.error('Failed to get voice commands', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId: user.id,
      });

      return c.json(
        {
          code: 'COMMANDS_RETRIEVAL_ERROR',
          error: 'Failed to retrieve voice commands',
        },
        500
      );
    }
  }
);

/**
 * Process voice command function (placeholder for NLU integration)
 * This would be replaced with actual NLU processing
 */
interface VoiceCommandResult {
  intent: string | null;
  entities: Record<string, unknown>;
  confidence: number;
  response: string;
  requiresConfirmation: boolean;
  sessionId: string;
  language: string;
}

async function processVoiceCommand(
  input: ProcessVoiceCommandInputType
): Promise<VoiceCommandResult> {
  const { command, sessionId, language, requireConfirmation } = input;

  // Placeholder implementation - in real scenario, this would:
  // 1. Convert audio to text if audioData is provided
  // 2. Extract intent and entities using NLU
  // 3. Execute appropriate action based on intent
  // 4. Return result with confidence score

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simple command detection for demo
  const lowerCommand = command.toLowerCase();
  let intent = null;
  let entities = {};
  let confidence = 0.9;

  if (lowerCommand.includes('saldo') || lowerCommand.includes('quanto tenho')) {
    intent = 'check_balance';
  } else if (lowerCommand.includes('transferir') || lowerCommand.includes('pagar')) {
    intent = 'transfer_money';
    // Extract amount and recipient (simplified)
    const amountMatch = command.match(/r?\$?\s*(\d+)/i);
    if (amountMatch) {
      entities = { amount: parseFloat(amountMatch[1]) };
    }
  } else if (lowerCommand.includes('conta') || lowerCommand.includes('boleto')) {
    intent = 'pay_bill';
  } else if (lowerCommand.includes('extrato') || lowerCommand.includes('transações')) {
    intent = 'transaction_history';
  } else {
    intent = 'unknown';
    confidence = 0.3;
  }

  // Determine if confirmation is required
  const requiresConfirmation = confidence < MIN_AUTOMATION_CONFIDENCE || requireConfirmation;

  return {
    confidence,
    entities,
    intent,
    language,
    processedAt: new Date().toISOString(),
    requiresConfirmation,
    sessionId,
  };
}

export default voiceRouter;

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
import { getAvailableCommands, processVoiceCommand } from '@/services/voiceCommandService';

const voiceRouter = new Hono<AppEnv>();

// Input validation schemas
const processCommandSchema = z
	.object({
		commandText: z.string().min(1).max(1000).optional(),
		sessionId: z.string().uuid(),
		audioData: z.string().optional(), // Base64 encoded audio data
		language: z.string().default('pt-BR'),
		requireConfirmation: z.boolean().default(false),
	})
	.refine((data) => data.audioData || data.commandText, {
		message: 'Dados de áudio ou texto do comando são obrigatórios',
		path: ['audioData'],
	});

export const availableCommandsResponseSchema = z.object({
	commands: z.array(
		z.object({
			description: z.string(),
			examples: z.array(z.string()),
			name: z.string(),
		}),
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
		const { user } = c.get('auth');
		const input = c.req.valid('json');
		const requestId = c.get('requestId');

		const { commandText, sessionId, audioData, language, requireConfirmation } = input;

		// Command text is required for non-audio processing
		const command = commandText ?? '';

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
				commandText: command,
				userId: user.id,
				context: { user },
				language,
				requireConfirmation,
				sessionId,
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
				500,
			);
		}
	},
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
			const response = getAvailableCommands();

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
				500,
			);
		}
	},
);

export default voiceRouter;

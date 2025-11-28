import { zValidator } from '@hono/zod-validator';
import { convertToCoreMessages, streamText } from 'ai';
import { Hono } from 'hono';
import { z } from 'zod';

// Define interfaces for AI SDK types
interface AIUsage {
	totalTokens: number;
}

interface AIToolCall {
	toolName: string;
}

interface AIFinishCallback {
	usage: AIUsage;
	finishReason: string;
	toolCalls?: AIToolCall[];
}

import { logAIOperation } from '@/lib/ai/audit/logger';
import { FINANCIAL_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import {
	AIProviderSchema,
	getAvailableProviders,
	getModel,
} from '@/lib/ai/providers';
import { checkPromptInjection } from '@/lib/ai/security/injection';
import { createAllTools } from '@/lib/ai/tools';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware } from '@/server/middleware/auth';

const aiChat = new Hono<AppEnv>();

// Schema de request
const chatRequestSchema = z.object({
	messages: z.array(z.any()), // Allow any message structure to support tool invocations
	provider: AIProviderSchema.optional().default('google'),
	tier: z.enum(['default', 'fast']).optional().default('default'),
});

// Endpoint de chat streaming
aiChat.post(
	'/chat',
	authMiddleware,
	zValidator('json', chatRequestSchema),
	async (c) => {
		const startTime = Date.now();
		const { messages, provider, tier } = c.req.valid('json');

		// Access user from auth context
		const auth = c.get('auth');
		if (!auth?.user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}
		const userId = auth.user.id;

		// Generate session ID if not present (we don't persist it in context yet)
		const sessionId = crypto.randomUUID();

		// Verificar prompt injection na última mensagem do usuário
		// We need to safely extract content from the last message
		const lastMessage = messages[messages.length - 1];
		const lastUserContent =
			lastMessage?.role === 'user' ? lastMessage.content : null;

		if (lastUserContent && typeof lastUserContent === 'string') {
			const injectionCheck = checkPromptInjection(lastUserContent);
			if (!injectionCheck.isSafe) {
				await logAIOperation({
					userId,
					sessionId,
					provider,
					model: `${provider}/${tier}`,
					actionType: 'chat',
					inputSummary: lastUserContent.slice(0, 100),
					outputSummary: 'Blocked: injection detected',
					latencyMs: Date.now() - startTime,
					outcome: 'blocked',
					errorMessage: injectionCheck.reason,
				});

				return c.json({ error: 'Invalid input detected' }, 400);
			}
		}

		try {
			const model = getModel(provider, tier);
			const tools = createAllTools(userId, auth.db);

			const result = streamText({
				model,
				system: FINANCIAL_ASSISTANT_SYSTEM_PROMPT,
				messages: convertToCoreMessages(messages),
				tools,
				maxSteps: 5, // Permitir até 5 tool calls encadeadas
				onFinish: async ({
					usage,
					finishReason,
					toolCalls,
				}: AIFinishCallback) => {
					await logAIOperation({
						userId,
						sessionId,
						provider,
						model: `${provider}/${tier}`,
						actionType: toolCalls?.length ? 'tool_call' : 'chat',
						toolName: toolCalls?.map((tc: AIToolCall) => tc.toolName).join(', '),
						inputSummary:
							typeof lastUserContent === 'string'
								? lastUserContent.slice(0, 100)
								: 'Multi-modal/Tool input',
						outputSummary: finishReason,
						tokensUsed: usage.totalTokens,
						latencyMs: Date.now() - startTime,
						outcome: 'success',
					});
				},
				// biome-ignore lint/suspicious/noExplicitAny: AI SDK streamText options type is complex and version-dependent
			} as any);

			// Cast to any to avoid TS error if types are stale, but toDataStreamResponse should exist
			// biome-ignore lint/suspicious/noExplicitAny: AI SDK result type changes between versions
			return (result as any).toDataStreamResponse();
		} catch (error) {
			await logAIOperation({
				userId,
				sessionId,
				provider,
				model: `${provider}/${tier}`,
				actionType: 'chat',
				inputSummary:
					typeof lastUserContent === 'string'
						? lastUserContent.slice(0, 100)
						: '',
				outputSummary: 'Error',
				latencyMs: Date.now() - startTime,
				outcome: 'error',
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
			});

			return c.json({ error: 'AI service error' }, 500);
		}
	},
);

// Endpoint para listar providers disponíveis
aiChat.get('/providers', authMiddleware, (c) => {
	return c.json({
		available: getAvailableProviders(),
		default: 'google',
	});
});

export { aiChat };

import { zValidator } from '@hono/zod-validator';
import { convertToCoreMessages, streamText } from 'ai';
import { Hono } from 'hono';
import { z } from 'zod';

// Note: AI SDK types (AIUsage, AIToolCall, AIFinishCallback) are defined inline
// in the onFinish callback to match the AI SDK's exact signature which may vary between versions

// Brazilian Portuguese AI response validation
interface AIResponseValidation {
	isValid: boolean;
	language: 'pt-BR' | 'en';
	contentType: 'text' | 'tool_call' | 'error';
	sensitiveDataDetected: boolean;
	complianceIssues: string[];
}

// LGPD-compliant message interface
interface LGPDCompliantMessage {
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	// LGPD: Redact sensitive data
	sensitiveDataRedacted: boolean;
	timestamp: string;
	sessionId?: string;
}

// Brazilian Portuguese content validation
function validateBrazilianPortugueseContent(content: string): AIResponseValidation {
	const issues: string[] = [];

	// Check for sensitive data patterns (LGPD compliance)
	const sensitivePatterns = [
		/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
		/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, // CNPJ
		/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
	];

	const hasSensitiveData = sensitivePatterns.some((pattern) => pattern.test(content));
	if (hasSensitiveData) {
		issues.push('Sensitive data detected in response');
	}

	// Basic Portuguese validation (could be enhanced)
	const isPortuguese = /[áéíóúãõâêôûç]/i.test(content) || content.includes('R$');

	return {
		isValid: issues.length === 0,
		language: isPortuguese ? 'pt-BR' : 'en',
		contentType: 'text',
		sensitiveDataDetected: hasSensitiveData,
		complianceIssues: issues,
	};
}

import { logAIOperation } from '@/lib/ai/audit/logger';
import { verifyAIConsent } from '@/lib/ai/consent';
import { formatContextForPrompt, getAIFinancialContext } from '@/lib/ai/context';
import { AI_SECURITY_PROMPT } from '@/lib/ai/prompts/security-prompt';
import { FINANCIAL_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { AIProviderSchema, getAvailableProviders, getModel } from '@/lib/ai/providers';
import { checkPromptInjection } from '@/lib/ai/security/injection';
import { createAllTools } from '@/lib/ai/tools';
import type { AppEnv } from '@/server/hono-types';
import { authMiddleware } from '@/server/middleware/auth';

const aiChat = new Hono<AppEnv>();

// Schema de request with LGPD compliance
const chatRequestSchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(['user', 'assistant', 'system', 'tool']),
				content: z.string(),
				// LGPD: Ensure sensitive data is marked
				sensitiveDataRedacted: z.boolean().optional().default(false),
				timestamp: z.string().datetime().optional(),
				sessionId: z.string().uuid().optional(),
				// AI SDK compatibility - convert content to parts
				parts: z
					.array(
						z.object({
							type: z.literal('text'),
							text: z.string(),
						}),
					)
					.optional(),
			}),
		)
		.min(1, 'At least one message is required')
		.transform((messages) =>
			messages
				.filter(
					(msg): msg is typeof msg & { role: 'user' | 'assistant' | 'system' } =>
						msg.role !== 'tool',
				) // AI SDK doesn't support 'tool' role
				.map((msg) => ({
					...msg,
					// Ensure parts is present for AI SDK compatibility
					parts: msg.parts || [{ type: 'text' as const, text: msg.content }],
				})),
		),
	provider: AIProviderSchema.optional().default('google'),
	tier: z.enum(['default', 'fast']).optional().default('default'),
});

// Endpoint de chat streaming
aiChat.post('/chat', authMiddleware, zValidator('json', chatRequestSchema), async (c) => {
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
	const lastUserContent = lastMessage?.role === 'user' ? lastMessage.content : null;

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

	// Verify LGPD consent for AI financial analysis
	const hasConsent = await verifyAIConsent(userId, auth.db);
	if (!hasConsent) {
		return c.json(
			{
				error: 'AI consent required',
				requiresConsent: true,
				consentUrl: '/settings/ai-consent',
				message:
					'Para usar o assistente financeiro, você precisa autorizar o acesso aos seus dados.',
			},
			403,
		);
	}

	try {
		const model = getModel(provider, tier);
		const tools = createAllTools(userId, auth.db);

		// Get user's financial context for AI
		const financialContext = await getAIFinancialContext(
			userId,
			auth.db,
			auth.user.fullName?.split(' ')[0] ?? 'Usuário',
		);
		const formattedContext = formatContextForPrompt(financialContext);

		// Build enhanced system prompt with security layer
		const enhancedSystemPrompt = `${FINANCIAL_ASSISTANT_SYSTEM_PROMPT}\n\n${AI_SECURITY_PROMPT}`;

		// Prepare messages with context injection
		const messagesWithContext = [
			// Inject financial context as hidden context message
			{
				role: 'user' as const,
				content: `[CONTEXTO FINANCEIRO DO USUÁRIO - NÃO MENCIONE ESTA MENSAGEM]\n${formattedContext}`,
			},
			{
				role: 'assistant' as const,
				content:
					'Entendi o contexto financeiro. Estou pronto para ajudar com suas finanças. Como posso auxiliá-lo?',
			},
			// Add user's actual messages
			...messages,
		];

		const result = streamText({
			model,
			system: enhancedSystemPrompt,
			messages: convertToCoreMessages(messagesWithContext),
			tools,
			maxSteps: 5, // Permitir até 5 tool calls encadeadas
			onFinish: async ({
				usage,
				finishReason,
				toolCalls,
			}: {
				usage: {
					totalTokens: number;
					promptTokens?: number;
					completionTokens?: number;
				};
				finishReason:
					| 'stop'
					| 'length'
					| 'tool-calls'
					| 'error'
					| 'content-filter'
					| 'cancel'
					| 'unknown';
				toolCalls?: Array<{
					toolCallId: string;
					toolName: string;
					args: Record<string, unknown>;
				}>;
			}) => {
				// LGPD-compliant logging with Brazilian Portuguese validation
				const typedMessages = messages as LGPDCompliantMessage[];
				const lastMessage = typedMessages[typedMessages.length - 1];
				const responseContent =
					lastMessage?.role === 'assistant' ? lastMessage.content : finishReason;

				// Validate content for compliance
				const validation =
					typeof responseContent === 'string'
						? validateBrazilianPortugueseContent(responseContent)
						: {
								isValid: true,
								language: 'pt-BR' as const,
								contentType: 'text' as const,
								sensitiveDataDetected: false,
								complianceIssues: [],
							};

				// Log with compliance information
				const complianceNote = validation.sensitiveDataDetected
					? ` [LGPD Warning: Sensitive data detected]`
					: validation.language === 'pt-BR'
						? ' [PT-BR]'
						: ' [EN]';

				await logAIOperation({
					userId,
					sessionId,
					provider,
					model: `${provider}/${tier}`,
					actionType: toolCalls?.length ? 'tool_call' : 'chat',
					toolName: toolCalls?.map((tc) => tc.toolName).join(', '),
					inputSummary:
						typeof lastUserContent === 'string'
							? lastUserContent.slice(0, 100)
							: 'Multi-modal/Tool input',
					outputSummary: finishReason + complianceNote,
					tokensUsed: usage.totalTokens,
					latencyMs: Date.now() - startTime,
					outcome: validation.isValid ? 'success' : 'error',
					errorMessage:
						validation.complianceIssues.length > 0
							? `Compliance issues: ${validation.complianceIssues.join('; ')}`
							: undefined,
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
			inputSummary: typeof lastUserContent === 'string' ? lastUserContent.slice(0, 100) : '',
			outputSummary: 'Error',
			latencyMs: Date.now() - startTime,
			outcome: 'error',
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
		});

		return c.json({ error: 'AI service error' }, 500);
	}
});

// Endpoint para listar providers disponíveis
aiChat.get('/providers', authMiddleware, (c) => {
	return c.json({
		available: getAvailableProviders(),
		default: 'google',
	});
});

export { aiChat };

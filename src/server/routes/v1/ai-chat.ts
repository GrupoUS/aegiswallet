import { Hono } from 'hono';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getModel, AIProviderSchema, getAvailableProviders } from '@/lib/ai/providers';
import { createAllTools } from '@/lib/ai/tools';
import { checkPromptInjection } from '@/lib/ai/security/injection';
import { logAIOperation } from '@/lib/ai/audit/logger';
import { FINANCIAL_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { authMiddleware } from '@/server/middleware/auth';

const aiChat = new Hono();

// Schema de request
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
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
    const userId = c.get('userId');
    const sessionId = c.get('sessionId') ?? crypto.randomUUID();

    // Verificar prompt injection na última mensagem do usuário
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      const injectionCheck = checkPromptInjection(lastUserMessage.content);
      if (!injectionCheck.isSafe) {
        await logAIOperation({
          userId,
          sessionId,
          provider,
          model: `${provider}/${tier}`,
          actionType: 'chat',
          inputSummary: lastUserMessage.content.slice(0, 100),
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
      const tools = createAllTools(userId);

      const result = streamText({
        model,
        system: FINANCIAL_ASSISTANT_SYSTEM_PROMPT,
        messages: convertToCoreMessages(messages),
        tools,
        maxSteps: 5, // Permitir até 5 tool calls encadeadas
        onFinish: async ({ usage, finishReason, toolCalls }) => {
          await logAIOperation({
            userId,
            sessionId,
            provider,
            model: `${provider}/${tier}`,
            actionType: toolCalls?.length ? 'tool_call' : 'chat',
            toolName: toolCalls?.map(tc => tc.toolName).join(', '),
            inputSummary: lastUserMessage?.content.slice(0, 100) ?? '',
            outputSummary: finishReason,
            tokensUsed: usage?.totalTokens,
            latencyMs: Date.now() - startTime,
            outcome: 'success',
          });
        },
      });

      return result.toDataStreamResponse();
    } catch (error) {
      await logAIOperation({
        userId,
        sessionId,
        provider,
        model: `${provider}/${tier}`,
        actionType: 'chat',
        inputSummary: lastUserMessage?.content.slice(0, 100) ?? '',
        outputSummary: 'Error',
        latencyMs: Date.now() - startTime,
        outcome: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return c.json({ error: 'AI service error' }, 500);
    }
  }
);

// Endpoint para listar providers disponíveis
aiChat.get('/providers', authMiddleware, (c) => {
  return c.json({
    available: getAvailableProviders(),
    default: 'google',
  });
});

export { aiChat };

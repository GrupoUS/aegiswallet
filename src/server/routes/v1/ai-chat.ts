import { zValidator } from '@hono/zod-validator';
import { streamText } from 'ai';
import { Hono } from 'hono';
import { z } from 'zod';
import { logAIOperation } from '@/lib/ai/audit/logger';
import { FINANCIAL_ASSISTANT_SYSTEM_PROMPT, ENHANCED_FINANCIAL_ASSISTANT_SYSTEM_PROMPT, getSystemPromptWithCustomization } from '@/lib/ai/prompts/system';
import { AIProviderSchema, getAvailableProviders, getModel } from '@/lib/ai/providers';
import { checkPromptInjection } from '@/lib/ai/security/injection';
import { createAllTools } from '@/lib/ai/tools';
import { type AuthContext, authMiddleware } from '@/server/middleware/auth';

const aiChat = new Hono<{ Variables: { auth: AuthContext } }>();

// Schema de request
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  provider: AIProviderSchema.optional().default('anthropic'),
  tier: z.enum(['default', 'fast']).optional().default('default'),
});

// Endpoint de chat streaming
aiChat.post('/chat', authMiddleware, zValidator('json', chatRequestSchema), async (c) => {
  const startTime = Date.now();
  const { messages, provider, tier } = c.req.valid('json');
  const auth = c.get('auth');
  const userId = auth.user.id;
  const sessionId = crypto.randomUUID();

  // Verificar prompt injection na última mensagem do usuário
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
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
      system: ENHANCED_FINANCIAL_ASSISTANT_SYSTEM_PROMPT,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        parts: [{ type: 'text', text: msg.content }],
      })),
      tools,
      onFinish: async ({ usage, finishReason, toolCalls }) => {
        await logAIOperation({
          userId,
          sessionId,
          provider,
          model: `${provider}/${tier}`,
          actionType: toolCalls?.length ? 'tool_call' : 'chat',
          toolName: toolCalls?.map((tc) => tc.toolName).join(', '),
          inputSummary: lastUserMessage?.content.slice(0, 100) ?? '',
          outputSummary: finishReason,
          tokensUsed: usage?.totalTokens,
          latencyMs: Date.now() - startTime,
          outcome: 'success',
        });
      },
    });

    return result.toTextStreamResponse();
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
});

// Endpoint para listar providers disponíveis
aiChat.get('/providers', authMiddleware, (c) => {
  return c.json({
    available: getAvailableProviders(),
    default: 'anthropic',
  });
});

export { aiChat };

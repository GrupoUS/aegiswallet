/**
 * Financial Agent Backend
 *
 * AI-powered financial assistant that uses Gemini with function calling
 * to access user's financial data through specialized tools.
 */

import {
	type FunctionCall,
	type FunctionResponsePart,
	GoogleGenerativeAI,
} from '@google/generative-ai';

import type {
	ChatBackend,
	ChatBackendConfig,
	ModelInfo,
} from '../domain/ChatBackend';
import {
	ChatEvents,
	createToolCallEndEvent,
	createToolCallStartEvent,
} from '../domain/events';
import type {
	ChatMessage,
	ChatRequestOptions,
	ChatStreamChunk,
} from '../domain/types';
import { FinancialContextService } from './context/FinancialContextService';
import {
	buildAlertsBlock,
	buildFinancialContextBlock,
} from './prompts/context-template';
import {
	FINANCIAL_AGENT_NO_DATA_PROMPT,
	FINANCIAL_AGENT_SYSTEM_PROMPT,
} from './prompts/system';
import { financialToolDefinitions } from './tools/definitions';
import { executeTool } from './tools/executor';

export interface FinancialAgentConfig extends ChatBackendConfig {
	apiKey: string;
	model?: string;
	userId: string;
}

/**
 * Financial Agent Backend
 *
 * AI-powered financial assistant that uses Gemini with function calling
 * to access user's financial data through specialized tools.
 */
export class FinancialAgentBackend implements ChatBackend {
	private client: GoogleGenerativeAI;
	private modelName: string;
	private userId: string;
	private contextService: FinancialContextService;
	private abortController: AbortController | null = null;

	constructor(config: FinancialAgentConfig) {
		this.client = new GoogleGenerativeAI(config.apiKey);
		this.modelName = config.model || 'gemini-1.5-flash';
		this.userId = config.userId;
		this.contextService = new FinancialContextService(config.userId);
	}

	async *send(
		messages: ChatMessage[],
		options?: ChatRequestOptions,
	): AsyncGenerator<ChatStreamChunk, void, unknown> {
		this.abortController = new AbortController();
		const messageId = crypto.randomUUID();

		try {
			// 1. Get financial context for system prompt injection
			const context = await this.contextService.getContext();

			// 2. Build system prompt with user's financial context
			let systemPrompt: string;
			if (context.totalBalance === 0 && context.topCategories.length === 0) {
				systemPrompt = FINANCIAL_AGENT_NO_DATA_PROMPT;
			} else {
				systemPrompt = FINANCIAL_AGENT_SYSTEM_PROMPT.replace(
					'{{FINANCIAL_CONTEXT}}',
					buildFinancialContextBlock(context),
				).replace('{{ACTIVE_ALERTS}}', buildAlertsBlock(context.pendingAlerts));
			}

			// 3. Initialize model with tools
			const model = this.client.getGenerativeModel({
				model: this.modelName,
				systemInstruction: systemPrompt,
				tools: [{ functionDeclarations: financialToolDefinitions }],
			});

			// 4. Convert messages to Gemini format
			const history = messages.slice(0, -1).map((m) => ({
				role: m.role === 'user' ? ('user' as const) : ('model' as const),
				parts: [{ text: m.content }],
			}));

			const lastMessage = messages[messages.length - 1];
			if (!lastMessage) return;

			const chat = model.startChat({
				history,
				generationConfig: {
					temperature: options?.temperature ?? 0.7,
					maxOutputTokens: options?.maxTokens ?? 8192,
				},
			});

			// Emit message start
			yield ChatEvents.messageStart(messageId, 'assistant');

			// 5. Send message and handle tool calling loop
			let response = await chat.sendMessage(lastMessage.content);
			let iterationCount = 0;
			const maxIterations = 5; // Prevent infinite loops

			while (iterationCount < maxIterations) {
				iterationCount++;

				if (this.abortController?.signal.aborted) break;

				const candidate = response.response.candidates?.[0];
				if (!candidate?.content?.parts) break;

				const parts = candidate.content.parts;
				const functionCalls = parts.filter(
					(part): part is { functionCall: FunctionCall } =>
						'functionCall' in part,
				);

				// If no function calls, extract and stream text response
				if (functionCalls.length === 0) {
					for (const part of parts) {
						if ('text' in part && part.text) {
							yield ChatEvents.textDelta(part.text);
						}
					}
					break;
				}

				// Execute function calls
				const functionResponses: FunctionResponsePart[] = [];
				for (const { functionCall } of functionCalls) {
					const toolCallId = crypto.randomUUID();

					// Emit tool call start
					yield createToolCallStartEvent(toolCallId, functionCall.name);

					// Execute the tool
					const result = await executeTool(
						functionCall.name,
						this.userId,
						(functionCall.args || {}) as Record<string, unknown>,
					);

					// Build response object
					const responseData = result.success
						? (result.result as object)
						: { error: result.error };

					// Emit tool call end
					yield createToolCallEndEvent(
						toolCallId,
						functionCall.name,
						responseData,
					);

					functionResponses.push({
						functionResponse: {
							name: functionCall.name,
							response: responseData,
						},
					});
				}

				// Send function responses back to model
				response = await chat.sendMessage(functionResponses);
			}

			// Emit message end and done
			yield ChatEvents.messageEnd(messageId);
			yield ChatEvents.done();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			yield ChatEvents.error({
				code: 'AGENT_ERROR',
				message: errorMessage,
			});
		} finally {
			this.abortController = null;
		}
	}

	abort(): void {
		this.abortController?.abort();
	}

	getModelInfo(): ModelInfo {
		return {
			id: 'financial-agent',
			name: 'Aegis Financial Agent',
			provider: 'Google (Gemini)',
			capabilities: {
				streaming: true,
				multimodal: false,
				tools: true,
				reasoning: false,
			},
		};
	}

	/**
	 * Force refresh the financial context cache
	 */
	async refreshContext(): Promise<void> {
		await this.contextService.getContext(true);
	}

	/**
	 * Invalidate the context cache
	 */
	invalidateContext(): void {
		this.contextService.invalidateCache();
	}
}

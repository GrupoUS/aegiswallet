/**
 * AG-UI Protocol Backend Adapter (Stub)
 *
 * This is a placeholder for direct AG-UI Protocol integration.
 * AG-UI is a universal protocol for agent-UI communication that provides
 * vendor-neutral message formats and transport-agnostic streaming.
 *
 * @see https://github.com/ag-ui-protocol/ag-ui
 *
 * ## Integration Notes
 *
 * ### AG-UI Protocol Overview
 * AG-UI defines a standard for:
 * - **Message Format**: Roles (user, assistant, system, tool, developer)
 * - **Streaming Events**: message.start, message.chunk, message.end
 * - **Tool Calls**: Embedded in assistant messages with results as tool messages
 * - **State Sync**: Bi-directional state synchronization between agent and UI
 *
 * ### Transport Options
 * AG-UI is transport-agnostic. Common options:
 * - **Server-Sent Events (SSE)**: Unidirectional streaming
 * - **WebSocket**: Bi-directional communication
 * - **HTTP Polling**: Fallback for environments without streaming
 * - **Webhooks**: For asynchronous agent responses
 *
 * ### Direct Integration Pattern
 *
 * ```typescript
 * // Future implementation example:
 * class AgUiBackend implements ChatBackend {
 *   private ws: WebSocket;
 *
 *   async *send(messages: ChatMessage[]) {
 *     // Send messages via WebSocket
 *     this.ws.send(JSON.stringify({ type: 'messages', messages }));
 *
 *     // Yield events as they arrive
 *     for await (const event of this.eventStream) {
 *       yield mapAgUiEventToChunk(event);
 *     }
 *   }
 * }
 * ```
 *
 * ### Human-in-the-Loop Patterns
 * AG-UI supports HITL workflows for:
 * - Approval of tool calls before execution
 * - User input during agent reasoning
 * - Feedback collection for agent improvement
 *
 * ### Agent Orchestration
 * For multi-agent scenarios, AG-UI provides:
 * - Agent identification via developer role messages
 * - State handoff between agents
 * - Conversation threading
 *
 * @module backends/AgUiBackend
 */

import type { ChatBackend, ChatBackendConfig, ModelInfo } from '../domain/ChatBackend';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

/**
 * Configuration for AG-UI Protocol backend
 */
export interface AgUiBackendConfig extends ChatBackendConfig {
  /** AG-UI endpoint URL */
  endpoint: string;
  /** Transport protocol */
  protocol?: 'sse' | 'websocket' | 'http';
  /** Agent identifier */
  agentId?: string;
  /** Session ID for conversation continuity */
  sessionId?: string;
  /** Enable human-in-the-loop features */
  enableHitl?: boolean;
  /** Custom headers for authentication */
  headers?: Record<string, string>;
}

/**
 * AG-UI Protocol backend adapter
 *
 * @throws {Error} Always throws - not yet implemented
 *
 * @example
 * ```typescript
 * // Future usage:
 * const backend = new AgUiBackend({
 *   endpoint: 'wss://agents.example.com/aegis',
 *   protocol: 'websocket',
 *   agentId: 'financial-advisor',
 * });
 *
 * const chat = useChatController(backend);
 * ```
 */
export class AgUiBackend implements ChatBackend {
  private _config: AgUiBackendConfig;

  constructor(config: AgUiBackendConfig) {
    this._config = config;
  }

  /**
   * Send messages via AG-UI Protocol and stream responses
   *
   * @throws {Error} Not yet implemented
   */
  async *send(
    _messages: ChatMessage[],
    _options?: ChatRequestOptions
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    throw new Error(
      'AG-UI Protocol backend not yet implemented. ' +
        'See https://github.com/ag-ui-protocol/ag-ui for protocol specification. ' +
        'Use GeminiBackend as the primary backend for now.'
    );
  }

  /**
   * Abort the current generation
   */
  abort(): void {
    // Will send abort signal via AG-UI protocol when implemented
  }

  /**
   * Get information about the AG-UI backend
   */
  getModelInfo(): ModelInfo {
    return {
      id: this._config.agentId || 'ag-ui-agent',
      name: 'AG-UI Protocol (Not Implemented)',
      provider: 'AG-UI',
      capabilities: {
        streaming: true,
        multimodal: true,
        tools: true,
        reasoning: true,
      },
    };
  }

  /**
   * Get the current configuration (for debugging)
   */
  getConfig(): AgUiBackendConfig {
    return { ...this._config };
  }
}


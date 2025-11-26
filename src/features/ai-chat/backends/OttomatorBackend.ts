/**
 * Ottomator AG-UI RAG Agent Backend Adapter (Stub)
 *
 * This is a placeholder for Ottomator Live Agent Studio integration.
 * Ottomator provides RAG (Retrieval-Augmented Generation) agents with
 * knowledge base integration using the AG-UI Protocol.
 *
 * @see https://github.com/coleam00/ottomator-agents
 *
 * ## Integration Notes
 *
 * ### Ottomator Overview
 * Ottomator Live Agent Studio is a community platform for:
 * - Building and deploying AI agents
 * - Managing knowledge bases for RAG
 * - Sharing and discovering community agents
 *
 * ### RAG Capabilities
 * Ottomator agents can:
 * - Retrieve relevant documents from knowledge bases
 * - Synthesize information from multiple sources
 * - Provide citations and source attribution
 * - Maintain context across conversations
 *
 * ### Knowledge Base Integration
 *
 * ```typescript
 * // Future implementation example:
 * class OttomatorBackend implements ChatBackend {
 *   async *send(messages: ChatMessage[]) {
 *     // Query knowledge base for relevant context
 *     const context = await this.retrieveContext(messages);
 *
 *     // Send to Ottomator agent with context
 *     const response = await this.agent.chat(messages, { context });
 *
 *     // Yield response chunks with source citations
 *     for await (const chunk of response.stream) {
 *       yield mapOttomatorChunk(chunk);
 *     }
 *   }
 * }
 * ```
 *
 * ### Document Retrieval
 * Ottomator supports multiple retrieval strategies:
 * - **Semantic Search**: Vector similarity for concept matching
 * - **Keyword Search**: BM25 for exact term matching
 * - **Hybrid**: Combination of semantic and keyword
 * - **Reranking**: LLM-based reranking of results
 *
 * ### Citation Format
 * Ottomator responses include citations in metadata:
 * ```typescript
 * {
 *   content: "According to the policy document...",
 *   metadata: {
 *     citations: [
 *       { source: "policy.pdf", page: 12, confidence: 0.95 }
 *     ]
 *   }
 * }
 * ```
 *
 * ### Use Cases for AegisWallet
 * - Financial education content retrieval
 * - Policy and terms explanation
 * - Regulatory compliance queries
 * - Historical transaction analysis
 *
 * @module backends/OttomatorBackend
 */

import type { ChatBackend, ChatBackendConfig, ModelInfo } from '../domain/ChatBackend';
import type { ChatMessage, ChatRequestOptions, ChatStreamChunk } from '../domain/types';

/**
 * Configuration for Ottomator backend
 */
export interface OttomatorBackendConfig extends ChatBackendConfig {
  /** Ottomator API endpoint */
  endpoint?: string;
  /** Agent identifier from Ottomator Live Agent Studio */
  agentId: string;
  /** Knowledge base identifier for RAG */
  knowledgeBaseId?: string;
  /** Number of documents to retrieve for context */
  topK?: number;
  /** Minimum similarity threshold for retrieval */
  similarityThreshold?: number;
  /** Enable source citations in responses */
  includeCitations?: boolean;
  /** API key for Ottomator (if required) */
  apiKey?: string;
}

/**
 * Citation information from RAG retrieval
 */
export interface OttomatorCitation {
  /** Source document identifier */
  source: string;
  /** Page or section number */
  page?: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Relevant excerpt from source */
  excerpt?: string;
}

/**
 * Ottomator AG-UI RAG Agent backend adapter
 *
 * @throws {Error} Always throws - not yet implemented
 *
 * @example
 * ```typescript
 * // Future usage:
 * const backend = new OttomatorBackend({
 *   agentId: 'aegis-financial-advisor',
 *   knowledgeBaseId: 'financial-docs',
 *   topK: 5,
 *   includeCitations: true,
 * });
 *
 * const chat = useChatController(backend);
 * ```
 */
export class OttomatorBackend implements ChatBackend {
  private _config: OttomatorBackendConfig;

  constructor(config: OttomatorBackendConfig) {
    this._config = config;
  }

  /**
   * Send messages to Ottomator agent and stream RAG-enhanced responses
   *
   * @throws {Error} Not yet implemented
   */
  async *send(
    _messages: ChatMessage[],
    _options?: ChatRequestOptions
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    throw new Error(
      'Ottomator backend not yet implemented. ' +
        'See https://github.com/coleam00/ottomator-agents for integration guide. ' +
        'Use GeminiBackend as the primary backend for now.'
    );
  }

  /**
   * Abort the current generation
   */
  abort(): void {
    // Will abort Ottomator request when implemented
  }

  /**
   * Get information about the Ottomator backend
   */
  getModelInfo(): ModelInfo {
    return {
      id: this._config.agentId,
      name: 'Ottomator RAG Agent (Not Implemented)',
      provider: 'Ottomator',
      capabilities: {
        streaming: true,
        multimodal: false,
        tools: true,
        reasoning: true,
      },
    };
  }

  /**
   * Get the current configuration (for debugging)
   */
  getConfig(): OttomatorBackendConfig {
    return { ...this._config };
  }
}


import { asc, desc, eq } from 'drizzle-orm';

import type { FinancialContext, Transaction } from '../context';
import type { ChatMessage } from '../domain/types';
import { db, type HttpClient } from '@/db/client';
import {
	type ChatSession,
	chatMessages,
	chatSessions,
	type ChatMessage as DbChatMessage,
	type InsertChatMessage,
	type InsertChatSession,
} from '@/db/schema';
import logger from '@/lib/logging/logger';

export interface Conversation {
	id: string;
	userId: string;
	title: string | null;
	createdAt: string;
	updatedAt: string;
	lastMessageAt: string | null;
	messageCount: number;
}

export interface ConversationWithMessages extends Conversation {
	messages: ChatMessage[];
}

export class ChatRepository {
	private db: HttpClient;
	private contextWindowSize = 20;

	constructor(dbClient: HttpClient = db) {
		this.db = dbClient;
	}

	/**
	 * Create a new conversation
	 */
	async createConversation(
		userId: string,
		title?: string,
	): Promise<Conversation> {
		try {
			const insertData: InsertChatSession = {
				userId,
				title: title || null,
				isActive: true,
			};

			const [data] = await this.db
				.insert(chatSessions)
				.values(insertData)
				.returning();

			return this.mapConversation(data);
		} catch (error) {
			logger.error('Error creating conversation', {
				component: 'ChatRepository',
				action: 'createConversation',
				error: String(error),
			});
			throw new Error('Failed to create conversation');
		}
	}

	/**
	 * Get a conversation by ID
	 */
	async getConversation(conversationId: string): Promise<Conversation | null> {
		try {
			const [data] = await this.db
				.select()
				.from(chatSessions)
				.where(eq(chatSessions.id, conversationId))
				.limit(1);

			return data ? this.mapConversation(data) : null;
		} catch (error) {
			logger.error('Error fetching conversation', {
				component: 'ChatRepository',
				action: 'getConversation',
				error: String(error),
			});
			return null;
		}
	}

	/**
	 * Get conversation with messages
	 */
	async getConversationWithMessages(
		conversationId: string,
		limit?: number,
	): Promise<ConversationWithMessages | null> {
		const conversation = await this.getConversation(conversationId);
		if (!conversation) return null;

		const messages = await this.getMessages(conversationId, limit);

		return {
			...conversation,
			messages,
		};
	}

	/**
	 * List all conversations for a user
	 */
	async listConversations(userId: string, limit = 50): Promise<Conversation[]> {
		try {
			const data = await this.db
				.select()
				.from(chatSessions)
				.where(eq(chatSessions.userId, userId))
				.orderBy(desc(chatSessions.updatedAt))
				.limit(limit);

			return (data || []).map((d) => this.mapConversation(d));
		} catch (error) {
			logger.error('Error listing conversations', {
				component: 'ChatRepository',
				action: 'listConversations',
				error: String(error),
			});
			return [];
		}
	}

	/**
	 * Save a message to a conversation
	 */
	async saveMessage(
		conversationId: string,
		message: ChatMessage,
	): Promise<void> {
		try {
			const insertData: InsertChatMessage = {
				sessionId: conversationId,
				role: message.role,
				content:
					typeof message.content === 'string'
						? message.content
						: JSON.stringify(message.content),
				context: message.metadata || null,
			};

			await this.db.insert(chatMessages).values(insertData);
		} catch (error) {
			logger.error('Error saving message', {
				component: 'ChatRepository',
				action: 'saveMessage',
				error: String(error),
			});
			throw new Error('Failed to save message');
		}
	}

	/**
	 * Get messages from a conversation
	 */
	async getMessages(
		conversationId: string,
		limit?: number,
	): Promise<ChatMessage[]> {
		try {
			const baseQuery = this.db
				.select()
				.from(chatMessages)
				.where(eq(chatMessages.sessionId, conversationId))
				.orderBy(asc(chatMessages.createdAt));

			const data = limit ? await baseQuery.limit(limit) : await baseQuery;

			return (data || []).map((d) => this.mapMessage(d));
		} catch (error) {
			logger.error('Error fetching messages', {
				component: 'ChatRepository',
				action: 'getMessages',
				error: String(error),
			});
			return [];
		}
	}

	/**
	 * Get messages with context window (last N messages)
	 */
	async getMessagesInContextWindow(
		conversationId: string,
	): Promise<ChatMessage[]> {
		return this.getMessages(conversationId, this.contextWindowSize);
	}

	/**
	 * Save context snapshot for a conversation (stored in session metadata)
	 */
	async saveContextSnapshot(
		conversationId: string,
		context: FinancialContext,
	): Promise<void> {
		try {
			await this.db
				.update(chatSessions)
				.set({
					metadata: {
						contextSnapshot: {
							recentTransactions: context.recentTransactions,
							accountBalances: context.accountBalances,
							upcomingEvents: context.upcomingEvents,
							userPreferences: context.userPreferences,
							savedAt: new Date().toISOString(),
						},
					},
					updatedAt: new Date(),
				})
				.where(eq(chatSessions.id, conversationId));
		} catch (error) {
			logger.error('Error saving context snapshot', {
				component: 'ChatRepository',
				action: 'saveContextSnapshot',
				error: String(error),
			});
			throw new Error('Failed to save context snapshot');
		}
	}

	/**
	 * Get latest context snapshot for a conversation
	 */
	async getLatestContextSnapshot(
		conversationId: string,
	): Promise<FinancialContext | null> {
		try {
			const [data] = await this.db
				.select({ metadata: chatSessions.metadata })
				.from(chatSessions)
				.where(eq(chatSessions.id, conversationId))
				.limit(1);

			if (!data?.metadata) return null;

			const metadata = data.metadata as Record<string, unknown>;
			const snapshot = metadata.contextSnapshot as Record<string, unknown>;

			if (!snapshot) return null;

			return {
				recentTransactions:
					(snapshot.recentTransactions as Transaction[]) || [],
				accountBalances:
					(snapshot.accountBalances as FinancialContext['accountBalances']) ||
					[],
				upcomingEvents:
					(snapshot.upcomingEvents as FinancialContext['upcomingEvents']) || [],
				userPreferences:
					(snapshot.userPreferences as FinancialContext['userPreferences']) ||
					{},
				summary: {
					totalBalance: 0,
					monthlyIncome: 0,
					monthlyExpenses: 0,
					upcomingBillsCount: 0,
				},
			};
		} catch (error) {
			logger.error('Error fetching context snapshot', {
				component: 'ChatRepository',
				action: 'getLatestContextSnapshot',
				error: String(error),
			});
			return null;
		}
	}

	/**
	 * Update conversation title
	 */
	async updateConversationTitle(
		conversationId: string,
		title: string,
	): Promise<void> {
		try {
			await this.db
				.update(chatSessions)
				.set({ title, updatedAt: new Date() })
				.where(eq(chatSessions.id, conversationId));
		} catch (error) {
			logger.error('Error updating conversation title', {
				component: 'ChatRepository',
				action: 'updateConversationTitle',
				error: String(error),
			});
			throw new Error('Failed to update conversation title');
		}
	}

	/**
	 * Delete a conversation
	 */
	async deleteConversation(conversationId: string): Promise<void> {
		try {
			await this.db
				.delete(chatSessions)
				.where(eq(chatSessions.id, conversationId));
		} catch (error) {
			logger.error('Error deleting conversation', {
				component: 'ChatRepository',
				action: 'deleteConversation',
				error: String(error),
			});
			throw new Error('Failed to delete conversation');
		}
	}

	/**
	 * Map database conversation to domain model
	 */
	private mapConversation(data: ChatSession): Conversation {
		return {
			id: data.id,
			userId: data.userId || '',
			title: data.title || 'Nova Conversa',
			createdAt: data.createdAt?.toISOString() || new Date().toISOString(),
			updatedAt: data.updatedAt?.toISOString() || new Date().toISOString(),
			lastMessageAt: data.updatedAt?.toISOString() || null,
			messageCount: 0, // Would need separate query to count
		};
	}

	/**
	 * Map database message to domain model
	 */
	private mapMessage(data: DbChatMessage): ChatMessage {
		return {
			id: data.id,
			role: data.role as 'user' | 'assistant' | 'system',
			content: data.content,
			timestamp: data.createdAt?.getTime() || Date.now(),
			metadata: (data.context as Record<string, unknown>) || {},
		};
	}
}

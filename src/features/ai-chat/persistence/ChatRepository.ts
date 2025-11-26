import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/integrations/supabase/types';
import logger from '@/lib/logging/logger';
import type { FinancialContext, Transaction } from '../context';
import type { ChatMessage } from '../domain/types';

// Extract table row types from Database for type safety
type ChatConversationRow = Database['public']['Tables']['chat_conversations']['Row'];
type ChatConversationInsert = Database['public']['Tables']['chat_conversations']['Insert'];
type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];
type ChatContextSnapshotRow = Database['public']['Tables']['chat_context_snapshots']['Row'];
type ChatContextSnapshotInsert = Database['public']['Tables']['chat_context_snapshots']['Insert'];

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
  private supabase: SupabaseClient<Database>;
  private contextWindowSize = 20; // Last N messages to keep in context

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const insertData: ChatConversationInsert = {
      user_id: userId,
      title: title || null,
    };

    const { data, error } = await this.supabase
      .from('chat_conversations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating conversation', { component: 'ChatRepository', action: 'createConversation', error: String(error) });
      throw new Error('Failed to create conversation');
    }

    return this.mapConversation(data);
  }


  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .select()
      .eq('id', conversationId)
      .single();

    if (error) {
      logger.error('Error fetching conversation', { component: 'ChatRepository', action: 'getConversation', error: String(error) });
      return null;
    }

    return data ? this.mapConversation(data) : null;
  }

  /**
   * Get conversation with messages
   */
  async getConversationWithMessages(
    conversationId: string,
    limit?: number
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
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .select()
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error listing conversations', { component: 'ChatRepository', action: 'listConversations', error: String(error) });
      return [];
    }

    return (data || []).map((d) => this.mapConversation(d));
  }

  /**
   * Save a message to a conversation
   */
  async saveMessage(conversationId: string, message: ChatMessage): Promise<void> {
    // Prepare metadata without reasoning since it has its own field
    const metadataWithoutReasoning = message.metadata ? {
      ...message.metadata,
      reasoning: undefined, // Remove reasoning from metadata as it has its own field
    } : {};

    const insertData: ChatMessageInsert = {
      conversation_id: conversationId,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      metadata: Object.keys(metadataWithoutReasoning).length > 0 ? metadataWithoutReasoning as Json : null,
      reasoning: message.metadata?.reasoning ? JSON.stringify(message.metadata.reasoning) : null,
    };

    const { error } = await this.supabase.from('chat_messages').insert(insertData);

    if (error) {
      logger.error('Error saving message', { component: 'ChatRepository', action: 'saveMessage', error: String(error) });
      throw new Error('Failed to save message');
    }
  }


  /**
   * Get messages from a conversation
   */
  async getMessages(conversationId: string, limit?: number): Promise<ChatMessage[]> {
    let query = this.supabase
      .from('chat_messages')
      .select()
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching messages', { component: 'ChatRepository', action: 'getMessages', error: String(error) });
      return [];
    }

    return (data || []).map((d) => this.mapMessage(d));
  }

  /**
   * Get messages with context window (last N messages)
   */
  async getMessagesInContextWindow(conversationId: string): Promise<ChatMessage[]> {
    return this.getMessages(conversationId, this.contextWindowSize);
  }

  /**
   * Save context snapshot for a conversation
   */
  async saveContextSnapshot(conversationId: string, context: FinancialContext): Promise<void> {
    const insertData: ChatContextSnapshotInsert = {
      conversation_id: conversationId,
      recent_transactions: context.recentTransactions as unknown as Json,
      account_balances: context.accountBalances as unknown as Json,
      upcoming_events: context.upcomingEvents as unknown as Json,
      user_preferences: context.userPreferences as unknown as Json,
    };

    const { error } = await this.supabase.from('chat_context_snapshots').insert(insertData);

    if (error) {
      logger.error('Error saving context snapshot', { component: 'ChatRepository', action: 'saveContextSnapshot', error: String(error) });
      throw new Error('Failed to save context snapshot');
    }
  }


  /**
   * Get latest context snapshot for a conversation
   */
  async getLatestContextSnapshot(conversationId: string): Promise<FinancialContext | null> {
    const { data, error } = await this.supabase
      .from('chat_context_snapshots')
      .select()
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching context snapshot', { component: 'ChatRepository', action: 'getLatestContextSnapshot', error: String(error) });
      return null;
    }

    if (!data) return null;

    return {
      recentTransactions: (data.recent_transactions as unknown as Transaction[]) || [],
      accountBalances: (data.account_balances as unknown as FinancialContext['accountBalances']) || [],
      upcomingEvents: (data.upcoming_events as unknown as FinancialContext['upcomingEvents']) || [],
      userPreferences: (data.user_preferences as unknown as FinancialContext['userPreferences']) || {},
      summary: {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        upcomingBillsCount: 0,
      },
    };
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      logger.error('Error updating conversation title', { component: 'ChatRepository', action: 'updateConversationTitle', error: String(error) });
      throw new Error('Failed to update conversation title');
    }
  }


  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      logger.error('Error deleting conversation', { component: 'ChatRepository', action: 'deleteConversation', error: String(error) });
      throw new Error('Failed to delete conversation');
    }
  }

  /**
   * Map database conversation to domain model
   */
  private mapConversation(data: ChatConversationRow): Conversation {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title || 'Nova Conversa',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastMessageAt: data.last_message_at || data.updated_at,
      messageCount: data.message_count || 0,
    };
  }

  /**
   * Map database message to domain model
   */
  private mapMessage(data: ChatMessageRow): ChatMessage {
    const parsedReasoning = data.reasoning ? JSON.parse(data.reasoning) : undefined;
    return {
      id: data.id,
      role: data.role as 'user' | 'assistant' | 'system',
      content: data.content,
      timestamp: new Date(data.created_at).getTime(),
      metadata: {
        ...(data.metadata as Record<string, unknown> || {}),
        reasoning: parsedReasoning,
      },
    };
  }
}

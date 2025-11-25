import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { ChatMessage } from '../domain/types';
import type { FinancialContext } from '../context';

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
    const { data, error } = await this.supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        title: title || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
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
      console.error('Error fetching conversation:', error);
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
      console.error('Error listing conversations:', error);
      return [];
    }

    return (data || []).map(this.mapConversation);
  }

  /**
   * Save a message to a conversation
   */
  async saveMessage(
    conversationId: string,
    message: ChatMessage
  ): Promise<void> {
    const { error } = await this.supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: message.role,
        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
        metadata: message.metadata || {},
        reasoning: message.reasoning || null,
      });

    if (error) {
      console.error('Error saving message:', error);
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
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []).map(this.mapMessage);
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
  async saveContextSnapshot(
    conversationId: string,
    context: FinancialContext
  ): Promise<void> {
    const { error } = await this.supabase
      .from('chat_context_snapshots')
      .insert({
        conversation_id: conversationId,
        recent_transactions: context.recentTransactions as any,
        account_balances: context.accountBalances as any,
        upcoming_events: context.upcomingEvents as any,
        user_preferences: context.userPreferences as any,
      });

    if (error) {
      console.error('Error saving context snapshot:', error);
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
      console.error('Error fetching context snapshot:', error);
      return null;
    }

    if (!data) return null;

    return {
      recentTransactions: (data.recent_transactions as any) || [],
      accountBalances: (data.account_balances as any) || [],
      upcomingEvents: (data.upcoming_events as any) || [],
      userPreferences: (data.user_preferences as any) || {},
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
      console.error('Error updating conversation title:', error);
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
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  /**
   * Map database conversation to domain model
   */
  private mapConversation(data: any): Conversation {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastMessageAt: data.last_message_at,
      messageCount: data.message_count,
    };
  }

  /**
   * Map database message to domain model
   */
  private mapMessage(data: any): ChatMessage {
    return {
      id: data.id,
      role: data.role,
      content: data.content,
      timestamp: data.created_at,
      metadata: data.metadata || {},
      reasoning: data.reasoning || undefined,
    };
  }
}

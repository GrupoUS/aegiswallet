import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { FinancialContext } from '../context';
import type { ChatMessage } from '../domain/types';

// Extract the Json type from Database for convenience
type Json = Database['public']['Tables']['conversation_contexts']['Insert']['history'];

// Temporary type for chat tables that are pending migration
// These tables are defined in the codebase but not yet in the Supabase type definitions
// TODO: Run Supabase type generation after tables are created
type ChatConversation = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  message_count: number;
};

type ChatMessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  metadata: Json | null;
  reasoning: string | null;
  created_at: string;
};

type ChatContextSnapshot = {
  id: string;
  conversation_id: string;
  recent_transactions: Json;
  account_balances: Json;
  upcoming_events: Json;
  user_preferences: Json;
  created_at: string;
};

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
  // Temporary in-memory storage until chat tables migration is applied
  private conversations = new Map<string, Conversation>();
  private messages = new Map<string, ChatMessage[]>();
  private contextSnapshots = new Map<string, FinancialContext>();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const { data, error } = await this.supabase
      .from('conversation_contexts')
      .insert({
        user_id: userId,
        session_id: `chat_${Date.now()}`,
        history: { title: title || null, created_at: new Date().toISOString() },
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
    // Using type assertion as chat_conversations table is pending migration
    const { data, error } = await (this.supabase as any)
      .from('chat_conversations')
      .select()
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data ? this.mapConversation(data as ChatConversation) : null;
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
    // Using type assertion as chat_conversations table is pending migration
    const { data, error } = await (this.supabase as any)
      .from('chat_conversations')
      .select()
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error listing conversations:', error);
      return [];
    }

    return (data || []).map((d: ChatConversation) => this.mapConversation(d));
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

    // Using type assertion as chat_messages table is pending migration
    const { error } = await (this.supabase as any).from('chat_messages').insert({
      conversation_id: conversationId,
      role: message.role,
      content:
        typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      metadata: Object.keys(metadataWithoutReasoning).length > 0 ? metadataWithoutReasoning as Json : null,
      reasoning: message.metadata?.reasoning ? JSON.stringify(message.metadata.reasoning) : null,
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
    // Using type assertion as chat_messages table is pending migration
    let query = (this.supabase as any)
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

    return (data || []).map((d: ChatMessageRow) => this.mapMessage(d));
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
    // Using type assertion as chat_context_snapshots table is pending migration
    const { error } = await (this.supabase as any).from('chat_context_snapshots').insert({
      conversation_id: conversationId,
      recent_transactions: JSON.stringify(context.recentTransactions),
      account_balances: JSON.stringify(context.accountBalances),
      upcoming_events: JSON.stringify(context.upcomingEvents),
      user_preferences: JSON.stringify(context.userPreferences),
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
    // Using type assertion as chat_context_snapshots table is pending migration
    const { data, error } = await (this.supabase as any)
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

    const snapshot = data as ChatContextSnapshot;
    return {
      recentTransactions: (snapshot.recent_transactions as unknown as any[]) || [],
      accountBalances: (snapshot.account_balances as unknown as any[]) || [],
      upcomingEvents: (snapshot.upcoming_events as unknown as any[]) || [],
      userPreferences: (snapshot.user_preferences as unknown as any) || {},
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
    // Using type assertion as chat_conversations table is pending migration
    const { error } = await (this.supabase as any)
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
    // Using type assertion as chat_conversations table is pending migration
    const { error } = await (this.supabase as any)
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
    const parsedReasoning = data.reasoning ? JSON.parse(data.reasoning) : undefined;
    return {
      id: data.id,
      role: data.role,
      content: data.content,
      timestamp: data.created_at,
      metadata: {
        ...data.metadata,
        reasoning: parsedReasoning,
      },
    };
  }
}

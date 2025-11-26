import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import logger from '@/lib/logging/logger';
import type { FinancialContext, Transaction } from '../context';
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

// Helper function for accessing pending migration tables
// biome-ignore lint/suspicious/noExplicitAny: Temporary escape hatch until chat tables migration is applied to Supabase types
const getUntypedClient = (supabase: SupabaseClient<Database>) => supabase as any;

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
      .from('conversation_contexts')
      .insert({
        user_id: userId,
        session_id: `chat_${Date.now()}`,
        history: { title: title || null, created_at: new Date().toISOString() },
      })
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
    // Using untyped client as chat_conversations table is pending migration
    const client = getUntypedClient(this.supabase);
    const { data, error } = await client
      .from('chat_conversations')
      .select()
      .eq('id', conversationId)
      .single();

    if (error) {
      logger.error('Error fetching conversation', { component: 'ChatRepository', action: 'getConversation', error: String(error) });
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
    const untypedClient = getUntypedClient(this.supabase);
    const { data, error } = await untypedClient
      .from('chat_conversations')
      .select()
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error listing conversations', { component: 'ChatRepository', action: 'listConversations', error: String(error) });
      return [];
    }

    return (data || []).map((d: unknown) => this.mapConversation(d as ChatConversation));
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
    const untypedClient = getUntypedClient(this.supabase);
    const { error } = await untypedClient.from('chat_messages').insert({
      conversation_id: conversationId,
      role: message.role,
      content:
        typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      metadata: Object.keys(metadataWithoutReasoning).length > 0 ? metadataWithoutReasoning as Json : null,
      reasoning: message.metadata?.reasoning ? JSON.stringify(message.metadata.reasoning) : null,
    });

    if (error) {
      logger.error('Error saving message', { component: 'ChatRepository', action: 'saveMessage', error: String(error) });
      throw new Error('Failed to save message');
    }
  }


  /**
   * Get messages from a conversation
   */
  async getMessages(conversationId: string, limit?: number): Promise<ChatMessage[]> {
    // Using type assertion as chat_messages table is pending migration
    const untypedClient = getUntypedClient(this.supabase);
    let query = untypedClient
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

    return (data || []).map((d: unknown) => this.mapMessage(d as ChatMessageRow));
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
    // Using untyped client as chat_context_snapshots table is pending migration
    const client = getUntypedClient(this.supabase);
    const { error } = await client.from('chat_context_snapshots').insert({
      conversation_id: conversationId,
      recent_transactions: JSON.stringify(context.recentTransactions),
      account_balances: JSON.stringify(context.accountBalances),
      upcoming_events: JSON.stringify(context.upcomingEvents),
      user_preferences: JSON.stringify(context.userPreferences),
    });

    if (error) {
      logger.error('Error saving context snapshot', { component: 'ChatRepository', action: 'saveContextSnapshot', error: String(error) });
      throw new Error('Failed to save context snapshot');
    }
  }


  /**
   * Get latest context snapshot for a conversation
   */
  async getLatestContextSnapshot(conversationId: string): Promise<FinancialContext | null> {
    // Using type assertion as chat_context_snapshots table is pending migration
    const untypedClient = getUntypedClient(this.supabase);
    const { data, error } = await untypedClient
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

    const snapshot = data as ChatContextSnapshot;
    return {
      recentTransactions: (snapshot.recent_transactions as unknown as Transaction[]) || [],
      accountBalances: (snapshot.account_balances as unknown as FinancialContext['accountBalances']) || [],
      upcomingEvents: (snapshot.upcoming_events as unknown as FinancialContext['upcomingEvents']) || [],
      userPreferences: (snapshot.user_preferences as unknown as FinancialContext['userPreferences']) || {},
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
    const untypedClient = getUntypedClient(this.supabase);
    const { error } = await untypedClient
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
    // Using type assertion as chat_conversations table is pending migration
    const untypedClient = getUntypedClient(this.supabase);
    const { error } = await untypedClient
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
  private mapConversation(data: ChatConversation | Record<string, unknown>): Conversation {
    const d = data as ChatConversation;
    return {
      id: d.id,
      userId: d.user_id,
      title: d.title || 'Nova Conversa',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      lastMessageAt: d.last_message_at || d.updated_at,
      messageCount: d.message_count || 0,
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

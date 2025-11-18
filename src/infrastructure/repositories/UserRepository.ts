/**
 * User Repository Implementation
 * Data access layer for User entity using Supabase
 */

import { type IUserRepository, User, type UserPreferences } from '@/domain/models/User';
import { supabase } from '@/integrations/supabase/client';
import { logError, logOperation } from '@/server/lib/logger';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const { error } = await supabase
        .from('users')
        .select(`
          *,
          user_preferences(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logError('user_repository_find_by_id', id, error, {
          operation: 'findById',
        });
        throw new Error(`Failed to find user: ${error.message}`);
      }

      return User.fromDatabase(data);
    } catch (error) {
      logError('user_repository_find_by_id_unexpected', id, error as Error, {
        operation: 'findById',
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { error } = await supabase
        .from('users')
        .select(`
          *,
          user_preferences(*)
        `)
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logError('user_repository_find_by_email', email, error, {
          operation: 'findByEmail',
        });
        throw new Error(`Failed to find user by email: ${error.message}`);
      }

      return User.fromDatabase(data);
    } catch (error) {
      logError('user_repository_find_by_email_unexpected', email, error as Error, {
        operation: 'findByEmail',
      });
      throw error;
    }
  }

  async create(user: User): Promise<User> {
    try {
      const userData = user.toJSON();
      const { preferences: _unusedPreferences, ...userFields } = userData;

      // Insert user
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userFields.id,
          email: userFields.email,
          full_name: userFields.fullName,
          phone: userFields.phone,
          cpf: userFields.cpf,
          birth_date: userFields.birthDate?.toISOString(),
          avatar_url: userFields.avatarUrl,
          created_at: userFields.createdAt.toISOString(),
          updated_at: userFields.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (userError) {
        logError('user_repository_create', user.id, userError, {
          operation: 'create',
        });
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      // Insert user preferences if provided
      if (preferences) {
        const { error: preferencesError } = await supabase.from('user_preferences').insert({
          user_id: user.id,
          theme: preferences.theme,
          language: preferences.language,
          timezone: preferences.timezone,
          currency: preferences.currency,
          notifications_enabled: preferences.notificationsEnabled,
          email_notifications: preferences.emailNotifications,
          push_notifications: preferences.pushNotifications,
          voice_commands_enabled: preferences.voiceCommandsEnabled,
          autonomy_level: preferences.autonomyLevel,
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        });

        if (preferencesError) {
          logError('user_repository_create_preferences', user.id, preferencesError, {
            operation: 'create',
          });
          // Don't throw error here, user was created successfully
        }
      }

      logOperation('user_repository_create_success', user.id, 'user', user.id, {
        email: user.email,
      });

      // Fetch complete user with preferences
      return (await this.findById(user.id)) as User;
    } catch (error) {
      logError('user_repository_create_unexpected', user.id, error as Error, {
        operation: 'create',
      });
      throw error;
    }
  }

  async update(user: User): Promise<User> {
    try {
      const userData = user.toJSON();
      const { preferences: _unusedPreferences, ...userFields } = userData;

      // Update user
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: userFields.fullName,
          phone: userFields.phone,
          cpf: userFields.cpf,
          birth_date: userFields.birthDate?.toISOString(),
          avatar_url: userFields.avatarUrl,
          updated_at: userFields.updatedAt.toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (userError) {
        logError('user_repository_update', user.id, userError, {
          operation: 'update',
        });
        throw new Error(`Failed to update user: ${userError.message}`);
      }

      logOperation('user_repository_update_success', user.id, 'user', user.id, {
        updatedFields: Object.keys(userFields),
      });

      // Fetch complete user with preferences
      return (await this.findById(user.id)) as User;
    } catch (error) {
      logError('user_repository_update_unexpected', user.id, error as Error, {
        operation: 'update',
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        logError('user_repository_delete', id, error, {
          operation: 'delete',
        });
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      logOperation('user_repository_delete_success', id, 'user', id);
    } catch (error) {
      logError('user_repository_delete_unexpected', id, error as Error, {
        operation: 'delete',
      });
      throw error;
    }
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logError('user_repository_update_preferences', userId, error, {
          operation: 'updatePreferences',
        });
        throw new Error(`Failed to update user preferences: ${error.message}`);
      }

      logOperation('user_repository_update_preferences_success', userId, 'user', userId, {
        updatedFields: Object.keys(preferences),
      });

      // Fetch complete user with updated preferences
      return (await this.findById(userId)) as User;
    } catch (error) {
      logError('user_repository_update_preferences_unexpected', userId, error as Error, {
        operation: 'updatePreferences',
      });
      throw error;
    }
  }

  /**
   * Find users with filters
   */
  async findMany(options: {
    limit?: number;
    offset?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ users: User[]; totalCount: number }> {
    try {
      let query = supabase.from('users').select(
        `
          *,
          user_preferences(*)
        `,
        { count: 'exact' }
      );

      if (options.search) {
        query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        logError('user_repository_find_many', 'system', error, {
          operation: 'findMany',
          options,
        });
        throw new Error(`Failed to find users: ${error.message}`);
      }

      const users = (data || []).map((userData) => User.fromDatabase(userData));

      return {
        users,
        totalCount: count || 0,
      };
    } catch (error) {
      logError('user_repository_find_many_unexpected', 'system', error as Error, {
        operation: 'findMany',
        options,
      });
      throw error;
    }
  }
}

/**
 * User Repository Factory
 */
export function createUserRepository(): IUserRepository {
  return new UserRepository();
}

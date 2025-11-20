/**
 * User Repository Implementation
 * Data access layer for User entity using Supabase
 */

import { type IUserRepository, User, type UserPreferences } from '@/domain/models/User';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
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
        logger.error('Failed to find user by id', {
          operation: 'findById',
          userId: id,
          error: error.message,
        });
        throw new Error(`Failed to find user: ${error.message}`);
      }

      return User.fromDatabase(data);
    } catch (error) {
      logger.error('Unexpected error in findById', {
        operation: 'findById',
        userId: id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
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
        logger.error('Failed to find user by email', {
          operation: 'findByEmail',
          email,
          error: error.message,
        });
        throw new Error(`Failed to find user by email: ${error.message}`);
      }

      return User.fromDatabase(data);
    } catch (error) {
      logger.error('Unexpected error in findByEmail', {
        operation: 'findByEmail',
        email,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async create(user: User): Promise<User> {
    try {
      const userData = user.toJSON();
      const { preferences, ...userFields } = userData;

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
        logger.error('Failed to create user', {
          operation: 'create',
          userId: user.id,
          error: userError.message,
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
          logger.error('Failed to create user preferences', {
            operation: 'create',
            userId: user.id,
            error: preferencesError.message,
          });
          // Don't throw error here, user was created successfully
        }
      }

      logger.info('User created successfully', {
        operation: 'user_repository_create_success',
        userId: user.id,
        resource: 'user',
        email: user.email,
      });

      // Fetch complete user with preferences
      return (await this.findById(user.id)) as User;
    } catch (error) {
      logger.error('Unexpected error in create user', {
        operation: 'create',
        userId: user.id,
        error: (error as Error).message,
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
        logger.error('Failed to update user', {
          operation: 'update',
          userId: user.id,
          error: userError.message,
        });
        throw new Error(`Failed to update user: ${userError.message}`);
      }

      logger.info('User updated successfully', {
        operation: 'user_repository_update_success',
        userId: user.id,
        resource: 'user',
        updatedFields: Object.keys(userFields),
      });

      // Fetch complete user with preferences
      return (await this.findById(user.id)) as User;
    } catch (error) {
      logger.error('Unexpected error in update user', {
        operation: 'update',
        userId: user.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        logger.error('Failed to delete user', {
          operation: 'delete',
          userId: id,
          error: error.message,
        });
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      logger.info('User deleted successfully', {
        operation: 'user_repository_delete_success',
        userId: id,
        resource: 'user',
      });
    } catch (error) {
      logger.error('Unexpected error in delete user', {
        operation: 'delete',
        userId: id,
        error: (error as Error).message,
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
        logger.error('Failed to update user preferences', {
          operation: 'updatePreferences',
          userId,
          error: error.message,
        });
        throw new Error(`Failed to update user preferences: ${error.message}`);
      }

      logger.info('User preferences updated successfully', {
        operation: 'user_repository_update_preferences_success',
        userId,
        resource: 'user',
        updatedFields: Object.keys(preferences),
      });

      // Fetch complete user with updated preferences
      return (await this.findById(userId)) as User;
    } catch (error) {
      logger.error('Unexpected error in update user preferences', {
        operation: 'updatePreferences',
        userId,
        error: (error as Error).message,
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
        logger.error('Failed to find users', {
          operation: 'findMany',
          component: 'system',
          options,
          error: error.message,
        });
        throw new Error(`Failed to find users: ${error.message}`);
      }

      const users = (data || []).map((userData) => User.fromDatabase(userData));

      return {
        users,
        totalCount: count || 0,
      };
    } catch (error) {
      logger.error('Unexpected error in findMany', {
        operation: 'findMany',
        component: 'system',
        options,
        error: (error as Error).message,
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
